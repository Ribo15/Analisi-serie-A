(() => {
'use strict';
/* Isola i dati economici della beta dall'ufficiale.
   La beta parte da zero e usa una chiave propria; l'ufficiale resta intatto. */
const storage=window.localStorage;
if(!storage)return;
const OFFICIAL_WALLET='serieADataLab.wallet.v3';
const OFFICIAL_OLD='serieADataLab.wallet.v2';
const BETA_WALLET='serieADataLab.beta.wallet.v4';
const BETA_OLD='serieADataLab.beta.wallet.old.v4';
const proto=Storage.prototype;
const nativeGet=proto.getItem;
const nativeSet=proto.setItem;
const nativeRemove=proto.removeItem;
const mapKey=k=>k===OFFICIAL_WALLET?BETA_WALLET:k===OFFICIAL_OLD?BETA_OLD:k;
if(nativeGet.call(storage,BETA_WALLET)===null) nativeSet.call(storage,BETA_WALLET,'[]');
if(nativeGet.call(storage,BETA_OLD)===null) nativeSet.call(storage,BETA_OLD,'[]');
proto.getItem=function(key){return nativeGet.call(this,this===storage?mapKey(String(key)):key)};
proto.setItem=function(key,value){return nativeSet.call(this,this===storage?mapKey(String(key)):key,value)};
proto.removeItem=function(key){return nativeRemove.call(this,this===storage?mapKey(String(key)):key)};
})();
