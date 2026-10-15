/* filmHUB - tile manager
   Owns layout, never the tiles themselves. It re-adds existing tiles through FILM.addTile()
   in the order you choose, so it needs no hook inside the shell: the public API is enough.

   Keeps: custom tiles, their order, per-tile size, and named presets - all in localStorage. */
var T_KEY = 'filmhub_tiles_v1', L_KEY = 'filmhub_layout_v1', P_KEY = 'filmhub_presets_v1';
var SIZE_STEPS = [[1,1],[2,1],[2,2],[1,2]];
var custom = [], layout = { order: [], size: {} }, presets = {}, mo = null;

function jread(k, d) { try { var r = localStorage.getItem(k); return r ? JSON.parse(r) : d; } catch (e) { return d; } }
function jwrite(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
function loadAll() {
  custom = jread(T_KEY, []); if (!(custom instanceof Array)) custom = [];
  layout = jread(L_KEY, { order: [], size: {} });
  if (!layout.order) layout.order = []; if (!layout.size) layout.size = {};
  presets = jread(P_KEY, {}); if (!presets || typeof presets !== 'object') presets = {};
}
function saveAll() { jwrite(T_KEY, custom); jwrite(L_KEY, layout); jwrite(P_KEY, presets); }
function embed() { try { return window.self !== window.top; } catch (e) { return true; } }

function openUrl(u) {
  if (!u) return;
  if (typeof FILM.toast === 'function') FILM.toast('Opening…');
  if (embed()) {
    var w = null; try { w = window.open(u, '_blank'); } catch (e) { w = null; }
    if (w) return;
    try { window.top.location.href = u; return; } catch (e) { /* cross-origin */ }
  }
  try { location.href = u; } catch (e) { if (typeof FILM.toast === 'function') FILM.toast('Could not open that link', 'bad'); }
}
function toTile(t) { return { id: t.id, title: t.title, sub: t.sub, colour: t.colour, icon: t.icon || 'grid', tag: t.tag || 'MINE',
                              run: function () { openUrl(t.url); } }; }
function managerTile() {
  return { id: 'tile-manager', title: 'Tile manager', sub: 'Add · reorder · size · presets', colour: '#E2A93B',
           icon: 'grid', tag: 'DESK', run: openManager };
}

/* ---- layout: rebuild the grid in the stored order, then apply sizes ---- */
function allTiles() {
  var list = custom.map(toTile);
  FILM.tiles().forEach(function (t) {
    if (t.id.indexOf('custom-') === 0 || t.id === 'tile-manager') return;
    list.push(t);
  });
  list.push(managerTile());
  return list;
}
function applyLayout() {
  var list = allTiles(), byId = {};
  list.forEach(function (t) { byId[t.id] = t; });
  var order = (layout.order || []).filter(function (id) { return !!byId[id]; });
  list.forEach(function (t) { if (order.indexOf(t.id) < 0) order.push(t.id); });
  layout.order = order;
  order.forEach(function (id) { FILM.addTile(byId[id]); });
  saveAll(); applySizes();
}

/* ---- sizes and drag, applied to the DOM the shell just rendered ---- */
function applySizes() {
  var host = document.getElementById('tiles'); if (!host) return;
  var tiles = host.querySelectorAll('.tile[data-tile]');
  for (var i = 0; i < tiles.length; i++) {
    var el = tiles[i], id = el.getAttribute('data-tile'), s = layout.size[id] || [1, 1];
    el.style.gridColumn = 'span ' + s[0];
    el.style.gridRow = 'span ' + s[1];
    el.setAttribute('draggable', 'true');
    bindDrag(el, id);
  }
}
function bindDrag(el, id) {
  if (el._dragBound) return;
  el._dragBound = true;
  el.addEventListener('dragstart', function (ev) {
    try { ev.dataTransfer.setData('text/plain', id); ev.dataTransfer.effectAllowed = 'move'; } catch (e) {}
  });
  el.addEventListener('dragover', function (ev) { ev.preventDefault(); });
  el.addEventListener('drop', function (ev) {
    ev.preventDefault();
    var from = ''; try { from = ev.dataTransfer.getData('text/plain'); } catch (e) {}
    if (!from || from === id) return;
    moveBefore(from, id);
  });
}
function moveBefore(fromId, toId) {
  var o = (layout.order || []).slice();
  var i = o.indexOf(fromId), j = o.indexOf(toId);
  if (i < 0 || j < 0) return;
  o.splice(i, 1); o.splice(j, 0, fromId);
  layout.order = o; saveAll(); applyLayout();
  if (typeof FILM.toast === 'function') FILM.toast('Reordered', 'good');
}
function nudge(id, dir) {
  var o = (layout.order || []).slice(), i = o.indexOf(id);
  if (i < 0) return;
  var j = i + dir; if (j < 0 || j >= o.length) return;
  var t = o[i]; o[i] = o[j]; o[j] = t;
  layout.order = o; saveAll(); applyLayout();
}
function cycleSize(id) {
  var cur = layout.size[id] || [1, 1], at = 0;
  for (var i = 0; i < SIZE_STEPS.length; i++) { if (SIZE_STEPS[i][0] === cur[0] && SIZE_STEPS[i][1] === cur[1]) { at = i; break; } }
  layout.size[id] = SIZE_STEPS[(at + 1) % SIZE_STEPS.length];
  saveAll(); applySizes();
}

/* ---- the manager panel ---- */
function listHtml() {
  var list = allTiles(), out = [];
  for (var i = 0; i < list.length; i++) {
    var t = list[i], s = layout.size[t.id] || [1, 1];
    var mine = t.id.indexOf('custom-') === 0;
    out.push('<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #1B2436">' +
      '<span style="flex:1;font-size:14px">' + FILM.esc(t.title) +
      ' <span style="color:#8794A6;font-size:12px">' + s[0] + '&times;' + s[1] + '</span></span>' +
      '<button type="button" class="btn sm" data-up="' + t.id + '">&uarr;</button>' +
      '<button type="button" class="btn sm" data-dn="' + t.id + '">&darr;</button>' +
      '<button type="button" class="btn sm" data-sz="' + t.id + '">size</button>' +
      (mine ? '<button type="button" class="btn sm" data-rm="' + t.id + '">remove</button>' : '') +
      '</div>');
  }
  return out.join('');
}
function presetHtml() {
  var names = Object.keys(presets);
  if (!names.length) return '<p style="margin:0;font-size:13px;color:#8794A6">No presets saved.</p>';
  return names.map(function (n) {
    return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1B2436">' +
      '<span style="flex:1;font-size:14px">' + FILM.esc(n) + '</span>' +
      '<button type="button" class="btn sm" data-pl="' + FILM.esc(n) + '">load</button>' +
      '<button type="button" class="btn sm" data-pd="' + FILM.esc(n) + '">delete</button></div>';
  }).join('');
}
function managerHtml() {
  return '<label class="fl">Layout</label><div id="tmLayout">' + listHtml() + '</div>' +
    '<p style="margin:8px 0 14px;font-size:13px;color:#8794A6">Drag a tile to reorder, or use the arrows - which also work on a phone.</p>' +
    '<label class="fl">Add a tile</label>' +
    '<div style="display:grid;gap:8px;margin-bottom:8px">' +
    '<input data-k="title" placeholder="Tile name (e.g. Dailies drive)">' +
    '<input data-k="sub" placeholder="Sub-line (e.g. production server)">' +
    '<input data-k="url" placeholder="Link it opens (https://... or a file name)">' +
    '<div style="display:flex;gap:8px;align-items:center"><input data-k="colour" value="#00ABA9" style="width:110px">' +
    '<span style="font-size:13px;color:#8794A6">colour</span></div></div>' +
    '<button type="button" class="btn sm" id="addTileBtn">Add tile</button>' +
    '<label class="fl" style="margin-top:16px">Presets</label><div id="tmPresets">' + presetHtml() + '</div>' +
    '<div style="display:flex;gap:8px;margin-top:8px"><input data-k="preset" placeholder="Preset name">' +
    '<button type="button" class="btn sm" id="savePreset">Save preset</button></div>';
}

/* ONE dialog, always. refresh() rewrites the two list containers in place and rebinds
   with onclick - assignment, not addEventListener - so handlers can never stack and a
   second dialog can never open on top of the first. The add-tile form is deliberately
   outside those containers so anything typed survives a reorder. */
function bind(d) {
  var i, n;
  function wire(attr, fn) {
    n = d.querySelectorAll('[' + attr + ']');
    for (i = 0; i < n.length; i++) n[i].onclick = fn;
  }
  wire('data-up', function () { nudge(this.getAttribute('data-up'), -1); refresh(d); });
  wire('data-dn', function () { nudge(this.getAttribute('data-dn'), 1); refresh(d); });
  wire('data-sz', function () { cycleSize(this.getAttribute('data-sz')); refresh(d); });
  wire('data-rm', function () {
    var id = this.getAttribute('data-rm');
    custom = custom.filter(function (t) { return t.id !== id; });
    layout.order = layout.order.filter(function (x) { return x !== id; });
    FILM.removeTile(id); saveAll(); applyLayout(); refresh(d);
  });
  wire('data-pl', function () { applyPreset(this.getAttribute('data-pl')); refresh(d); });
  wire('data-pd', function () { delete presets[this.getAttribute('data-pd')]; saveAll(); refresh(d); });

  var add = d.querySelector('#addTileBtn');
  if (add) add.onclick = function () {
    var q = function (k) { var e = d.querySelector('[data-k="' + k + '"]'); return e ? e.value.trim() : ''; };
    var title = q('title'), url = q('url');
    if (!title) { FILM.toast('A tile needs a name', 'bad'); return; }
    var id = 'custom-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24) + '-' + Date.now().toString(36).slice(-4);
    custom.push({ id: id, title: title.toUpperCase(), sub: q('sub') || 'your tile', url: url, colour: q('colour') || '#00ABA9', tag: 'MINE' });
    layout.order.push(id); saveAll(); applyLayout(); refresh(d);
    FILM.toast('Tile added', 'good');
  };
  var sp = d.querySelector('#savePreset');
  if (sp) sp.onclick = function () {
    var e = d.querySelector('[data-k="preset"]'), name = e ? e.value.trim() : '';
    if (!name) { FILM.toast('Name the preset first', 'bad'); return; }
    presets[name] = { order: layout.order.slice(), size: JSON.parse(JSON.stringify(layout.size)), tiles: JSON.parse(JSON.stringify(custom)) };
    saveAll(); refresh(d); FILM.toast('Preset "' + name + '" saved', 'good');
  };
}

function openManager() {
  FILM.ask({ title: 'Tile manager', icon: 'grid', ok: 'Close', cancel: false, html: managerHtml() }).then(function () {});
  setTimeout(function () { var d = document.querySelector('dialog[open]'); if (d) bind(d); }, 80);
}

function refresh(d) {
  if (!d) d = document.querySelector('dialog[open]');
  if (!d) return;
  var l = document.getElementById('tmLayout'); if (l) l.innerHTML = listHtml();
  var p = document.getElementById('tmPresets'); if (p) p.innerHTML = presetHtml();
  bind(d);
}

function applyPreset(name) {
  var p = presets[name]; if (!p) return;
  layout.order = (p.order || []).slice();
  layout.size = p.size || {};
  custom = JSON.parse(JSON.stringify(p.tiles || []));
  saveAll(); applyLayout();
  if (typeof FILM.toast === 'function') FILM.toast('Preset "' + name + '" loaded', 'good');
}
FILM.register({
  id: 'tiles',
  mount: function () {
    loadAll();
    applyLayout();
    var host = document.getElementById('tiles');
    if (host && typeof MutationObserver === 'function') {
      if (mo) mo.disconnect();
      mo = new MutationObserver(function () { applySizes(); });
      mo.observe(host, { childList: true });
    }
  },
  state: function () {
    return { custom: custom.length, order: (layout.order || []).slice(),
             sizes: JSON.parse(JSON.stringify(layout.size)), presets: Object.keys(presets) };
  }
});
/* public operations, so the lifecycle can be exercised without clicking the dialog.
   addCustom does exactly what the Add tile button does; nudge, cycleSize and applyPreset
   are the very functions the arrow, size and preset buttons call. */
FILM.tileOps = {
  layout: function () { return JSON.parse(JSON.stringify(layout)); },
  addCustom: function (title, sub, url, colour) {
    if (!title) return null;
    var id = 'custom-' + String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24) + '-' + Date.now().toString(36).slice(-4);
    custom.push({ id: id, title: String(title).toUpperCase(), sub: sub || 'your tile', url: url || '', colour: colour || '#00ABA9', tag: 'MINE' });
    layout.order.push(id); saveAll(); applyLayout();
    return id;
  },
  removeCustom: function (id) {
    custom = custom.filter(function (t) { return t.id !== id; });
    layout.order = layout.order.filter(function (x) { return x !== id; });
    FILM.removeTile(id); saveAll(); applyLayout(); return true;
  },
  nudge: nudge,
  cycleSize: cycleSize,
  applyPreset: applyPreset,
  order: function () { return (layout.order || []).slice(); },
  sizeOf: function (id) { return (layout.size[id] || [1, 1]).slice(); },
  presetNames: function () { return Object.keys(presets); },
  savePreset: function (name) {
    if (!name) return false;
    presets[name] = { order: layout.order.slice(), size: JSON.parse(JSON.stringify(layout.size)), tiles: JSON.parse(JSON.stringify(custom)) };
    saveAll(); return true;
  }
};
FILM.openTileManager = openManager;
