/* postHUB - timeline
   The spine of the edit desk: a cut list with source and record in/out, ripple delete, and
   EDL text both ways. No media is touched here - cuts are decisions, and decisions are small. */
var FPS = 25;
var CUTS = [], SELECTED = -1;

function pad(n) { return (n < 10 ? '0' : '') + n; }
function tcf(sec) {
  sec = sec || 0;
  var f = Math.round((sec - Math.floor(sec)) * FPS), s = Math.floor(sec) % 60, m = Math.floor(sec / 60) % 60, h = Math.floor(sec / 3600);
  return pad(h) + ':' + pad(m) + ':' + pad(s) + ':' + pad(f);
}
function parseTc(t) {
  if (t == null) return 0;
  var p = String(t).trim().split(':');
  if (p.length === 1) return parseFloat(p[0]) || 0;
  var f = parseFloat(p[p.length - 1]) || 0, s = parseFloat(p[p.length - 2]) || 0, m = parseFloat(p[p.length - 3]) || 0, h = parseFloat(p[p.length - 4]) || 0;
  return h * 3600 + m * 60 + s + f / FPS;
}
function ripple() {                    /* record times are derived, never stored loose */
  var at = 0;
  CUTS.forEach(function (k) {
    k.duration = Math.max(0, k.srcOut - k.srcIn);
    k.recIn = at; k.recOut = at + k.duration; at = k.recOut;
  });
}
function add(cut) {
  cut = cut || {};
  var k = { name: cut.name || 'CLIP', reel: cut.reel || 'AX', srcIn: +cut.srcIn || 0, srcOut: +cut.srcOut || 5 };
  CUTS.push(k); ripple(); paint();
  return CUTS.length;
}
function rippleDelete(i) {
  if (i == null || i < 0 || i >= CUTS.length) return false;
  CUTS.splice(i, 1); if (SELECTED >= CUTS.length) SELECTED = CUTS.length - 1;
  ripple(); paint(); return true;
}
function total() { return CUTS.length ? CUTS[CUTS.length - 1].recOut : 0; }

/* ---- EDL: CMX3600 out, forgiving in ---- */
function edl() {
  var title = (POST.state().project && POST.state().project.name) || 'postHUB';
  var out = ['TITLE: ' + title, 'FCM: NON-DROP FRAME', ''];
  CUTS.forEach(function (k, i) {
    var n = String(i + 1);
    while (n.length < 3) n = '0' + n;
    out.push(n + '  ' + (k.reel + '        ').slice(0, 8) + ' V     C        ' +
      tcf(k.srcIn) + ' ' + tcf(k.srcOut) + ' ' + tcf(k.recIn) + ' ' + tcf(k.recOut));
    out.push('* FROM CLIP NAME: ' + k.name);
  });
  return out.join('\n');
}
function importEdl(text) {
  var lines = String(text || '').split(/\r?\n/), added = 0, last = null;
  var re = /^(\d{3,6})\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)/;
  lines.forEach(function (ln) {
    var m = ln.match(re);
    if (m) {
      last = { reel: m[2], srcIn: parseTc(m[5]), srcOut: parseTc(m[6]), name: m[2] };
      CUTS.push(last); added++;
      return;
    }
    var c = ln.match(/^\*\s*FROM CLIP NAME:\s*(.+)$/i);
    if (c && last) last.name = c[1].trim();
  });
  ripple(); paint();
  return added;
}

/* ---- Build By Storyboard ----
   Reads the storyboard left in this browser by preHUB or proHUB, lays the panels on the
   timeline in scene order, and lets each one be swapped for its shot with a single click.
   Tolerant about shape: frames keyed 'sc0','sc1'... plus scene headings, or an array of
   scenes carrying an image. Anything it cannot find is said plainly, not guessed at. */
