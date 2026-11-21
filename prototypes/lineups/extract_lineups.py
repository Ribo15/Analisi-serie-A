"""Estrazione sperimentale, sola lettura. Non modifica il sito o il repository."""
from __future__ import annotations

import json
import re
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup

SOURCE = "https://www.sosfanta.com/lista-formazioni/probabili-formazioni-serie-a/"
OUTPUT = Path("lineups-preview.json")
REPORT = Path("lineups-validation.json")
EXPECTED_MATCHES = 10
EXPECTED_TEAMS = 20
PERCENT = re.compile(r"^(\d{1,3})\s*%\s+(.+)$")
MATCH_DATE = re.compile(r"\b(\d{2})/(\d{2})/(\d{4})\s*-\s*(\d{2}):(\d{2})\b")
MODULE = re.compile(r"^\d(?:-\d){2,4}$")

def fetch_html() -> str:
    req = Request(SOURCE, headers={
        "User-Agent": "Mozilla/5.0 (compatible; LineupsSourceCheck/1.0)",
        "Accept-Language": "it-IT,it;q=0.9",
    })
    with urlopen(req, timeout=25) as r:
        if r.status != 200:
            raise ValueError(f"HTTP {r.status}")
        data = r.read(3_000_001)
        charset = r.headers.get_content_charset() or "utf-8"
    if len(data) > 3_000_000:
        raise ValueError("Pagina superiore a 3 MB")
    return data.decode(charset, errors="replace")

def next_grid(heading):
    row = heading.parent
    if not row:
        return None
    # Titolari: h3 in div-intestazione; indisponibili: h3 direttamente in section.
    if row.name == "div":
        return row.find_next_sibling("div")
    return heading.find_next_sibling("div")

def direct_uls(grid):
    if grid is None:
        return []
    uls = grid.find_all("ul", recursive=False)
    return uls if len(uls) == 2 else []

def parse_starters(ul) -> list:
    players = []
    for li in ul.find_all("li", recursive=False):
        text = li.get_text(" ", strip=True)
        match = PERCENT.fullmatch(text)
        if not match:
            raise ValueError(f"Titolare senza coppia probabilità/nome: {text[:80]}")
        percent = int(match.group(1))
        name = match.group(2).strip()
        if not name or not 0 <= percent <= 100:
            raise ValueError("Probabilità o nome non valido")
        players.append({"name": name, "prob": percent / 100})
    return players

def parse_out(ul) -> list:
    names = []
    for li in ul.find_all("li", recursive=False):
        chunks = list(li.stripped_strings)
        if chunks:
            names.append(chunks[0])
    return names

def extract(html: str) -> list:
    soup = BeautifulSoup(html, "html.parser")
    headings = [h for h in soup.find_all("h3") if h.get_text(" ",strip=True) == "Titolari"]
    matches = []
    for h in headings:
        header = h.find_previous("header")
        if header is None:
            raise ValueError("Intestazione partita non trovata")
        teams = [x.get_text(" ",strip=True) for x in header.find_all("h2")]
        if len(teams) != 2:
            raise ValueError(f"Squadre non riconosciute in intestazione: {teams}")
        modules = []
        for heading_team in header.find_all("h2"):
            next_span = heading_team.find_next_sibling("span")
            module = next_span.get_text(" ",strip=True) if next_span else ""
            if not MODULE.fullmatch(module):
                raise ValueError(f"Modulo non riconosciuto per {heading_team.get_text(strip=True)}: {module}")
            modules.append(module)
        raw_date = header.get_text(" ",strip=True)
        m = MATCH_DATE.search(raw_date)
        if not m:
            raise ValueError(f"Data/ora non riconosciute per {teams}: {raw_date[:150]}")
        d, mo, y, hh, mm = map(int, m.groups())
        kickoff = datetime(y, mo, d, hh, mm).isoformat(timespec="minutes")
        grid = next_grid(h)
        uls = direct_uls(grid)
        if len(uls) != 2:
            raise ValueError(f"Colonne titolari non riconosciute per {teams}")
        starters = [parse_starters(u) for u in uls]

        # Cerca gli indisponibili SOLO prima dei titolari della partita successiva.
        indis = None
        cursor = h.find_next("h3")
        while cursor:
            name = cursor.get_text(" ", strip=True)
            if name == "Titolari":
                break
            if name == "Indisponibili":
                indis = cursor
                break
            cursor = cursor.find_next("h3")
        if indis is None:
            raise ValueError(f"Sezione indisponibili non trovata per {teams}")
        injury_uls = direct_uls(next_grid(indis))
        if len(injury_uls) != 2:
            raise ValueError(f"Colonne indisponibili non riconosciute per {teams}; HTML primo blocco: {str(indis.parent)[:2500]}")
        injured = [parse_out(u) for u in injury_uls]
        matches.append({
            "home": teams[0],
            "away": teams[1],
            "kickoff_local": kickoff,
            "date": f"{y:04}-{mo:02}-{d:02}",
            "time": f"{hh:02}:{mm:02}",
            "homeModule": modules[0],
            "awayModule": modules[1],
            "source": "SOS Fanta",
            "homeXI": starters[0],
            "awayXI": starters[1],
            "homeOut": injured[0],
            "awayOut": injured[1],
        })
    return matches

