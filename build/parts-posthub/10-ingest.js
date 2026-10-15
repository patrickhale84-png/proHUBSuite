/* postHUB - ingest
   Reads media straight off the client's drive. Nothing is copied, uploaded or fetched.

   Playability is decided by asking the browser to decode the file, not by trusting an
   extension: an object URL goes into a hidden <video>/<audio> and we wait for metadata.
   If it loads, the browser can play it and we have the duration. If it does not, the file
   is refused with a reason - which is the honest answer for ProRes, BRAW, R3D and MXF. */
var DB_NAME = 'posthub_handles', DB_STORE = 'dirs';
var VIDEO_EXT = ['mp4','m4v','webm','mov','mkv','avi','mxf','r3d','braw'];
var AUDIO_EXT = ['wav','aif','aiff','mp3','m4a','aac','flac','ogg'];
var KNOWN_BAD = { mxf:'MXF is not decodable in any browser', r3d:'RED RAW is not decodable in any browser',
                  braw:'Blackmagic RAW is not decodable in any browser', mkv:'MKV is usually not decodable',
                  avi:'AVI is usually not decodable', mov:'ProRes and other MOV codecs are usually not decodable' };

var FILES = [], REFUSED = [], DIR_HANDLE = null, MOUNTED = false;

function extOf(n) { var m = String(n).toLowerCase().match(/\.([a-z0-9]+)$/); return m ? m[1] : ''; }
function isMedia(n) { var e = extOf(n); return VIDEO_EXT.indexOf(e) >= 0 || AUDIO_EXT.indexOf(e) >= 0; }
function mmss(sec) {
  if (!isFinite(sec) || sec <= 0) return '--:--';
  var s = Math.round(sec), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  function p(n) { return (n < 10 ? '0' : '') + n; }
  return (h ? h + ':' : '') + p(m) + ':' + p(r);
}
function bytes(n) { var u = ['B','KB','MB','GB']; var i = 0; while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; } return (Math.round(n * 10) / 10) + ' ' + u[i]; }

/* ---- handle persistence: a directory handle survives in IndexedDB, permission does not ---- */
function idb() {
  return new Promise(function (res, rej) {
    try {
      var r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = function () { try { r.result.createObjectStore(DB_STORE); } catch (e) {} };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    } catch (e) { rej(e); }
  });
}
function putHandle(h) {
  return idb().then(function (db) {
    return new Promise(function (res) {
      try { var tx = db.transaction(DB_STORE, 'readwrite'); tx.objectStore(DB_STORE).put(h, 'media'); tx.oncomplete = function () { res(true); }; }
      catch (e) { res(false); }
    });
  }).catch(function () { return false; });
}
function getHandle() {
  return idb().then(function (db) {
    return new Promise(function (res) {
      try { var tx = db.transaction(DB_STORE, 'readonly'), rq = tx.objectStore(DB_STORE).get('media'); rq.onsuccess = function () { res(rq.result || null); }; rq.onerror = function () { res(null); }; }
      catch (e) { res(null); }
    });
  }).catch(function () { return null; });
}
function permission(h) {
  if (!h || !h.queryPermission) return Promise.resolve('no-handle-api');
  return h.queryPermission({ mode: 'read' }).catch(function () { return 'unknown'; });
}

/* ---- the honest playability probe ---- */
function probe(file, cb) {
  var isAudio = AUDIO_EXT.indexOf(extOf(file.name)) >= 0;
  var url = null, el = null, done = false;
  function finish(ok, info) {
    if (done) return; done = true;
    try { if (el) { el.removeAttribute('src'); el.load(); } } catch (e) {}
    try { if (url) URL.revokeObjectURL(url); } catch (e) {}
    cb(ok, info || {});
  }
  try {
    url = URL.createObjectURL(file);
    el = document.createElement(isAudio ? 'audio' : 'video');
    el.preload = 'metadata'; el.muted = true;
    var to = setTimeout(function () { finish(false, { reason: 'timed out reading metadata' }); }, 6000);
    el.onloadedmetadata = function () {
      clearTimeout(to);
      finish(true, { duration: el.duration, width: (isAudio ? 0 : el.videoWidth), height: (isAudio ? 0 : el.videoHeight), audio: isAudio });
    };
    el.onerror = function () { clearTimeout(to); finish(false, { reason: KNOWN_BAD[extOf(file.name)] || 'this browser has no decoder for it' }); };
    el.src = url;
  } catch (e) { finish(false, { reason: 'could not read the file' }); }
}

