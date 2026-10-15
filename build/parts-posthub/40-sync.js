/* postHUB - sync
   Which cuts have gone to which platform, and when. A delivery matrix, not a guess:
   every tick records a timestamp, and the outstanding column is counted, not asserted.

   Markup is assembled as an array and joined - never spliced into a concatenated
   string. That mistake broke three files on this project. */
var S_KEY = 'posthub_sync_v1';
var PLATFORMS = ['Frame.io', 'Vimeo', 'YouTube', 'Client drive', 'Broadcast'];
var CELLS = {};                      /* 'cutIndex|platform' -> { at: epochMs, by: '' } */

function load() {
  try {
    var r = localStorage.getItem(S_KEY);
    if (r) { var j = JSON.parse(r); if (j.platforms && j.platforms.length) PLATFORMS = j.platforms; CELLS = j.cells || {}; }
  } catch (e) {}
}
function keep() { try { localStorage.setItem(S_KEY, JSON.stringify({ platforms: PLATFORMS, cells: CELLS })); } catch (e) {} }
function cuts() { return (typeof POST.timeline === 'object' && POST.timeline && POST.timeline.cuts) ? POST.timeline.cuts() : []; }
function key(i, p) { return i + '|' + p; }
function isSent(i, p) { return !!CELLS[key(i, p)]; }
function mark(i, p, on) {
  var k = key(i, p);
  if (on) CELLS[k] = { at: Date.now() };
  else delete CELLS[k];
  keep(); paint();
}
function when(ms) {
  if (!ms) return '';
  var d = new Date(ms), p = function (n) { return (n < 10 ? '0' : '') + n; };
  return p(d.getHours()) + ':' + p(d.getMinutes()) + ' ' + p(d.getDate()) + '/' + p(d.getMonth() + 1);
}
function totals() {
  var cs = cuts(), sent = 0, out = {};
  for (var p = 0; p < PLATFORMS.length; p++) out[PLATFORMS[p]] = 0;
  for (var i = 0; i < cs.length; i++) {
    var all = PLATFORMS.length > 0;
    for (var q = 0; q < PLATFORMS.length; q++) {
      if (isSent(i, PLATFORMS[q])) { out[PLATFORMS[q]]++; } else { all = false; }
    }
    if (all) sent++;
  }
  return { cuts: cs.length, everywhere: sent, outstanding: cs.length - sent, per: out };
}
function asText() {
  var cs = cuts(), t = totals(), rows = [];
  rows.push('SYNC - ' + cs.length + ' cuts, ' + t.everywhere + ' delivered everywhere');
  rows.push('');
  rows.push(['Cut'.padEnd(28)].concat(PLATFORMS.map(function (p) { return p; })).join('  '));
  for (var i = 0; i < cs.length; i++) {
    var cells = PLATFORMS.map(function (p) { return isSent(i, p) ? when(CELLS[key(i, p)].at) : '-'; });
    rows.push([(cs[i].name || ('cut ' + (i + 1))).slice(0, 28).padEnd(28)].concat(cells).join('  '));
  }
  return rows.join('\n');
}

