/* the tile host: registers modalities, lays them out to the viewport, opens them full screen
   and sizes itself again whenever the window changes. */
var TILES=[],OPEN=null;
function reg(t){TILES.push(t)}
function busTick(){var n=window.ModalSync?ModalSync.getTags().length:0;var el=document.getElementById('tagcount');if(el)el.textContent=n}
function layout(){
 var g=document.getElementById('tgrid');if(!g)return;
 var html=[];
 for(var i=0;i<TILES.length;i++){
  var t=TILES[i];
  html.push('<div class="tile'+(t.big?' big':'')+'" data-id="'+t.id+'">'+
   '<div class="row"><span class="dot" style="background:'+(t.colour||'#E2A93B')+'"></span>'+
   '<span class="k">'+(t.tag||'modality')+'</span></div>'+
   '<h2>'+esc(t.title)+'</h2><p>'+esc(t.sub||'')+'</p></div>');
 }
 g.innerHTML=html.join('');
 var tiles=g.querySelectorAll('[data-id]');
 for(var j=0;j<tiles.length;j++)tiles[j].onclick=function(){open(this.getAttribute('data-id'))};
 sizeGrid();
}
function sizeGrid(){
 var g=document.getElementById('tgrid');if(!g)return;
 var avail=g.clientWidth-32,availH=g.clientHeight-32;
 var cols=Math.max(2,Math.min(6,Math.floor(avail/230)));
 var rows=Math.max(1,Math.round(availH/168));
 g.style.gridTemplateColumns='repeat('+cols+',minmax(0,1fr))';
 g.style.gridAutoRows=Math.max(120,Math.floor(availH/rows))+'px';
}
function open(id){
 var t=null;
 for(var i=0;i<TILES.length;i++)if(TILES[i].id===id)t=TILES[i];
 if(!t)return;
 OPEN=t;
 var m=document.getElementById('modal');
 m.classList.add('on');document.body.style.overflow='hidden';
 document.getElementById('mtitle').textContent=t.title;
 document.getElementById('mkey').textContent=t.tag||'modality';
 var body=document.getElementById('mbody');
 body.innerHTML='';
 try{t.render(body)}catch(e){body.innerHTML='<p class="note">That modality failed to open: '+esc(e.message)+'</p>'}
 autosize();
}
function close(){
 OPEN=null;
 document.getElementById('modal').classList.remove('on');
 document.body.style.overflow='';
 var body=document.getElementById('mbody');if(body)body.innerHTML='';
}
function autosize(){
 var m=document.getElementById('modal').querySelector('.mbox');
 if(!m)return;
 m.style.height=(window.innerHeight-24)+'px';
}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function boot(){
 layout();
 document.getElementById('mclose').onclick=close;
 document.getElementById('modal').addEventListener('click',function(e){if(e.target===this)close()});
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&OPEN)close()});
 window.addEventListener('resize',function(){sizeGrid();if(OPEN)autosize()});
 busTick();
 if(window.HUB_READY)HUB_READY();
}
window.HUB={reg:reg,open:open,close:close,boot:boot,layout:layout,sizeGrid:sizeGrid,tiles:function(){return TILES.map(function(t){return t.id})},busTick:busTick,esc:esc};
