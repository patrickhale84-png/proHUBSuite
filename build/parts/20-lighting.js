var LIGHTS={};
LIGHTS.Day={wall:'#E8EDF3',floor:'#CDD6DF',line:'#6E7C8C',key:0.66,shade:0.30,len:1.5};
LIGHTS.Golden={wall:'#F6E6C8',floor:'#D9C39A',line:'#7A6A4E',key:0.80,shade:0.34,len:2.1};
LIGHTS.Night={wall:'#232C3B',floor:'#1A2230',line:'#7C8CA0',key:0.22,shade:0.45,len:1.2};
LIGHTS.Interior={wall:'#DCE2E8',floor:'#C3CCD6',line:'#63707E',key:0.55,shade:0.26,len:1.0};
LIGHTS.Firelight={wall:'#3A2A1C',floor:'#2A1E14',line:'#C08A4A',key:0.30,shade:0.50,len:2.4};
function stageLightName(){var k=stage().light;if(!k){k='Day'}return k}
function stageLight(){var k=stageLightName();var L=LIGHTS[k];if(!L){L=LIGHTS.Day}return L}
var _roomDrawL=roomDraw;
roomDraw=function(k,c,w,h){
 var L=stageLight();
 c.save();
 c.fillStyle=L.wall;c.fillRect(0,0,w,h*0.62);
 c.fillStyle=L.floor;c.fillRect(0,h*0.62,w,h*0.38);
 var stop=Math.round(L.key*100)/100;
 if(stop<0.05){stop=0.05}
 if(stop>0.95){stop=0.95}
 var g=c.createLinearGradient(0,0,w,h);
 g.addColorStop(0,'rgba(255,255,255,0)');
 g.addColorStop(stop,'rgba(255,246,225,0.26)');
 g.addColorStop(1,'rgba(16,24,36,0.30)');
 c.fillStyle=g;c.fillRect(0,0,w,h);
 c.restore();
 _roomDrawL(k,c,w,h);
 c.save();
 var lx=w*L.key;
 var a=Math.round(L.key*30)/100;
 var rg=c.createRadialGradient(lx,h*0.92,10,lx,h*0.92,w*0.5);
 rg.addColorStop(0,'rgba(255,240,210,'+a+')');
 rg.addColorStop(1,'rgba(255,240,210,0)');
 c.globalCompositeOperation='lighter';
 c.fillStyle=rg;c.fillRect(0,0,w,h);
 c.restore();
};
var _partDrawL=partDraw;
partDraw=function(t,c,x,y,sc,rot){
 var L=stageLight();
 var dir=(L.key-0.5)*2;
 c.save();
 c.globalAlpha=L.shade;c.fillStyle='#0A1018';
 c.beginPath();c.ellipse(x+dir*34*sc*L.len,y+52*sc,30*sc,9*sc,0,0,7);c.fill();
 c.restore();
 _partDrawL(t,c,x,y,sc,rot);
};
var _stagePanelL=stagePanel;
stagePanel=function(){
 var h=_stagePanelL();
 var lk=stageLightName();
 var lr='';
 var keys=Object.keys(LIGHTS);
 var i=0;
 for(i=0;i<keys.length;i++){
  var lb='<button class="btn xs" data-lt="'+keys[i]+'">';
  if(keys[i]===lk){lb='<button class="btn xs on" data-lt="'+keys[i]+'">'}
  lr=lr+lb+keys[i]+'</button>';
 }
 var box='<div class="box"><h3 style="font-size:13px;color:#8794A6;margin-bottom:8px">LIGHT</h3>';
 box=box+'<div class="row"><span class="tiny muted">Rig</span>'+lr+'</div></div>';
 return h+box;
};
var _stageWireL=stageWire;
stageWire=function(h){
 _stageWireL(h);
 var list=$$('[data-lt]',h);
 for(var i=0;i<list.length;i++){
  var b=list[i];
  b.addEventListener('click',function(){
   stage().light=this.getAttribute('data-lt');
   saveSoon();stagePaint();
   var all=$$('[data-lt]',h);
   for(var n=0;n<all.length;n++){all[n].classList.remove('on')}
   this.classList.add('on');
  });
 }
};
