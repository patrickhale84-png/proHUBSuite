/* the pitch deck studio: genre, slide type and layout on the left, an editable canvas in the
   middle, faces and accent in the footer. Images by file or URL, for the slide and the background.
   The deck rides the bus as deck:pitch so it saves with the profile. */
var PD = { genre:'DRAMA', slide:'LOGLINE', layout:'split', display:1, body:0, accent:'#8BA8B8',
           bg:'', bgMode:'colour', slides:{}, slidesAt:{} };
var PD_GENRES=['DRAMA','THRILLER','SCI-FI','HORROR','ACTION','ROMANCE','WESTERN','BIOPIC'];
var PD_SLIDES=['TITLE','LOGLINE','STORY','CHARACTERS','WORLD','COMPS','MARKET','TEAM'];
var PD_LAYOUTS=[['split','image left, text right'],['full','image full, text over'],['text','text only'],['stack','image above, text below']];
var PD_FACES=[['Editorial serif',"Georgia,'Iowan Old Style','Times New Roman',serif"],
 ['Modern serif',"'Palatino Linotype',Palatino,'Book Antiqua',serif"],
 ['Condensed sans',"'Arial Narrow','Helvetica Neue',system-ui,sans-serif"],
 ['Neutral sans',"system-ui,-apple-system,'Segoe UI',Roboto,sans-serif"]];
var PD_BODIES=[['Neutral sans',"system-ui,-apple-system,'Segoe UI',Roboto,sans-serif"],
 ['Humanist serif','Georgia,serif'],['Mono','ui-monospace,SFMono-Regular,Menlo,Consolas,monospace'],
 ['Condensed sans',"'Arial Narrow',system-ui,sans-serif"]];
var PD_PH={TITLE:'STELLAR NURSERY',
 LOGLINE:"A woman returns to her childhood home after twenty years to discover her mother's most careful secret was not a secret at all.",
 STORY:'Act one, act two, act three - what changes, and what it costs.',
 CHARACTERS:'Who wants what, and who stands in the way.',WORLD:'The place, the rules of it, and the palette.',
 COMPS:'Where this sits on the shelf.',MARKET:'Who leans in, and why now.',TEAM:'Who is making it, and what they have made.'};

