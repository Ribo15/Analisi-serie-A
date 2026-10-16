# Serie A DataLab – V3

Dashboard statica per GitHub Pages basata sullo snapshot Excel del progetto Pronostici Serie A.

## Pagine
- **Dati Match**: confronto tra due squadre con dati generali, ultime gare dinamiche, casa/fuori dinamico e livello avversario.
- **Pronostici**: bozza attuale dei mercati del modello.
- **Classifica**: classifica e forma recente.
- **Andamento scommesse**: bozza personale con ricariche, schedine, vincite/perdite, saldo e attivo/passivo.

## Nota sul portafoglio
I movimenti della pagina **Andamento scommesse** vengono salvati nel `localStorage` del browser. Restano quindi sul singolo browser/dispositivo e non vengono caricati su GitHub.

## Pubblicazione
Caricare nella root del repository GitHub questi file:
- `index.html`
- `styles.css`
- `app.js`
- `data.js`
- `README.md`

GitHub Pages può continuare a usare `main / (root)`.


## V4
Andamento scommesse ridisegnato con Attivo/Passivo, grafico cumulato per giornata, riepilogo ricariche/giocate/vincite/perdite/credito/ritiri e inserimento compatto dei movimenti.