function ingestFiles(list) {
  REFUSED = [];
  var arr = Array.prototype.slice.call(list).filter(function (f) { return isMedia(f.name); });
  if (!arr.length) { if (POST.toast) POST.toast('No media found there', 'bad'); paint(); return; }
  if (POST.toast) POST.toast('Reading ' + arr.length + ' files…');
  var i = 0;
  function next() {
    if (i >= arr.length) { paint(); if (POST.toast) POST.toast('Bin ready: ' + FILES.length + ' playable', 'good'); return; }
    var f = arr[i++];
    probe(f, function (ok, info) {
      if (ok) FILES.push({ name: f.name, size: f.size, ext: extOf(f.name), duration: info.duration || 0,
                           width: info.width || 0, height: info.height || 0, audio: !!info.audio, ready: true });
      else REFUSED.push({ name: f.name, size: f.size, ext: extOf(f.name), reason: info.reason || 'unreadable' });
      paint();
      setTimeout(next, 0);   /* keep the UI responsive and the watchdog clean */
    });
  }
  next();
}

function walk(dir, out) {
  return new Promise(function (res) {
    var it = dir.values(), chain = Promise.resolve();
    chain = chain.then(function step() {
      return it.next().then(function (r) {
        if (r.done) { res(out); return; }
        var e = r.value;
        if (e.kind === 'file' && isMedia(e.name)) { out.push(e); return step(); }
        if (e.kind === 'directory') { return walk(e, out).then(step); }
        return step();
      });
    });
    chain.catch(function () { res(out); });
  });
}
function openFromHandle(dir) {
  DIR_HANDLE = dir;
  return permission(dir).then(function (p) {
    var need = (p === 'granted' || p === 'no-handle-api') ? Promise.resolve(true) : dir.requestPermission({ mode: 'read' }).then(function (q) { return q === 'granted'; });
    return need.then(function (ok) {
      if (!ok) { if (POST.toast) POST.toast('Permission was not granted', 'bad'); return; }
      putHandle(dir);
      return walk(dir, []).then(function (entries) {
        if (!entries.length) { if (POST.toast) POST.toast('No media in that folder', 'bad'); paint(); return; }
        var chain = Promise.resolve();
        entries.forEach(function (h) { chain = chain.then(function () { return h.getFile().then(function (f) { return f; }).then(function (f) { ingestFiles([f]); }); }); });
        /* ingestFiles paints after each file, so a folder arrives a row at a time */
      });
    });
  });
}
function pickFolder() {
  if (!window.showDirectoryPicker) { if (POST.toast) POST.toast('This browser has no folder picker - use the file picker below', 'bad'); return; }
  window.showDirectoryPicker({ mode: 'read' }).then(openFromHandle).catch(function (e) {
    if (e && e.name !== 'AbortError' && POST.toast) POST.toast('Could not open that folder: ' + e.message, 'bad');
  });
}
function pickFiles() {
  var i = document.createElement('input');
  i.type = 'file'; i.multiple = true; i.accept = 'video/*,audio/*';
  i.onchange = function () { if (i.files && i.files.length) ingestFiles(i.files); };
  i.click();
}

