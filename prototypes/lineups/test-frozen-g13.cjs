const assert=require('node:assert/strict');
const {test}=require('node:test');
const vm=require('node:vm'),fs=require('node:fs');

const paths=['data.js','beta/data-meta-g9.js','beta/data-bands-v12.js','beta/data-predictions-g10.js','beta/data-lineups-g10.js','beta/data-v12.js','beta/data-v13.js'];
function data() {
 const ctx={window:{},console};
 for(const name of paths)vm.runInNewContext(fs.readFileSync(name,'utf8'),ctx,{filename:name});
 const D=ctx.window.SERIE_A_DATA;
 const before=JSON.stringify((D.predictions||[]).filter(x=>+x.round!==13));
 vm.runInNewContext(fs.readFileSync('beta/data-predictions-g13.js','utf8'),ctx,{filename:'beta/data-predictions-g13.js'});
 return {D,ctx,before};
}
test('G13: 10 pronostici, abbinamenti corretti, fasce congelate',()=>{
 const {D}=data();
 const p=D.predictions.filter(x=>+x.round===13);
 const cal=D.calendar.filter(x=>+x.round===13);
 assert.equal(p.length,10);
 assert.equal(cal.length,10);
 assert.equal(new Set(p.map(x=>x.home+'|'+x.away)).size,10);
 for(const row of p){
  assert(cal.some(f=>f.home===row.home&&f.away===row.away));
  assert(['A','B','C','D','NoBet'].includes(row.band));
  assert(['A','B','C','D','NoBet'].includes(row.poissonBand));
  assert(row.oneXtwoConf>=0&&row.oneXtwoConf<=1);
  assert(row.poissonConf>=0&&row.poissonConf<=1);
  assert(row.bttsConf>=0&&row.bttsConf<=1);
  assert(row.uo25Conf>=0&&row.uo25Conf<=1);
  assert(row.bandSample>=0);
  assert(row.poissonBandSample>=0);
  assert(row.bttsBandSample>=0);
  assert(row.uo25BandSample>=0);
  assert(row.scoreHomeYNBandSample>=0);
  assert(row.scoreAwayYNBandSample>=0);
  assert(row.doubleChanceBandSample>=0);
  assert(row.doubleChancePoissonBandSample>=0);
 }
 assert.equal(D.betaSnapshot.predictionsFrozen,true);
 assert.equal(D.betaSnapshot.predictionRound,13);
 assert.equal(D.lastRound,12);
});
test('G13: valori congelati letti da Excel esattamente',()=>{
 const {D}=data(),p=D.predictions.filter(x=>x.round===13);
 const one=p.find(x=>x.home==='Frosinone'&&x.away==='Parma');
 assert.equal(one.oneXtwo,'1');assert.equal(one.oneXtwoConf,0.74);
 assert.equal(one.band,'A');assert.equal(one.poissonBand,'A');
 assert.equal(one.bandSample,10);assert.equal(one.bandRate,0.9);
 const two=p.find(x=>x.home==='Lecce'&&x.away==='Atalanta');
 assert.equal(two.oneXtwo,'2');assert.equal(two.oneXtwoConf,0.55);
 assert.equal(two.band,'NoBet');assert.equal(two.poissonBand,'NoBet');
 assert.equal(two.btts,'Gol');assert.equal(two.bttsConf,0.67);
});
test('Nessuna variazione alle 10 pronostici G12 e giornate precedenti',()=>{
 const {D,before}=data();
 assert.equal(JSON.stringify(D.predictions.filter(x=>+x.round!==13)),before);
 assert.equal(D.predictions.filter(x=>x.round===12).length,10);
});
test('Importazione idempotente: non raddoppia pronostici G13',()=>{
 const {D,ctx}=data();
 vm.runInNewContext(fs.readFileSync('beta/data-predictions-g13.js','utf8'),ctx,{filename:'repeat'});
 assert.equal(D.predictions.filter(x=>+x.round===13).length,10);
});
test('Schedina già giocata di G13 resta aperta: 5 euro',()=>{
 const code=fs.readFileSync('beta/wallet-excel-g12-g13.js','utf8');
 assert(code.includes('"round":13'));
 assert(code.includes('"amount":5'));
 assert(code.includes('"status":"open"'));
 assert(code.includes('"payout":0'));
});