var STORY_KEYS = ['prehub_desk_v1', 'prehub_master_v1', 'prohub_staged_payload_v1', 'posthub_staged_payload_v1'];
function jread(k) { try { var r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
function fmt(sec) { var s = Math.round(sec || 0), m = Math.floor(s / 60), r = s % 60; return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r; }

function readShots() {
  for (var i = 0; i < STORY_KEYS.length; i++) {
    var d = jread(STORY_KEYS[i]);
    if (!d) continue;
    var heads = [];
    if (d.lines && d.lines.length) { for (var j = 0; j < d.lines.length; j++) { if (d.lines[j].type === 'SCENE_HEADING') heads.push(d.lines[j].text); } }
    var frames = d.frames || d.panels || null;
    if (frames && typeof frames === 'object' && !(frames instanceof Array)) {
      var keys = Object.keys(frames).filter(function (k) { return /^sc\d+$/.test(k); })
        .sort(function (a, b) { return (parseInt(a.slice(2), 10) - parseInt(b.slice(2), 10)); });
      if (keys.length) {
        return keys.map(function (k) {
          var n = parseInt(k.slice(2), 10);
          return { n: n, heading: heads[n] || ('SCENE ' + (n + 1)), image: frames[k] };
        });
      }
    }
    var arr = d.scenes || d.shots || d.boards || null;
    if (arr && arr.length) {
      return arr.map(function (s, ix) {
        return { n: ix, heading: s.heading || s.slug || s.name || ('SCENE ' + (ix + 1)),
                 image: s.image || s.frame || s.dataUrl || null };
      });
    }
  }
  return [];
}
function buildByStoryboard(force) {
  var shots = readShots();
  if (!shots.length) { POST.toast('No storyboard found in this browser - make one in preHUB or proHUB first', 'bad'); return 0; }
  function lay() {
    CUTS = shots.map(function (s) {
      return { name: s.heading, reel: 'SB', srcIn: 0, srcOut: 5, image: s.image || null, sb: true, scene: s.n, replaced: false };
    });
    SELECTED = -1; ripple(); paint();
    POST.toast(shots.length + ' storyboard panels on the timeline', 'good');
    return shots.length;
  }
  if (CUTS.length && !force) {
    POST.ask({ title: 'Replace the cut list?', icon: 'warn', ok: 'Replace it', cancel: true,
      html: '<p style="margin:0;font-size:14px;color:#B9C4D2">The timeline already has ' + CUTS.length +
            ' cuts. Building from the storyboard will replace them.</p>' }).then(function (r) { if (r) lay(); });
    return -1;
  }
  return lay();
}
function replaceCut(i) {
  var media = (typeof POST.media === 'function') ? POST.media() : [];
  if (!media.length) { POST.toast('Ingest the shots first - the bin is empty', 'bad'); return false; }
  var opts = media.map(function (f, ix) {
    return '<option value="' + ix + '">' + POST.esc(f.name) + '   ' + fmt(f.duration) + '</option>';
  }).join('');
  var cur = CUTS[i] ? CUTS[i].name : '';
  POST.ask({ title: 'Replace with the shot', icon: 'film', ok: 'Replace',
    html: '<label class="fl">Using ' + POST.esc(cur) + '</label><select data-k="clip">' + opts + '</select>' +
          '<p style="margin:10px 0 0;font-size:13px;color:#8794A6">The storyboard panel stays with the cut as a reference frame.</p>' })
  .then(function (r) {
    if (!r) return;
    var f = media[parseInt(r.clip, 10) || 0];
    if (!f) return;
    CUTS[i].name = f.name; CUTS[i].reel = 'AX';
    CUTS[i].srcIn = 0; CUTS[i].srcOut = f.duration || 5;
    CUTS[i].replaced = true;
    ripple(); paint();
    POST.toast('Replaced with ' + f.name, 'good');
  });
  return true;
}

/* ---- the desk ---- */
function style() {
  if (document.getElementById('tlStyle')) return;
  var s = document.createElement('style'); s.id = 'tlStyle';
  s.textContent = '.tlh{position:fixed;inset:0;z-index:500;background:rgba(3,6,12,.94);overflow-y:auto;display:none}' +
    '.tlh.on{display:block}.tlh .box{max-width:1240px;margin:0 auto;background:#0A101B;min-height:100vh}' +
    '@media(min-width:900px){.tlh{padding:30px 16px 60px}.tlh .box{border-radius:12px;min-height:auto;border-top:4px solid #00ABA9}}' +
    '.tlh .hd{display:flex;gap:10px;align-items:flex-start;padding:15px 17px;border-bottom:1px solid #1B2436;background:#0C1320;position:sticky;top:0}' +
    '.tlh .hd h2{font-size:20px;color:#fff}.tlh .hd .k{font-family:var(--fm);font-size:12px;letter-spacing:.15em;color:#00ABA9;text-transform:uppercase}' +
    '.tlh .bd{padding:16px 17px 26px}.tlh table{width:100%;border-collapse:collapse;font-size:13px}' +
    '.tlh th{text-align:left;font-family:var(--fm);font-size:11px;letter-spacing:.1em;color:#8794A6;text-transform:uppercase;border-bottom:1px solid #1B2436;padding:6px 8px}' +
    '.tlh td{border-bottom:1px solid rgba(27,36,54,.6);padding:7px 8px;color:#C6D1DC}' +
    '.tlh td.n{font-family:var(--fm);white-space:nowrap}.tlh tr.sel{background:#12202E}.tlh tr{cursor:pointer}' +
    '.tlh .note{font-size:13px;color:#8794A6;margin:10px 0 0}' +
    '.tlh textarea{width:100%;min-height:150px;font-family:var(--fm);font-size:12px}';
  document.head.appendChild(s);
}
function hub() {
  var h = document.getElementById('posthub-timeline');
  if (h) return h;
  style();
  h = document.createElement('div'); h.className = 'tlh'; h.id = 'posthub-timeline';
  h.innerHTML = '<div class="box"><div class="hd"><div><div class="k">TIMELINE</div><h2>Cut list</h2></div>' +
    '<div style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap">' +
    '<button class="btn sm pri" id="tlAdd">Add cut</button>' +
    '<button class="btn sm" id="tlFromBin">From bin</button>' +
    '<button class="btn sm" id="tlRip">Ripple delete</button>' +
    '<button class="btn sm" id="tlStory">Build By Storyboard</button>' +
    '<button class="btn sm" id="tlEdl">EDL</button>' +
    '<button class="btn sm" id="tlClose">Close</button></div></div>' +
    '<div class="bd"><div id="tlBody"></div></div></div>';
  document.body.appendChild(h);
  h.addEventListener('click', function (e) { if (e.target === h) h.classList.remove('on'); });
  h.querySelector('#tlClose').onclick = function () { h.classList.remove('on'); };
  h.querySelector('#tlAdd').onclick = function () {
    POST.ask({ title: 'Add a cut', icon: 'list', ok: 'Add', fields: [
      { k: 'name', label: 'Clip name', value: '' }, { k: 'reel', label: 'Reel', value: 'AX' },
      { k: 'srcIn', label: 'Source in (HH:MM:SS:FF or seconds)', value: '01:00:00:00' },
      { k: 'srcOut', label: 'Source out', value: '01:00:05:00' } ] }).then(function (r) {
      if (!r) return;
      add({ name: r.name || 'CLIP', reel: (r.reel || 'AX').toUpperCase(), srcIn: parseTc(r.srcIn), srcOut: parseTc(r.srcOut) });
      POST.toast('Cut added', 'good');
    });
  };
  h.querySelector('#tlRip').onclick = function () {
    if (rippleDelete(SELECTED)) POST.toast('Rippled - everything after closed up', 'good');
    else POST.toast('Select a cut first', 'bad');
  };
  h.querySelector('#tlFromBin').onclick = function () {
    var media = (typeof POST.media === 'function') ? POST.media() : [];
    if (!media.length) { POST.toast('The bin is empty - ingest some media first', 'bad'); return; }
    media.forEach(function (f) { add({ name: f.name, reel: 'AX', srcIn: 0, srcOut: f.duration || 5 }); });
    POST.toast(media.length + ' clips added from the bin', 'good');
  };
  h.querySelector('#tlStory').onclick = function () { buildByStoryboard(); };
  h.querySelector('#tlEdl').onclick = function () { openEdl(); };
  return h;
}
function openEdl() {
  POST.ask({ title: 'EDL', icon: 'out', ok: 'Import', cancel: true,
    fields: [{ k: 'edl', label: 'CMX3600 - edit and paste back to import', type: 'textarea', rows: 12, value: edl() }],
    html: '<div style="display:flex;gap:8px;margin-top:6px"><button type="button" class="btn sm" id="edlCopy">Copy EDL</button>' +
          '<button type="button" class="btn sm" id="edlSave">Download .edl</button>' +
          '<span style="font-size:13px;color:#8794A6;align-self:center">' + CUTS.length + ' cuts · ' + tcf(total()) + '</span></div>' })
  .then(function (r) { if (!r) return; var n = importEdl(r.edl); if (n) POST.toast(n + ' cuts imported', 'good'); });
  setTimeout(function () {
    var d = document.querySelector('dialog[open]'); if (!d) return;
    var c = d.querySelector('#edlCopy'), s = d.querySelector('#edlSave');
    if (c) c.onclick = function () { var t = d.querySelector('[data-k="edl"]'); try { navigator.clipboard.writeText(t.value); POST.toast('EDL copied', 'good'); } catch (e) { t.select(); } };
    if (s) s.onclick = function () { var t = d.querySelector('[data-k="edl"]'); POST.dl('sequence.edl', t.value, 'text/plain'); };
  }, 80);
}
function paint() {
  var h = document.getElementById('posthub-timeline'); if (!h) return;
  var b = h.querySelector('#tlBody');
  if (!CUTS.length) { b.innerHTML = '<div class="note">No cuts yet. Add one by hand, pull the bin in, or import an EDL.</div>'; return; }
  var rows = CUTS.map(function (k, i) {
    var thumb = k.image ? '<img src="' + k.image + '" alt="" style="height:34px;border-radius:3px;display:block">' : '<span style="color:#4B5563">-</span>';
    var act = '<button type="button" class="btn xs" data-rep="' + i + '" style="min-height:28px">replace</button>';
    return '<tr data-i="' + i + '"' + (i === SELECTED ? ' class="sel"' : '') + '><td class="n">' + pad(i + 1) + '</td><td>' + thumb + '</td>' +
      '<td>' + POST.esc(k.name) + (k.replaced ? ' <span style="color:#88C13F;font-size:11px">shot</span>' : (k.sb ? ' <span style="color:#E2A93B;font-size:11px">board</span>' : '')) + '</td>' +
      '<td class="n">' + POST.esc(k.reel) + '</td><td class="n">' + tcf(k.srcIn) + '</td><td class="n">' + tcf(k.srcOut) + '</td>' +
      '<td class="n">' + tcf(k.duration) + '</td><td class="n">' + tcf(k.recIn) + '</td><td class="n">' + tcf(k.recOut) + '</td><td>' + act + '</td></tr>';
  }).join('');
  b.innerHTML = '<table><thead><tr><th>#</th><th>Board</th><th>Clip</th><th>Reel</th><th>Src in</th><th>Src out</th><th>Dur</th><th>Rec in</th><th>Rec out</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' +
    '<p class="note">' + CUTS.length + ' cuts · sequence ' + tcf(total()) + ' · ' + FPS + ' fps</p>';
  var reps = b.querySelectorAll('[data-rep]');
  for (var r2 = 0; r2 < reps.length; r2++) reps[r2].onclick = function (ev) { ev.stopPropagation(); replaceCut(parseInt(this.getAttribute('data-rep'), 10)); };
  var trs = b.querySelectorAll('tr[data-i]');
  for (var i = 0; i < trs.length; i++) trs[i].onclick = function () { SELECTED = +this.getAttribute('data-i'); paint(); };
}
function closeOtherDesks() {   /* one desk at a time: a full-screen desk must not trap you */
  var all = document.querySelectorAll('.pgh.on, .tlh.on');
  for (var i = 0; i < all.length; i++) all[i].classList.remove('on');
}
function openDesk() { closeOtherDesks(); var h = hub(); h.classList.add('on'); paint(); }

POST.register({
  id: 'timeline',
  mount: function () {
    hub();
    POST.addTile({ id: 'timeline', title: 'Timeline', sub: 'Cut list · EDL in and out', colour: '#00ABA9', icon: 'list', tag: 'EDIT', run: openDesk });
  },
  state: function () {
    var shots = readShots();
    return { shotsFound: shots.length, boards: CUTS.filter(function (k) { return !!k.sb; }).length,
             replaced: CUTS.filter(function (k) { return !!k.replaced; }).length,
             cuts: CUTS.length, selected: SELECTED, total: Math.round(total() * 100) / 100,
             fps: FPS, sequence: tcf(total()),
             first: CUTS.length ? CUTS[0].name : null, edlLines: edl().split('\n').length };
  }
});
POST.timeline = { add: add, ripple: rippleDelete, buildByStoryboard: buildByStoryboard, replace: replaceCut, shots: readShots, edl: edl, importEdl: importEdl, cuts: function () { return CUTS.slice(); }, total: total, open: openDesk };
