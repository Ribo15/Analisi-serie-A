(() => {
'use strict';
const D=window.SERIE_A_DATA||{};
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=v=>Number.isFinite(Number(v))?`${(Number(v)*100).toFixed((Number(v)*100)%1?1:0)}%`:'—';
const euro=v=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(Number(v)||0);
const WALLET_KEY='serieADataLab.wallet.v3';
const logos={Atalanta:'https://assets.football-logos.cc/logos/italy/256x256/atalanta.45225436.png',Bologna:'https://assets.football-logos.cc/logos/italy/256x256/bologna.a78d435f.png',Cagliari:'https://assets.football-logos.cc/logos/italy/256x256/cagliari.1c3353f1.png',Como:'https://assets.football-logos.cc/logos/italy/256x256/como-1907.1a1430cd.png',Fiorentina:'https://assets.football-logos.cc/logos/italy/256x256/fiorentina.7ba101c2.png',Frosinone:'https://assets.football-logos.cc/logos/italy/256x256/frosinone.8cc89626.png',Genoa:'https://assets.football-logos.cc/logos/italy/256x256/genoa.a5ec9be4.png',Inter:'https://assets.football-logos.cc/logos/italy/256x256/inter.3a7ce90c.png',Juventus:'https://assets.football-logos.cc/logos/italy/256x256/juventus.a8baf848.png',Lazio:'https://assets.football-logos.cc/logos/italy/256x256/lazio.2386d28d.png',Lecce:'https://assets.football-logos.cc/logos/italy/256x256/lecce.18baee06.png',Milan:'https://assets.football-logos.cc/logos/italy/256x256/milan.75d56f90.png',Monza:'https://assets.football-logos.cc/logos/italy/256x256/monza.a0b0c166.png',Napoli:'https://assets.football-logos.cc/logos/italy/256x256/napoli.ee47a50b.png',Parma:'https://assets.football-logos.cc/logos/italy/256x256/parma.ca4e3120.png',Roma:'https://assets.football-logos.cc/logos/italy/256x256/roma.034a933e.png',Sassuolo:'https://assets.football-logos.cc/logos/italy/256x256/sassuolo.1b38db1d.png',Torino:'https://assets.football-logos.cc/logos/italy/256x256/torino.a6c78dd6.png',Udinese:'https://assets.football-logos.cc/logos/italy/256x256/udinese.a69e0bef.png',Venezia:'https://assets.football-logos.cc/logos/italy/256x256/venezia.b006ee57.png'};

function bandClass(v){return `band-${String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'')}`}
function bandMeta(band,rate,sample){
  if(!band)return'';
  const n=Number.isFinite(Number(sample))?Number(sample):0;
  return `<span class="beta-band-meta"><span class="band-badge ${bandClass(band)}">${esc(band)}</span><span>Storico ${pct(rate)}</span><span>N ${n}</span></span>`;
}
function selection(){
  const home=$('#predictionHomeTeam')?.value||'';
  const away=$('#predictionAwayTeam')?.value||'';
  return {home,away,p:(D.predictions||[]).find(x=>x.home===home&&x.away===away)||null};
}
function yn(v){return String(v||'').toLowerCase().includes('no')?'No':'Sì'}
function marketCards(p,home,away){
  return [
    {family:'1X2 Standard',value:p.oneXtwo,prob:p.oneXtwoConf,band:p.band,rate:p.bandRate,n:p.bandSample,market:p.oneXtwo},
    {family:'1X2 Poisson',value:p.poisson,prob:p.poissonConf,band:p.poissonBand,rate:p.poissonBandRate,n:p.poissonBandSample,market:`${p.poisson} Poisson`},
    {family:'DC Standard',value:p.doubleChance,prob:p.doubleChanceConf,band:p.doubleChanceBand,rate:p.doubleChanceBandRate,n:p.doubleChanceBandSample,market:p.doubleChance},
    {family:'DC Poisson',value:p.doubleChancePoisson,prob:p.doubleChancePoissonConf,band:p.doubleChancePoissonBand,rate:p.doubleChancePoissonBandRate,n:p.doubleChancePoissonBandSample,market:`${p.doubleChancePoisson} Poisson`},
    {family:'Gol / NoGol',value:p.btts,prob:p.bttsConf,band:p.bttsBand,rate:p.bttsBandRate,n:p.bttsBandSample,market:p.btts},
    {family:'Under / Over 2,5',value:p.uo25,prob:p.uo25Conf,band:p.uo25Band,rate:p.uo25BandRate,n:p.uo25BandSample,market:p.uo25},
    {family:`${home} segna`,value:yn(p.scoreHomeYN),prob:p.scoreHomeYNConf,band:p.scoreHomeYNBand,rate:p.scoreHomeYNBandRate,n:p.scoreHomeYNBandSample,market:`${home} segna ${yn(p.scoreHomeYN)}`},
    {family:`${away} segna`,value:yn(p.scoreAwayYN),prob:p.scoreAwayYNConf,band:p.scoreAwayYNBand,rate:p.scoreAwayYNBandRate,n:p.scoreAwayYNBandSample,market:`${away} segna ${yn(p.scoreAwayYN)}`}
  ].filter(x=>x.band);
}
function principalCard(x){
  return `<article class="principal-pred-card beta-principal-card" role="button" tabindex="0" data-beta-market="${esc(x.market)}" data-beta-conf="${Number(x.prob)||0}"><span class="principal-family">${esc(x.family)}</span><strong>${esc(x.value)}</strong><small class="principal-source">${bandMeta(x.band,x.rate,x.n)}</small><div class="principal-prob"><span>Probabilità modello</span><b>${pct(x.prob)}</b></div></article>`;
}
function primeIdea(market,conf){
  const form=$('#predictionIdeas .idea-form'); if(!form)return;
  const m=$('[name="market"]',form),c=$('[name="confidence"]',form),o=$('[name="odds"]',form);
  if(m)m.value=market;
  if(c)c.value=Number(conf)>=.65?'high':Number(conf)>=.5?'medium':'low';
  $('#predictionIdeas')?.scrollIntoView({behavior:'smooth',block:'center'});
  setTimeout(()=>o?.focus(),300);
}
function renderPrincipalBands(){
  const {home,away,p}=selection(); if(!p)return;
  const grid=$('#predictionSingle .principal-grid'); if(!grid)return;
  const cards=marketCards(p,home,away);
  const key=cards.map(x=>`${x.family}:${x.band}:${x.n}:${x.prob}`).join('|');
  if(grid.dataset.betaBands===key)return;
  grid.dataset.betaBands=key;
  grid.innerHTML=cards.map(principalCard).join('');
  $$('.beta-principal-card',grid).forEach(el=>{
    const fire=()=>primeIdea(el.dataset.betaMarket,Number(el.dataset.betaConf));
    el.addEventListener('click',fire);
    el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fire()}});
  });
  const title=grid.closest('.principal-preds')?.querySelector('.pred-block-title');
  if(title)title.textContent='Principali pronostici · mercati con fascia';
}
function appendMeta(row,band,rate,n){
  if(!row||!band)return;
  const host=$('.pred-row-info',row)||$('.pred-1x2-model',row);
  if(!host||$('.beta-band-meta',host))return;
  host.insertAdjacentHTML('beforeend',bandMeta(band,rate,n));
}
function enhanceDetailBands(){
  const {home,away,p}=selection();if(!p)return;
  const root=$('#predictionSingle');if(!root)return;
  $$('[data-market]',root).forEach(el=>{
    const market=String(el.dataset.market||'').trim().toUpperCase();
    if(market===String(p.doubleChance||'').toUpperCase()) appendMeta(el.closest('.pred-table-row,.pred-1x2-cell')||el,p.doubleChanceBand,p.doubleChanceBandRate,p.doubleChanceBandSample);
    if(market===`${String(p.doubleChancePoisson||'').toUpperCase()} POISSON`) appendMeta(el.closest('.pred-table-row,.pred-1x2-cell')||el,p.doubleChancePoissonBand,p.doubleChancePoissonBandRate,p.doubleChancePoissonBandSample);
    if(market===`${home.toUpperCase()} SEGNA ${yn(p.scoreHomeYN).toUpperCase()}`) appendMeta(el.closest('.pred-table-row')||el,p.scoreHomeYNBand,p.scoreHomeYNBandRate,p.scoreHomeYNBandSample);
    if(market===`${away.toUpperCase()} SEGNA ${yn(p.scoreAwayYN).toUpperCase()}`) appendMeta(el.closest('.pred-table-row')||el,p.scoreAwayYNBand,p.scoreAwayYNBandRate,p.scoreAwayYNBandSample);
  });
}
function normalizeLineupProbabilities(root=document){
  $$('.combined-player',root).forEach(player=>{
    const marker=$('.combined-marker',player),pctEl=$('small',player);if(!marker||!pctEl)return;
    marker.textContent=pctEl.textContent.trim();marker.classList.add('has-prob');pctEl.remove();
  });
  $$('.pitch-player',root).forEach(player=>{
    const marker=$('.pitch-marker',player),pctEl=$('.pitch-prob',player);if(!marker||!pctEl)return;
    marker.textContent=pctEl.textContent.trim();marker.classList.add('has-prob');pctEl.remove();
  });
}
function walletRows(){try{return JSON.parse(localStorage.getItem(WALLET_KEY)||'[]')}catch(e){return[]}}
function fixtureFor(sel){return (D.calendar||[]).find(f=>f.home===sel.home&&f.away===sel.away)||null}
function fixtureDate(f){if(!f?.date)return null;const time=/^\d{1,2}:\d{2}$/.test(String(f.time||''))?String(f.time):'00:00';const d=new Date(`${f.date}T${time}:00`);return Number.isNaN(+d)?null:d}
function nextActiveFixture(open){
  const seen=new Set(),arr=[];
  open.forEach(b=>(b.selections||[]).forEach(sel=>{const f=fixtureFor(sel);if(!f)return;const key=`${f.date}|${f.time}|${f.home}|${f.away}`;if(seen.has(key))return;seen.add(key);const dt=fixtureDate(f);if(dt)arr.push({f,dt})}));
  const now=Date.now();return arr.filter(x=>+x.dt>=now-7200000).sort((a,b)=>a.dt-b.dt)[0]||null;
}
function countdown(dt){let d=+dt-Date.now();if(d<=0){const m=Math.floor(Math.abs(d)/60000);return m<120?`Iniziata da ${m} min`:'Partita iniziata'}const days=Math.floor(d/86400000);d%=86400000;const h=Math.floor(d/3600000);d%=3600000;const m=Math.floor(d/60000);const s=Math.floor((d%60000)/1000);return days?`${days}g ${h}h ${m}m`:`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
function img(t){return logos[t]?`<img src="${logos[t]}" alt="">`:''}
function ensureDashboard(){
  const page=$('#page-wallet'),anchor=$('.wallet-data-grid',page);if(!page||!anchor)return null;
  let host=$('#betaWalletPulse');if(!host){host=document.createElement('section');host.id='betaWalletPulse';host.className='beta-wallet-pulse';anchor.after(host)}return host;
}
function renderDashboard(){
  const host=ensureDashboard();if(!host)return;
  const rows=walletRows(),bets=rows.filter(x=>x.type==='bet'),won=bets.filter(x=>x.status==='won'),lost=bets.filter(x=>x.status==='lost'),open=bets.filter(x=>x.status==='open');
  const exposure=open.reduce((s,x)=>s+(+x.amount||0),0),potential=open.reduce((s,x)=>s+(+x.potentialPayout||0),0),next=nextActiveFixture(open);
  let nextHtml='<div class="beta-next-empty">Nessuna partita collegata alle schedine attive.</div>';
  if(next){
    const f=next.f,linked=open.filter(b=>(b.selections||[]).some(s=>s.home===f.home&&s.away===f.away)),stake=linked.reduce((s,x)=>s+(+x.amount||0),0);
    nextHtml=`<div class="beta-next-teams"><div>${img(f.home)}<strong>${esc(f.home)}</strong></div><span>VS</span><div><strong>${esc(f.away)}</strong>${img(f.away)}</div></div><div class="beta-next-info"><span>${new Date(f.date+'T12:00:00').toLocaleDateString('it-IT',{weekday:'long',day:'2-digit',month:'2-digit'})}${f.time?` • ${esc(f.time)}`:''}</span><b data-beta-countdown>${esc(countdown(next.dt))}</b><small>${linked.length} ${linked.length===1?'schedina':'schedine'} • ${euro(stake)} impegnati</small></div>`;
  }
  host.innerHTML=`<div class="beta-wallet-grid"><article class="card"><span>Schedine giocate</span><strong>${bets.length}</strong></article><article class="card beta-win"><span>Vinte</span><strong>${won.length}</strong></article><article class="card beta-loss"><span>Perse</span><strong>${lost.length}</strong></article><article class="card beta-open"><span>Attive</span><strong>${open.length}</strong></article><article class="card"><span>Capitale impegnato</span><strong>${euro(exposure)}</strong></article><article class="card beta-potential"><span>Vincita potenziale</span><strong>${euro(potential)}</strong></article></div><article class="card beta-next-card"><div class="beta-next-kicker">PROSSIMA PARTITA DELLE SCHEDINE ATTIVE</div>${nextHtml}</article>`;
}
function updateSnapshot(){const el=$('#snapshot');if(el)el.textContent='Snapshot Excel • risultati fino alla giornata 9 • pronostici giornata 10'}
function refresh(){renderPrincipalBands();enhanceDetailBands();normalizeLineupProbabilities();renderDashboard();updateSnapshot()}
function schedule(){setTimeout(refresh,60)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
document.addEventListener('click',schedule,true);document.addEventListener('change',schedule,true);document.addEventListener('submit',()=>setTimeout(refresh,120),true);window.addEventListener('storage',refresh);
new MutationObserver(m=>{if(m.some(x=>x.addedNodes?.length))schedule()}).observe(document.body,{childList:true,subtree:true});
setInterval(()=>{const el=$('[data-beta-countdown]');if(!el)return;const open=walletRows().filter(x=>x.type==='bet'&&x.status==='open'),next=nextActiveFixture(open);if(next)el.textContent=countdown(next.dt)},1000);
})();