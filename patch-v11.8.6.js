(() => {
'use strict';
const D=window.SERIE_A_DATA||{};
const WALLET_KEY='serieADataLab.wallet.v3';
const $=(s,r=document)=>r.querySelector(s);
const euro=v=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(Number(v)||0);
function rows(){try{return JSON.parse(localStorage.getItem(WALLET_KEY)||'[]')}catch(e){return[]}}
function fixtureFor(sel){return(D.calendar||[]).find(f=>f.home===sel.home&&f.away===sel.away)||null}
function fixtureDate(f){if(!f?.date)return null;const t=/^\d{1,2}:\d{2}$/.test(String(f.time||''))?String(f.time):'00:00';const d=new Date(`${f.date}T${t}:00`);return Number.isNaN(+d)?null:d}
function nextActive(open){const seen=new Set(),list=[];open.forEach(b=>(b.selections||[]).forEach(sel=>{const f=fixtureFor(sel);if(!f)return;const key=`${f.date}|${f.time}|${f.home}|${f.away}`;if(seen.has(key))return;seen.add(key);const dt=fixtureDate(f);if(dt&&+dt>=Date.now()-7200000)list.push({f,dt})}));return list.sort((a,b)=>a.dt-b.dt)[0]||null}
function enhancePotential(){
  const bets=rows().filter(x=>x.type==='bet');
  const open=bets.filter(x=>x.status==='open');
  const total=open.reduce((s,x)=>s+(+x.potentialPayout||0),0);
  const active=$('.beta-wallet-grid .beta-open');
  if(active){
    let line=$('.official-potential-line',active);
    if(!line){line=document.createElement('small');line.className='official-potential-line';active.append(line)}
    line.textContent=`Vincita potenziale ${euro(total)}`;
  }
  const next=nextActive(open),info=$('.beta-next-card .beta-next-info');
  if(info){
    let line=$('.official-next-potential',info);
    if(!line){line=document.createElement('strong');line.className='official-next-potential';info.append(line)}
    if(next){
      const f=next.f;
      const linked=open.filter(b=>(b.selections||[]).some(s=>s.home===f.home&&s.away===f.away));
      const potential=linked.reduce((s,x)=>s+(+x.potentialPayout||0),0);
      line.textContent=`Vincita potenziale ${euro(potential)}`;
      line.hidden=false;
    }else{
      line.textContent=`Vincita potenziale ${euro(total)}`;
      line.hidden=total<=0;
    }
  }
}
let busy=false;
function schedule(){if(busy)return;busy=true;setTimeout(()=>{busy=false;enhancePotential()},80)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
document.addEventListener('click',schedule,true);
document.addEventListener('change',schedule,true);
document.addEventListener('submit',()=>setTimeout(schedule,120),true);
window.addEventListener('storage',schedule);
setInterval(enhancePotential,1500);
})();
