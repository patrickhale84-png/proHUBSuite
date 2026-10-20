var HubImport=(function(){
 var TYPES={ 'scene heading':'SCENE_HEADING','scene':'SCENE_HEADING','action':'ACTION','character':'CHARACTER',
  'parenthetical':'PARENTHETICAL','dialogue':'DIALOGUE','transition':'TRANSITION','general':'ACTION','shot':'ACTION' };
 function norm(t){return String(t||'').replace(/\r/g,'').replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').trim()}
 function classifyLines(raw){
  var out=[],prev=null,lines=String(raw||'').replace(/\r/g,'').split('\n');
  for(var i=0;i<lines.length;i++){
   var t=norm(lines[i]); if(!t){prev=null;continue}
   var up=t.toUpperCase();
   if(/^\s*(?:\d+[A-Za-z]?[.)]?\s+)?(?:INT|EXT|EST|I\/E|INT\.?\/EXT|EXT\.?\/INT)\b[.\s\/]/i.test(t)){out.push({type:'SCENE_HEADING',text:up});prev='h';continue}
   if(/^(FADE IN|FADE OUT|FADE TO|CUT TO|SMASH TO|SMASH CUT|MATCH CUT|DISSOLVE TO|HARD CUT)/i.test(t)||/\bTO:\s*$/.test(t)){out.push({type:'TRANSITION',text:up});prev='t';continue}
   if(/^\(.*\)$/.test(t)){out.push({type:'PARENTHETICAL',text:t});prev='p';continue}
   if(up===t&&t.length<44&&!/[.,!?]$/.test(t)&&!/[:;]/.test(t)&&!/^\d+$/.test(t)){out.push({type:'CHARACTER',text:up});prev='c';continue}
   if(prev==='c'||prev==='p'||prev==='d'){
    var isAct=(prev==='d'&&/[.!?]$/.test(t)&&t.split(/\s+/).length>6&&!/^[(]/.test(t));
    if(isAct){out.push({type:'ACTION',text:t});prev='a';continue}
    out.push({type:'DIALOGUE',text:t});prev='d';continue}
   out.push({type:'ACTION',text:t});prev='a';
  }
  return out;
 }
 function parseFdx(text){
  var doc=new DOMParser().parseFromString(text,'application/xml');
  if(doc.getElementsByTagName('parsererror').length)throw new Error('that .fdx would not parse as XML');
  var ps=doc.getElementsByTagName('Paragraph'),out=[];
  for(var i=0;i<ps.length;i++){
   var p=ps[i],ty=String(p.getAttribute('Type')||'Action'),tx='';
   var texts=p.getElementsByTagName('Text');
   for(var j=0;j<texts.length;j++)tx+=(j?' ':'')+texts[j].textContent;
   tx=norm(tx); if(!tx)continue;
   out.push({type:TYPES[ty.toLowerCase()]||'ACTION',text:tx});
  }
  if(!out.length)throw new Error('no paragraphs found in that .fdx');
  return out;
 }
 function pickType(o){var t=String(o.type||o.Type||o.kind||o.element||'').toLowerCase();return TYPES[t]||null}
 function parseJson(text){
  var j=JSON.parse(text),arr=null;
  if(Array.isArray(j))arr=j;
  else if(j&&Array.isArray(j.elements))arr=j.elements;
  else if(j&&Array.isArray(j.lines))arr=j.lines;
  else if(j&&Array.isArray(j.paragraphs))arr=j.paragraphs;
  else if(j&&j.tags&&j.tags['screenplay:main']){
   var m=j.tags['screenplay:main'],c=(m.data&&m.data.content)||m.content||'';
   if(c)return classifyLines(c);
  }
  if(arr&&arr.length){
   var out=[];
   for(var i=0;i<arr.length;i++){
    var o=arr[i];
    if(typeof o==='string'){out.push({type:'ACTION',text:norm(o)});continue}
    var tt=pickType(o),tx=norm(o.text||o.Text||o.content||o.value||o.body||'');
    if(!tx)continue;
    out.push({type:tt||'ACTION',text:tx});
   }
   if(out.length)return out;
  }
  var raw=(j&&(j.script||j.content||j.text||j.body))||'';
  if(raw)return classifyLines(raw);
  throw new Error('that .json has no script lines I recognise');
 }
 function loadPdfJs(){
  if(window.pdfjsLib)return Promise.resolve(window.pdfjsLib);
  return new Promise(function(res,rej){
   var s=document.createElement('script');
   s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
   s.onload=function(){try{window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'}catch(e){}res(window.pdfjsLib)};
   s.onerror=function(){rej(new Error('the PDF reader could not load - it needs a connection the first time'))};
   document.head.appendChild(s);
  });
 }
 function parsePdf(buf){
  return loadPdfJs().then(function(lib){return lib.getDocument({data:buf}).promise})
   .then(function(doc){var ps=[];for(var p=1;p<=doc.numPages;p++)ps.push(doc.getPage(p));return Promise.all(ps)})
   .then(function(pages){return Promise.all(pages.map(function(pg){return pg.getTextContent()}))})
   .then(function(cont){
    var lines=[];
    cont.forEach(function(tc){
     var rows={};
     (tc.items||[]).forEach(function(it){
      if(!it.str||!it.str.trim())return;
      var y=Math.round((it.transform?it.transform[5]:0)/3)*3;
      rows[y]=(rows[y]||'')+it.str;
     });
     Object.keys(rows).sort(function(a,b){return b-a}).forEach(function(y){lines.push(rows[y])});
    });
    return classifyLines(lines.join('\n'));
   });
 }
 function analyse(lines){
  var cast=[],locs=[],scenes=[],n=0;
  for(var i=0;i<lines.length;i++){
   var l=lines[i],t=l.text||'';
   if(l.type==='SCENE_HEADING'){n++;
    var m=/^(INT|EXT|INT\/EXT|EST)[.\s\/]*\s*([^-\u2013]+?)(?:\s*[-\u2013]\s*(.+))?$/i.exec(t);
    var loc=((m&&m[2])?m[2]:t).trim().toUpperCase();
    scenes.push({num:n,head:t,loc:loc});
    if(loc&&locs.indexOf(loc)<0)locs.push(loc);}
   if(l.type==='CHARACTER'){var c=t.replace(/\(.*\)/g,'').trim().toUpperCase();if(c&&cast.indexOf(c)<0)cast.push(c)}
  }
  return {cast:cast,locations:locs,scenes:scenes};
 }
 function textOf(lines){return lines.map(function(l){return l.text}).join('\n')}
 function publish(result){
  var a=analyse(result.lines);
  var payload={format:result.format,filename:result.filename||'',updatedAt:new Date().toISOString(),
   content:textOf(result.lines),lines:result.lines,scenes:a.scenes,cast:a.cast,locations:a.locations,confidence:result.confidence};
  ModalSync.publishMultiple({'screenplay:main':payload,'cast:updated':{cast:a.cast,source:result.format},
   'locations:updated':{locations:a.locations,source:result.format},'scenes:list':{scenes:a.scenes,source:result.format}},'import');
  return {lines:result.lines.length,scenes:a.scenes.length,cast:a.cast.length,locations:a.locations.length};
 }
 function fromFile(file){
  var name=(file.name||'').toLowerCase(),ext=name.split('.').pop();
  if(ext==='pdf')return file.arrayBuffer().then(parsePdf).then(function(lines){
   return {format:'PDF',filename:file.name,lines:lines,confidence:'classified from page text - check the element types'}});
  return file.text().then(function(txt){
   if(ext==='fdx')return {format:'Final Draft',filename:file.name,lines:parseFdx(txt),confidence:'typed by the file'};
   if(ext==='json')return {format:'JSON',filename:file.name,lines:parseJson(txt),confidence:'typed where the file says, classified otherwise'};
   return {format:(ext==='fountain'?'Fountain':'plain text'),filename:file.name,lines:classifyLines(txt),confidence:'classified from the text'};
  });
 }
 return {fromFile:fromFile,parseFdx:parseFdx,parseJson:parseJson,classifyLines:classifyLines,parsePdf:parsePdf,
  analyse:analyse,publish:publish,publishLines:function(lines,f,n){return publish({lines:lines,format:f||'text',filename:n||''})}};
})();
window.HubImport=HubImport;
HUB.reg({id:'import',title:'Import script',sub:'PDF, FDX, WriterDuet JSON, Fountain - syncs every tile',tag:'import',colour:'#A78BFA',
 render:function(box){
  box.innerHTML='<div class="row" style="margin-bottom:10px"><input id="iFile" type="file" accept=".pdf,.fdx,.json,.fountain,.txt" style="flex:1"></div>'+
   '<div class="row" style="margin-bottom:10px"><button class="pri" id="iRun">Read and sync</button>'+
   '<button id="iPaste">Paste text instead</button><span class="note" id="iState">&nbsp;</span></div>'+
   '<textarea id="iPasteBox" rows="10" style="display:none" placeholder="Paste a screenplay or Fountain text here"></textarea>'+
   '<div id="iReport" style="margin-top:10px"></div>'+
   '<p class="note" style="margin-top:12px">FDX and JSON carry element types. A PDF does not - it is only positions on a page - so those lines are classified by shape and case. Check the result before you trust it.</p>';
  function report(r){document.getElementById('iReport').innerHTML='<div class="row" style="gap:14px;flex-wrap:wrap">'+
   '<span class="note"><b>'+r.lines+'</b> lines</span><span class="note"><b>'+r.scenes+'</b> scenes</span>'+
   '<span class="note"><b>'+r.cast+'</b> characters</span><span class="note"><b>'+r.locations+'</b> locations</span></div>'+
   '<p class="note" style="margin-top:6px">Published to screenplay:main, cast:updated, locations:updated, scenes:list</p>'}
  document.getElementById('iPaste').onclick=function(){var t=document.getElementById('iPasteBox');t.style.display=t.style.display==='none'?'block':'none'};
  document.getElementById('iRun').onclick=function(){
   var st=document.getElementById('iState');
   var f=document.getElementById('iFile').files&&document.getElementById('iFile').files[0];
   var pasted=document.getElementById('iPasteBox').value;
   function done(res){var r=HubImport.publish(res);st.textContent=res.format+' · '+(res.confidence||'');report(r)}
   function fail(e){st.textContent='failed: '+e.message}
   if(f){st.textContent='reading '+f.name+'…';HubImport.fromFile(f).then(done).catch(fail);return}
   if(pasted.trim()){done({format:'pasted text',filename:'',lines:HubImport.classifyLines(pasted),confidence:'classified from the text'});return}
   st.textContent='choose a file or paste text first';
  };
 }});
