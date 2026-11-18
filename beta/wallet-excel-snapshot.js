/* SCHEDINE Excel 2026-11-18: G1–G11; data originale delle giocate non presente nel file.
   Importazione una volta per versione, con backup locale e conservazione dei movimenti G12+. */
(() => {
'use strict';
const VERSION='schedine-excel-20261118-g11';
const KEY='serieADataLab.wallet.v3';
const beta=location.pathname.includes('/beta/');
const namespace=beta?'beta':'ufficiale';
const marker='serieADataLab.wallet.importVersion.'+namespace;
const backup='serieADataLab.wallet.backup.'+namespace+'.'+VERSION;
const excel=[{"id":26000600,"round":6,"date":null,"type":"topup","description":"Ricarica Excel • giornata 6","amount":10,"status":null,"payout":0,"source":"excel"},{"id":26000601,"round":6,"date":null,"type":"bet","description":"Schedina Excel • giornata 6 • n. 1","amount":10,"status":"won","payout":65,"source":"excel"},{"id":26000701,"round":7,"date":null,"type":"bet","description":"Schedina Excel • giornata 7 • n. 1","amount":25,"status":"lost","payout":0,"source":"excel"},{"id":26000801,"round":8,"date":null,"type":"bet","description":"Schedina Excel • giornata 8 • n. 1","amount":25,"status":"lost","payout":0,"source":"excel"},{"id":26000900,"round":9,"date":null,"type":"topup","description":"Ricarica Excel • giornata 9","amount":10,"status":null,"payout":0,"source":"excel"},{"id":26000901,"round":9,"date":null,"type":"bet","description":"Schedina Excel • giornata 9 • n. 1","amount":25,"status":"lost","payout":0,"source":"excel"},{"id":26001000,"round":10,"date":null,"type":"topup","description":"Ricarica Excel • giornata 10","amount":40,"status":null,"payout":0,"source":"excel"},{"id":26001001,"round":10,"date":null,"type":"bet","description":"Schedina Excel • giornata 10 • n. 1","amount":5,"status":"lost","payout":0,"source":"excel"},{"id":26001002,"round":10,"date":null,"type":"bet","description":"Schedina Excel • giornata 10 • n. 2","amount":5,"status":"lost","payout":0,"source":"excel"},{"id":26001003,"round":10,"date":null,"type":"bet","description":"Schedina Excel • giornata 10 • n. 3","amount":5,"status":"lost","payout":0,"source":"excel"},{"id":26001004,"round":10,"date":null,"type":"bet","description":"Schedina Excel • giornata 10 • n. 4","amount":15,"status":"lost","payout":0,"source":"excel"},{"id":26001005,"round":10,"date":null,"type":"bet","description":"Schedina Excel • giornata 10 • n. 5","amount":10,"status":"lost","payout":0,"source":"excel"},{"id":26001100,"round":11,"date":null,"type":"topup","description":"Ricarica Excel • giornata 11","amount":40,"status":null,"payout":0,"source":"excel"},{"id":26001101,"round":11,"date":null,"type":"bet","description":"Schedina Excel • giornata 11 • n. 1","amount":15,"status":"lost","payout":0,"source":"excel","selections":[{"home":"Venezia","away":"Udinese","market":"x2","odds":null},{"home":"Roma","away":"Sassuolo","market":"1","odds":null},{"home":"Parma","away":"Bologna","market":"x2","odds":null},{"home":"Cagliari","away":"Frosinone","market":"x2","odds":null},{"home":"Fiorentina","away":"Juventus","market":"x2","odds":null},{"home":"Genoa","away":"Milan","market":"x2","odds":null},{"home":"Monza","away":"Atalanta","market":"over1,5","odds":null}]},{"id":26001102,"round":11,"date":null,"type":"bet","description":"Schedina Excel • giornata 11 • n. 2","amount":5,"status":"lost","payout":0,"source":"excel","selections":[{"home":"Parma","away":"Bologna","market":"2","odds":null},{"home":"Torino","away":"Lecce","market":"x","odds":null},{"home":"Fiorentina","away":"Juventus","market":"2","odds":null},{"home":"Inter","away":"Como","market":"gol","odds":null}]},{"id":26001103,"round":11,"date":null,"type":"bet","description":"Schedina Excel • giornata 11 • n. 3","amount":10,"status":"lost","payout":0,"source":"excel","selections":[{"home":"Roma","away":"Sassuolo","market":"over3,5","odds":null},{"home":"Torino","away":"Lecce","market":"gol","odds":null},{"home":"Fiorentina","away":"Juventus","market":"gol","odds":null},{"home":"Genoa","away":"Milan","market":"2","odds":null},{"home":"Monza","away":"Atalanta","market":"x2 + over 2,5","odds":null}]},{"id":26001104,"round":11,"date":null,"type":"bet","description":"Schedina Excel • giornata 11 • n. 4","amount":10,"status":"lost","payout":0,"source":"excel","selections":[{"home":"Fiorentina","away":"Juventus","market":"2","odds":null},{"home":"Genoa","away":"Milan","market":"2","odds":null},{"home":"Inter","away":"Como","market":"1+gol","odds":null}]}];
try {
 if(localStorage.getItem(marker)===VERSION)return;
 const raw=localStorage.getItem(KEY);
 const old=raw===null?[]:JSON.parse(raw);
 if(!Array.isArray(old))return;
 if(raw!==null&&localStorage.getItem(backup)===null)localStorage.setItem(backup,raw);
 const keep=old.filter(x=>{
  const n=Number(x?.round);
  return !(Number.isInteger(n)&&n>=1&&n<=11&&['topup','bet','withdrawal'].includes(x?.type));
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
 if(pill)pill.textContent='Excel aggiornato a G11 • salvataggio locale';
 window.EXCEL_WALLET_SYNC={version:VERSION,lastRound:11,schedineExcel:13,environment:namespace};
} catch(e) {console.warn('Sincronizzazione SCHEDINE Excel non applicata:',e)}
})();