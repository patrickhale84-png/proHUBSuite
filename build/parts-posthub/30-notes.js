/* postHUB - notes
   Timecoded annotations against the cut list: what to fix, where, and whether it is done.
   A contributor like the others - it registers on POST._desks and draws its own tab.

   Markup is assembled as an array and joined, never built by splicing into a
   concatenated string. That mistake broke three files on this project. */
var N_KEY = 'posthub_notes_v1';
var NOTES = [], FILTER = 'all', SEQ = 1;

function pad2(n) { return (n < 10 ? '0' : '') + n; }
function tcf(sec) {
  sec = sec || 0;
  var f = Math.round((sec - Math.floor(sec)) * 25), s = Math.floor(sec) % 60, m = Math.floor(sec / 60) % 60, h = Math.floor(sec / 3600);
  return pad2(h) + ':' + pad2(m) + ':' + pad2(s) + ':' + pad2(f);
}
function parseTc(t) {
  if (t == null || t === '') return 0;
  var p = String(t).trim().split(':');
  if (p.length === 1) return parseFloat(p[0]) || 0;
  var f = parseFloat(p[p.length - 1]) || 0, s = parseFloat(p[p.length - 2]) || 0, m = parseFloat(p[p.length - 3]) || 0, h = parseFloat(p[p.length - 4]) || 0;
  return h * 3600 + m * 60 + s + f / 25;
}
function load() {
  try { var r = localStorage.getItem(N_KEY); if (r) { var j = JSON.parse(r); NOTES = j.notes || []; SEQ = j.seq || (NOTES.length + 1); } } catch (e) {}
}
function keep() {
  try { localStorage.setItem(N_KEY, JSON.stringify({ notes: NOTES, seq: SEQ })); } catch (e) {}
}
function cuts() { return (typeof POST.timeline === 'object' && POST.timeline && POST.timeline.cuts) ? POST.timeline.cuts() : []; }
function cutName(i) { var cs = cuts(); return (cs[i] && cs[i].name) || 'cut ' + (i + 1); }
function cutAt(i) { var cs = cuts(); return cs[i] ? cs[i].recIn : 0; }

function addNote(n) {
  n = n || {};
  NOTES.push({
    id: SEQ++, at: +n.at || 0, cut: (n.cut == null ? -1 : n.cut), cutName: (n.cutName || ''),
    text: n.text || '', status: 'open', ts: Date.now(), author: n.author || ''
  });
  keep(); paint();
  return NOTES.length;
}
function toggle(id) {
  for (var i = 0; i < NOTES.length; i++) if (NOTES[i].id === id) { NOTES[i].status = NOTES[i].status === 'open' ? 'resolved' : 'open'; break; }
  keep(); paint();
}
function remove(id) {
  var before = NOTES.length;
  NOTES = NOTES.filter(function (n) { return n.id !== id; });
  if (NOTES.length !== before) { keep(); paint(); }
}
function visible() {
  return NOTES.filter(function (n) {
    if (FILTER === 'open') return n.status === 'open';
    if (FILTER === 'resolved') return n.status === 'resolved';
    return true;
  }).sort(function (a, b) { return a.at - b.at; });
}
function asText() {
  if (!NOTES.length) return 'No notes.';
  return visible().map(function (n) {
    return tcf(n.at) + '  [' + (n.status === 'open' ? 'open' : 'done') + ']  ' + (n.cutName || '') + '\n   ' + n.text;
  }).join('\n');
}

