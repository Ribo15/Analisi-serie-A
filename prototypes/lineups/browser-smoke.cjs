/* Smoke test visuale su Chromium: solo nel ramo di prova. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SCREENSHOTS = 'prototypes/lineups/screenshots';
fs.mkdirSync(SCREENSHOTS, {recursive: true});
const URL = 'http://127.0.0.1:8765/index.html';

async function openCalendar(page) {
  await page.getByRole('button', {name:'Calendario', exact:true}).click();
  await page.locator('#calendarRound').selectOption('12');
  const matches = page.locator('#calendarGrid .calendar-match');
  assert.equal(await matches.count(), 10, 'Le dieci partite della giornata devono essere visibili');
  const card = matches.first();
  await card.locator('.calendar-lineup-toggle').click();
  assert.equal(await card.locator('.pitch-player').count(), 22, 'Devono esserci 22 titolari');
  const names = await card.locator('.pitch-player strong').allTextContents();
  assert(names.every(x => x.trim()), 'Nomi dei titolari obbligatori');
  return card;
}

async function main() {
  const browser = await chromium.launch({headless: true, args: ['--no-sandbox']});
  const issues = [];
  try {
    // Test reale nel viewport iPhone: dati online.
    const mobile = await browser.newContext({viewport:{width:390,height:844}, deviceScaleFactor:1, isMobile:true, hasTouch:true});
    const page = await mobile.newPage();
    page.on('pageerror', e => issues.push('mobile: ' + e.message));
    await page.goto(URL, {waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => window.RIBO_LINEUPS && window.RIBO_LINEUPS.status === 'live', {timeout:15000});
    const card = await openCalendar(page);
    const label = (await card.locator('.lineup-source').innerText()).trim();
    assert(label.includes('SOS Fanta'), 'Fonte aggiornata non visibile in calendario');
    await page.screenshot({path:path.join(SCREENSHOTS,'formazioni-online-iphone.png'), fullPage:false});
    const liveSourceCount = await page.locator('#calendarGrid .lineup-source').count();
    assert.equal(liveSourceCount,10,'Ogni incontro deve avere pannello formazioni');
    await page.getByRole('button', {name:'Pronostici', exact:true}).first().click();
    assert((await page.locator('#page-predictions').count())===1,'Pagina Pronostici deve esistere');
    console.log('MOBILE LIVE OK - fonte:', label, '- match:', liveSourceCount);

    // Test senza rete JSON: ripristino Excel, senza errori.
    const offline = await browser.newContext({viewport:{width:390,height:844}, deviceScaleFactor:1, isMobile:true, hasTouch:true});
    const oldPage = await offline.newPage();
    oldPage.on('pageerror', e => issues.push('fallback: ' + e.message));
    await oldPage.route('**/prototypes/lineups/lineups-latest.json*', route => route.abort());
    await oldPage.goto(URL, {waitUntil:'domcontentloaded'});
    await oldPage.waitForFunction(() => window.RIBO_LINEUPS && window.RIBO_LINEUPS.status === 'excel', {timeout:15000});
    const oldCard = await openCalendar(oldPage);
    const fallbackLabel = (await oldCard.locator('.lineup-source').innerText()).trim();
    assert.equal(fallbackLabel,'Excel','Fallback deve mantenere formazioni Excel');
    await oldPage.screenshot({path:path.join(SCREENSHOTS,'formazioni-fallback-iphone.png'), fullPage:false});
    console.log('MOBILE FALLBACK OK - fonte:', fallbackLabel);

    // Verifica desktop senza cambiare dati del sito.
    const desktop = await browser.newContext({viewport:{width:1366,height:900}, deviceScaleFactor:1});
    const desk = await desktop.newPage();
    desk.on('pageerror', e => issues.push('desktop: ' + e.message));
    await desk.goto(URL, {waitUntil:'domcontentloaded'});
    await desk.waitForFunction(() => window.RIBO_LINEUPS && window.RIBO_LINEUPS.status === 'live', {timeout:15000});
    const deskCard = await openCalendar(desk);
    assert((await deskCard.locator('.lineup-source').innerText()).includes('SOS Fanta'));
    await desk.screenshot({path:path.join(SCREENSHOTS,'formazioni-online-desktop.png'), fullPage:false});
    console.log('DESKTOP LIVE OK');

    if (issues.length) {
      console.error('ERRORI JS:', issues.join('\n'));
      process.exitCode = 1;
    } else {
      console.log('BROWSER SMOKE: PASS (mobile, fallback, desktop). Nessuna eccezione JavaScript');
    }
    await mobile.close();await offline.close();await desktop.close();
  } finally {
    await browser.close();
  }
}

main().catch(e => {console.error('BROWSER SMOKE FAILED:', e);process.exitCode=1;});
