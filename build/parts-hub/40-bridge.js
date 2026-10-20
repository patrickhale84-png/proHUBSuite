/* the profile bridge: the bus talks to the member's profile, not to this browser.
   Inside a Wix embed there is no access to Wix APIs, so every read and write goes out as a
   postMessage to the page, where Velo does the wix-data call. Standalone (no parent, or no
   answer within 1200ms) it falls back to localStorage so the app still works on a laptop. */
var HubBridge=(function(){
 var KEY='prohub_profile_v1', pending={}, seq=0, timer=null, mode='local';
 function post(msg){ try{ if(window.parent&&window.parent!==window) window.parent.postMessage(msg,'*'); return true }catch(e){ return false } }
 function readLocal(){ try{var r=localStorage.getItem(KEY);return r?JSON.parse(r):null}catch(e){return null} }
 function writeLocal(v){ try{localStorage.setItem(KEY,JSON.stringify(v));return true}catch(e){return false} }
 function apply(profile,fromLocal){
  if(!profile) return;
  var tags=profile.tags||{};
  for(var k in tags){ try{ ModalSync.publish(k,tags[k],'profile') }catch(e){} }
  if(profile.script!=null){ try{ ModalSync.publish('screenplay:main',{content:profile.script},'profile') }catch(e){} }
  mode=fromLocal?'local':'profile';
 }
 function snapshot(){
  var out={version:1,updatedAt:new Date().toISOString(),tags:{},script:null};
  try{ out.tags=ModalSync.getAllData() }catch(e){}
  try{ var s=ModalSync.get('screenplay:main'); if(s&&s.content!=null) out.script=s.content }catch(e){}
  return out;
 }
 function save(reason){
  var prof=snapshot();
  if(mode==='profile'){
   var id=++seq;
   pending[id]=true;
   post({hub:'profile:save',id:id,reason:reason||'auto',profile:prof});
   setTimeout(function(){ if(pending[id]){ delete pending[id]; writeLocal(prof) } },2500);
  } else writeLocal(prof);
  return prof;
 }
 function queueSave(reason){
  if(timer) clearTimeout(timer);
  timer=setTimeout(function(){ save(reason) },900);
 }
 function load(){
  var sent=post({hub:'profile:load'});
  if(!sent){ var p0=readLocal(); if(p0) apply(p0,true); return true; }
  setTimeout(function(){ if(mode!=='profile'){ var p1=readLocal(); if(p1) apply(p1,true) } },1200);
  return true;
 }
 window.addEventListener('message',function(e){
  var d=e.data; if(!d||typeof d!=='object') return;
  if(d.hub==='profile'){ apply(d.profile); return }
  if(d.hub==='saved'&&d.id){ delete pending[d.id]; mode='profile'; return }
  if(d.hub==='tag'){ try{ ModalSync.publish(d.tag,d.data,'frame') }catch(err){} return }
 },false);
 function start(){
  if(window.ModalSync&&ModalSync.subscribe){
   ModalSync.subscribe('*',function(){ queueSave('auto') });
  }
  load();
  document.addEventListener('visibilitychange',function(){ if(document.hidden) save('hide') });
  window.addEventListener('beforeunload',function(){ save('unload') });
 }
 return {start:start,save:save,load:load,snapshot:snapshot,history:history,recordImport:recordImport,mode:function(){return mode},saveScript:function(){
   var s=ModalSync.get('screenplay:main');return save('script:'+((s&&s.content)?s.content.length:0))}};
})();
