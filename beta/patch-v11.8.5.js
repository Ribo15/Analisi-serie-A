(() => {
'use strict';
const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
let raf=0;

function normalizeAllPredictions(){
  const root=q('#predictionSingle');
  if(!root)return;

  /* Rimuove l'accordion esterno introdotto dalla patch precedente, se presente.
     "Tutti i pronostici" deve essere una semplice intestazione sempre visibile. */
  const wrapper=q('details.all-preds-wrapper',root);
  if(wrapper){
    const section=document.createElement('section');
    section.className='all-preds';

    const title=document.createElement('div');
    title.className='pred-block-title';
    title.textContent='Tutti i pronostici';
    section.appendChild(title);

    const body=q('.all-preds-content',wrapper);
    if(body){
      while(body.firstChild)section.appendChild(body.firstChild);
    }
    wrapper.replaceWith(section);
  }

  const section=q('section.all-preds',root);
  if(!section || section.dataset.defaultsDone==='1')return;

  /* L'elenco dei mercati è subito visibile, ma ogni singolo mercato parte chiuso.
     Dopo questo primo settaggio non tocchiamo più lo stato: l'utente può aprire
     e chiudere liberamente 1X2, Gol/NoGol, Over/Under, ecc. */
  qa('details.pred-section',section).forEach(d=>d.removeAttribute('open'));
  section.dataset.defaultsDone='1';
}

function schedule(){cancelAnimationFrame(raf);raf=requestAnimationFrame(normalizeAllPredictions)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
const host=q('#predictionSingle');
if(host)new MutationObserver(mutations=>{
  if(mutations.some(m=>m.type==='childList')) schedule();
}).observe(host,{childList:true,subtree:true});
})();
