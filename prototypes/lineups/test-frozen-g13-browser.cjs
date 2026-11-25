const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||undefined,args:['--no-sandbox']});
 try {
  for(const mobile of [true,false]) {
   const ctx=await browser.newContext(mobile?{viewport:{width:390,height:844},isMobile:true,hasTouch:true}:{viewport:{width:1366,height:900}});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.SERIE_A_DATA && window.SERIE_A_DATA.betaSnapshot?.predictionsFrozen===true);
   await page.locator('.nav-btn[data-page="predictions"]').click();
   const sel=page.locator('#page-predictions .shared-round-select');
   await sel.selectOption('13');
   const data=await page.evaluate(()=>({
      count:window.SERIE_A_DATA.predictions.filter(p=>+p.round===13).length,
      g12count:window.SERIE_A_DATA.predictions.filter(p=>+p.round===12).length,
      frozen:window.SERIE_A_DATA.betaSnapshot.predictionsFrozen
   }));
   assert.equal(data.count,10);
   assert.equal(data.g12count,10);
   assert.equal(data.frozen,true);
   const txt=(await page.locator('#predictionSingle').innerText()).trim();
   assert(txt.length>80,'Pannello pronostici G13 vuoto');
   assert.equal(errors.length,0,errors.join('; '));
   console.log(mobile?'IPHONE OK':'DESKTOP OK',data,'pannello characters',txt.length);
   await ctx.close();
  }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
