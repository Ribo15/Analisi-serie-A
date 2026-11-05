/* SCHEDINE Excel 2026-11-05: G1–G10; data originale delle giocate non presente nel file.
   Importazione una volta per versione, con backup locale e conservazione dei movimenti G11+. */
(() => {
'use strict';
const VERSION='schedine-excel-20261105-g10';
const KEY='serieADataLab.wallet.v3';
const beta=location.pathname.includes('/beta/');
const namespace=beta?'beta':'ufficiale';
const marker='serieADataLab.wallet.importVersion.'+namespace;
const backup='serieADataLab.wallet.backup.'+namespace+'.'+VERSION;
const excel=[{"id":26000600,"round":6,"date":null,"type":"topup","description":"Ricarica Excel • giornata 6","amount":10,"status":null,"payout":0,"source":"excel"},{"id":26000601,"round":6,"date":null,"type":"bet","description":"Schedina Excel • giornata 6 • n. 1","amount":10,"status":"won","payout":65,"source":"excel"},{"id":26000701,"round":7,"date":null,"type":"bet","description":"Schedina Excel • giornata 7 • n. 1","amount":25,"status":"lost","payout":0,"source":"excel"},{"id":26000801,"round":8,"date":null,"type":"bet","description":"Schedina Excel • giornata 8 • n. 1","amount":25,"status":"lost","payout":0,"source":"excel"},{"id":26000900,"round":9,"date":null,"type":"topup","description":"Ricarica Excel • giornata 9","amount":10,"status":null,"payout":0,"source":"excel"},{"id":26000901,"round":9,"date":null,"type":"bet","description":"Schedina Excel • giornata 9 • n. 1","amount":25,"status":"lost","payout":0,"source":"excel"},{"id":26001000,"round":10,"date":null,"type":"topup","description":"Ricarica Excel • giornata 10","amount":40,"status":null,"payout":0,"source":"excel"},{"id":26001001,"round":10,"date":null,"type":"bet","description":"Schedina Excel • giornata 10 • n. 1","amount":5,"status":"lost","payout":0,"source":"excel"},{"id":26001002,"round":10,"date":null,"type":"bet","description":"Schedina Excel • giornata 10 • n. 2","amount":5,"status":"lost","payout":0,"source":"excel"},{"id":26001003,"round":10,"date":null,"type":"bet","description":"Schedina Excel • giornata 10 • n. 3","amount":5,"status":"lost","payout":0,"source":"excel"},{"id":26001004,"round":10,"date":null,"type":"bet","description":"Schedina Excel • giornata 10 • n. 4","amount":15,"status":"lost","payout":0,"source":"excel"},{"id":26001005,"round":10,"date":null,"type":"bet","description":"Schedina Excel • giornata 10 • n. 5","amount":10,"status":"lost","payout":0,"source":"excel"}];
try {
 if(localStorage.getItem(marker)===VERSION)return;
 const raw=localStorage.getItem(KEY);
 const old=raw===null?[]:JSON.parse(raw);
 if(!Array.isArray(old))return;
 if(raw!==null&&localStorage.getItem(backup)===null)localStorage.setItem(backup,raw);
 const keep=old.filter(x=>{
  const n=Number(x?.round);
  return !(Number.isInteger(n)&&n>=1&&n<=10&&['topup','bet','withdrawal'].includes(x?.type));
 });
 // Preserva eventuali dettagli delle schedine create sul sito se giornata/importo coincidono.
 const candidates=old.filter(x=>x?.type==='bet'&&x?.source==='slip'&&Array.isArray(x.selections));
 const used=new Set();
 const synced=excel.map(r=>{
  if(r.type!=='bet')return r;
  const match=candidates.find(c=>!used.has(c.id)&&Number(c.round)===r.round&&Number(c.amount)===r.amount);
  if(!match)return r;
  used.add(match.id);
  return {...r,id:match.id,date:match.date||null,description:match.description||r.description,source:'slip',selections:match.selections,combinedOdds:match.combinedOdds,potentialPayout:match.potentialPayout,excelSynced:true};
 });
 const merged=synced.concat(keep);
 if(!merged.every(r=>Number.isFinite(Number(r.amount))))return;
 localStorage.setItem(KEY,JSON.stringify(merged));
 localStorage.setItem(marker,VERSION);
 const pill=document.querySelector('.wallet-local-pill');
 if(pill)pill.textContent='Excel aggiornato a G10 • salvataggio locale';
 window.EXCEL_WALLET_SYNC={version:VERSION,lastRound:10,schedineExcel:9,environment:namespace};
} catch(e) {console.warn('Sincronizzazione SCHEDINE Excel non applicata:',e)}
})();