function pdLoad(){
 var r=ModalSync.get('deck:pitch');
 if(r&&r.deck){for(var k in r.deck)if(r.deck[k]!==undefined)PD[k]=r.deck[k]}
 if(!PD.slides.TITLE){
  var sp=ModalSync.get('screenplay:main');
  if(sp&&sp.lines){
   var sc=SB.parseScenes(sp.lines);
   if(sc.length){
    PD.slides.TITLE=sc[0].heading.replace(/^(INT|EXT)\.?\s*/i,'').split(/[-\u2013]/)[0].trim();
    if(sc[0].action)PD.slides.LOGLINE=sc[0].action.split('. ')[0]+'.';
   }
  }
 }
}
function pdPub(){try{ModalSync.publish('deck:pitch',{deck:PD},'deck')}catch(e){}}
function pdText(k){return PD.slides[k]||PD_PH[k]||''}
function pdImg(){return PD.slidesAt[PD.slide]||''}
function pdFace(){return (PD_FACES[PD.display]||PD_FACES[0])[1]}
function pdBody(){return (PD_BODIES[PD.body]||PD_BODIES[0])[1]}
function pdBgStyle(){
 return (PD.bgMode==='image'&&PD.bg)
  ? "background:#080C14 url('"+PD.bg.replace(/'/g,"%27")+"') center/cover"
  : 'background:#080C14';
}
function pdWell(){
 var img=pdImg();
 if(img)return "<div style=\"width:100%;height:100%;background:url('"+img.replace(/'/g,"%27")+"') center/cover\"></div>";
 return '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center">'+
  '<div style="width:62%;aspect-ratio:1;border:1px solid rgba(255,255,255,.22);border-radius:50%"></div></div>';
}
function pdCanvasHTML(){
 var text=pdText(PD.slide);
 var type='font-family:'+pdFace()+';font-weight:500;line-height:1.28;color:#F2F0EA;outline:none;font-size:';
 var body='<div contenteditable="true" data-pd="text" style="'+type+(PD.slide==='TITLE'?'42px':'27px')+'">'+
  HUB.esc(text)+'</div><div style="margin-top:14px;font-family:'+pdBody()+
  ';font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:'+PD.accent+'">'+
  HUB.esc(PD.slide)+' &middot; '+HUB.esc(PD.genre)+'</div>';
 if(PD.layout==='text'){
  return '<div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:8%">'+
   '<div style="max-width:760px"><div style="font-size:44px;color:'+PD.accent+';font-family:'+pdFace()+'">&ldquo;</div>'+
   '<div contenteditable="true" data-pd="text" style="'+type+(PD.slide==='TITLE'?'46px':'30px')+'">'+HUB.esc(text)+'</div></div>'+
   '<div style="margin-top:18px;font-family:'+pdBody()+';font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:'+PD.accent+'">'+
   HUB.esc(PD.slide)+' &middot; '+HUB.esc(PD.genre)+'</div></div>';
 }
 if(PD.layout==='full'){
  return '<div style="position:absolute;inset:0">'+pdWell()+
   '<div style="position:absolute;inset:auto 0 0 0;padding:28px 34px;background:linear-gradient(transparent,rgba(4,7,12,.92))">'+body+'</div></div>';
 }
 if(PD.layout==='stack'){
  return '<div style="position:absolute;inset:0;display:flex;flex-direction:column">'+
   '<div style="flex:0 0 58%;border-bottom:1px solid rgba(255,255,255,.08)">'+pdWell()+'</div>'+
   '<div style="flex:1 1 auto;padding:26px 32px">'+body+'</div></div>';
 }
 return '<div style="position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr">'+
  '<div style="border-right:1px solid rgba(255,255,255,.08)">'+pdWell()+'</div>'+
  '<div style="padding:34px 38px;display:flex;flex-direction:column;justify-content:center">'+body+'</div></div>';
}
function pdPrint(){
 var pages=PD_SLIDES.map(function(s){
  var t=PD.slides[s]||PD_PH[s]||'', img=PD.slidesAt[s];
  return '<section class="pdpage">'+(img?'<img src="'+img+'">':'')+
   '<h1>'+HUB.esc(t)+'</h1><p class="pdmeta">'+HUB.esc(s)+' &middot; '+HUB.esc(PD.genre)+'</p></section>';
 }).join('');
 var w=window.open('','_blank');
 if(!w){alert('Allow pop-ups to export the deck.');return}
 w.document.write('<!DOCTYPE html><html><head><title>Pitch deck</title><style>'+
  '@page{size:A4 landscape;margin:0}body{margin:0;background:#080C14;color:#F2F0EA;font-family:'+pdBody()+'}'+
  '.pdpage{width:100vw;height:100vh;display:flex;flex-direction:column;justify-content:center;padding:8vh 8vw;'+
  'box-sizing:border-box;page-break-after:always}.pdpage img{max-height:52vh;object-fit:contain;margin-bottom:5vh}'+
  '.pdpage h1{font-family:'+pdFace()+';font-size:5.2vh;font-weight:500;margin:0;line-height:1.3}'+
  '.pdmeta{font-size:1.6vh;letter-spacing:.16em;text-transform:uppercase;color:'+PD.accent+';margin-top:3vh}'+
  '</style></head><body>'+pages+'</body></html>');
 w.document.close();
 setTimeout(function(){try{w.print()}catch(e){}},400);
}
function pdDraw(box){
 var canvas=box.querySelector('#pdCanvas'); if(!canvas)return;
 canvas.setAttribute('style','position:relative;overflow:hidden;border-radius:10px;border:1px solid var(--line);aspect-ratio:16/9;'+pdBgStyle()+';color:#F2F0EA');
 canvas.innerHTML=pdCanvasHTML();
 var tint=function(sel,on){box.querySelectorAll(sel).forEach(function(b){
  b.style.borderColor=on(b)?PD.accent:'var(--line)';b.style.color=on(b)?'#fff':'#8794A6';})};
 tint('[data-genre]',function(b){return b.getAttribute('data-genre')===PD.genre});
 tint('[data-slide]',function(b){return b.getAttribute('data-slide')===PD.slide});
 tint('[data-layout]',function(b){return b.getAttribute('data-layout')===PD.layout});
 var f=box.querySelector('#pdFaceName');if(f)f.textContent=PD_FACES[PD.display][0];
 var bf=box.querySelector('#pdBodyName');if(bf)bf.textContent=PD_BODIES[PD.body][0];
 var ln=box.querySelector('#pdLayoutName');if(ln)ln.textContent=PD.layout;
 var av=box.querySelector('#pdAccentVal');if(av)av.textContent=PD.accent;
 pdBind(box);
}
function pdBind(box){
 var t=box.querySelector('[data-pd="text"]');
 if(t)t.addEventListener('blur',function(){PD.slides[PD.slide]=t.textContent.trim();pdPub()});
 box.querySelectorAll('[data-genre]').forEach(function(b){b.onclick=function(){PD.genre=b.getAttribute('data-genre');pdPub();pdDraw(box)}});
 box.querySelectorAll('[data-slide]').forEach(function(b){b.onclick=function(){PD.slide=b.getAttribute('data-slide');pdPub();pdDraw(box)}});
 box.querySelectorAll('[data-layout]').forEach(function(b){b.onclick=function(){PD.layout=b.getAttribute('data-layout');pdPub();pdDraw(box)}});
 var fs=box.querySelector('#pdFace');if(fs)fs.onchange=function(){PD.display=+fs.value;pdPub();pdDraw(box)};
 var bs=box.querySelector('#pdBody');if(bs)bs.onchange=function(){PD.body=+bs.value;pdPub();pdDraw(box)};
 var ac=box.querySelector('#pdAccent');if(ac){ac.oninput=function(){PD.accent=ac.value;pdDraw(box)};ac.onchange=function(){pdPub()}}
 var up=box.querySelector('#pdImgFile');if(up)up.onchange=function(){
  var f=up.files&&up.files[0];if(!f)return;var fr=new FileReader();
  fr.onload=function(){PD.slidesAt[PD.slide]=fr.result;pdPub();pdDraw(box)};fr.readAsDataURL(f)};
 var u2=box.querySelector('#pdImgUrl');if(u2)u2.onclick=function(){
  var u=window.prompt('Image URL for this slide:','');if(u){PD.slidesAt[PD.slide]=u;pdPub();pdDraw(box)}};
 var bu=box.querySelector('#pdBgFile');if(bu)bu.onchange=function(){
  var f=bu.files&&bu.files[0];if(!f)return;var fr=new FileReader();
  fr.onload=function(){PD.bg=fr.result;PD.bgMode='image';pdPub();pdDraw(box)};fr.readAsDataURL(f)};
 var b2=box.querySelector('#pdBgUrl');if(b2)b2.onclick=function(){
  var u=window.prompt('Background image URL:',PD.bgMode==='image'?PD.bg:'');if(u){PD.bg=u;PD.bgMode='image';pdPub();pdDraw(box)}};
 var cl=box.querySelector('#pdBgClear');if(cl)cl.onclick=function(){PD.bg='';PD.bgMode='colour';pdPub();pdDraw(box)};
 var pr=box.querySelector('#pdPrint');if(pr)pr.onclick=pdPrint;
}
HUB.reg({id:'pitch',title:'Pitch deck',sub:'Genre, slide type, four layouts, faces, accent, PDF',
 tag:'pre-production',colour:'#B07CE8',
 render:function(box){
  pdLoad();
  function rail(label,items,attr){
   return '<div class="note" style="margin:12px 0 5px;letter-spacing:.14em;font-size:10px;text-transform:uppercase">'+
    label+'</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:5px">'+
    items.map(function(it){var v=(typeof it==='string')?it:it[0];
     return '<button data-'+attr+'="'+HUB.esc(v)+'" style="font-size:10.5px;letter-spacing:.06em;padding:6px 4px;'+
      'border-radius:5px;background:#0D1420;border:1px solid var(--line);color:#8794A6">'+HUB.esc(v)+'</button>'}).join('')+'</div>';
  }
  box.innerHTML='<div style="display:grid;grid-template-columns:230px 1fr;gap:14px">'+
   '<div style="border-right:1px solid var(--line);padding-right:12px">'+
    rail('Genre',PD_GENRES,'genre')+rail('Slide type',PD_SLIDES,'slide')+rail('Layout',PD_LAYOUTS.map(function(l){return l[0]}),'layout')+
   '</div><div><div id="pdCanvas"></div>'+
   '<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:10px">'+
    '<input type="file" id="pdImgFile" accept="image/*" style="width:auto;font-size:11px">'+
    '<button id="pdImgUrl">image by URL</button>'+
    '<input type="file" id="pdBgFile" accept="image/*" style="width:auto;font-size:11px">'+
    '<button id="pdBgUrl">background by URL</button><button id="pdBgClear">clear background</button>'+
    '<button id="pdPrint" class="pri">Export PDF</button></div>'+
   '<div style="margin-top:14px;border-top:1px solid var(--line);padding-top:10px;display:grid;'+
   'grid-template-columns:repeat(4,1fr);gap:12px">'+
    '<div><div class="note" style="font-size:9.5px;letter-spacing:.14em;text-transform:uppercase">Display face</div>'+
     '<div id="pdFaceName" style="font-size:12.5px;color:#C6D1DC"></div><select id="pdFace" style="margin-top:4px;font-size:11px">'+
     PD_FACES.map(function(f,i){return '<option value="'+i+'">'+HUB.esc(f[0])+'</option>'}).join('')+'</select></div>'+
    '<div><div class="note" style="font-size:9.5px;letter-spacing:.14em;text-transform:uppercase">Body face</div>'+
     '<div id="pdBodyName" style="font-size:12.5px;color:#C6D1DC"></div><select id="pdBody" style="margin-top:4px;font-size:11px">'+
     PD_BODIES.map(function(f,i){return '<option value="'+i+'">'+HUB.esc(f[0])+'</option>'}).join('')+'</select></div>'+
    '<div><div class="note" style="font-size:9.5px;letter-spacing:.14em;text-transform:uppercase">Accent</div>'+
     '<div style="display:flex;align-items:center;gap:6px;margin-top:4px"><input type="color" id="pdAccent" value="'+PD.accent+
     '" style="width:34px;height:24px;padding:0;border:0"><span id="pdAccentVal" class="note">'+PD.accent+'</span></div></div>'+
    '<div><div class="note" style="font-size:9.5px;letter-spacing:.14em;text-transform:uppercase">Layout</div>'+
     '<div id="pdLayoutName" style="font-size:12.5px;color:#C6D1DC"></div></div>'+
   '</div></div></div>';
  var fs=box.querySelector('#pdFace');if(fs)fs.value=PD.display;
  var bs=box.querySelector('#pdBody');if(bs)bs.value=PD.body;
  pdDraw(box);
 }});
