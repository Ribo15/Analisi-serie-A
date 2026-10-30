(() => {
'use strict';
const D=window.SERIE_A_DATA||{};
const WALLET_KEY='serieADataLab.wallet.v3';
const euro=v=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(Number(v)||0);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function walletRows(){
  try{return JSON.parse(localStorage.getItem(WALLET_KEY)||'[]')}catch(e){return []}
}

function normalizeLineupProbabilities(root=document){
  root.querySelectorAll('.combined-player').forEach(player=>{
    const marker=player.querySelector('.combined-marker');
    const pct=player.querySelector('small');
    if(!marker||!pct)return;
    marker.textContent=pct.textContent.trim();
    marker.classList.add('has-prob');
    pct.remove();
  });
  root.querySelectorAll('.pitch-player').forEach(player=>{
    const marker=player.querySelector('.pitch-marker');
    const pct=player.querySelector('.pitch-prob');
    if(!marker||!pct)return;
    marker.textContent=pct.textContent.trim();
    marker.classList.add('has-prob');
    pct.remove();
  });
}

function fixtureForSelection(sel){
  return (D.calendar||[]).find(f=>f.home===sel.home&&f.away===sel.away)||null;
}
function fixtureDate(f){
  if(!f?.date)return null;
  const time=/^\d{1,2}:\d{2}$/.test(String(f.time||''))?String(f.time):'00:00';
  const d=new Date(`${f.date}T${time}:00`);
  return Number.isNaN(d.getTime())?null:d;
}
function nextOpenFixture(openBets){
  const seen=new Set(), candidates=[];
  openBets.forEach(b=>(b.selections||[]).forEach(sel=>{
    const f=fixtureForSelection(sel); if(!f)return;
    const k=`${f.date}|${f.time||''}|${f.home}|${f.away}`; if(seen.has(k))return; seen.add(k);
    const dt=fixtureDate(f); if(!dt)return;
    candidates.push({f,dt});
  }));
  const now=Date.now();
  const future=candidates.filter(x=>x.dt.getTime()>=now-2*60*60*1000).sort((a,b)=>a.dt-b.dt);
  return future[0]||null;
}
function countdown(dt,hasTime){
  if(!dt)return 'Orario non disponibile';
  if(!hasTime)return dt.toLocaleDateString('it-IT',{weekday:'short',day:'2-digit',month:'2-digit'});
  let diff=dt.getTime()-Date.now();
  if(diff<=0){
    const mins=Math.floor(Math.abs(diff)/60000);
    return mins<120?`Iniziata da ${mins} min`:'Partita iniziata';
  }
  const days=Math.floor(diff/86400000); diff%=86400000;
  const h=Math.floor(diff/3600000); diff%=3600000;
  const m=Math.floor(diff/60000); const s=Math.floor((diff%60000)/1000);
  return days>0?`Inizia tra ${days}g ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m`:`Inizia tra ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function ensureDashboardPulse(){
  const page=document.querySelector('#page-wallet');
  const anchor=page?.querySelector('.wallet-data-grid');
  if(!page||!anchor)return null;
  let host=document.querySelector('#walletPulse');
  if(host)return host;
  host=document.createElement('section');
  host.id='walletPulse';
  host.className='wallet-pulse';
  anchor.after(host);
  return host;
}

function renderDashboardPulse(){
  const host=ensureDashboardPulse(); if(!host)return;
  const rows=walletRows();
  const bets=rows.filter(x=>x.type==='bet');
  const open=bets.filter(x=>x.status==='open');
  const exposure=open.reduce((s,x)=>s+(+x.amount||0),0);
  const potential=open.reduce((s,x)=>s+(+x.potentialPayout||0),0);
  const next=nextOpenFixture(open);
  let nextHtml='<div class="wallet-next-empty">Nessuna partita collegata a schedine attive.</div>';
  if(next){
    const f=next.f, hasTime=/^\d{1,2}:\d{2}$/.test(String(f.time||''));
    nextHtml=`<div class="wallet-next-main"><div><span>PROSSIMA PARTITA DELLE TUE SCHEDINE</span><strong>${esc(f.home)} – ${esc(f.away)}</strong><small>${esc(f.date)}${hasTime?` • ${esc(f.time)}`:''}</small></div><b data-wallet-countdown>${esc(countdown(next.dt,hasTime))}</b></div>`;
  }
  host.innerHTML=`<div class="wallet-pulse-grid">
    <article class="wallet-pulse-card card"><span>Schedine giocate</span><strong>${bets.length}</strong></article>
    <article class="wallet-pulse-card card"><span>Schedine attive</span><strong>${open.length}</strong></article>
    <article class="wallet-pulse-card card"><span>Capitale impegnato</span><strong>${euro(exposure)}</strong></article>
    <article class="wallet-pulse-card card wallet-potential"><span>Vincita potenziale</span><strong>${euro(potential)}</strong></article>
  </div>
  <article class="wallet-next-card card">${nextHtml}</article>`;
}

function refresh(){
  normalizeLineupProbabilities();
  renderDashboardPulse();
}

refresh();
setInterval(()=>{
  const rows=walletRows();
  if(document.querySelector('#page-wallet.active'))renderDashboardPulse();
  const cd=document.querySelector('[data-wallet-countdown]');
  if(cd){
    const open=rows.filter(x=>x.type==='bet'&&x.status==='open');
    const next=nextOpenFixture(open);
    if(next){const hasTime=/^\d{1,2}:\d{2}$/.test(String(next.f.time||''));cd.textContent=countdown(next.dt,hasTime)}
  }
},1000);

document.addEventListener('click',()=>setTimeout(refresh,80),true);
document.addEventListener('submit',()=>setTimeout(refresh,120),true);
window.addEventListener('storage',refresh);
new MutationObserver(muts=>{
  let should=false;
  for(const m of muts){if(m.addedNodes?.length){should=true;break}}
  if(should)normalizeLineupProbabilities();
}).observe(document.body,{childList:true,subtree:true});
})();