/* ---- the desk ---- */
function style() {
  if (document.getElementById('ingestStyle')) return;
  var s = document.createElement('style'); s.id = 'ingestStyle';
  s.textContent = '.pgh{position:fixed;inset:0;z-index:500;background:rgba(3,6,12,.94);overflow-y:auto;display:none}' +
    '.pgh.on{display:block}.pgh .box{max-width:1180px;margin:0 auto;background:#0A101B;min-height:100vh}' +
    '@media(min-width:900px){.pgh{padding:30px 16px 60px}.pgh .box{border-radius:12px;min-height:auto;border-top:4px solid #7137C8}}' +
    '.pgh .hd{display:flex;gap:10px;align-items:flex-start;padding:15px 17px;border-bottom:1px solid #1B2436;background:#0C1320;position:sticky;top:0}' +
    '.pgh .hd h2{font-size:20px;color:#fff}.pgh .hd .k{font-family:var(--fm);font-size:12px;letter-spacing:.15em;color:#B07CE8;text-transform:uppercase}' +
    '.pgh .bd{padding:16px 17px 26px}.pgh table{width:100%;border-collapse:collapse;font-size:13px}' +
    '.pgh th{text-align:left;font-family:var(--fm);font-size:11px;letter-spacing:.1em;color:#8794A6;text-transform:uppercase;border-bottom:1px solid #1B2436;padding:6px 8px}' +
    '.pgh td{border-bottom:1px solid rgba(27,36,54,.6);padding:7px 8px;color:#C6D1DC}' +
    '.pgh td.n{font-family:var(--fm);white-space:nowrap}.pgh .ok{color:#88C13F}.pgh .no{color:#FF9E9E}' +
    '.pgh .note{font-size:13px;color:#8794A6;margin:10px 0 0}';
  document.head.appendChild(s);
}
function hub() {
  var h = document.getElementById('posthub-ingest');
  if (h) return h;
  style();
  h = document.createElement('div'); h.className = 'pgh'; h.id = 'posthub-ingest';
  h.innerHTML = '<div class="box"><div class="hd"><div><div class="k">INGEST</div><h2>Media bin</h2></div>' +
    '<div style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap">' +
    '<button class="btn sm pri" id="igPick">Choose a folder</button>' +
    '<button class="btn sm" id="igFiles">Choose files</button>' +
    '<button class="btn sm" id="igClose">Close</button></div></div>' +deskTabs('ingest')+'<div class="bd"><div id="igSource"></div><div id="igBin"></div></div></div>';
  document.body.appendChild(h);
  h.addEventListener('click', function (e) { if (e.target === h) h.classList.remove('on'); });
  h.querySelector('#igClose').addEventListener('click', function () { h.classList.remove('on'); });
  h.querySelector('#igPick').addEventListener('click', pickFolder);
  h.querySelector('#igFiles').addEventListener('click', pickFiles);
  bindDeskTabs(h, 'ingest');
  return h;
}
function paint() {
  var h = document.getElementById('posthub-ingest');
  if (!h) return;
  bindDeskTabs(h, 'ingest');
  var src = h.querySelector('#igSource'), bin = h.querySelector('#igBin');
  var permText = DIR_HANDLE ? 'folder connected' : 'no folder connected yet';
  src.innerHTML = '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;font-family:var(--fm);font-size:13px;color:#8794A6">' +
    '<span class="chip" style="font-family:var(--fm);font-size:12px;border:1px solid #26344E;padding:4px 8px;border-radius:4px">' + permText + '</span>' +
    '<span>' + FILES.length + ' playable</span><span>' + REFUSED.length + ' refused</span>' +
    '<span>' + mmss(FILES.reduce(function (a, f) { return a + (f.duration || 0); }, 0)) + ' total</span></div>';
  if (!FILES.length && !REFUSED.length) {
    bin.innerHTML = '<div class="note">Choose the folder holding your media. Nothing is uploaded and nothing is copied - the desk reads the files where they sit, and keeps only the decisions you make about them.</div>';
    return;
  }
  var rows = FILES.map(function (f) {
    return '<tr><td>' + POST.esc(f.name) + '</td><td class="n">' + f.ext.toUpperCase() + '</td><td class="n">' + mmss(f.duration) + '</td>' +
      '<td class="n">' + (f.audio ? 'audio' : (f.width + 'x' + f.height)) + '</td><td class="n">' + bytes(f.size) + '</td><td class="ok">playable</td></tr>';
  }).join('');
  var ref = REFUSED.map(function (f) {
    return '<tr><td>' + POST.esc(f.name) + '</td><td class="n">' + f.ext.toUpperCase() + '</td><td class="n">--:--</td>' +
      '<td class="n">-</td><td class="n">' + bytes(f.size) + '</td><td class="no">' + POST.esc(f.reason) + '</td></tr>';
  }).join('');
  bin.innerHTML = '<table><thead><tr><th>File</th><th>Format</th><th>Duration</th><th>Frame</th><th>Size</th><th>Status</th></tr></thead><tbody>' + rows + ref + '</tbody></table>' +
    (REFUSED.length ? '<p class="note">Refused files have no decoder in any browser. Supply H.264 or WebM proxies alongside the camera originals and they will open here.</p>' : '');
}
function closeOtherDesks() {   /* one desk at a time: a full-screen desk must not trap you */
  var all = document.querySelectorAll('.pgh.on, .tlh.on');
  for (var i = 0; i < all.length; i++) all[i].classList.remove('on');
}
/* ---- desk tabs ----
   A shared switcher so you never have to close a desk to reach another. Desks register
   themselves on POST._desks; this renders and binds the bar. Deliberately duplicated in
   each module rather than cross-imported, so either desk works if the other is absent. */