function style() {
  if (document.getElementById('syStyle')) return;
  var s = document.createElement('style'); s.id = 'syStyle';
  s.textContent = '.syh{position:fixed;inset:0;z-index:500;background:rgba(3,6,12,.94);overflow-y:auto;display:none}' +
    '.syh.on{display:block}.syh .box{max-width:1240px;margin:0 auto;background:#0A101B;min-height:100vh}' +
    '@media(min-width:900px){.syh{padding:30px 16px 60px}.syh .box{border-radius:12px;min-height:auto;border-top:4px solid #88C13F}}' +
    '.syh .hd{display:flex;gap:10px;align-items:flex-start;padding:15px 17px;border-bottom:1px solid #1B2436;background:#0C1320;position:sticky;top:0}' +
    '.syh .hd h2{font-size:20px;color:#fff}.syh .hd .k{font-family:var(--fm);font-size:12px;letter-spacing:.15em;color:#88C13F;text-transform:uppercase}' +
    '.syh .bd{padding:16px 17px 26px}.syh table{width:100%;border-collapse:collapse;font-size:13px}' +
    '.syh th{text-align:left;font-family:var(--fm);font-size:11px;letter-spacing:.08em;color:#8794A6;text-transform:uppercase;border-bottom:1px solid #1B2436;padding:6px 8px;white-space:nowrap}' +
    '.syh td{border-bottom:1px solid rgba(27,36,54,.6);padding:7px 8px;color:#C6D1DC;vertical-align:top}' +
    '.syh td.n{font-family:var(--fm);white-space:nowrap}.syh .at{display:block;font-family:var(--fm);font-size:11px;color:#88C13F;margin-top:2px}' +
    '.syh .out{font-family:var(--fm);color:#FF9E9E}.syh .all{font-family:var(--fm);color:#88C13F}' +
    '.syh input[type=checkbox]{width:auto;transform:scale(1.15)}.syh .note{font-size:13px;color:#8794A6;margin:10px 0 0}';
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
  var h = document.getElementById('posthub-sync');
  if (h) return h;
  style();
  var bar = deskTabs('sync');
  var rows = [
    '<div class="box">',
      '<div class="hd">',
        '<div><div class="k">SYNC</div><h2>Delivery</h2></div>',
        '<div style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap">',
          '<button class="btn sm pri" id="syPlat">Add platform</button>',
          '<button class="btn sm" id="syCopy">Copy</button>',
          '<button class="btn sm" id="sySave">Download</button>',
          '<button class="btn sm" id="syClose">Close</button>',
        '</div>',
      '</div>',
      bar,
      '<div class="bd"><div id="sySum"></div><div id="syBody"></div></div>',
    '</div>'
  ];
  h = document.createElement('div');
  h.className = 'syh'; h.id = 'posthub-sync';
  h.innerHTML = rows.join('');
  document.body.appendChild(h);
  h.addEventListener('click', function (e) { if (e.target === h) h.classList.remove('on'); });
  h.querySelector('#syClose').onclick = function () { h.classList.remove('on'); };
  h.querySelector('#syCopy').onclick = function () {
    try { navigator.clipboard.writeText(asText()); POST.toast('Delivery matrix copied', 'good'); }
    catch (e) { POST.toast('Could not copy', 'bad'); }
  };
  h.querySelector('#sySave').onclick = function () { POST.dl('postHUB_delivery.txt', asText(), 'text/plain'); };
  h.querySelector('#syPlat').onclick = function () {
    POST.ask({ title: 'Add a platform', icon: 'out', ok: 'Add', fields: [{ k: 'p', label: 'Platform or destination', value: '' }] })
    .then(function (r) {
      if (!r) return;
      var name = String(r.p || '').trim();
      if (!name) return;
      if (PLATFORMS.indexOf(name) >= 0) { POST.toast('Already there', 'bad'); return; }
      PLATFORMS.push(name); keep(); paint(); POST.toast('Added ' + name, 'good');
    });
  };
  bindDeskTabs(h, 'sync');
  return h;
}
function paint() {
  var h = document.getElementById('posthub-sync'); if (!h) return;
  bindDeskTabs(h, 'sync');
  var t = totals(), cs = cuts();
  var sum = h.querySelector('#sySum');
  if (sum) {
    sum.style.cssText = 'display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-bottom:12px;font-family:var(--fm);font-size:13px;color:#8794A6';
    var bits = ['<span class="chip" style="font-family:var(--fm);font-size:12px;border:1px solid #26344E;padding:4px 8px;border-radius:4px">' + t.everywhere + ' of ' + t.cuts + ' delivered everywhere</span>'];
    for (var p = 0; p < PLATFORMS.length; p++) bits.push('<span>' + POST.esc(PLATFORMS[p]) + ' ' + t.per[PLATFORMS[p]] + '</span>');
    sum.innerHTML = bits.join('');
  }
  var b = h.querySelector('#syBody'); if (!b) return;
  if (!cs.length) { b.innerHTML = '<div class="note">No cuts yet. Build the cut list on the timeline - or from the storyboard - and the delivery matrix fills in here.</div>'; return; }
  var head = ['<tr><th>Cut</th>'];
  for (var q = 0; q < PLATFORMS.length; q++) {
    head.push('<th>' + POST.esc(PLATFORMS[q]) +
      ' <button type="button" class="btn sm" data-rmp="' + q + '" style="min-height:24px;padding:2px 6px;font-size:11px">&times;</button></th>');
  }
  head.push('<th>Status</th></tr>');
  var body = [];
  for (var i = 0; i < cs.length; i++) {
    var cells = [], all = PLATFORMS.length > 0, any = false;
    for (var j = 0; j < PLATFORMS.length; j++) {
      var pl = PLATFORMS[j], sent = isSent(i, pl);
      if (sent) any = true; else all = false;
      cells.push('<td><input type="checkbox" data-c="' + i + '|' + POST.esc(pl) + '"' + (sent ? ' checked' : '') + '>' +
        (sent ? '<span class="at">' + when(CELLS[key(i, pl)].at) + '</span>' : '') + '</td>');
    }
    body.push('<tr><td class="n">' + POST.esc(cs[i].name || ('cut ' + (i + 1))) + '</td>' + cells.join('') +
      '<td>' + (all ? '<span class="all">delivered</span>' : (any ? '<span class="n">part sent</span>' : '<span class="out">outstanding</span>')) + '</td></tr>');
  }
  b.innerHTML = '<table><thead>' + head.join('') + '</thead><tbody>' + body.join('') + '</tbody></table>' +
    '<p class="note">A tick records the time it was sent. Unticking clears it. The matrix is part of the project file, so an export carries the delivery record with it.</p>';
  var cbs = b.querySelectorAll('[data-c]');
  for (var k = 0; k < cbs.length; k++) {
    cbs[k].onchange = function () {
      var parts = this.getAttribute('data-c').split('|');
      mark(parseInt(parts[0], 10), parts.slice(1).join('|'), this.checked);
    };
  }
  var rms = b.querySelectorAll('[data-rmp]');
  for (var m = 0; m < rms.length; m++) {
    rms[m].onclick = function () {
      var ix = parseInt(this.getAttribute('data-rmp'), 10), name = PLATFORMS[ix];
      PLATFORMS.splice(ix, 1); keep(); paint(); POST.toast('Removed ' + name, 'bad');
    };
  }
}
function openDesk() {
  var others = document.querySelectorAll('.pgh.on, .tlh.on, .nth.on, .syh.on');
  for (var i = 0; i < others.length; i++) others[i].classList.remove('on');
  var h = hub(); h.classList.add('on'); paint();
}

POST.register({
  id: 'sync',
  mount: function () {
    load();
    hub();
    var DS = POST._desks || (POST._desks = []);
    DS.push({ id: 'sync', label: 'Sync', open: openDesk });
    POST.addTile({ id: 'sync', title: 'Sync', sub: 'Delivery across platforms', colour: '#88C13F', icon: 'out', tag: 'DELIVERY', run: openDesk });
  },
  state: function () {
    var t = totals();
    return { platforms: PLATFORMS.slice(), cuts: t.cuts, deliveredEverywhere: t.everywhere,
             outstanding: t.outstanding, perPlatform: t.per, cells: Object.keys(CELLS).length,
             firstTick: Object.keys(CELLS).length ? when(CELLS[Object.keys(CELLS)[0]].at) : null };
  }
});
POST.sync = { mark: mark, totals: totals, text: asText, platforms: function () { return PLATFORMS.slice(); }, cells: function () { return JSON.parse(JSON.stringify(CELLS)); }, open: openDesk };
