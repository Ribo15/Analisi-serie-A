/* Beta data overlay v12 — core applicator. Source: workbook Pronostici v12, 30/10/2026. */
(() => {
'use strict';
const D=window.SERIE_A_DATA;
if(!D)return;
D.lastRound=9;
D.predictionRounds=[10,9,8,7];
if(window.BETA_V12_META) D.meta=window.BETA_V12_META;
if(Array.isArray(window.BETA_V12_GAMES9)) D.games=(D.games||[]).filter(g=>+g.round!==9).concat(window.BETA_V12_GAMES9);
const fixtures10=window.BETA_V12_FIXTURES10||[];
(D.calendar||[]).forEach(f=>{
  if(+f.round===9) f.status='FINISHED';
  if(+f.round===10){
    const u=fixtures10.find(x=>x.home===f.home&&x.away===f.away);
    if(u) Object.assign(f,u);
  }
});
const rates={
  band:{A:[1,3],B:[1,1],C:[.6,5],NoBet:[5/11,11]},
  poissonBand:{A:[1,4],B:[.5,2],C:[.6,5],NoBet:[4/9,9]},
  doubleChanceBand:{A:[1,1],B:[5/6,6],C:[1,1],NoBet:[.75,12]},
  doubleChancePoissonBand:{A:[1,2],B:[5/6,6],C:[0,1],NoBet:[9/11,11]},
  scoreHomeYNBand:{A:[1,3],B:[1,3],C:[5/7,7],NoBet:[3/7,7]},
  scoreAwayYNBand:{A:[1,3],B:[6/9,9],C:[1,1],NoBet:[4/7,7]},
  bttsBand:{'Possible Bet':[8/13,13],NoBet:[2/7,7]},
  uo25Band:{'Possible Bet':[8/15,15],NoBet:[3/5,5]}
};
function applyRate(p,key){
  const x=rates[key]?.[p[key]];
  p[key+'Rate']=x?x[0]:null;
  p[key+'Sample']=x?x[1]:0;
}
const existing=(D.predictions||[]).filter(p=>+p.round!==10);
(window.BETA_V12_BAND_UPDATES||[]).forEach(u=>{
  const p=existing.find(x=>x.home===u.home&&x.away===u.away);
  if(p) Object.assign(p,u);
});
existing.forEach(p=>Object.keys(rates).forEach(k=>{if(p[k])applyRate(p,k)}));
const p10=(window.BETA_V12_PREDICTIONS10||[]).map(p=>({...p}));
p10.forEach(p=>Object.keys(rates).forEach(k=>{if(p[k])applyRate(p,k)}));
D.predictions=p10.concat(existing);
D.lineups=(D.lineups||[]).filter(x=>+x.round!==10).concat(window.BETA_V12_LINEUPS10||[]);
D.betaSnapshot={source:'Pronostici v12',generated:'2026-10-30',lastResultsRound:9,predictionRound:10};
})();