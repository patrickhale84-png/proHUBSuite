/* postHUB - deliverables
   What has to leave the building: the masters, the HDR pass and the social cuts, each with
   its own spec and QC checklist. A deliverable is "ready" when its checks are ticked - counted,
   not asserted.

   Markup is assembled as an array and joined - never spliced into a concatenated string. */
var D_KEY = 'posthub_deliverables_v1';
var DEFAULT_QC = ['Colour checked on a calibrated monitor', 'Audio mix within spec',
                  'Slate, bars and countdown present', 'Textless elements delivered',
                  'File name matches the delivery convention', 'Checksum recorded'];

function defaults() {
  return [
    { id: 'master', name: 'MASTER', spec: 'ProRes 422 HQ · 1920x1080 · 25p · stereo + M&E', qc: DEFAULT_QC.slice(), custom: false },
    { id: 'hdr', name: 'HDR MASTER', spec: 'HDR10 / Dolby Vision · 3840x2160 · 25p · 5.1 + stereo', qc: DEFAULT_QC.slice(), custom: false },
    { id: 'web', name: 'WEB 1080P', spec: 'H.264 high profile · 1920x1080 · AAC 320k · -14 LUFS', qc: DEFAULT_QC.slice(), custom: false },
    { id: 'social', name: 'SOCIAL 9:16', spec: '1080x1920 · burnt-in captions · -14 LUFS', qc: DEFAULT_QC.slice(), custom: false }
  ];
}
var ITEMS = [], SEQ = 1;

function load() {
  try {
    var r = localStorage.getItem(D_KEY);
    if (r) { var j = JSON.parse(r); if (j.items && j.items.length) { ITEMS = j.items; SEQ = j.seq || (ITEMS.length + 1); return; } }
  } catch (e) {}
  ITEMS = defaults();
}
function keep() { try { localStorage.setItem(D_KEY, JSON.stringify({ items: ITEMS, seq: SEQ })); } catch (e) {} }
function ready(it) {
  for (var i = 0; i < it.qc.length; i++) if (!it.qc[i].done) return false;
  return it.qc.length > 0;
}
function totals() {
  var done = 0, total = 0, rdy = 0;
  for (var i = 0; i < ITEMS.length; i++) {
    for (var j = 0; j < ITEMS[i].qc.length; j++) { total++; if (ITEMS[i].qc[j].done) done++; }
    if (ready(ITEMS[i])) rdy++;
  }
  return { items: ITEMS.length, ready: rdy, outstanding: ITEMS.length - rdy, checksDone: done, checksTotal: total };
}
function asText() {
  var t = totals(), out = [];
  out.push('DELIVERABLES - ' + t.ready + ' of ' + t.items + ' ready · ' + t.checksDone + '/' + t.checksTotal + ' QC checks');
  out.push('');
  for (var i = 0; i < ITEMS.length; i++) {
    var it = ITEMS[i];
    out.push((ready(it) ? '[x] ' : '[ ] ') + it.name + '   ' + it.spec);
    for (var j = 0; j < it.qc.length; j++) out.push('     ' + (it.qc[j].done ? '[x]' : '[ ]') + ' ' + it.qc[j].label);
    out.push('');
  }
  return out.join('\n');
}

