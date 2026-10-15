/* filmHUB - add-ons
   A role sets the starting grid. This lets anyone pull a module in that their role did not
   include - a 1st AD who also needs the pitch deck, a director who wants the call sheet - and
   it stays put when the role changes. */
var EX_KEY = 'filmhub_extras_v1';
function eread() { try { var r = localStorage.getItem(EX_KEY); var a = r ? JSON.parse(r) : []; return a instanceof Array ? a : []; } catch (e) { return []; } }
function ewrite(a) { try { localStorage.setItem(EX_KEY, JSON.stringify(a)); return true; } catch (e) { return false; } }
function ids() { return eread(); }
function tileFrom(cat) {
  return { id: cat.id, title: cat.title, sub: cat.sub + ' · added', colour: cat.colour, icon: cat.icon, tag: 'EXTRA',
           run: function () { var u = cat.url, emb = false; try { emb = window.self !== window.top; } catch (e) { emb = true; }
             if (emb) { var w = null; try { w = window.open(u, '_blank'); } catch (e) { w = null; } if (w) return;
                        try { window.top.location.href = u; return; } catch (e) {} }
             try { location.href = u; } catch (e) {} } };
}
function add(id) {
  if (typeof FILM.roleTileById !== 'function') return false;
  var cat = FILM.roleTileById(id);
  if (!cat) return false;
  var list = ids();
  if (list.indexOf(id) < 0) { list.push(id); ewrite(list); }
  FILM.addTile(tileFrom(cat));
  if (typeof FILM.toast === 'function') FILM.toast(cat.title + ' added to your desk', 'good');
  return true;
}
function remove(id) {
  ewrite(ids().filter(function (x) { return x !== id; }));
  FILM.removeTile(id);
  if (typeof FILM.toast === 'function') FILM.toast('Removed', 'bad');
  return true;
}
function reapply() { var list = ids(); for (var i = 0; i < list.length; i++) { if (typeof FILM.roleTileById === 'function') { var cat = FILM.roleTileById(list[i]); if (cat) FILM.addTile(tileFrom(cat)); } } }
function picker() {
  var cat = (typeof FILM.catalogue === 'function') ? FILM.catalogue() : [];
  var on = ids(), rows = [];
  for (var i = 0; i < cat.length; i++) {
    var t = cat[i], here = on.indexOf(t.id) >= 0, fromRole = (typeof FILM.state === 'function' && FILM.state().modules.roles && FILM.state().modules.roles.role) ? t.roles.join(', ') : t.roles.join(', ');
    rows.push('<div style="display:flex;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid #1B2436">' +
      '<span style="width:8px;height:8px;border-radius:50%;background:' + t.colour + ';flex:0 0 auto"></span>' +
      '<span style="flex:1"><b style="font-size:14px">' + FILM.esc(t.title) + '</b>' +
      '<span style="display:block;font-size:12px;color:#8794A6">' + FILM.esc(t.sub) + ' · in: ' + FILM.esc(fromRole) + '</span></span>' +
      '<button type="button" class="btn sm" data-' + (here ? 'drop' : 'take') + '="' + t.id + '">' + (here ? 'remove' : 'add') + '</button></div>');
  }
  FILM.ask({
    title: 'Add modules', icon: 'grid', ok: 'Close', cancel: false,
    html: '<div class="db" style="padding:0"><p style="margin:0 0 10px;font-size:13px;color:#8794A6">Anything here can be added, whatever role you picked. Additions stay when you switch roles.</p>' + rows.join('') + '</div>'
  }).then(function () {});
  setTimeout(function () {
    var d = document.querySelector('dialog[open]'); if (!d) return;
    var ts = d.querySelectorAll('[data-take]'), ds = d.querySelectorAll('[data-drop]');
    for (var a = 0; a < ts.length; a++) ts[a].onclick = function () { add(this.getAttribute('data-take')); d.close(); picker(); };
    for (var b = 0; b < ds.length; b++) ds[b].onclick = function () { remove(this.getAttribute('data-drop')); d.close(); picker(); };
  }, 80);
}
FILM.register({
  id: 'addons',
  mount: function () {
    if (!FILM.tiles().some(function (t) { return t.id === 'add-modules'; })) {
      FILM.addTile({ id: 'add-modules', title: 'Add modules', sub: 'Pull in anything else', colour: '#00ABA9', icon: 'add' in {} ? 'grid' : 'grid', tag: 'DESK', run: picker });
    }
    reapply();
    var roles = FILM.state && FILM.state().modules && FILM.state().modules.roles;
    if (roles) reapply();
  },
  state: function () { return { extras: ids(), catalogue: (typeof FILM.catalogue === 'function') ? FILM.catalogue().length : 0 }; }
});
/* the roles module re-applies its own tiles on a switch; extras go back on afterwards */
var _setRole = FILM.setRole;
FILM.setRole = function (id) { var r = _setRole(id); try { reapply(); } catch (e) {} return r; };
FILM.addModule = add;
FILM.removeModule = remove;
FILM.addons = { list: ids, catalogue: function () { return (typeof FILM.catalogue === 'function') ? FILM.catalogue() : []; }, picker: picker };
