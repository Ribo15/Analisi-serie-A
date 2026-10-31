(() => {
'use strict';
const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
let raf=0;
function buildOuterAccordion(){
  const root=q('#predictionSingle');
  if(!root)return;

  /* app.js genera .all-preds come semplice <section>. La trasformiamo in un vero
     accordion esterno, aperto di default. I singoli mercati restano indipendenti. */
  const old=q('section.all-preds',root);
  if(old){
    const wrapper=document.createElement('details');
    wrapper.className='all-preds-wrapper card';
    wrapper.open=true;
    wrapper.dataset.outerPreds='1';

    const summary=document.createElement('summary');
    summary.className='all-preds-summary';
    summary.textContent='Tutti i pronostici';

    const body=document.createElement('div');
    body.className='all-preds all-preds-content';

    const title=q(':scope > .pred-block-title',old);
    if(title)title.remove();
    while(old.firstChild)body.appendChild(old.firstChild);

    /* Tutte le sottosezioni partono chiuse, come richiesto. */
    qa('details.pred-section',body).forEach(d=>d.removeAttribute('open'));

    wrapper.append(summary,body);
    old.replaceWith(wrapper);
    return;
  }

  /* Se il wrapper esiste già non tocchiamo più il suo stato open/closed:
     così i click dell'utente funzionano normalmente. */
  const wrapper=q('.all-preds-wrapper',root);
  if(wrapper && !wrapper.dataset.defaultsDone){
    qa('details.pred-section',wrapper).forEach(d=>d.removeAttribute('open'));
    wrapper.dataset.defaultsDone='1';
  }
}
function schedule(){cancelAnimationFrame(raf);raf=requestAnimationFrame(buildOuterAccordion)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
const host=q('#predictionSingle');
if(host)new MutationObserver(mutations=>{
  if(mutations.some(m=>m.type==='childList')) schedule();
}).observe(host,{childList:true,subtree:true});
})();
