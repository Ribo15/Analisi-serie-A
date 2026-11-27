const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||undefined,args:['--no-sandbox']});
 try{
  for(const mobile of [true,false]){
   const ctx=await browser.newContext(mobile?
     {viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1}:
     {viewport:{width:1366,height:900},deviceScaleFactor:1});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.SERIE_A_DATA && window.SERIE_A_DATA.betaSnapshot.predictionsFrozen===true);
   const bets=await page.evaluate(()=>JSON.parse(localStorage.getItem('serieADataLab.wallet.v3')||'[]'));
   const g13=bets.filter(b=>b.type==='bet'&&b.round===13&&b.amount===5);
   assert.equal(g13.length,1);
   assert.equal(g13[0].status,'lost');
   assert.equal(g13[0].payout,0);
   await page.locator('.nav-btn[data-page="calendar"]').click();
   await page.locator('#calendarRound').selectOption('13');
   const matches=page.locator('#calendarGrid .calendar-match');
   assert.equal(await matches.count(),10);
   await matches.first().locator('.calendar-lineup-toggle').click();
   assert.equal(await matches.first().locator('.combined-player').count(),22);
   await page.locator('.nav-btn[data-page="predictions"]').click();
   const sel=page.locator('#page-predictions .shared-round-select');
   await sel.selectOption('13');
   const preds=await page.evaluate(()=>window.SERIE_A_DATA.predictions.filter(p=>p.round===13));
   assert.equal(preds.length,10);
   assert.equal(errors.length,0,errors.join('\n'));
   console.log((mobile?'IPHONE':'DESKTOP')+' OK: 10 pronostici congelati, 220 titolari, G13 5 euro perso');
   await ctx.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