function style() {
  if (document.getElementById('ntStyle')) return;
  var s = document.createElement('style'); s.id = 'ntStyle';
  s.textContent = '.nth{position:fixed;inset:0;z-index:500;background:rgba(3,6,12,.94);overflow-y:auto;display:none}' +
    '.nth.on{display:block}.nth .box{max-width:1100px;margin:0 auto;background:#0A101B;min-height:100vh}' +
    '@media(min-width:900px){.nth{padding:30px 16px 60px}.nth .box{border-radius:12px;min-height:auto;border-top:4px solid #E2A93B}}' +
    '.nth .hd{display:flex;gap:10px;align-items:flex-start;padding:15px 17px;border-bottom:1px solid #1B2436;background:#0C1320;position:sticky;top:0}' +
    '.nth .hd h2{font-size:20px;color:#fff}.nth .hd .k{font-family:var(--fm);font-size:12px;letter-spacing:.15em;color:#E2A93B;text-transform:uppercase}' +
    '.nth .bd{padding:16px 17px 26px}.nth .noteitem{display:flex;gap:12px;padding:11px 0;border-bottom:1px solid rgba(27,36,54,.7)}' +
    '.nth .noteitem .t{font-family:var(--fm);font-size:13px;color:#E2A93B;white-space:nowrap;min-width:96px}' +
    '.nth .noteitem .x{flex:1}.nth .noteitem .m{font-size:13px;color:#C6D1DC}.nth .noteitem .c{font-size:12px;color:#8794A6;font-family:var(--fm);margin-top:3px}' +
    '.nth .done .m{color:#7C8A9C;text-decoration:line-through}' +
    '.nth .note{font-size:13px;color:#8794A6;margin:10px 0 0}.nth .fl{display:block;font-family:var(--fm);font-size:12px;color:#8794A6;margin-bottom:4px}';
  document.head.appendChild(s);
}
function deskTabs(current) {
  var desks = POST._desks || [], out = [];
  for (var i = 0; i < desks.length; i++) {
    var d = desks[i], on = (d.id === current);
    out.push('<button type="button" class="btn sm" data-desk="' + d.id + '"' + (on ? ' style="border-color:#E2A93B;color:#fff"' : '') + '>' + POST.esc(d.label) + '</button>');
  }
  return '<div style="display:flex;gap:6px;padding:8px 17px;border-bottom:1px solid #1B2436;background:#0A0F1A;flex-wrap:wrap">' +
         (out.length ? out.join('') : '<span style="font-size:13px;color:#8794A6">No other desks yet</span>') + '</div>';
}
function bindDeskTabs(root, current) {
  var bs = root.querySelectorAll('[data-desk]');
  for (var i = 0; i < bs.length; i++) {
    var on = bs[i].getAttribute('data-desk') === current;
    bs[i].style.borderColor = on ? '#E2A93B' : '';
    bs[i].style.color = on ? '#fff' : '';
    bs[i].onclick = function () {
      var id = this.getAttribute('data-desk'), desks = POST._desks || [];
      for (var j = 0; j < desks.length; j++) { if (desks[j].id === id) { desks[j].open(); return; } }
    };
  }
}

