/* postHUB - viewer
   A screen you can actually watch, with transport, timecode, a scrubber and in/out marks that
   become cuts. The cut list is the conform view; this is the viewing one.

   Media is read from the bin's own File objects - nothing is copied or uploaded. */
var PLI = -1, PLURL = null, PLIN = null, PLOUT = null;

function q1(id) { return document.getElementById(id); }
function pad(n) { return (n < 10 ? '0' : '') + n; }
function tc(sec, fps) {
  sec = sec || 0; fps = fps || 25;
  var f = Math.round((sec - Math.floor(sec)) * fps);
  return pad(Math.floor(sec / 3600)) + ':' + pad(Math.floor(sec / 60) % 60) + ':' + pad(Math.floor(sec) % 60) + ':' + pad(f);
}
function clips() { return (typeof POST.mediaFiles === 'function') ? POST.mediaFiles() : []; }

function style() {
  if (q1('plStyle')) return;
  var s = document.createElement('style'); s.id = 'plStyle';
  s.textContent =
    '.plh{position:fixed;inset:0;z-index:500;background:rgba(3,6,12,.96);overflow-y:auto;display:none}' +
    '.plh.on{display:block}.plh .box{max-width:1200px;margin:0 auto;background:#080D16;min-height:100vh}' +
    '@media(min-width:900px){.plh{padding:24px 16px 60px}.plh .box{border-radius:12px;min-height:auto;border-top:4px solid #7137C8}}' +
    '.plh .hd{display:flex;gap:10px;align-items:flex-start;padding:14px 16px;border-bottom:1px solid #1B2436;background:#0C1320}' +
    '.plh .hd h2{font-size:20px;color:#fff}.plh .hd .k{font-family:var(--fm);font-size:12px;letter-spacing:.15em;color:#B07CE8;text-transform:uppercase}' +
    '.plh .bd{padding:14px 16px 24px}.plview{width:100%;background:#000;border-radius:6px;max-height:56vh;display:block}' +
    '.plbar{display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap}' +
    '.plscrub{width:100%;margin:12px 0 4px}' +
    '.plmarks{display:flex;gap:14px;font-family:var(--fm);font-size:12px;color:#8794A6;flex-wrap:wrap}' +
    '.plstrip{display:flex;gap:6px;overflow-x:auto;padding:10px 0 4px}' +
    '.plclip{flex:0 0 auto;min-width:104px;padding:7px 9px;border-radius:5px;background:#131A28;border:1px solid #26344E;cursor:pointer;font-size:12px}' +
    '.plclip.cur{border-color:#B07CE8;background:#1B1730}.plclip .nm{display:block;font-family:var(--fm);font-size:11.5px;color:#C6D1DC;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px}' +
    '.plclip .du{font-family:var(--fm);font-size:10.5px;color:#8794A6}' +
    '.plnote{font-size:12.5px;color:#8794A6;margin:8px 0 0}';
  document.head.appendChild(s);
}
function hub() {
  var h = q1('posthub-viewer');
  if (h) return h;
  style();
  var rows = [
    '<div class="box">',
      '<div class="hd">',
        '<div><div class="k">VIEWER</div><h2>Watch and mark</h2></div>',
        '<div style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap">',
          '<button class="btn sm" id="plBack">&minus;1s</button>',
          '<button class="btn sm pri" id="plPlay">Play</button>',
          '<button class="btn sm" id="plFwd">+1s</button>',
          '<button class="btn sm" id="plIn">Mark in</button>',
          '<button class="btn sm" id="plOut">Mark out</button>',
          '<button class="btn sm" id="plAdd">Add to timeline</button>',
          '<button class="btn sm" id="plClose">Close</button>',
        '</div>',
      '</div>',
      '<div class="bd">',
        '<video id="plView" class="plview" playsinline preload="metadata"></video>',
        '<input id="plBar" class="plscrub" type="range" min="0" max="1000" value="0" step="1">',
        '<div class="plmarks">',
          '<span>Time <b id="plTc">00:00:00:00</b></span>',
          '<span>Length <b id="plDur">--</b></span>',
          '<span>In <b id="plInTc">--</b></span>',
          '<span>Out <b id="plOutTc">--</b></span>',
          '<span id="plName">no clip loaded</span>',
        '</div>',
        '<div class="plstrip" id="plStrip"></div>',
        '<p class="plnote">Space plays, J and L shuttle back and forward, arrows step a frame, shift with the arrows jumps a second. Mark in and out, then add the selection to the timeline as a cut.</p>',
      '</div>',
    '</div>'
  ];
  h = document.createElement('div');
  h.className = 'plh'; h.id = 'posthub-viewer';
  h.innerHTML = rows.join('');
  document.body.appendChild(h);
  h.addEventListener('click', function (e) { if (e.target === h) h.classList.remove('on'); });
  q1('plClose').onclick = function () { h.classList.remove('on'); };
  q1('plPlay').onclick = toggle;
  q1('plBack').onclick = function () { seek(cur() - 1); };
  q1('plFwd').onclick = function () { seek(cur() + 1); };
  q1('plIn').onclick = function () { PLIN = cur(); paintMarks(); POST.toast('In at ' + tc(PLIN), 'good'); };
  q1('plOut').onclick = function () { PLOUT = cur(); paintMarks(); POST.toast('Out at ' + tc(PLOUT), 'good'); };
  q1('plAdd').onclick = addCut;
  q1('plBar').addEventListener('input', function () { var v = q1('plView'); if (v && v.duration) v.currentTime = (this.value / 1000) * v.duration; });
  var v = q1('plView');
  v.addEventListener('timeupdate', function () { syncBar(); paintMarks(); });
  v.addEventListener('loadedmetadata', function () { syncBar(); paintMarks(); });
  v.addEventListener('play', function () { q1('plPlay').textContent = 'Pause'; });
  v.addEventListener('pause', function () { q1('plPlay').textContent = 'Play'; });
  return h;
}
function cur() { var v = q1('plView'); return v ? (v.currentTime || 0) : 0; }
function toggle() { var v = q1('plView'); if (!v || !v.src) { POST.toast('Load a clip from the strip below', 'bad'); return; } if (v.paused) v.play(); else v.pause(); }
function seek(t) { var v = q1('plView'); if (!v) return; v.currentTime = Math.max(0, Math.min(t, (v.duration || 0))); }
function syncBar() { var v = q1('plView'), b = q1('plBar'); if (!v || !b) return; var d = v.duration || 0; b.value = d ? Math.round((v.currentTime / d) * 1000) : 0; var e = q1('plTc'); if (e) e.textContent = tc(v.currentTime); var f = q1('plDur'); if (f) f.textContent = d ? tc(d) : '--'; }
function paintMarks() {
  var a = q1('plInTc'), b = q1('plOutTc');
  if (a) a.textContent = (PLIN == null) ? '--' : tc(PLIN);
  if (b) b.textContent = (PLOUT == null) ? '--' : tc(PLOUT);
}
function paintStrip() {
  var s = q1('plStrip'); if (!s) return;
  var list = clips();
  if (!list.length) { s.innerHTML = '<span class="plnote">The bin is empty. Use Ingest to point at a folder of H.264 or WebM files, then come back.</span>'; return; }
  var out = [];
  for (var i = 0; i < list.length; i++) {
    out.push('<div class="plclip' + (i === PLI ? ' cur' : '') + '" data-i="' + i + '">' +
      '<span class="nm">' + POST.esc(list[i].name) + '</span>' +
      '<span class="du">' + tc(list[i].duration || 0) + '</span></div>');
  }
  s.innerHTML = out.join('');
  var cs = s.querySelectorAll('[data-i]');
  for (var j = 0; j < cs.length; j++) cs[j].onclick = function () { load(parseInt(this.getAttribute('data-i'), 10)); };
}
function load(i) {
  var list = clips();
  if (!list[i]) return;
  PLI = i; PLIN = null; PLOUT = null;
  var v = q1('plView');
  try { if (PLURL) URL.revokeObjectURL(PLURL); } catch (e) {}
  PLURL = URL.createObjectURL(list[i].file);
  v.src = PLURL;
  v.load();
  var n = q1('plName'); if (n) n.textContent = list[i].name;
  paintStrip(); paintMarks(); syncBar();
}
function addCut() {
  var list = clips();
  var clip = list[PLI];
  if (!clip) { POST.toast('Load a clip first', 'bad'); return; }
  var a = (PLIN == null) ? 0 : PLIN;
  var b = (PLOUT == null) ? (clip.duration || cur()) : PLOUT;
  if (b <= a) { POST.toast('Out must be after in', 'bad'); return; }
  if (typeof POST.timeline === 'object' && POST.timeline && POST.timeline.add) {
    POST.timeline.add({ name: clip.name, srcIn: a, srcOut: b });
    POST.toast('Cut added: ' + tc(a) + ' - ' + tc(b), 'good');
  } else {
    POST.toast('The timeline is not loaded', 'bad');
  }
}
function open() {
  var others = document.querySelectorAll('.' + 'pgh.on, .tlh.on, .nth.on, .syh.on, .dvh.on, .plh.on');
  for (var i = 0; i < others.length; i++) others[i].classList.remove('on');
  var h = hub(); h.classList.add('on'); paintStrip(); paintMarks(); syncBar();
}
document.addEventListener('keydown', function (e) {
  var h = q1('posthub-viewer');
  if (!h || !h.classList.contains('on')) return;
  if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
  var v = q1('plView');
  if (e.key === ' ') { e.preventDefault(); toggle(); }
  else if (e.key === 'j') { seek(cur() - 1); }
  else if (e.key === 'l') { seek(cur() + 1); }
  else if (e.key === 'k') { if (v) v.pause(); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); seek(cur() + (e.shiftKey ? 1 : 1 / 25)); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); seek(cur() - (e.shiftKey ? 1 : 1 / 25)); }
  else if (e.key === 'i') { PLIN = cur(); paintMarks(); }
  else if (e.key === 'o') { PLOUT = cur(); paintMarks(); }
});

POST.register({
  id: 'viewer',
  mount: function () {
    hub();
    POST.addTile({ id: 'viewer', title: 'Viewer', sub: 'Watch · scrub · mark in and out', colour: '#B07CE8', icon: 'play', tag: 'VIEW', run: open });
  },
  state: function () {
    var v = q1('plView');
    return { clips: clips().length, loaded: PLI, name: (clips()[PLI] || {}).name || null,
             duration: Math.round(((clips()[PLI] || {}).duration || 0) * 100) / 100,
             position: v ? Math.round((v.currentTime || 0) * 100) / 100 : 0,
             playing: v ? !v.paused : false, inMark: PLIN, outMark: PLOUT };
  }
});
POST.viewer = { open: open, load: load, seek: seek, play: toggle, cur: cur, markIn: function () { PLIN = cur(); }, markOut: function () { PLOUT = cur(); }, addCut: addCut };
