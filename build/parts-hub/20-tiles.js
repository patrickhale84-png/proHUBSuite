/* the tile host: registers modalities, lays them out to the viewport, opens them full screen
   and sizes itself again whenever the window changes. */
var TILES=[],OPEN=null;
function reg(t){TILES.push(t)}
function busTick(){var n=window.ModalSync?ModalSync.getTags().length:0;var el=document.getElementById('tagcount');if(el)el.textContent=n}
function layout(){
 loadSpans();
 var g=document.getElementById('tgrid');if(!g)return;
 var html=[];
 for(var i=0;i<TILES.length;i++){
  var t=TILES[i];
  html.push('<div class="tile'+(t.big?' big':'')+'" data-id="'+t.id+'">'+
   '<div class="row"><span class="dot" style="background:'+(t.colour||'#E2A93B')+'"></span>'+
   '<span class="k">'+(t.tag||'modality')+'</span></div>'+
   '<h2>'+esc(t.title)+'</h2><p>'+esc(t.sub||'')+'</p><span class="tzgrip" data-grip="'+t.id+'"></span></div>');
 }
 g.innerHTML=html.join('');
 var tiles=g.querySelectorAll('[data-id]');
 for(var j=0;j<tiles.length;j++)tiles[j].onclick=function(){open(this.getAttribute('data-id'))};
 sizeGrid();
}
/* spans let a tile be extended beyond its square, but the grid never scrolls: the cell size
   is chosen so rows x cell fits the viewport exactly, and the layout favours square cells. */
var SPANS = {};
function spanOf(id){ var s=SPANS[id]; return s||{w:1,h:1}; }
function loadSpans(){
  try { var r=localStorage.getItem('hub_spans_v1'); if(r) SPANS=JSON.parse(r)||{}; } catch(e){ SPANS={}; }
  try { var t=ModalSync.get('ui:spans'); if(t&&t.spans) SPANS=t.spans; } catch(e){}
}
function saveSpans(){
  try { localStorage.setItem('hub_spans_v1', JSON.stringify(SPANS)); } catch(e){}
  try { ModalSync.publish('ui:spans',{spans:SPANS},'hub'); } catch(e){}
}
function nextSpan(id){
  var s=spanOf(id), seq=[[1,1],[2,1],[1,2],[2,2]], at=0;
  for(var i=0;i<seq.length;i++) if(seq[i][0]===s.w&&seq[i][1]===s.h) at=i;
  var n=seq[(at+1)%seq.length];
  SPANS[id]={w:n[0],h:n[1]};
  saveSpans(); sizeGrid();
}
function sizeGrid(){
  var g=document.getElementById('tgrid'); if(!g) return;
  var W=g.clientWidth, H=g.clientHeight;
  if(!W||!H||!TILES.length) return;
  var units=0, most=1;
  for(var i=0;i<TILES.length;i++){ var s=spanOf(TILES[i].id); units+=s.w*s.h; }
  var best=null;
  for(var cols=1;cols<=Math.min(10,units);cols++){
    var rows=Math.ceil(units/cols);
    var cw=W/cols, ch=H/rows;
    var cell=Math.min(cw,ch);
    if(cell<40) continue;
    var aspect=Math.abs(Math.log(cw/ch));            // 0 when the cell is square
    var score=cell/(1+aspect*2.2);                    // favour size, then squareness
    if(!best||score>best.score) best={cols:cols,rows:rows,cell:cell,score:score};
  }
  if(!best) return;
  g.style.gridTemplateColumns='repeat('+best.cols+',minmax(0,1fr))';
  g.style.gridAutoRows=Math.floor(best.cell)+'px';
  g.style.gridAutoFlow='row dense';
  g.style.overflow='hidden';
  for(var k=0;k<TILES.length;k++){
    var sp=spanOf(TILES[k].id);
    var el=g.querySelector('[data-id="'+TILES[k].id+'"]');
    if(el){ el.style.gridColumn='span '+sp.w; el.style.gridRow='span '+sp.h; el.style.minHeight='0'; }
  }
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
/* injected styles for the grip */
(function(){var s=document.createElement('style');s.textContent="\n/* the grip that extends a tile, and a grid that never scrolls */\n.tile{position:relative;overflow:hidden}\n.tzgrip{position:absolute;right:6px;bottom:6px;width:14px;height:14px;border-radius:3px;cursor:nwse-resize;opacity:.35;\n background:linear-gradient(135deg,transparent 45%,#7E8FA6 45%,#7E8FA6 55%,transparent 55%,transparent 70%,#7E8FA6 70%,#7E8FA6 80%,transparent 80%)}\n.tile:hover .tzgrip{opacity:.8}\n#tgrid{overflow:hidden !important;overscroll-behavior:none}\n@supports(height:100dvh){.wrap{height:100dvh}}\n";document.head.appendChild(s);})();
