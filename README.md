# Dati Match Serie A — prototipo GitHub Pages

Prototipo statico costruito dallo snapshot `Pronostici_v12_auditata_sbloccata.xlsx`.

## Cosa fa ora

- selezione **Squadra Casa** e **Squadra Trasferta** tra tutte le 20 squadre;
- confronto **Generale**;
- confronto **Ultime 5**;
- confronto **Casa / Fuori** (ultime gare disponibili in casa per la prima squadra e in trasferta per la seconda);
- confronto **Livello avversario** usando i livelli già presenti nel file Excel;
- dati calcolati con la stessa logica delle tabelle di confronto del foglio PRONOSTICI.

Lo snapshot contiene dati giocati fino alla **giornata 6**.

## Pubblicazione su GitHub Pages

1. Crea un repository, ad esempio `dati-match-serie-a`.
2. Carica nella radice del repository questi quattro file: `index.html`, `styles.css`, `app.js`, `data.js`.
3. Apri **Settings → Pages**.
4. In **Build and deployment**, scegli **Deploy from a branch**.
5. Seleziona `main` e cartella `/ (root)`, quindi **Save**.
6. Dopo la pubblicazione GitHub mostrerà l'indirizzo del sito.

## Aggiornamento dati

Per questo primo test `data.js` è uno snapshot. Quando il layout sarà approvato, il passo successivo sarà creare un piccolo esportatore che rigenera `data.js` dal nuovo Excel senza toccare il sito.
