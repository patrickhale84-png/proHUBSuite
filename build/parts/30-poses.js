var POSES={};
POSES.Standing={a1x:-15,a1y:7,a2x:15,a2y:7,l1x:-10,l1y:48,l2x:10,l2y:48,drop:0,lean:0,rot:0};
POSES.Reaching={a1x:-34,a1y:-14,a2x:26,a2y:2,l1x:-10,l1y:48,l2x:10,l2y:48,drop:0,lean:0,rot:0};
POSES.Sitting={a1x:-18,a1y:10,a2x:18,a2y:10,l1x:-22,l1y:30,l2x:22,l2y:30,drop:14,lean:0,rot:0};
POSES.Crouching={a1x:-16,a1y:14,a2x:16,a2y:14,l1x:-20,l1y:26,l2x:20,l2y:26,drop:22,lean:0,rot:0};
POSES.Running={a1x:-36,a1y:-6,a2x:30,a2y:16,l1x:-30,l1y:40,l2x:24,l2y:34,drop:0,lean:8,rot:0};
POSES.Lying={a1x:-16,a1y:14,a2x:16,a2y:14,l1x:-26,l1y:10,l2x:26,l2y:10,drop:0,lean:0,rot:72};
function stagePoseName(){var k=stage().pose;if(!k){k='Standing'}return k}
function stagePose(){var k=stagePoseName();var P=POSES[k];if(!P){P=POSES.Standing}return P}
var _partDrawP=partDraw;
partDraw=function(t,c,x,y,sc,rot){
 var P=stagePose();
 var dy=P.drop?P.drop:0;
 var r=rot;
 if(P.rot){r=P.rot}
 c.save();
 c.translate(x,y);
 c.rotate(r*Math.PI/180);
 if(P.lean){c.rotate(P.lean*Math.PI/180)}
 c.scale(sc,sc);
 c.lineWidth=2.4;c.strokeStyle='#2A3543';c.fillStyle='rgba(255,244,220,0.72)';
 if(t.indexOf('head')===0){
  c.beginPath();c.ellipse(0,0,15,19,0,0,7);c.fill();c.stroke();
 }else{
  c.beginPath();c.moveTo(0,-16);c.lineTo(0,24+dy);c.stroke();
  c.beginPath();c.moveTo(0,-6+dy);c.lineTo(P.a1x,P.a1y+dy);c.stroke();
  c.beginPath();c.moveTo(0,-6+dy);c.lineTo(P.a2x,P.a2y+dy);c.stroke();
  c.beginPath();c.moveTo(0,24+dy);c.lineTo(P.l1x,P.l1y+dy);c.stroke();
  c.beginPath();c.moveTo(0,24+dy);c.lineTo(P.l2x,P.l2y+dy);c.stroke();
 }
 c.restore();
};
var _stagePanelP=stagePanel;
stagePanel=function(){
 var h=_stagePanelP();
 var pk=stagePoseName();
 var pr='';
 var keys=Object.keys(POSES);
 for(var i=0;i<keys.length;i++){
  var pb='<button class="btn xs" data-ps="'+keys[i]+'">';
  if(keys[i]===pk){pb='<button class="btn xs on" data-ps="'+keys[i]+'">'}
  pr=pr+pb+keys[i]+'</button>';
 }
 var box='<div class="box"><h3 style="font-size:13px;color:#8794A6;margin-bottom:8px">POSE</h3>';
 box=box+'<div class="row"><span class="tiny muted">Pose</span>'+pr+'</div></div>';
 return h+box;
};
var _stageWireP=stageWire;
stageWire=function(h){
 _stageWireP(h);
 var list=$$('[data-ps]',h);
 for(var i=0;i<list.length;i++){
  var b=list[i];
  b.addEventListener('click',function(){
   var v=this.getAttribute('data-ps');
   stage().pose=v;
   var st=stage();
   if(st.sel!=null){if(st.items[st.sel]){st.items[st.sel].pose=v}}
   saveSoon();stagePaint();
   var all=$$('[data-ps]',h);
   for(var n=0;n<all.length;n++){all[n].classList.remove('on')}
   this.classList.add('on');
  });
 }
};
