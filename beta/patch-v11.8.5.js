(() => {
'use strict';
const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
let raf=0;
function applyDefaults(){
  const root=q('#predictionSingle');
  if(!root)return;
  const wrapper=q('.all-preds-wrapper',root);
  if(wrapper) wrapper.setAttribute('open','');
  qa('.all-preds details.pred-section',root).forEach(d=>d.removeAttribute('open'));
}
function schedule(){cancelAnimationFrame(raf);raf=requestAnimationFrame(applyDefaults)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
const host=q('#predictionSingle');
if(host)new MutationObserver(mutations=>{
  if(mutations.some(m=>m.type==='childList')) schedule();
}).observe(host,{childList:true,subtree:true});
})();
