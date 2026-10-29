(() => {
'use strict';
const D=window.SERIE_A_DATA||{};
const cal=Array.isArray(D.calendar)?D.calendar:[];
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const logos={Atalanta:'https://assets.football-logos.cc/logos/italy/256x256/atalanta.45225436.png',Bologna:'https://assets.football-logos.cc/logos/italy/256x256/bologna.a78d435f.png',Cagliari:'https://assets.football-logos.cc/logos/italy/256x256/cagliari.1c3353f1.png',Como:'https://assets.football-logos.cc/logos/italy/256x256/como-1907.1a1430cd.png',Fiorentina:'https://assets.football-logos.cc/logos/italy/256x256/fiorentina.7ba101c2.png',Frosinone:'https://assets.football-logos.cc/logos/italy/256x256/frosinone.8cc89626.png',Genoa:'https://assets.football-logos.cc/logos/italy/256x256/genoa.a5ec9be4.png',Inter:'https://assets.football-logos.cc/logos/italy/256x256/inter.3a7ce90c.png',Juventus:'https://assets.football-logos.cc/logos/italy/256x256/juventus.a8baf848.png',Lazio:'https://assets.football-logos.cc/logos/italy/256x256/lazio.2386d28d.png',Lecce:'https://assets.football-logos.cc/logos/italy/256x256/lecce.18baee06.png',Milan:'https://assets.football-logos.cc/logos/italy/256x256/milan.75d56f90.png',Monza:'https://assets.football-logos.cc/logos/italy/256x256/monza.a0b0c166.png',Napoli:'https://assets.football-logos.cc/logos/italy/256x256/napoli.ee47a50b.png',Parma:'https://assets.football-logos.cc/logos/italy/256x256/parma.ca4e3120.png',Roma:'https://assets.football-logos.cc/logos/italy/256x256/roma.034a933e.png',Sassuolo:'https://assets.football-logos.cc/logos/italy/256x256/sassuolo.1b38db1d.png',Torino:'https://assets.football-logos.cc/logos/italy/256x256/torino.a6c78dd6.png',Udinese:'https://assets.football-logos.cc/logos/italy/256x256/udinese.a69e0bef.png',Venezia:'https://assets.football-logos.cc/logos/italy/256x256/venezia.b006ee57.png'};
const logo=t=>logos[t]?`<img src="${logos[t]}" alt="" loading="lazy" referrerpolicy="no-referrer">`:'';
const timeValue=v=>{const m=String(v||'').match(/^(\d{1,2}):(\d{2})/);return m?(+m[1]*60)+(+m[2]):9999};
function selected(){
  const h=$('#homeTeam')?.value||$('#predictionHomeTeam')?.value||'';
  const a=$('#awayTeam')?.value||$('#predictionAwayTeam')?.value||'';
  const f=cal.find(x=>x.home===h&&x.away===a);
  return {home:h,away:a,round:+(f?.round||D.lastRound||0)};
}
function nextFixture(team,afterRound){
  return cal.filter(x=>+x.round>afterRound&&(x.home===team||x.away===team)).slice().sort((a,b)=>+a.round-+b.round||String(a.date||'').localeCompare(String(b.date||''))||timeValue(a.time)-timeValue(b.time))[0]||null;
}
function dateText(v){
  if(!v)return'';
  try{return new Date(v+'T12:00:00').toLocaleDateString('it-IT',{day:'2-digit',month:'2-digit'});}catch(e){return v}
}
function teamRow(team,focus){return `<div class="next-v2-team${team===focus?' is-focus':''}">${logo(team)}<strong>${esc(team)}</strong></div>`}
function block(owner,f){
  if(!f)return `<article class="next-v2-card"><div class="next-v2-owner">${logo(owner)}<strong>${esc(owner)}</strong></div><div class="next-v2-empty">Prossima partita non disponibile.</div></article>`;
  return `<article class="next-v2-card"><div class="next-v2-owner">${logo(owner)}<strong>${esc(owner)}</strong></div><div class="next-v2-meta"><span>Giornata ${esc(f.round)}</span>${f.date?`<span>${dateText(f.date)}</span>`:''}</div><div class="next-v2-fixture">${teamRow(f.home,owner)}${teamRow(f.away,owner)}</div></article>`;
}
function renderHost(host){
  if(!host)return;
  const s=selected();
  if(!s.home||!s.away)return;
  const h=nextFixture(s.home,s.round),a=nextFixture(s.away,s.round);
  const key=[s.home,s.away,s.round,h?.home,h?.away,h?.round,a?.home,a?.away,a?.round].join('|');
  if(host.dataset.nextV2===key&&host.querySelector('.next-v2-grid'))return;
  host.dataset.nextV2=key;
  host.innerHTML=`<div class="next-v2-title"><strong>Prossima giornata</strong></div><div class="next-v2-grid">${block(s.home,h)}${block(s.away,a)}</div>`;
}
function renderAll(){renderHost($('#nextFixtures'));renderHost($('#predictionNextFixtures'))}
let raf=0;
function schedule(){cancelAnimationFrame(raf);raf=requestAnimationFrame(renderAll)}
function init(){
  renderAll();
  document.addEventListener('change',e=>{if(e.target.matches('#homeTeam,#awayTeam,#predictionHomeTeam,#predictionAwayTeam,.shared-round-select,.shared-match-select'))setTimeout(schedule,0)},true);
  document.addEventListener('click',e=>{if(e.target.closest('[data-cal-action],.nav-btn,[data-go]'))setTimeout(schedule,40)},true);
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