function deskTabs(current) {
  var desks = POST._desks || [], out = '';
  for (var i = 0; i < desks.length; i++) {
    var d = desks[i], on = (d.id === current);
    out += '<button type="button" class="btn sm" data-desk="' + d.id + '"' +
      (on ? ' style="border-color:#E2A93B;color:#fff"' : '') + '>' + POST.esc(d.label) + '</button>';
  }
  return '<div class="deskbar" style="display:flex;gap:6px;padding:8px 17px;border-bottom:1px solid #1B2436;background:#0A0F1A;flex-wrap:wrap">' +
         (desks.length ? out : '<span style="font-size:13px;color:#8794A6">No other desks yet</span>') + '</div>';
}
function bindDeskTabs(root, current) {
  var bs = root.querySelectorAll('[data-desk]');
  for (var i = 0; i < bs.length; i++) {
    bs[i].onclick = function () {
      var id = this.getAttribute('data-desk'), desks = POST._desks || [];
      for (var j = 0; j < desks.length; j++) { if (desks[j].id === id) { desks[j].open(); return; } }
    };
  }
  var all = root.querySelectorAll('[data-desk]');
  for (var k = 0; k < all.length; k++) {
    var on = all[k].getAttribute('data-desk') === current;
    all[k].style.borderColor = on ? '#E2A93B' : '';
    all[k].style.color = on ? '#fff' : '';
  }
}
function openDesk() { closeOtherDesks(); var h = hub(); h.classList.add('on'); paint(); }

POST.register({
  id: 'ingest',
  mount: function () {
    hub(); MOUNTED = true;
    var DS = POST._desks || (POST._desks = []);
    DS.push({ id: 'ingest', label: 'Ingest', open: openDesk });
    POST.addTile({ id: 'ingest', title: 'Ingest', sub: 'Media from your drive', colour: '#7137C8', icon: 'in', tag: 'MEDIA', run: openDesk });
    getHandle().then(function (h) {
      if (!h) return;
      DIR_HANDLE = h;
      return permission(h).then(function (p) { if (p === 'granted') return openFromHandle(h); paint(); });
    }).catch(function () {});
  },
  state: function () {
    return { mounted: MOUNTED, files: FILES.length, refused: REFUSED.length,
             totalSeconds: Math.round(FILES.reduce(function (a, f) { return a + (f.duration || 0); }, 0)),
             folderConnected: !!DIR_HANDLE,
             pickerAvailable: !!window.showDirectoryPicker,
             refusedList: REFUSED.map(function (f) { return f.name + ': ' + f.reason; }) };
  }
});
POST.openIngest = openDesk;
POST.media = function () { return FILES.slice(); };
POST.ingestFiles = ingestFiles;
