"""Sonda NON invasiva della fonte formazioni: non modifica dati o file del sito."""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

SOURCE = "https://www.sosfanta.com/lista-formazioni/probabili-formazioni-serie-a/"
OUT = Path("lineups-probe-report.json")
TEAMS = (
    "Atalanta", "Bologna", "Cagliari", "Como", "Fiorentina",
    "Frosinone", "Genoa", "Inter", "Juventus", "Lazio",
    "Lecce", "Milan", "Monza", "Napoli", "Parma",
    "Roma", "Sassuolo", "Torino", "Udinese", "Venezia",
)

class VisibleText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ignored = 0
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.ignored += 1

    def handle_endtag(self, tag):
        if tag in ("script", "style") and self.ignored:
            self.ignored -= 1

    def handle_data(self, data):
        if not self.ignored and data.strip():
            self.parts.append(data.strip())


def probe() -> dict:
    req = Request(
        SOURCE,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; LineupsSourceCheck/1.0)",
            "Accept-Language": "it-IT,it;q=0.9",
        },
    )
    with urlopen(req, timeout=25) as response:
        status = response.status
        body = response.read(3_000_001)
        charset = response.headers.get_content_charset() or "utf-8"
    if len(body) > 3_000_000:
        raise ValueError("Risposta troppo grande: controllo fermato")
    parser = VisibleText()
    parser.feed(body.decode(charset, errors="replace"))
    text = " ".join(parser.parts)
    lower = text.casefold()
    found_teams = [t for t in TEAMS if re.search(r"\b" + re.escape(t.casefold()) + r"\b", lower)]
    pct_count = len(re.findall(r"(?<!\d)(?:100|[1-9]\d?)\s*%", text))
    signals = {
        "titolo": "probabili formazioni" in lower,
        "titolari": "titolari" in lower,
        "indisponibili": "indisponibili" in lower,
        "percentuali": pct_count >= 22,
        "squadre": len(found_teams) >= 18,
    }
    return {
        "source": SOURCE,
        "checked_at_utc": datetime.now(timezone.utc).isoformat(),
        "http_status": status,
        "body_bytes": len(body),
        "html_text_chars": len(text),
        "teams_detected": len(found_teams),
        "percentage_entries": pct_count,
        "signals": signals,
        "safe_for_extraction_test": all(signals.values()) and status == 200,
        "note": "Solo diagnostica: NON contiene formazioni, NON sovrascrive file, NON pubblica dati.",
    }


def main() -> int:
    try:
        report = probe()
    except (HTTPError, URLError, TimeoutError, ValueError, OSError) as exc:
        report = {
            "source": SOURCE,
            "checked_at_utc": datetime.now(timezone.utc).isoformat(),
            "safe_for_extraction_test": False,
            "error": f"{type(exc).__name__}: {exc}",
            "note": "Nessun aggiornamento effettuato.",
        }
    OUT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0 if report["safe_for_extraction_test"] else 1


if __name__ == "__main__":
    sys.exit(main())
