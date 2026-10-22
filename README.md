# Serie A DataLab — V5

Dashboard statica per GitHub Pages basata sul file Excel del progetto.

## Novità V5
- **Calendario**: 38 giornate e 380 match letti dal foglio `SCHEDINE/CALENDARIO` dell’Excel aggiornato.
- **Pronostici Match**: stessa logica di selezione Casa/Trasferta della pagina Dati Match; viene mostrato un solo match alla volta.
- **Possibili puntate**: blocco condiviso tra Dati Match e Pronostici con mercato, quota, fiducia, stato e nota.
- Le possibili puntate sono visibili anche nel Calendario come conteggio per partita.
- Per ora puntate e portafoglio sono salvati in `localStorage` del browser.

## File da caricare nella root del repository GitHub
- `index.html`
- `styles.css`
- `app.js`
- `data.js`
- `README.md`

GitHub Pages continua a usare lo stesso link del repository.

## Nota dati
I pronostici mostrati sono quelli **salvati/congelati nel Pannello A** del file, non il calcolo live del match attualmente aperto nel foglio `PRONOSTICI`.
