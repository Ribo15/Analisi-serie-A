(() => {
'use strict';
const D=window.SERIE_A_DATA||{};
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=v=>Number.isFinite(Number(v))?`${(Number(v)*100).toFixed((Number(v)*100)%1?1:0)}%`:'—';
const euro=v=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(Number(v)||0);
const IDEAS_KEY='serieADataLab.ideas.v1';
const SLIP_KEY='serieADataLab.slip.v1';
const WALLET_KEY='serieADataLab.wallet.v3';
const logos={Atalanta:'https://assets.football-logos.cc/logos/italy/256x256/atalanta.45225436.png',Bologna:'https://assets.football-logos.cc/logos/italy/256x256/bologna.a78d435f.png',Cagliari:'https://assets.football-logos.cc/logos/italy/256x256/cagliari.1c3353f1.png',Como:'https://assets.football-logos.cc/logos/italy/256x256/como-1907.1a1430cd.png',Fiorentina:'https://assets.football-logos.cc/logos/italy/256x256/fiorentina.7ba101c2.png',Frosinone:'https://assets.football-logos.cc/logos/italy/256x256/frosinone.8cc89626.png',Genoa:'https://assets.football-logos.cc/logos/italy/256x256/genoa.a5ec9be4.png',Inter:'https://assets.football-logos.cc/logos/italy/256x256/inter.3a7ce90c.png',Juventus:'https://assets.football-logos.cc/logos/italy/256x256/juventus.a8baf848.png',Lazio:'https://assets.football-logos.cc/logos/italy/256x256/lazio.2386d28d.png',Lecce:'https://assets.football-logos.cc/logos/italy/256x256/lecce.18baee06.png',Milan:'https://assets.football-logos.cc/logos/italy/256x256/milan.75d56f90.png',Monza:'https://assets.football-logos.cc/logos/italy/256x256/monza.a0b0c166.png',Napoli:'https://assets.football-logos.cc/logos/italy/256x256/napoli.ee47a50b.png',Parma:'https://assets.football-logos.cc/logos/italy/256x256/parma.ca4e3120.png',Roma:'https://assets.football-logos.cc/logos/italy/256x256/roma.034a933e.png',Sassuolo:'https://assets.football-logos.cc/logos/italy/256x256/sassuolo.1b38db1d.png',Torino:'https://assets.football-logos.cc/logos/italy/256x256/torino.a6c78dd6.png',Udinese:'https://assets.football-logos.cc/logos/italy/256x256/udinese.a69e0bef.png',Venezia:'https://assets.football-logos.cc/logos/italy/256x256/venezia.b006ee57.png'};
const img=t=>logos[t]?`<img src="${logos[t]}" alt="" loading="lazy" referrerpolicy="no-referrer">`:'';
const load=(k,fallback=[])=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v??fallback}catch(e){return fallback}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function selection(){const home=$('#predictionHomeTeam')?.value||'',away=$('#predictionAwayTeam')?.value||'';return{home,away,p:(D.predictions||[]).find(x=>x.home===home&&x.away===away)||null}}
function yn(v){return String(v||'').toLowerCase().includes('no')?'No':'Sì'}
function bandClass(v){return `band-${String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'')}`}
function bandMeta(band,rate,sample){if(!band)return'';const n=Number.isFinite(Number(sample))?Number(sample):0;return `<span class="official-band-meta"><span class="band-badge ${bandClass(band)}">${esc(band)}</span><span>Storico ${pct(rate)}</span><span>N ${n}</span></span>`}
function marketCards(p,home,away){return [
{family:'1X2 Standard',value:p.oneXtwo,prob:p.oneXtwoConf,band:p.band,rate:p.bandRate,n:p.bandSample,market:p.oneXtwo},
{family:'1X2 Poisson',value:p.poisson,prob:p.poissonConf,band:p.poissonBand,rate:p.poissonBandRate,n:p.poissonBandSample,market:`${p.poisson} Poisson`},
{family:'DC Standard',value:p.doubleChance,prob:p.doubleChanceConf,band:p.doubleChanceBand,rate:p.doubleChanceBandRate,n:p.doubleChanceBandSample,market:p.doubleChance},
{family:'DC Poisson',value:p.doubleChancePoisson,prob:p.doubleChancePoissonConf,band:p.doubleChancePoissonBand,rate:p.doubleChancePoissonBandRate,n:p.doubleChancePoissonBandSample,market:`${p.doubleChancePoisson} Poisson`},
{family:'Gol / NoGol',value:p.btts,prob:p.bttsConf,band:p.bttsBand,rate:p.bttsBandRate,n:p.bttsBandSample,market:p.btts},
{family:'Under / Over 2,5',value:p.uo25,prob:p.uo25Conf,band:p.uo25Band,rate:p.uo25BandRate,n:p.uo25BandSample,market:p.uo25},
{family:`${home} segna`,value:yn(p.scoreHomeYN),prob:p.scoreHomeYNConf,band:p.scoreHomeYNBand,rate:p.scoreHomeYNBandRate,n:p.scoreHomeYNBandSample,market:`${home} segna ${yn(p.scoreHomeYN)}`},
{family:`${away} segna`,value:yn(p.scoreAwayYN),prob:p.scoreAwayYNConf,band:p.scoreAwayYNBand,rate:p.scoreAwayYNBandRate,n:p.scoreAwayYNBandSample,market:`${away} segna ${yn(p.scoreAwayYN)}`}
]}
function principalCard(x){return `<article class="principal-pred-card official-principal-card" role="button" tabindex="0" data-official-market="${esc(x.market)}" data-official-conf="${Number(x.prob)||0}"><span class="principal-family">${esc(x.family)}</span><strong>${esc(x.value)}</strong><small class="principal-source">${bandMeta(x.band,x.rate,x.n)}</small><div class="principal-prob"><span>Probabilità modello</span><b>${pct(x.prob)}</b></div></article>`}
function primeIdea(market,conf){
 const s=selection();
 if(!s.home||!s.away||!market)return;
 document.dispatchEvent(new CustomEvent('ribo:prediction-pick',{detail:{home:s.home,away:s.away,market,conf}}));
}
function renderPrincipalBands(){const{home,away,p}=selection();if(!p)return;const grid=$('#predictionSingle .principal-grid');if(!grid)return;const cards=marketCards(p,home,away),key=cards.map(x=>`${x.family}:${x.band}:${x.n}:${x.prob}`).join('|');if(grid.dataset.officialBands===key&&$('.official-principal-card',grid).length===cards.length)return;grid.dataset.officialBands=key;grid.innerHTML=cards.map(principalCard).join('');$$('.official-principal-card',grid).forEach(el=>{const fire=()=>primeIdea(el.dataset.officialMarket,Number(el.dataset.officialConf));el.addEventListener('click',fire);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fire()}})});const title=grid.closest('.principal-preds')?.querySelector('.pred-block-title');if(title)title.textContent='Principali pronostici · fasce dove disponibili'}
function normalizeAllPredictions(){const root=$('#predictionSingle');if(!root)return;const section=$('section.all-preds',root);if(!section)return;const title=$(':scope > .pred-block-title',section);if(title)title.textContent='Tutti i pronostici';if(section.dataset.officialDefaults!=='1'){$$('details.pred-section',section).forEach(d=>d.removeAttribute('open'));section.dataset.officialDefaults='1'}}
function normalizeLineupProbabilities(root=document){$$('.combined-player',root).forEach(player=>{const marker=$('.combined-marker',player),pctEl=$('small',player);if(!marker||!pctEl)return;marker.textContent=pctEl.textContent.trim();marker.classList.add('has-prob');pctEl.remove()});$$('.pitch-player',root).forEach(player=>{const marker=$('.pitch-marker',player),pctEl=$('.pitch-prob',player);if(!marker||!pctEl)return;marker.textContent=pctEl.textContent.trim();marker.classList.add('has-prob');pctEl.remove()})}
function walletRows(){return load(WALLET_KEY,[])}
function walletStats(rows){const topups=rows.filter(x=>x.type==='topup').reduce((s,x)=>s+(+x.amount||0),0);const withdrawals=rows.filter(x=>x.type==='withdrawal').reduce((s,x)=>s+(+x.amount||0),0);const bets=rows.filter(x=>x.type==='bet');const staked=bets.reduce((s,x)=>s+(+x.amount||0),0);const won=bets.filter(x=>x.status==='won').reduce((s,x)=>s+(+x.payout||0),0);return{balance:topups-staked+won-withdrawals,bets}}
function fixtureFor(sel){return(D.calendar||[]).find(f=>f.home===sel.home&&f.away===sel.away)||null}
function fixtureDate(f){if(!f?.date)return null;const t=/^\d{1,2}:\d{2}$/.test(String(f.time||''))?String(f.time):'00:00',d=new Date(`${f.date}T${t}:00`);return Number.isNaN(+d)?null:d}
function nextActive(open){const seen=new Set(),list=[];open.forEach(b=>(b.selections||[]).forEach(sel=>{const f=fixtureFor(sel);if(!f)return;const key=`${f.date}|${f.time}|${f.home}|${f.away}`;if(seen.has(key))return;seen.add(key);const dt=fixtureDate(f);if(dt&&+dt>=Date.now()-7200000)list.push({f,dt})}));return list.sort((a,b)=>a.dt-b.dt)[0]||null}
function countdown(dt){let d=+dt-Date.now();if(d<=0){const m=Math.floor(Math.abs(d)/60000);return m<120?`Iniziata da ${m} min`:'Partita iniziata'}const days=Math.floor(d/86400000);d%=86400000;const h=Math.floor(d/3600000);d%=3600000;const m=Math.floor(d/60000),s=Math.floor((d%60000)/1000);return days?`${days}g ${h}h ${m}m`:`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
function ensureDashboard(){const page=$('#page-wallet'),anchor=$('.wallet-data-grid',page);if(!page||!anchor)return null;let host=$('#officialWalletPulse');if(!host){host=document.createElement('section');host.id='officialWalletPulse';host.className='official-wallet-pulse';anchor.after(host)}return host}
function ensureReviewHost(){
 const entry=$('#page-wallet .wallet-entry');if(!entry)return null;
 let host=$('#walletSlipReview');
 if(!host){host=document.createElement('div');host.id='walletSlipReview';host.className='wallet-slip-review-host';entry.after(host)}
 return host;
}

/* Indicazioni da risultati FINALI nello snapshot Excel, non da feed live e non da SNAI. */
function savedResult(sel){
 const f=fixtureFor(sel);if(!f)return null;
 const match=(D.games||[]).find(g=>g.team===sel.home&&g.opponent===sel.away&&g.venue==='Casa'&&Number(g.round)===Number(f.round));
 if(!match||match.gf===null||match.ga===null||match.gf===''||match.ga===''||!Number.isFinite(Number(match.gf))||!Number.isFinite(Number(match.ga)))return null;
 return {h:Number(match.gf),a:Number(match.ga),round:Number(f.round)};
}
function verifySelection(sel){
 const r=savedResult(sel);
 if(!r)return {state:'pending',label:'Da giocare / esito non aggiornato',score:''};
 const m=String(sel.market||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+poisson$/,'').replace(/\s+/g,' ');
 const total=r.h+r.a,sign=r.h>r.a?'1':r.h<r.a?'2':'x',score=r.h+'–'+r.a;
 let good=null;
 if(['1','x','2','1x','x2','12'].includes(m))good=m.includes(sign);
 else if(m==='gol'||m==='goal')good=r.h>0&&r.a>0;
 else if(['no gol','nogol','no goal','nogoal'].includes(m))good=r.h===0||r.a===0;
 else if(/^(under|over)\s*\d+(?:[.,]\d+)?$/.test(m)){
   const q=m.match(/^(under|over)\s*(\d+(?:[.,]\d+)?)$/),threshold=Number(q[2].replace(',','.'));
   good=q[1]==='over'?total>threshold:total<threshold;
 }else if(m.startsWith('risultato esatto ')){
   const q=m.match(/risultato esatto\s+(\d+)\s*[-–]\s*(\d+)/);
   if(q)good=r.h===Number(q[1])&&r.a===Number(q[2]);
 }else if(m.startsWith('multigoal ')){
   const q=m.match(/^multigoal\s+(totale|casa|trasferta)\s+(\d+)\s*[-–]\s*(\d+)$/);
   if(q){const n=q[1]==='casa'?r.h:q[1]==='trasferta'?r.a:total;good=n>=+q[2]&&n<=+q[3]}
 }else if(m.includes(' segna ')||m.startsWith('segnacasa')||m.startsWith('segnatrasferta')){
   const q=m.match(/(si|no)$/);
   const h=String(sel.home||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
   const away=String(sel.away||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
   const isHome=m.startsWith('segnacasa')||m.startsWith(h+' segna ');
   const isAway=m.startsWith('segnatrasferta')||m.startsWith(away+' segna ');
   if(q&&(isHome||isAway))good=((isHome?r.h:r.a)>0)===(q[1]==='si');
 }
 return good===null?{state:'unknown',label:'Mercato da verificare',score}:{state:good?'correct':'incorrect',label:good?'Pronostico preso':'Pronostico non preso',score};
}
function reviewSlips(rows){
 if(!rows.length)return '<section class="card wallet-slip-review"><h3>Le mie schedine</h3><p>Nessuna schedina registrata.</p></section>';
 const groups=[['open','Attive'],['lost','Perse'],['won','Vinte']];
 const cards=groups.map(([status,title])=>{
  const subset=rows.filter(x=>x.status===status).slice().sort((a,b)=>Number(b.round||0)-Number(a.round||0)||Number(b.id||0)-Number(a.id||0));
  if(!subset.length)return '';
  return '<div class="wallet-slip-group"><h4>'+title+' <span>'+subset.length+'</span></h4>'+subset.map(b=>{
   const sel=Array.isArray(b.selections)?b.selections:[],count=sel.length;
   const picks=count?sel.map(s=>{
    const r=verifySelection(s),cl=r.state;
    return '<li class="wallet-pick-row"><span class="wallet-pick-dot '+cl+'" aria-label="'+esc(r.label)+'" title="'+esc(r.label)+'"></span><span><strong>'+esc(s.home)+' – '+esc(s.away)+'</strong><small>'+esc(s.market||'Mercato non indicato')+(s.odds?' • quota '+Number(s.odds).toFixed(2).replace('.',','):'')+'</small></span><span class="wallet-pick-state">'+esc(r.score||'')+'<small>'+esc(r.label)+'</small></span></li>';
   }).join(''):'<li class="wallet-pick-no-detail">Questa schedina proviene dallo storico Excel senza dettaglio delle selezioni. Non posso attribuire pallini di esito senza conoscere i mercati giocati.</li>';
   const statusLabel=status==='open'?'Attiva':status==='won'?'Vinta':'Persa';
   return '<details class="wallet-slip-card"><summary><span><strong>G'+esc(b.round||'—')+' • '+esc(b.description||'Schedina')+'</strong><small>'+count+' selezioni note • '+statusLabel+'</small></span><span class="wallet-slip-amount">'+euro(b.amount)+(Number(b.potentialPayout)>0?'<small>Potenziale '+euro(b.potentialPayout)+'</small>':'')+'</span></summary><ul class="wallet-pick-list">'+picks+'</ul></details>';
  }).join('')+'</div>';
 }).join('');
 return '<section class="card wallet-slip-review"><h3>Le mie schedine</h3><p>Apri una schedina per controllare le selezioni. Verde e rosso sono calcolati solo quando il risultato finale è presente nello snapshot Excel; nessun punteggio in diretta.</p>'+cards+'</section>';
}

function renderDashboard(){const host=ensureDashboard();if(!host)return;const rows=walletRows(),bets=rows.filter(x=>x.type==='bet'),won=bets.filter(x=>x.status==='won'),lost=bets.filter(x=>x.status==='lost'),open=bets.filter(x=>x.status==='open'),potential=open.reduce((s,x)=>s+(+x.potentialPayout||0),0),next=nextActive(open);let nextHtml='<div class="official-next-empty">Nessuna partita collegata alle schedine attive.</div>';if(next){const f=next.f,linked=open.filter(b=>(b.selections||[]).some(s=>s.home===f.home&&s.away===f.away)),stake=linked.reduce((s,x)=>s+(+x.amount||0),0),linkedPotential=linked.reduce((s,x)=>s+(+x.potentialPayout||0),0);nextHtml=`<div class="official-next-teams"><div>${img(f.home)}<strong>${esc(f.home)}</strong></div><div>${img(f.away)}<strong>${esc(f.away)}</strong></div></div><div class="official-next-info"><span>${new Date(f.date+'T12:00:00').toLocaleDateString('it-IT',{weekday:'long',day:'2-digit',month:'2-digit'})}${f.time?` • ${esc(f.time)}`:''}</span><b data-official-countdown>${esc(countdown(next.dt))}</b><small>${linked.length} ${linked.length===1?'schedina':'schedine'} • ${euro(stake)} impegnati</small><strong>Vincita potenziale ${euro(linkedPotential)}</strong></div>`}
const html=`<article class="card official-next-card"><div class="official-next-kicker">PROSSIMA PARTITA DELLE SCHEDINE ATTIVE</div>${nextHtml}</article><div class="official-wallet-grid"><article class="card"><span>Schedine giocate</span><strong>${bets.length}</strong></article><article class="card official-win"><span>Vinte</span><strong>${won.length}</strong></article><article class="card official-loss"><span>Perse</span><strong>${lost.length}</strong></article><article class="card official-open"><span>Attive</span><strong>${open.length}</strong><small>Vincita potenziale ${euro(potential)}</small></article></div>`;const markup=html;
if(host.dataset.html!==markup){host.dataset.html=markup;host.innerHTML=markup}
const review=ensureReviewHost();
if(review){const content=reviewSlips(bets);if(review.dataset.html!==content){review.dataset.html=content;review.innerHTML=content}}
}
function currentSlip(){const ideas=load(IDEAS_KEY,[]),ids=load(SLIP_KEY,[]).map(String);return ids.map(id=>ideas.find(x=>String(x.id)===id)).filter(Boolean)}
function combinedOdds(slip){const o=slip.map(x=>+x.odds||0);return slip.length&&o.every(v=>v>=1)?o.reduce((a,b)=>a*b,1):null}
function enhanceSlipPotential(){const box=$('.slip-play-box');if(!box)return;const stake=$('#slipStake',box),play=$('#playSlip',box);if(!stake||!play)return;let label=$('.official-slip-potential-label',box);if(!label){const old=$('.slip-potential',box);label=document.createElement('label');label.className='official-slip-potential-label';label.innerHTML='Vincita potenziale €<input id="slipPotentialInput" type="number" min="0.01" step="0.01" inputmode="decimal" placeholder="Es. 35,00">';if(old)old.replaceWith(label);else play.before(label)}const input=$('#slipPotentialInput',box);if(!input)return;const slip=currentSlip(),combined=combinedOdds(slip);const auto=()=>{if(input.dataset.manual==='1')return;const v=Number(stake.value||0);input.value=v>0&&combined?(v*combined).toFixed(2):''};if(stake.dataset.potentialBound!=='1'){stake.dataset.potentialBound='1';stake.addEventListener('input',auto)}if(input.dataset.bound!=='1'){input.dataset.bound='1';input.addEventListener('input',()=>{input.dataset.manual='1'})}if(!input.value)auto();play.dataset.officialPlay='1'}
function slipRound(slip){const rs=[...new Set(slip.map(x=>{const f=(D.calendar||[]).find(g=>g.home===x.home&&g.away===x.away);return f?+f.round:null}).filter(Boolean))];return rs.length===1?rs[0]:null}
function playSlipOfficial(){const slip=currentSlip();if(!slip.length)return alert('La schedina è vuota.');const stake=Number($('#slipStake')?.value||0);if(!(stake>0))return alert('Inserisci l’importo da giocare.');const potential=Number($('#slipPotentialInput')?.value||0);if(!(potential>0))return alert('Inserisci la vincita potenziale della schedina.');const rows=walletRows(),stats=walletStats(rows);if(stake>stats.balance+1e-9)return alert(`Saldo SNAI insufficiente: ${euro(stats.balance)}.`);const combined=combinedOdds(slip),round=slipRound(slip);const msg=`Registrare questa schedina per ${euro(stake)}${combined?` a quota ${combined.toFixed(2).replace('.',',')}`:''}?\nVincita potenziale: ${euro(potential)}`;if(!confirm(msg))return;rows.push({id:Date.now(),round,date:new Date().toISOString().slice(0,10),type:'bet',description:`Schedina ${slip.length} selezioni`,amount:stake,status:'open',payout:0,source:'slip',combinedOdds:combined,potentialPayout:potential,selections:slip.map(x=>({id:x.id,home:x.home,away:x.away,market:x.market,odds:x.odds||null,band:null}))});save(WALLET_KEY,rows);save(SLIP_KEY,[]);$('.nav-btn[data-page="ideas"]')?.click();renderDashboard();alert('Schedina registrata. Saldo e vincita potenziale sono stati aggiornati.')}
function refreshUi(){renderPrincipalBands();normalizeAllPredictions();normalizeLineupProbabilities();renderDashboard();enhanceSlipPotential();const snap=$('#snapshot');if(snap)snap.textContent=`Snapshot Excel • risultati fino alla giornata ${+D.lastRound||0} • pronostici giornata ${(D.predictionRounds||[])[0]||(+D.lastRound||0)+1}`}
let timer=0;function schedule(ms=40){clearTimeout(timer);timer=setTimeout(refreshUi,ms)}
function initObservers(){const pred=$('#predictionSingle');if(pred)new MutationObserver(m=>{if(m.some(x=>x.type==='childList'&&x.target===pred))schedule(0)}).observe(pred,{childList:true});const slip=$('#slipOverview');if(slip)new MutationObserver(()=>schedule(0)).observe(slip,{childList:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{initObservers();schedule(0)},{once:true});else{initObservers();schedule(0)}
document.addEventListener('change',e=>{if(e.target.matches('#predictionHomeTeam,#predictionAwayTeam,.shared-round-select,.shared-match-select'))schedule(60)},true);
document.addEventListener('click',e=>{if(e.target.closest('[data-lu],.nav-btn[data-page="wallet"],.nav-btn[data-page="ideas"]'))schedule(100)},true);
document.addEventListener('click',e=>{const b=e.target.closest('#playSlip');if(!b||b.dataset.officialPlay!=='1')return;e.preventDefault();e.stopImmediatePropagation();playSlipOfficial()},true);
window.addEventListener('storage',()=>schedule(0));window.addEventListener('ribo:wallet-changed',()=>schedule(0));
setInterval(()=>{const el=$('[data-official-countdown]');if(el){const open=walletRows().filter(x=>x.type==='bet'&&x.status==='open'),next=nextActive(open);if(next)el.textContent=countdown(next.dt)}},1000);
})();
