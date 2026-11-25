const assert=require('node:assert/strict');
const {test}=require('node:test');
const fs=require('node:fs');
const vm=require('node:vm');

const base=['data.js','beta/data-meta-g9.js','beta/data-bands-v12.js','beta/data-predictions-g10.js','beta/data-lineups-g10.js','beta/data-v12.js'];
function run(ctx,path){vm.runInNewContext(fs.readFileSync(path,'utf8'),ctx,{filename:path,timeout:15000});}
function dataModel(){
 const ctx={window:{},console};
 for(const path of base)run(ctx,path);
 const frozen=JSON.stringify(ctx.window.SERIE_A_DATA.predictions.filter(x=>+x.round===12));
 run(ctx,'beta/data-v13.js');
 return {D:ctx.window.SERIE_A_DATA,previousFrozen:frozen};
}
function walletModel(seed=[]){
 const saved=new Map();
 saved.set('serieADataLab.wallet.v3',JSON.stringify(seed));
 const localStorage={
  getItem:k=>saved.has(k)?saved.get(k):null,
  setItem:(k,v)=>{saved.set(k,String(v));},
  removeItem:k=>saved.delete(k)
 };
 const ctx={window:{},location:{pathname:'/Analisi-serie-A/'},document:{querySelector:()=>null},localStorage,console};
 run(ctx,'beta/wallet-excel-snapshot.js');
 run(ctx,'beta/wallet-excel-g12-g13.js');
 const rows=JSON.parse(saved.get('serieADataLab.wallet.v3'));
 return {ctx,rows,saved};
}
test('classifica G12 completa e partite coerenti',()=>{
 const {D}=dataModel();
 assert.equal(D.lastRound,12);
 assert.equal(Object.keys(D.meta).length,20);
 assert(Object.values(D.meta).every(x=>x.played===12));
 assert.equal(D.games.filter(g=>+g.round===12).length,20);
 assert.equal(D.calendar.filter(g=>+g.round===12&&g.status==='FINISHED').length,10);
 const c=D.games.find(g=>g.round===12&&g.team==='Como'&&g.opponent==='Cagliari');
 assert.equal(c.gf,2);assert.equal(c.ga,0);
});
test('G13: calendario e 220 titolari, tutte le date e moduli validi',()=>{
 const {D}=dataModel();
 const cal=D.calendar.filter(g=>+g.round===13);
 const lineup=D.lineups.filter(g=>+g.round===13);
 assert.equal(cal.length,10);assert.equal(lineup.length,10);
 assert.equal(D.betaSnapshot.predictionRound,13);
 for(const f of cal){
  const l=lineup.find(x=>x.home===f.home&&x.away===f.away);
  assert(l,f.home+'-'+f.away);
  assert.equal(l.date,f.date);assert.equal(l.time,f.time);
  assert.equal(l.homeXI.length,11);assert.equal(l.awayXI.length,11);
  assert.equal(l.round,13);assert.equal(l.source,'Excel');
 }
 const v=cal.find(x=>x.home==='Venezia'&&x.away==='Bologna');
 assert.equal(v.date,'2026-11-27');assert.equal(v.time,'20:45');
});
test('pronostici G12 congelati immutati; non inventare G13',()=>{
 const {D,previousFrozen}=dataModel();
 assert.equal(JSON.stringify(D.predictions.filter(x=>+x.round===12)),previousFrozen);
 assert.equal(D.predictions.filter(x=>+x.round===13).length,0);
});
test('schedine Excel: incassi, importi G12 e G13 da €5 APERTA',()=>{
 const {rows,saved}=walletModel();
 const topups=rows.filter(x=>x.type==='topup').reduce((v,x)=>v+Number(x.amount),0);
 const played=rows.filter(x=>x.type==='bet').reduce((v,x)=>v+Number(x.amount),0);
 const won=rows.filter(x=>x.type==='bet').reduce((v,x)=>v+Number(x.payout||0),0);
 assert.equal(topups,120);assert.equal(played,190);assert.equal(won,126.05);
 assert.equal(rows.filter(x=>x.round===12&&x.type==='bet').length,3);
 assert.equal(rows.filter(x=>x.round===13&&x.type==='bet').length,1);
 const active=rows.filter(x=>x.type==='bet'&&x.status==='open');
 assert.equal(active.length,1);assert.equal(active[0].round,13);assert.equal(active[0].amount,5);
 assert.equal(active[0].payout,0);assert.equal(active[0].selections.length,4);
 assert(saved.has('serieADataLab.wallet.backup.ufficiale.schedine-excel-20261125-g12-g13-open'));
});
test('Giocata €5 già inserita localmente non viene duplicata o persa',()=>{
 const original={id:123456789,round:13,date:'2026-11-24',type:'bet',description:'Mia schedina',amount:5,status:'open',payout:0,source:'slip',selections:[{home:'Como',away:'Juventus',market:'Gol',odds:1.9}]};
 const {rows}=walletModel([original]);
 const x=rows.filter(r=>r.type==='bet'&&r.round===13);
 assert.equal(x.length,1);
 assert.equal(x[0].id,original.id);assert.equal(x[0].status,'open');
 assert.equal(x[0].selections[0].market,'Gol');
 assert.equal(x[0].description,original.description);
});
test('Reload non duplica giocate',()=>{
 const {ctx,rows,saved}=walletModel();
 const original=JSON.stringify(rows);
 run(ctx,'beta/wallet-excel-g12-g13.js');
 assert.equal(saved.get('serieADataLab.wallet.v3'),original);
});