def validate(matches: list) -> list[str]:
    errors = []
    if len(matches) != EXPECTED_MATCHES:
        errors.append(f"Partite attese {EXPECTED_MATCHES}, trovate {len(matches)}")
    teams = [t for m in matches for t in (m["home"], m["away"])]
    if len(set(teams)) != EXPECTED_TEAMS:
        errors.append(f"Squadre uniche attese {EXPECTED_TEAMS}, trovate {len(set(teams))}")
    today = datetime.now(timezone.utc).date()
    for match in matches:
        key = f'{match["home"]} - {match["away"]}'
        for side in ("homeXI", "awayXI"):
            players = match[side]
            if len(players) != 11:
                errors.append(f"{key}: {side} contiene {len(players)} titolari, attesi 11")
            if len({p["name"].casefold() for p in players}) != len(players):
                errors.append(f"{key}: nomi doppi in {side}")
        played = date.fromisoformat(match["kickoff_local"][:10])
        if not today - timedelta(days=1) <= played <= today + timedelta(days=14):
            errors.append(f"{key}: data inattesa {played}")
        for side in ("homeOut","awayOut"):
            if any(not isinstance(n,str) or not n.strip() for n in match[side]):
                errors.append(f"{key}: indisponibili non validi per {side}")
    return errors

def main() -> int:
    report = {"source": SOURCE, "checked_at_utc": datetime.now(timezone.utc).isoformat(), "valid": False}
    try:
        matches = extract(fetch_html())
        errors = validate(matches)
        report["matches_found"] = len(matches)
        report["teams_found"] = len({x for m in matches for x in [m["home"],m["away"]]})
        report["matches"] = [{
            "fixture": f'{m["home"]} - {m["away"]}',
            "kickoff": m["kickoff_local"],
            "modules": [m["homeModule"],m["awayModule"]],
            "home_players": len(m["homeXI"]),
            "away_players": len(m["awayXI"]),
            "home_out": len(m["homeOut"]),
            "away_out": len(m["awayOut"])
        } for m in matches]
        report["errors"] = errors
        if not errors:
            result = {"source": SOURCE, "generated_at_utc": report["checked_at_utc"], "lineups": matches}
            OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2)+"\n",encoding="utf-8")
            report["valid"] = True
            # Tracce minime per verificare associazione nomi, senza stampare l'intera pagina.
            print("CAMPIONE:",json.dumps([{"fixture": f'{m["home"]} - {m["away"]}', "home_first": m["homeXI"][0], "away_first": m["awayXI"][0], "home_out": m["homeOut"][:2], "away_out": m["awayOut"][:2]} for m in matches[:2]], ensure_ascii=False))
    except Exception as exc:
        report["errors"] = [f"{type(exc).__name__}: {exc}"]
    REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("VALIDAZIONE:",json.dumps(report,ensure_ascii=False))
    return 0 if report["valid"] else 1

if __name__=="__main__":
    sys.exit(main())
