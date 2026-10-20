/* two modalities, to prove the bus end to end: the script publishes screenplay:main, and the
   notes tile watches it and re-counts live without either knowing the other exists. */
HUB.reg({id:'script',title:'Screenplay',sub:'The draft, published to the bus',tag:'screenplay',colour:'#E2A93B',big:true,
 render:function(box){
  box.innerHTML='<div class="row" style="margin-bottom:8px"><button class="pri" id="sPub">Publish</button>'+
   '<span class="note">every keystroke publishes <b>screenplay:main</b></span></div>'+
   '<textarea id="sBody" rows="18"></textarea>';
  var ta=document.getElementById('sBody');
  var cur=ModalSync.get('screenplay:main');
  ta.value=(cur&&cur.content)||'INT. KITCHEN - DAY\n\nMARY\nWe have to go before the light turns.';
  ModalSync.publish('screenplay:main',{content:ta.value},'script');
  var timer=null;
  ta.oninput=function(){
   if(timer)clearTimeout(timer);
   timer=setTimeout(function(){ModalSync.publish('screenplay:main',{content:ta.value},'script')},250);
  };
  document.getElementById('sPub').onclick=function(){ModalSync.publish('screenplay:main',{content:ta.value},'script')};
  ModalSync.watch('screenplay:main',function(rec){
   if(rec.source==='script')return;
   if(ta.value!==rec.data.content)ta.value=rec.data.content;
  });
 }});
HUB.reg({id:'notes',title:'Notes',sub:'Watches the script and counts it live',tag:'notes',colour:'#8FC13F',
 render:function(box){
  box.innerHTML='<div class="note" id="nStat">waiting for the script</div>'+
   '<div class="row" style="margin:10px 0"><input id="nIn" placeholder="a note about this draft"><button class="pri" id="nAdd">Add</button></div>'+
   '<div id="nList"></div>';
  function draw(){
   var rec=ModalSync.getWithMetadata('notes:list'),items=(rec&&rec.data&&rec.data.items)||[];
   document.getElementById('nList').innerHTML=items.length?items.map(function(x,i){
    return '<div class="row" style="border-bottom:1px solid var(--line);padding:7px 0"><span class="note" style="flex:1">'+HUB.esc(x)+'</span>'+
     '<button data-del="'+i+'">x</button></div>';
   }).join(''):'<p class="note">No notes yet.</p>';
   var bs=document.querySelectorAll('#nList [data-del]');
   for(var i=0;i<bs.length;i++)bs[i].onclick=function(){
    var ix=+this.getAttribute('data-del'),its=(ModalSync.get('notes:list')||{}).items||[];
    its.splice(ix,1);ModalSync.publish('notes:list',{items:its},'notes');
   };
  }
  document.getElementById('nAdd').onclick=function(){
   var v=document.getElementById('nIn').value.trim();if(!v)return;
   var its=(ModalSync.get('notes:list')||{}).items||[];its.push(v);
   ModalSync.publish('notes:list',{items:its},'notes');
   document.getElementById('nIn').value='';
  };
  ModalSync.watch('notes:list',function(){draw()});
  ModalSync.watch('screenplay:main',function(rec){
   var txt=(rec.data&&rec.data.content)||'';
   var lines=txt.split('\n').filter(function(l){return l.trim()}).length;
   var words=txt.split(/\s+/).filter(Boolean).length;
   var scenes=txt.split('\n').filter(function(l){return /^(INT|EXT)/i.test(l.trim())}).length;
   document.getElementById('nStat').innerHTML='<b>'+lines+'</b> lines &middot; <b>'+words+'</b> words &middot; <b>'+scenes+'</b> scenes &middot; updated '+new Date(rec.updatedAt).toLocaleTimeString();
  });
  draw();
 }});