function style() {
  if (document.getElementById('dvStyle')) return;
  var s = document.createElement('style'); s.id = 'dvStyle';
  s.textContent = '.dvh{position:fixed;inset:0;z-index:500;background:rgba(3,6,12,.94);overflow-y:auto;display:none}' +
    '.dvh.on{display:block}.dvh .box{max-width:1100px;margin:0 auto;background:#0A101B;min-height:100vh}' +
    '@media(min-width:900px){.dvh{padding:30px 16px 60px}.dvh .box{border-radius:12px;min-height:auto;border-top:4px solid #B07CE8}}' +
    '.dvh .hd{display:flex;gap:10px;align-items:flex-start;padding:15px 17px;border-bottom:1px solid #1B2436;background:#0C1320;position:sticky;top:0}' +
    '.dvh .hd h2{font-size:20px;color:#fff}.dvh .hd .k{font-family:var(--fm);font-size:12px;letter-spacing:.15em;color:#B07CE8;text-transform:uppercase}' +
    '.dvh .bd{padding:16px 17px 26px}.dvh .card{border:1px solid #1B2436;border-left:3px solid #B07CE8;border-radius:0 8px 8px 0;background:#0C1320;padding:12px 14px;margin-bottom:12px}' +
    '.dvh .card.ok{border-left-color:#88C13F}.dvh .card .top{display:flex;gap:10px;align-items:center;flex-wrap:wrap}' +
    '.dvh .card .nm{font-family:var(--fd);font-size:18px;text-transform:uppercase;color:#fff}' +
    '.dvh .card .sp{font-family:var(--fm);font-size:12.5px;color:#8794A6;margin-top:3px}' +
    '.dvh .card ul{list-style:none;margin:10px 0 0;padding:0}' +
    '.dvh .card li{display:flex;gap:8px;align-items:flex-start;padding:4px 0;font-size:13.5px;color:#C6D1DC}' +
    '.dvh input[type=checkbox]{width:auto;transform:scale(1.15);margin-top:2px}' +
    '.dvh .pill{font-family:var(--fm);font-size:11px;letter-spacing:.08em;text-transform:uppercase;border:1px solid #26344E;padding:3px 7px;border-radius:99px;color:#8794A6}' +
    '.dvh .pill.ok{color:#88C13F;border-color:#88C13F}.dvh .pill.no{color:#FF9E9E;border-color:#C0392B}' +
    '.dvh .note{font-size:13px;color:#8794A6;margin:10px 0 0}';
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
  var h = document.getElementById('posthub-deliverables');
  if (h) return h;
  style();
  var bar = deskTabs('deliverables');
  var rows = [
    '<div class="box">',
      '<div class="hd">',
        '<div><div class="k">DELIVERABLES</div><h2>What leaves the building</h2></div>',
        '<div style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap">',
          '<button class="btn sm pri" id="dvAdd">Add output</button>',
          '<button class="btn sm" id="dvCopy">Copy sheet</button>',
          '<button class="btn sm" id="dvSave">Download</button>',
          '<button class="btn sm" id="dvClose">Close</button>',
        '</div>',
      '</div>',
      bar,
      '<div class="bd"><div id="dvSum"></div><div id="dvBody"></div></div>',
    '</div>'
  ];
  h = document.createElement('div');
  h.className = 'dvh'; h.id = 'posthub-deliverables';
  h.innerHTML = rows.join('');
  document.body.appendChild(h);
  h.addEventListener('click', function (e) { if (e.target === h) h.classList.remove('on'); });
  h.querySelector('#dvClose').onclick = function () { h.classList.remove('on'); };
  h.querySelector('#dvCopy').onclick = function () {
    try { navigator.clipboard.writeText(asText()); POST.toast('Delivery sheet copied', 'good'); }
    catch (e) { POST.toast('Could not copy', 'bad'); }
  };
  h.querySelector('#dvSave').onclick = function () { POST.dl('postHUB_deliverables.txt', asText(), 'text/plain'); };
  h.querySelector('#dvAdd').onclick = function () {
    POST.ask({ title: 'Add an output', icon: 'out', ok: 'Add',
      fields: [{ k: 'name', label: 'Name', value: '' }, { k: 'spec', label: 'Spec', value: '' }] })
    .then(function (r) {
      if (!r || !String(r.name || '').trim()) return;
      ITEMS.push({ id: 'out-' + (SEQ++), name: String(r.name).trim().toUpperCase(), spec: String(r.spec || '').trim(),
                   qc: DEFAULT_QC.map(function (l) { return { label: l, done: false }; }), custom: true });
      keep(); paint(); POST.toast('Output added', 'good');
    });
  };
  bindDeskTabs(h, 'deliverables');
  return h;
}
function paint() {
  var h = document.getElementById('posthub-deliverables'); if (!h) return;
  bindDeskTabs(h, 'deliverables');
  var t = totals(), sum = h.querySelector('#dvSum');
  if (sum) {
    sum.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px;font-family:var(--fm);font-size:13px;color:#8794A6';
    sum.innerHTML = '<span class="pill ' + (t.outstanding ? 'no' : 'ok') + '">' + t.ready + ' of ' + t.items + ' ready</span>' +
      '<span>' + t.checksDone + '/' + t.checksTotal + ' QC checks ticked</span>';
  }
  var b = h.querySelector('#dvBody'); if (!b) return;
  var out = [];
  for (var i = 0; i < ITEMS.length; i++) {
    var it = ITEMS[i], ok = ready(it), done = 0;
    for (var q = 0; q < it.qc.length; q++) if (it.qc[q].done) done++;
    out.push('<div class="card' + (ok ? ' ok' : '') + '">',
      '<div class="top"><span class="nm">' + POST.esc(it.name) + '</span>',
      '<span class="pill ' + (ok ? 'ok' : 'no') + '">' + (ok ? 'ready' : (done + '/' + it.qc.length + ' checked')) + '</span>',
      '<span style="margin-left:auto"></span>',
      '<button type="button" class="btn sm" data-edit="' + it.id + '">spec</button>',
      (it.custom ? '<button type="button" class="btn sm" data-del="' + it.id + '">remove</button>' : ''),
      '</div>',
      '<div class="sp">' + POST.esc(it.spec || 'no spec set') + '</div>',
      '<ul>');
    for (var j = 0; j < it.qc.length; j++) {
      out.push('<li><input type="checkbox" data-q="' + it.id + '|' + j + '"' + (it.qc[j].done ? ' checked' : '') +
        '><span>' + POST.esc(it.qc[j].label) + '</span></li>');
    }
    out.push('</ul></div>');
  }
  out.push('<p class="note">A deliverable counts as ready only when every check is ticked. The sheet exports as text for the delivery email, and travels with the project file.</p>');
  b.innerHTML = out.join('');
  var qs = b.querySelectorAll('[data-q]');
  for (var k = 0; k < qs.length; k++) {
    qs[k].onchange = function () {
      var p = this.getAttribute('data-q').split('|'), id = p[0], ix = parseInt(p[1], 10);
      for (var m = 0; m < ITEMS.length; m++) if (ITEMS[m].id === id) { ITEMS[m].qc[ix].done = this.checked; break; }
      keep(); paint();
    };
  }
  var es = b.querySelectorAll('[data-edit]');
  for (var e = 0; e < es.length; e++) {
    es[e].onclick = function () {
      var id = this.getAttribute('data-edit'), it = null, n = 0;
      for (var m = 0; m < ITEMS.length; m++) if (ITEMS[m].id === id) { it = ITEMS[m]; n = m; }
      if (!it) return;
      POST.ask({ title: 'Spec - ' + it.name, icon: 'out', ok: 'Save',
        fields: [{ k: 'spec', label: 'Delivery spec', type: 'textarea', rows: 3, value: it.spec }] })
      .then(function (r) { if (!r) return; ITEMS[n].spec = r.spec || ''; keep(); paint(); POST.toast('Spec saved', 'good'); });
    };
  }
  var ds = b.querySelectorAll('[data-del]');
  for (var d = 0; d < ds.length; d++) {
    ds[d].onclick = function () {
      var id = this.getAttribute('data-del');
      ITEMS = ITEMS.filter(function (x) { return x.id !== id; });
      keep(); paint(); POST.toast('Output removed', 'bad');
    };
  }
}
function openDesk() {
  var others = document.querySelectorAll('.pgh.on, .tlh.on, .nth.on, .syh.on, .dvh.on');
  for (var i = 0; i < others.length; i++) others[i].classList.remove('on');
  var h = hub(); h.classList.add('on'); paint();
}

POST.register({
  id: 'deliverables',
  mount: function () {
    load();
    hub();
    var DS = POST._desks || (POST._desks = []);
    DS.push({ id: 'deliverables', label: 'Deliverables', open: openDesk });
    POST.addTile({ id: 'deliverables', title: 'Deliverables', sub: 'Masters, HDR, social · QC', colour: '#B07CE8', icon: 'out', tag: 'OUTPUT', run: openDesk });
  },
  state: function () {
    var t = totals();
    return { items: t.items, ready: t.ready, outstanding: t.outstanding,
             checksDone: t.checksDone, checksTotal: t.checksTotal,
             list: ITEMS.map(function (i) { return { name: i.name, ready: ready(i) }; }) };
  }
});
POST.deliverables = { totals: totals, text: asText, list: function () { return JSON.parse(JSON.stringify(ITEMS)); }, open: openDesk };