function hub() {
  var h = document.getElementById('posthub-notes');
  if (h) return h;
  style();
  var bar = deskTabs('notes');
  var rows = [
    '<div class="box">',
      '<div class="hd">',
        '<div><div class="k">NOTES</div><h2>Cut notes</h2></div>',
        '<div style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap">',
          '<button class="btn sm pri" id="ntAdd">Add note</button>',
          '<button class="btn sm" id="ntCopy">Copy</button>',
          '<button class="btn sm" id="ntSave">Download</button>',
          '<button class="btn sm" id="ntClose">Close</button>',
        '</div>',
      '</div>',
      bar,
      '<div class="bd"><div id="ntBar"></div><div id="ntBody"></div></div>',
    '</div>'
  ];
  h = document.createElement('div');
  h.className = 'nth'; h.id = 'posthub-notes';
  h.innerHTML = rows.join('');
  document.body.appendChild(h);
  h.addEventListener('click', function (e) { if (e.target === h) h.classList.remove('on'); });
  h.querySelector('#ntClose').onclick = function () { h.classList.remove('on'); };
  h.querySelector('#ntAdd').onclick = openAdd;
  h.querySelector('#ntCopy').onclick = function () {
    try { navigator.clipboard.writeText(asText()); POST.toast('Notes copied', 'good'); }
    catch (e) { POST.toast('Could not copy', 'bad'); }
  };
  h.querySelector('#ntSave').onclick = function () { POST.dl('postHUB_notes.txt', asText(), 'text/plain'); };
  bindDeskTabs(h, 'notes');
  return h;
}
function openAdd() {
  var cs = cuts();
  var opts = ['<option value="-1">Whole sequence</option>'].concat(cs.map(function (k, i) {
    return '<option value="' + i + '">' + POST.esc(k.name) + '   at ' + tcf(k.recIn) + '</option>';
  })).join('');
  var fieldLabel = '<label class="fl">Against</label><select data-k="cut">' + opts + '</select>';
  var timeLabel = '<label class="fl" style="margin-top:10px">Timestamp (HH:MM:SS:FF, blank uses the cut)</label><input data-k="at" placeholder="' + tcf(0) + '">';
  POST.ask({
    title: 'Add a note', icon: 'note', ok: 'Add',
    html: fieldLabel + timeLabel,
    fields: [{ k: 'text', label: 'Note', type: 'textarea', rows: 4, value: '' }]
  }).then(function (r) {
    if (!r || !String(r.text || '').trim()) return;
    var ci = parseInt(r.cut, 10);
    if (isNaN(ci)) ci = -1;
    var at = String(r.at || '').trim() ? parseTc(r.at) : (ci >= 0 ? cutAt(ci) : 0);
    addNote({ at: at, cut: ci, cutName: ci >= 0 ? cutName(ci) : 'sequence', text: String(r.text).trim() });
    POST.toast('Note added', 'good');
  });
}
function paint() {
  var h = document.getElementById('posthub-notes'); if (!h) return;
  bindDeskTabs(h, 'notes');
  var bar = h.querySelector('#ntBar');
  if (bar) {
    var open = NOTES.filter(function (n) { return n.status === 'open'; }).length;
    var chip = function (id, label) {
      var on = FILTER === id;
      return '<button type="button" class="btn sm" data-f="' + id + '"' + (on ? ' style="border-color:#E2A93B;color:#fff"' : '') + '>' + label + '</button>';
    };
    bar.style.cssText = 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:12px';
    bar.innerHTML = chip('all', 'All ' + NOTES.length) + chip('open', 'Open ' + open) + chip('resolved', 'Done ' + (NOTES.length - open)) +
      '<span style="margin-left:auto;font-size:13px;color:#8794A6">' + visible().length + ' shown</span>';
    var fs = bar.querySelectorAll('[data-f]');
    for (var i = 0; i < fs.length; i++) fs[i].onclick = function () { FILTER = this.getAttribute('data-f'); paint(); };
  }
  var b = h.querySelector('#ntBody'); if (!b) return;
  var list = visible();
  if (!list.length) {
    b.innerHTML = '<div class="note">No notes yet' + (NOTES.length ? ' under this filter' : '') + '. Add one against a cut and it will show with its timestamp.</div>';
    return;
  }
  var out = [];
  for (var j = 0; j < list.length; j++) {
    var n = list[j], done = n.status === 'resolved';
    out.push('<div class="noteitem' + (done ? ' done' : '') + '" data-id="' + n.id + '">' +
      '<div class="t">' + tcf(n.at) + '</div>' +
      '<div class="x"><div class="m">' + POST.esc(n.text) + '</div>' +
      '<div class="c">' + POST.esc(n.cutName || '') + ' · ' + (done ? 'done' : 'open') + '</div></div>' +
      '<div style="display:flex;gap:6px;align-items:flex-start">' +
      '<button type="button" class="btn sm" data-t="' + n.id + '">' + (done ? 'reopen' : 'done') + '</button>' +
      '<button type="button" class="btn sm" data-x="' + n.id + '">delete</button></div></div>');
  }
  b.innerHTML = out.join('');
  var ts = b.querySelectorAll('[data-t]'), xs = b.querySelectorAll('[data-x]');
  for (var k = 0; k < ts.length; k++) ts[k].onclick = function () { toggle(parseInt(this.getAttribute('data-t'), 10)); };
  for (var m = 0; m < xs.length; m++) xs[m].onclick = function () { remove(parseInt(this.getAttribute('data-x'), 10)); };
}
function openDesk() {
  var others = document.querySelectorAll('.pgh.on, .tlh.on, .nth.on');
  for (var i = 0; i < others.length; i++) others[i].classList.remove('on');
  var h = hub(); h.classList.add('on'); paint();
}

POST.register({
  id: 'notes',
  mount: function () {
    load();
    hub();
    var DS = POST._desks || (POST._desks = []);
    DS.push({ id: 'notes', label: 'Notes', open: openDesk });
    POST.addTile({ id: 'notes', title: 'Notes', sub: 'Timecoded annotations', colour: '#E2A93B', icon: 'note', tag: 'NOTES', run: openDesk });
  },
  state: function () {
    return { notes: NOTES.length,
             open: NOTES.filter(function (n) { return n.status === 'open'; }).length,
             resolved: NOTES.filter(function (n) { return n.status === 'resolved'; }).length,
             filter: FILTER, cutsAvailable: cuts().length,
             first: NOTES.length ? (tcf(NOTES[0].at) + ' ' + NOTES[0].text.slice(0, 24)) : null };
  }
});
POST.notes = { add: addNote, toggle: toggle, remove: remove, list: function () { return NOTES.slice(); }, text: asText, open: openDesk };
