/* ModalSync - the tag bus. Everything a modality knows that another needs goes here,
   published under a tag, so tiles stay decoupled. Persisted per tag, versioned, and with a
   wildcard subscription for the harness. */
window.ModalSync=(function(){
 var data={},subs={},vers={};
 function ls(tag){try{var r=localStorage.getItem('ms:'+tag);return r?JSON.parse(r):null}catch(e){return null}}
 function save(tag,rec){try{localStorage.setItem('ms:'+tag,JSON.stringify(rec))}catch(e){}}
 function publish(tag,payload,source){
  var rec={tag:tag,data:payload,source:source||'',version:(vers[tag]||0)+1,updatedAt:new Date().toISOString()};
  vers[tag]=rec.version;data[tag]=rec;save(tag,rec);
  var list=(subs[tag]||[]).slice();
  for(var i=0;i<list.length;i++){try{list[i](rec)}catch(e){}}
  var all=(subs['*']||[]).slice();
  for(var j=0;j<all.length;j++){try{all[j](rec)}catch(e){}}
  try{if(window.HUB&&HUB.busTick)HUB.busTick()}catch(e){}
  return rec;
 }
 function subscribe(tag,cb){(subs[tag]=subs[tag]||[]).push(cb);
  return function(){(subs[tag]||[]).filter(function(f){return f!==cb})}}
 function getWithMetadata(tag){return data[tag]||ls(tag)}
 function get(tag){var r=getWithMetadata(tag);return r?r.data:null}
 function watch(tag,cb){subscribe(tag,cb);var cur=getWithMetadata(tag);if(cur){try{cb(cur)}catch(e){}}}
 function getAllData(){var o={};for(var k in data){if(data[k])o[k]=data[k].data}return o}
 function getTags(){var t={};for(var k in data){t[k]=1}
  try{for(var i=0;i<localStorage.length;i++){var key=localStorage.key(i);if(key&&key.indexOf('ms:')===0)t[key.slice(3)]=1}}catch(e){}
  return Object.keys(t)}
 function publishMultiple(obj,source){for(var k in obj){publish(k,obj[k],source)}}
 return {publish:publish,subscribe:subscribe,watch:watch,get:get,getWithMetadata:getWithMetadata,
         getAllData:getAllData,getTags:getTags,publishMultiple:publishMultiple};
})();
