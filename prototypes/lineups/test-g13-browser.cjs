const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base='http://127.0.0.1:8765/index.html';
async function check(browser, mobile) {
 const context=await browser.newContext(mobile?
   {viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1}:
   {viewport:{width:1366,height:900},deviceScaleFactor:1});
 const page=await context.newPage();
 const errs=[];
 page.on('pageerror',e=>errs.push(e.message));
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.RIBO_LINEUPS && window.SERIE_A_DATA.lastRound===12);
 const bets=await page.evaluate(()=>JSON.parse(localStorage.getItem('serieADataLab.wallet.v3')||'[]'));
 const g13=bets.filter(x=>x.type==='bet'&&x.round===13);
 assert.equal(g13.length,1,'G13 contiene una schedina sola');
 assert.equal(g13[0].amount,5,'G13 importo cinque euro');
 assert.equal(g13[0].status,'open','G13 deve restare aperta');
 const orig=await page.evaluate(()=>window.SERIE_A_DATA.predictions.filter(x=>x.round===12).length);
 assert.equal(orig,10,'10 pronostici G12 rimangono congelati');
 await page.locator('.nav-btn[data-page="calendar"]').click();
 await page.locator('#calendarRound').selectOption('13');
 const cards=page.locator('#calendarGrid .calendar-match');
 assert.equal(await cards.count(),10,'Calendario G13 completo');
 await cards.first().locator('.calendar-lineup-toggle').click();
 assert.equal(await cards.first().locator('.combined-player').count(),22,'22 giocatori presenti');
 assert.equal((await cards.first().locator('.lineup-source').innerText()).trim(),'Excel','Fonte fallback Excel');
 await page.locator('.nav-btn[data-page="predictions"]').click();
 assert.equal(await page.locator('#page-predictions').count(),1);
 assert.equal(errs.length,0,errs.join('; '));
 console.log(mobile?'BROWSER IPHONE OK':'BROWSER DESKTOP OK','G13 aperta',g13[0].amount,'€','pronostici G12',orig);
 await context.close();
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||undefined,args:['--no-sandbox']});
 try{await check(browser,true);await check(browser,false);}
 finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
