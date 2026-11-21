"""Diagnostica temporanea: piccoli frammenti di HTML della prima partita, non modifica dati."""
import re
from urllib.request import Request,urlopen
from html import unescape

url="https://www.sosfanta.com/lista-formazioni/probabili-formazioni-serie-a/"
with urlopen(Request(url,headers={"User-Agent":"Mozilla/5.0","Accept-Language":"it-IT,it;q=0.9"}),timeout=25) as r:
    page=r.read().decode(r.headers.get_content_charset() or "utf-8","replace")
for term in ("Como", "Titolari", "Indisponibili"):
    print("=== struttura: "+term+" ===")
    hits=[m.start() for m in re.finditer(term,page,re.IGNORECASE)]
    print("occorrenze",len(hits))
    for idx in hits[:3]:
        snippet=page[max(0,idx-400):min(len(page),idx+1400)]
        snippet=re.sub(r'<script[^>]*>.*?</script>','[script]',snippet,flags=re.I|re.S)
        print(unescape(snippet[:1800]).replace("\\n"," ")[:1800])
