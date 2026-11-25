/* Incremento schedine Dropbox 25/11/2026.
   G12 aggiornata, G13 €5 APERTA. Backup locale; nessuna modifica allo storico G1-G11. */
(() => {
'use strict';
const VERSION='schedine-excel-20261125-g12-g13-open',KEY='serieADataLab.wallet.v3';
const namespace=location.pathname.includes('/beta/')?'beta':'ufficiale';
const marker='serieADataLab.wallet.deltaVersion.'+namespace;
const backup='serieADataLab.wallet.backup.'+namespace+'.'+VERSION;
const additions=[{"id":26001200,"round":12,"date":null,"type":"topup","description":"Ricarica Excel • giornata 12","amount":20,"status":null,"payout":0,"source":"excel"},{"id":26001201,"round":12,"date":null,"type":"bet","description":"Schedina Excel • giornata 12 • n. 1","amount":10,"status":"won","payout":61.05,"source":"excel","selections":[{"home":"Parma","away":"Roma","market":"2","odds":null},{"home":"Como","away":"Cagliari","market":"1","odds":null},{"home":"Lazio","away":"Lecce","market":"1","odds":null},{"home":"Milan","away":"Frosinone","market":"gol","odds":null},{"home":"Atalanta","away":"Inter","market":"gol","odds":null},{"home":"Juventus","away":"Venezia","market":"1","odds":null}]},{"id":26001202,"round":12,"date":null,"type":"bet","description":"Schedina Excel • giornata 12 • n. 2","amount":5,"status":"lost","payout":0,"source":"excel","selections":[{"home":"Milan","away":"Frosinone","market":"over 2,5","odds":null},{"home":"Bologna","away":"Udinese","market":"gol","odds":null},{"home":"Atalanta","away":"Inter","market":"2+over 2,5","odds":null},{"home":"Monza","away":"Fiorentina","market":"x+gol","odds":null},{"home":"Juventus","away":"Venezia","market":"1","odds":null}]},{"id":26001203,"round":12,"date":null,"type":"bet","description":"Schedina Excel • giornata 12 • n. 3","amount":5,"status":"lost","payout":0,"source":"excel","selections":[{"home":"Lazio","away":"Lecce","market":"1+under 2,5","odds":null},{"home":"Sassuolo","away":"Genoa","market":"1","odds":null},{"home":"Bologna","away":"Udinese","market":"gol + over 2,5","odds":null},{"home":"Monza","away":"Fiorentina","market":"1-1 o 2-1","odds":null},{"home":"Juventus","away":"Venezia","market":"1","odds":null}]},{"id":26001301,"round":13,"date":null,"type":"bet","description":"Schedina Excel • giornata 13 • in corso","amount":5,"status":"open","payout":0,"source":"excel","selections":[{"home":"Udinese","away":"Fiorentina","market":"gol","odds":null},{"home":"Como","away":"Juventus","market":"gol","odds":null},{"home":"Venezia","away":"Bologna","market":"2","odds":null},{"home":"Lecce","away":"Atalanta","market":"2","odds":null}]}];
try {
 if(localStorage.getItem(marker)===VERSION)return;
 const raw=localStorage.getItem(KEY);
 if(raw===null)return;
 const old=JSON.parse(raw);
 if(!Array.isArray(old))return;
 if(localStorage.getItem(backup)===null)localStorage.setItem(backup,raw);
 const used=new Set();
 const rows=additions.map(x=>{
   const candidates=old.filter(o=>!used.has(o.id)&&o.type===x.type&&Number(o.round)===x.round&&Number(o.amount)===x.amount);
   let match=null;
   if(candidates.length){
     const overlap=c=>Array.isArray(c.selections)&&c.selections.some(sel=>
       (x.selections||[]).some(p=>p.home===sel.home&&p.away===sel.away&&String(p.market||'').toLowerCase()===String(sel.market||'').toLowerCase()));
     match=candidates.find(overlap)||candidates.find(c=>!Array.isArray(c.selections)||c.selections.length===0)||null;
     if(!match&&x.round===13&&candidates.length===1)match=candidates[0];
   }
   if(!match)return x;
   used.add(match.id);
   const preserve=Array.isArray(match.selections)&&match.selections.length>0;
   return {...x,...match,status:x.status,payout:x.payout,
     selections:preserve?match.selections:(x.selections||match.selections||[]),
     source:match.source||x.source,excelSynced:true};
 });
 const merged=old.filter(x=>!used.has(x.id)).concat(rows);
 if(!merged.every(x=>Number.isFinite(Number(x.amount))))return;
 const ids=new Set();
 for(const x of merged){if(ids.has(x.id))throw new Error('Identificativo schedina duplicato');ids.add(x.id);}
 localStorage.setItem(KEY,JSON.stringify(merged));
 localStorage.setItem(marker,VERSION);
 const pill=document.querySelector('.wallet-local-pill');
 if(pill)pill.textContent='Excel aggiornato a G12 • G13 €5 aperta • salvataggio locale';
 window.EXCEL_WALLET_SYNC_G13={version:VERSION,lastResultsRound:12,activeStake:5};
} catch(err){console.warn('Importazione delta schedine G12/G13 bloccata:',err);}
})();
