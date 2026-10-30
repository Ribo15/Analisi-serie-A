(() => {
'use strict';
const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
let lock=false;
function predictionDefaults(){
  const root=q('#predictionSingle');
  if(!root)return;
  const wrapper=q('.all-preds-wrapper',root);
  if(wrapper && !wrapper.hasAttribute('open')) wrapper.setAttribute('open','');
  qa('.all-preds details.pred-section',root).forEach(d=>{if(d.hasAttribute('open'))d.removeAttribute('open')});
}
function apply(){
  if(lock)return;
  lock=true;
  requestAnimationFrame(()=>{
    predictionDefaults();
    lock=false;
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
document.addEventListener('click',()=>setTimeout(apply,40),true);
document.addEventListener('change',()=>setTimeout(apply,40),true);
const host=q('#predictionSingle');
if(host)new MutationObserver(()=>setTimeout(apply,20)).observe(host,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});
})();
