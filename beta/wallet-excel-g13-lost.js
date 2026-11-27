/* Chiusura G13: la schedina Excel da 5 euro e' persa (27/11/2026).
   Incremento isolato: nessuna modifica a importi, storico o altre giocate.
   Conserva una copia locale del portafoglio prima della modifica. */
(() => {
  'use strict';
  const KEY='serieADataLab.wallet.v3';
  const VERSION='excel-g13-5e-lost-20261127';
  const ns=location.pathname.includes('/beta/')?'beta':'ufficiale';
  const marker='serieADataLab.wallet.settlement.'+ns+'.'+VERSION;
  const backup='serieADataLab.wallet.backup.'+ns+'.'+VERSION;
  const stake=5, round=13;
  try {
    if(localStorage.getItem(marker)===VERSION)return;
    const raw=localStorage.getItem(KEY);
    if(raw===null)return; // Mai inizializzare o sovrascrivere un portafoglio non ancora caricato.
    const rows=JSON.parse(raw);
    if(!Array.isArray(rows))return;
    function matchExcelBet(b){
      if(!b||b.type!=='bet'||Number(b.round)!==round||Number(b.amount)!==stake)return false;
      // Identificativo originale Excel, oppure schedina locale gia' associata
      // all'unica giocata Excel G13 dall'importatore precedente.
      return Number(b.id)===26001301 || b.excelSynced===true;
    }
    const matches=rows.map((b,i)=>({b,i})).filter(x=>matchExcelBet(x.b));
    if(matches.length!==1){
      console.warn('Saldo G13 non applicato: identificazione non univoca della schedina Excel da 5 euro');
      return;
    }
    const i=matches[0].i,bet=rows[i];
    if(localStorage.getItem(backup)===null)localStorage.setItem(backup,raw);
    const updated=rows.slice();
    updated[i]={...bet,status:'lost',payout:0};
    const ids=new Set();
    for(const row of updated){if(ids.has(row.id))throw new Error('Id schedina duplicato');ids.add(row.id);}
    localStorage.setItem(KEY,JSON.stringify(updated));
    localStorage.setItem(marker,VERSION);
    const pill=document.querySelector('.wallet-local-pill');
    if(pill)pill.textContent='Excel G12 • G13 schedina da 5 € persa • salvataggio locale';
    window.EXCEL_WALLET_SYNC_G13={...(window.EXCEL_WALLET_SYNC_G13||{}),version:VERSION,lastResultsRound:12,activeStake:0,settlement:'lost'};
  }catch(err){console.warn('Chiusura schedina Excel G13 non applicata:',err);}
})();
