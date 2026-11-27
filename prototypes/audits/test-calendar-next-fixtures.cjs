const {chromium}=require('playwright');
const assert=require('node:assert/strict');

async function testViewport(browser,phone) {
  const ctx=await browser.newContext(phone?
    {viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true}:
    {viewport:{width:1366,height:900},deviceScaleFactor:1});
  const p=await ctx.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.SERIE_A_DATA && document.querySelectorAll('.shared-match-selector').length===2);
  const baseline=await p.evaluate(()=>{
    const D=window.SERIE_A_DATA;
    return {
      predictionsG12:D.predictions.filter(x=>x.round===12).length,
      predictionsG13:D.predictions.filter(x=>x.round===13).length,
      frozen:D.betaSnapshot.predictionsFrozen,
      wallet:JSON.parse(localStorage.getItem('serieADataLab.wallet.v3')||'[]')
        .filter(x=>x.type==='bet'&&x.round===13&&Number(x.amount)===5)
        .map(x=>({status:x.status,payout:x.payout}))
    };
  });
  assert.equal(baseline.predictionsG12,10);
  assert.equal(baseline.predictionsG13,10);
  assert.equal(baseline.frozen,true);
  assert.equal(baseline.wallet.length,1);
  assert.equal(baseline.wallet[0].status,'lost');

  async function assertOrder(phase) {
    const found=await p.evaluate(()=>{
      const matches=[...document.querySelectorAll('#calendarGrid .calendar-match')];
      const D=window.SERIE_A_DATA;
      return matches.map(card=>{
        const a=card.querySelector('[data-cal-action="match"]');
        const f=D.calendar.find(x=>x.round===13&&x.home===a?.dataset.home&&x.away===a?.dataset.away);
        return f?{date:f.date,time:f.time,home:f.home,away:f.away}:null;
      });
    });
    assert.equal(found.length,10,phase+' calendar contains 10 matches');
    assert(found.every(Boolean),phase+' fixture mapping');
    const sorted=found.slice().sort((a,b)=>
      a.date.localeCompare(b.date)||a.time.localeCompare(b.time)||a.home.localeCompare(b.home)||a.away.localeCompare(b.away));
    assert.deepEqual(found,sorted,phase+' match order must follow DATE and TIME');
    const hours=found.map(f=>f.date+' '+f.time);
    assert.equal(hours[0],'2026-11-27 20:45');
    assert.equal(hours[hours.length-1],'2026-11-30 20:45');
  }

  await p.locator('.nav-btn[data-page="calendar"]').click();
  await p.locator('#calendarRound').selectOption('13');
  await assertOrder('normal');
  // Se l'array originale arriva non ordinato da Excel, l'UI deve comunque ordinare.
  await p.evaluate(()=>window.SERIE_A_DATA.calendar.reverse());
  await p.locator('#calendarRound').selectOption('12');
  await p.locator('#calendarRound').selectOption('13');
  await assertOrder('shuffled source');

  // Dal Calendario apri Pronostici del match scelto, anche se su un altro round.
  const target=await p.evaluate(()=>window.SERIE_A_DATA.calendar.find(f=>f.round===13&&f.home==='Como'));
  assert(target);
  await p.locator('#calendarGrid .calendar-match [data-cal-action="pred"][data-home="Como"][data-away="Juventus"]').click();
  assert.equal(await p.locator('#page-predictions').evaluate(e=>e.classList.contains('active')),true);
  assert.equal(await p.locator('#predictionHomeTeam').inputValue(),'Como');
  assert.equal(await p.locator('#predictionAwayTeam').inputValue(),'Juventus');
  assert.equal(await p.locator('#page-predictions .shared-round-select').inputValue(),'13');

  async function checkNext(pageName,h,a) {
    const host=pageName==='predictions'?'#predictionNextFixtures':'#nextFixtures';
    await p.waitForFunction(({host,h,a})=>{
      const cards=[...document.querySelectorAll(host+' .next-v2-card')];
      const owners=cards.map(c=>c.querySelector('.next-v2-owner strong')?.textContent?.trim());
      return owners.length===2&&owners[0]===h&&owners[1]===a;
    },{host,h,a},{timeout:10000});
    const next=await p.evaluate(({pageName,h,a})=>{
      const el=pageName==='predictions'?'#predictionNextFixtures':'#nextFixtures';
      const parent=document.querySelector('#page-'+pageName),round=Number(parent.querySelector('.shared-round-select')?.value);
      const times=v=>{const m=String(v||'').match(/^(\d{1,2}):(\d{2})/);return m?Number(m[1])*60+Number(m[2]):9999};
      const fixtures=[h,a].map(t=>window.SERIE_A_DATA.calendar.filter(f=>f.round>round&&(f.home===t||f.away===t))
        .sort((x,y)=>x.round-y.round||String(x.date).localeCompare(String(y.date))||times(x.time)-times(y.time))[0]);
      const blocks=[...document.querySelectorAll(el+' .next-v2-card')].map(c=>({
        owner:c.querySelector('.next-v2-owner strong')?.textContent.trim(),
        teams:[...c.querySelectorAll('.next-v2-fixture .next-v2-team strong')].map(x=>x.textContent.trim())
      }));
      return {fixtures,blocks};
    },{pageName,h,a});
    for(let i=0;i<2;i++){
      assert.equal(next.blocks[i].owner,i===0?h:a);
      assert(next.fixtures[i],pageName+' next fixture for '+next.blocks[i].owner);
      assert.deepEqual(next.blocks[i].teams,[next.fixtures[i].home,next.fixtures[i].away]);
    }
    return next.fixtures.map(x=>x.home+'–'+x.away).join('|');
  }
  const first=await checkNext('predictions','Como','Juventus');
  const fixtureSelector='#page-predictions .shared-match-select';
  const items=await p.locator(fixtureSelector+' option').allTextContents();
  const idx=items.findIndex(x=>x.includes('Roma')&&x.includes('Monza'));
  assert(idx>=0);
  await p.locator(fixtureSelector).selectOption({index:idx});
  assert.equal(await p.locator('#predictionHomeTeam').inputValue(),'Roma');
  assert.equal(await p.locator('#predictionAwayTeam').inputValue(),'Monza');
  const second=await checkNext('predictions','Roma','Monza');
  assert.notEqual(first,second,'Changing Predictions match MUST change next two fixtures');
  const idx2=items.findIndex(x=>x.includes('Venezia')&&x.includes('Bologna'));
  assert(idx2>=0);
  await p.locator(fixtureSelector).selectOption({index:idx2});
  await checkNext('predictions','Venezia','Bologna');
  // Cambia giornata e torna a G13, assicurando che si aggiornino squadre e calendario.
  await p.locator('#page-predictions .shared-round-select').selectOption('12');
  await p.locator('#page-predictions .shared-round-select').selectOption('13');
  const nowH=await p.locator('#predictionHomeTeam').inputValue();
  const nowA=await p.locator('#predictionAwayTeam').inputValue();
  await checkNext('predictions',nowH,nowA);

  // Il riquadro Dati Match legge la SUA selezione.
  await p.locator('.nav-btn[data-page="match"]').click();
  const sel='#page-match .shared-match-select';
  const all=await p.locator(sel+' option').allTextContents();
  const mIdx=all.findIndex(x=>x.includes('Inter')&&x.includes('Genoa'));
  assert(mIdx>=0);
  await p.locator(sel).selectOption({index:mIdx});
  await checkNext('match','Inter','Genoa');

  await p.locator('.nav-btn[data-page="wallet"]').click();
  const lost=await p.locator('#officialWalletPulse .official-wallet-grid .official-loss strong').innerText();
  assert(Number(lost)>=1);
  assert.equal(errors.length,0,'JavaScript errors: '+errors.join('; '));
  console.log((phone?'IPHONE':'DESKTOP')+' OK: calendario ordinato, prossime partite dinamiche, navigazione, G13 congelata, schedina persa');
  await ctx.close();
}
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||undefined,args:['--no-sandbox']});
  try {await testViewport(browser,true);await testViewport(browser,false);}
  finally {await browser.close();}
})().catch(e=>{console.error('AUDIT ERROR:',e);process.exit(1)});
