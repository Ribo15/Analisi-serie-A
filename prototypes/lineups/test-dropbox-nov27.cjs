const assert=require('node:assert/strict');
const {test}=require('node:test');
const fs=require('node:fs'),vm=require('node:vm');

const DATA=['data.js','beta/data-meta-g9.js','beta/data-bands-v12.js','beta/data-predictions-g10.js','beta/data-lineups-g10.js','beta/data-v12.js'];
const WALLET=['beta/wallet-excel-snapshot.js','beta/wallet-excel-g12-g13.js','beta/wallet-excel-g13-lost.js'];
const run=(ctx,p)=>vm.runInNewContext(fs.readFileSync(p,'utf8'),ctx,{filename:p,timeout:12000});
function model(){
 const ctx={window:{},console};
 for(const p of DATA)run(ctx,p);
 const prevPred=JSON.stringify(ctx.window.SERIE_A_DATA.predictions);
 const beforeG13=JSON.stringify(ctx.window.SERIE_A_DATA.predictions.filter(x=>x.round===13));
 run(ctx,'beta/data-v13.js');
 run(ctx,'beta/data-predictions-g13.js');
 return {D:ctx.window.SERIE_A_DATA,prevPred,beforeG13};
}
function wallet(initial=[],beforeSettlement=()=>{}){
 const saved=new Map([['serieADataLab.wallet.v3',JSON.stringify(initial)]]);
 const localStorage={
  getItem:k=>saved.has(k)?saved.get(k):null,
  setItem:(k,v)=>{saved.set(k,String(v));},
  removeItem:k=>saved.delete(k)
 };
 const pill={textContent:''};
 const ctx={window:{},location:{pathname:'/Analisi-serie-A/'},document:{querySelector:()=>pill},localStorage,console};
 run(ctx,WALLET[0]);run(ctx,WALLET[1]);beforeSettlement({saved,ctx});
 run(ctx,WALLET[2]);
 return {ctx,saved,pill,rows:JSON.parse(saved.get('serieADataLab.wallet.v3'))};
}
const bet=rows=>rows.filter(r=>r.type==='bet'&&r.round===13&&Number(r.amount)===5);

test('G13: all 10 matches, 220 valid starting players and latest Dropbox snapshot',()=>{
 const {D}=model();
 const all=D.lineups.filter(l=>l.round===13);
 const cal=D.calendar.filter(l=>l.round===13);
 assert.equal(all.length,10);assert.equal(cal.length,10);
 assert.equal(all.reduce((s,l)=>s+l.homeXI.length+l.awayXI.length,0),220);
 for(const f of cal){
  const l=all.find(x=>x.home===f.home&&x.away===f.away);
  assert(l);assert.equal(f.date,l.date);assert.equal(f.time,l.time);
  for(const side of ['home','away']){
   const p=l[side+'XI'],m=l[side+'Module'];
   assert.equal(p.length,11);
   assert.equal(new Set(p.map(x=>x.name.toLowerCase())).size,11);
   assert(p.every(x=>x.prob>=0&&x.prob<=1));
   assert.equal(m.split('-').map(Number).reduce((a,b)=>a+b),10);
  }
 }
 assert.equal(D.lastRound,12);
 assert.equal(D.games.filter(g=>g.round===12).length,20);
});
test('No changes to any historical or frozen G12-G13 prediction',()=>{
 const {D,prevPred}=model();
 assert.equal(D.predictions.filter(x=>x.round===13).length,10);
 assert.equal(D.predictions.filter(x=>x.round===12).length,10);
 assert.equal(D.betaSnapshot.predictionsFrozen,true);
 const earlier=JSON.parse(prevPred);
 assert.deepEqual(JSON.parse(JSON.stringify(D.predictions.filter(x=>x.round!==13))),earlier);
});
test('G13 €5: marked LOST, no payout, still one bet and no other changes',()=>{
 const {rows,saved,pill}=wallet();
 const g13=bet(rows);
 assert.equal(g13.length,1);
 assert.equal(g13[0].status,'lost');assert.equal(g13[0].payout,0);
 assert.equal(g13[0].selections.length,4);
 assert.equal(rows.filter(x=>x.type==='topup').reduce((n,x)=>n+Number(x.amount),0),120);
 assert.equal(rows.filter(x=>x.type==='bet').reduce((n,x)=>n+Number(x.amount),0),190);
 assert.equal(rows.filter(x=>x.type==='bet').reduce((n,x)=>n+Number(x.payout||0),0),126.05);
 assert.equal(rows.filter(x=>x.type==='bet'&&x.status==='open').length,0);
 assert(pill.textContent.includes('persa'));
 assert(saved.has('serieADataLab.wallet.backup.ufficiale.excel-g13-5e-lost-20261127'));
});
test('Existing local slip merged with Excel: preserve id and details, only close it',()=>{
 const custom={id:987612,round:13,date:'2026-11-27',type:'bet',description:'Mia schedina di prova',
  amount:5,status:'open',payout:0,source:'slip',
  selections:[{home:'Como',away:'Juventus',market:'gol',odds:1.8}]};
 const {rows}=wallet([custom]);
 const found=bet(rows);assert.equal(found.length,1);
 assert.equal(found[0].id,custom.id);assert.equal(found[0].description,custom.description);
 assert.equal(found[0].status,'lost');assert.equal(found[0].payout,0);
 assert.equal(found[0].selections[0].odds,1.8);
});
test('Another personal G13 €5 slip is untouched and stays open',()=>{
 const unrelated={id:19191919,round:13,type:'bet',description:'Altra schedina',
  amount:5,status:'open',payout:0,source:'slip',
  selections:[{home:'Inter',away:'Genoa',market:'1',odds:1.4}]};
 const {rows}=wallet([],({saved})=>{
  const arr=JSON.parse(saved.get('serieADataLab.wallet.v3'));
  arr.push(unrelated);
  saved.set('serieADataLab.wallet.v3',JSON.stringify(arr));
 });
 assert.equal(rows.filter(x=>x.id===unrelated.id).length,1);
 assert.equal(rows.find(x=>x.id===unrelated.id).status,'open');
 assert.equal(rows.find(x=>x.id===26001301).status,'lost');
});
test('Repeated load never duplicates or changes other bets',()=>{
 const {ctx,saved,rows}=wallet();
 const original=JSON.stringify(rows);
 run(ctx,WALLET[2]);
 assert.equal(saved.get('serieADataLab.wallet.v3'),original);
 assert.equal(bet(rows).length,1);
});
test('Absent wallet remains absent and is never initialized by settlement patch',()=>{
 const saved=new Map(),localStorage={getItem:k=>saved.has(k)?saved.get(k):null,setItem:(k,v)=>saved.set(k,String(v))};
 const ctx={window:{},location:{pathname:'/Analisi-serie-A/'},document:{querySelector:()=>null},localStorage,console};
 run(ctx,WALLET[2]);assert.equal(saved.size,0);
});
