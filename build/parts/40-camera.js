var CAM_ANGLES={};
CAM_ANGLES.Low={sy:0.84,dy:-30,ceiling:1};
CAM_ANGLES.Eye={sy:1,dy:0,ceiling:0};
CAM_ANGLES.High={sy:1.14,dy:26,ceiling:0};
var CAM_FRAMES={};
CAM_FRAMES.Wide={zoom:0.86};
CAM_FRAMES.Medium={zoom:1};
CAM_FRAMES.Close={zoom:1.32};
function stageAngleName(){var k=stage().angle;if(!k){k='Eye'}return k}
function stageAngle(){var k=stageAngleName();var a=CAM_ANGLES[k];if(!a){a=CAM_ANGLES.Eye}return a}
function stageFrameName(){var k=stage().frame;if(!k){k='Medium'}return k}
function stageFrame(){var k=stageFrameName();var f=CAM_FRAMES[k];if(!f){f=CAM_FRAMES.Medium}return f}
function camMode(){var k=stageFrameName();if(k==='Wide'){return 'bg'}if(k==='Close'){return 'fg'}return 'mid'}
function roomDetail(k,c,w,h,mode,ang){
 c.save();c.lineWidth=1.6;c.strokeStyle='#5F6E7E';
 if(mode==='bg'){
  c.beginPath();c.moveTo(0,h*0.13);c.lineTo(w,h*0.13);c.stroke();
  c.beginPath();c.moveTo(w*0.07,0);c.lineTo(w*0.07,h*0.62);c.stroke();
  c.beginPath();c.moveTo(w*0.93,0);c.lineTo(w*0.93,h*0.62);c.stroke();
  c.beginPath();c.moveTo(w*0.30,h*0.62);c.lineTo(w*0.30,h);c.stroke();
  c.beginPath();c.moveTo(w*0.70,h*0.62);c.lineTo(w*0.70,h);c.stroke();
 }
 if(mode==='mid'){
  c.beginPath();c.moveTo(w*0.22,h*0.62);c.lineTo(w*0.22,h*0.88);c.stroke();
  c.beginPath();c.moveTo(w*0.78,h*0.62);c.lineTo(w*0.78,h*0.88);c.stroke();
  c.beginPath();c.moveTo(0,h*0.34);c.lineTo(w,h*0.34);c.stroke();
 }
 if(mode==='fg'){
  c.lineWidth=2.4;
  c.strokeRect(w*0.02,h*0.44,w*0.19,h*0.48);
  c.strokeRect(w*0.79,h*0.30,w*0.19,h*0.62);
  c.beginPath();c.moveTo(0,h*0.90);c.lineTo(w,h*0.90);c.stroke();
 }
 if(ang){if(ang.ceiling){c.beginPath();c.moveTo(0,h*0.04);c.lineTo(w,h*0.04);c.stroke()}}
 c.restore();
}
var _roomDrawC=roomDraw;
roomDraw=function(k,c,w,h){
 var A=stageAngle();var F=stageFrame();var m=camMode();
 c.save();
 c.translate(w/2,h/2);
 c.scale(F.zoom,F.zoom*A.sy);
 c.translate(-w/2,(-h/2)+A.dy);
 _roomDrawC(k,c,w,h);
 roomDetail(k,c,w,h,m,A);
 c.restore();
};
var _stagePanelC=stagePanel;
stagePanel=function(){
 var h=_stagePanelC();
 var A=stageAngleName();
 var F=stageFrameName();
 var ar='';var fr='';var keys=Object.keys(CAM_ANGLES);var i=0;
 for(i=0;i<keys.length;i++){
  var cl='<button class="btn xs" data-ang="'+keys[i]+'">';
  if(keys[i]===A){cl='<button class="btn xs on" data-ang="'+keys[i]+'">'}
  ar=ar+cl+keys[i]+'</button>';
 }
 keys=Object.keys(CAM_FRAMES);
 for(i=0;i<keys.length;i++){
  var cf='<button class="btn xs" data-fr="'+keys[i]+'">';
  if(keys[i]===F){cf='<button class="btn xs on" data-fr="'+keys[i]+'">'}
  fr=fr+cf+keys[i]+'</button>';
 }
 var box='<div class="box"><h3 style="font-size:13px;color:#8794A6;margin-bottom:8px">CAMERA</h3>';
 box=box+'<div class="row" style="margin-bottom:6px"><span class="tiny muted">Angle</span>'+ar+'</div>';
 box=box+'<div class="row"><span class="tiny muted">Framing</span>'+fr+'</div></div>';
 return h+box;
};
var _stageWireC=stageWire;
stageWire=function(h){
 _stageWireC(h);
 function bind(attr){
  var list=$$('['+attr+']',h);
  for(var i=0;i<list.length;i++){
   var b=list[i];
   b.addEventListener('click',function(){
    var v=this.getAttribute(attr);
    if(attr==='data-ang'){stage().angle=v}else{stage().frame=v}
    saveSoon();stagePaint();
    var all=$$('['+attr+']',h);
    for(var n=0;n<all.length;n++){all[n].classList.remove('on')}
    this.classList.add('on');
   });
  }
 }
 bind('data-ang');
 bind('data-fr');
};
