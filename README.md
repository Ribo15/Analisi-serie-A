# Serie A DataLab

Dashboard statica GitHub Pages basata sul file Excel del progetto Pronostici Serie A.

## Sezioni

- **Dati Match**: confronto tra due squadre su generale, ultime 5, casa/fuori e livello avversario.
- **Pronostici**: output del modello salvati nello snapshot Excel per la giornata disponibile, con attendibilità e dati attesi.
- **Classifica**: posizione, punti, V/N/P, gol e forma recente.

## Pubblicazione su GitHub Pages

Caricare nella root del repository:

- `index.html`
- `styles.css`
- `app.js`
- `data.js`

Poi: **Settings → Pages → Deploy from a branch → main → /(root)**.

## Aggiornamento dati

`data.js` contiene lo snapshot dei dati. Quando si aggiorna l'Excel, il file può essere rigenerato e sostituito nel repository senza cambiare gli altri file, salvo modifiche alla struttura del sito.
