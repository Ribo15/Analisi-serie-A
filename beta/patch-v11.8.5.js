(() => {
'use strict';
const D=window.SERIE_A_DATA||{};
const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=v=>Number.isFinite(Number(v))?`${(Number(v)*100).toFixed((Number(v)*100)%1?1:0)}%`:'—';
const bandClass=v=>`band-${String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'')}`;
const bandMeta=(band,rate,sample)=>{
  if(!band)return'';
  const n=Number.isFinite(Number(sample))?Number(sample):0;
  return `<span class="band-meta ui-recovery-band"><span class="band-badge ${bandClass(band)}">Fascia ${esc(band)}</span><span>Storico fascia ${pct(rate)}</span><span>N campione ${n}</span></span>`;
};
const yn=v=>String(v||'').toLowerCase().includes('no')?'No':'Sì';
function selection(){
  const home=q('#predictionHomeTeam')?.value||'';
  const away=q('#predictionAwayTeam')?.value||'';
  return {home,away,p:(D.predictions||[]).find(x=>x.home===home&&x.away===away)||null};
}
function appendMeta(host,band,rate,sample){
  if(!host||!band||q('.band-meta',host))return;
  host.insertAdjacentHTML('beforeend',bandMeta(band,rate,sample));
}
function ensurePredictionBands(){
  const root=q('#predictionSingle');
  const {home,away,p}=selection();
  if(!root||!p)return;
  const std=String(p.oneXtwo||'').trim().toUpperCase();
  const poi=`${String(p.poisson||'').trim()} POISSON`.toUpperCase();
  qa('.pred-1x2-cell[data-market]',root).forEach(cell=>{
    const market=String(cell.dataset.market||'').trim().toUpperCase();
    const host=q('.pred-1x2-model',cell);
    if(market===std) appendMeta(host,p.band,p.bandRate,p.bandSample);
    if(market===poi) appendMeta(host,p.poissonBand,p.poissonBandRate,p.poissonBandSample);
  });
  const homeMarket=`${home} segna ${yn(p.scoreHomeYN)}`.toUpperCase();
  const awayMarket=`${away} segna ${yn(p.scoreAwayYN)}`.toUpperCase();
  qa('.pred-table-row [data-market]',root).forEach(btn=>{
    const market=String(btn.dataset.market||'').trim().toUpperCase();
    const row=btn.closest('.pred-table-row');
    const host=q('.pred-row-info',row);
    if(market===homeMarket) appendMeta(host,p.scoreHomeYNBand,p.scoreHomeYNBandRate,p.scoreHomeYNBandSample);
    if(market===awayMarket) appendMeta(host,p.scoreAwayYNBand,p.scoreAwayYNBandRate,p.scoreAwayYNBandSample);
  });
}
function fixLastFiveTitle(){
  const tab=q('.tab[data-view="last5"]');
  if(tab&&tab.textContent!=='Dati ultime 5 gare')tab.textContent='Dati ultime 5 gare';
}
function normalizeLineupProbabilities(root=document){
  qa('.combined-player',root).forEach(player=>{
    const marker=q('.combined-marker',player),prob=q('small',player);
    if(!marker||!prob)return;
    marker.textContent=prob.textContent.trim();
    marker.classList.add('has-prob');
    prob.remove();
  });
  qa('.pitch-player',root).forEach(player=>{
    const marker=q('.pitch-marker',player),prob=q('.pitch-prob',player);
    if(!marker||!prob)return;
    marker.textContent=prob.textContent.trim();
    marker.classList.add('has-prob');
    prob.remove();
  });
}
let timer=0;
function run(){fixLastFiveTitle();ensurePredictionBands();normalizeLineupProbabilities();}
function schedule(ms=30){clearTimeout(timer);timer=setTimeout(run,ms);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>schedule(0),{once:true});else schedule(0);
document.addEventListener('change',e=>{
  if(e.target.matches('#homeTeam,#awayTeam,#predictionHomeTeam,#predictionAwayTeam,.shared-round-select,.shared-match-select'))schedule(40);
},true);
document.addEventListener('click',e=>{
  if(e.target.closest('[data-lu],.nav-btn[data-page="match"],.nav-btn[data-page="predictions"]'))schedule(120);
},true);
new MutationObserver(m=>{
  if(m.some(x=>x.type==='childList'&&x.addedNodes.length))schedule(40);
}).observe(document.body,{childList:true,subtree:true});
})();
