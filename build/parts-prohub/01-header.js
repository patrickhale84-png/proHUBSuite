/* proHUB - 01-header
   The header's two jobs: keep the save stamp and live dot honest, and bind the project title
   and company fields. Lifted out of the shell, so it talks to the app only through the public
   surface: proHUB.state, proHUB.save, proHUB.ops. It never reaches into shell internals.

   The assembler wraps this in its own IIFE, so the two tiny helpers it needs are local. */
(function () {
  function q(sel) { return document.querySelector(sel); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function actChrome(o) {
    var op = window.proHUB && window.proHUB.ops;
    if (op && typeof op.setChrome === 'function') { try { return op.setChrome(o); } catch (e) {} }
    if (o.stamp != null) { var e = q('#saveStamp'); if (e) e.textContent = o.stamp; }
    if (o.dot != null) { var d = q('#liveDot'); if (d) d.style.background = o.dot ? 'var(--emerald)' : 'var(--red)'; }
    return null;
  }
  function stamp(ok) {
    var t = new Date();
    actChrome({ stamp: (ok ? 'saved ' : 'in memory only ') + pad2(t.getHours()) + ':' + pad2(t.getMinutes()) + ':' + pad2(t.getSeconds()), dot: ok });
  }
  function bindFields() {
    var t = q('#fTitle'), c = q('#fCompany');
    if (t) {
      t.value = (window.proHUB.state && window.proHUB.state.project && window.proHUB.state.project.title) || '';
      t.addEventListener('change', function () {
        var S = window.proHUB.state;
        S.project.title = t.value.toUpperCase();
        document.title = S.project.title + ' | proHUB';
        if (window.proHUB.ops && window.proHUB.ops.saveSoon) window.proHUB.ops.saveSoon();
        if (window.proHUB.ops && window.proHUB.ops.renderTiles) window.proHUB.ops.renderTiles();
      });
    }
    if (c) {
      c.value = (window.proHUB.state && window.proHUB.state.project && window.proHUB.state.project.company) || '';
      c.addEventListener('change', function () {
        var S = window.proHUB.state;
        S.project.company = c.value.toUpperCase();
        if (window.proHUB.ops && window.proHUB.ops.saveSoon) window.proHUB.ops.saveSoon();
      });
    }
  }
  window.proHUBparts = window.proHUBparts || {};
  window.proHUBparts.stamp = stamp;
  window.proHUBparts.bindFields = bindFields;
  window.proHUBparts.actChrome = actChrome;
})();
