/* The production desk, ported into the tiles rather than framed.

   desk/schedule.html carries the whole app: all nine sections plus its CSS and script. It is
   fetched ONCE, its styles and script are injected into this document once, and each tile then
   moves its own <section> into the panel. Nine tiles, one running instance, no iframes.

   Why move the node instead of copying markup: the app's own code finds its views with
   getElementById, and a moved node keeps its identity - so the schedule builder, the call sheet
   renderer and the budget totals keep working on the section they were written for. */
var DESK = { loaded: false, loading: null, source: 'desk/schedule.html' };
var DESK_VIEWS = ['schedule','callsheet','screenplay','cast','shots','props','budget','indieplus','shootingscript'];
var DESK_LABEL = {
  schedule:'One-line schedule', callsheet:'Call sheets', screenplay:'Screenwriter', cast:'Crew and cast',
  shots:'A/V studio', props:'Assets and locations', budget:'Standard budget',
  indieplus:'indiePLUS', shootingscript:'Shooting script'
};

function deskLoad() {
  if (DESK.loaded) return Promise.resolve(true);
  if (DESK.loading) return DESK.loading;
  DESK.loading = fetch(DESK.source, { cache: 'no-store' })
    .then(function (r) { return r.text(); })
    .then(function (html) {
      // the desk's schedule view touches a Tailwind runtime global; define a harmless stub so
      // the port does not throw. Its stylesheet is already compiled into the desk.
      try { if (!window.tailwind) window.tailwind = { config: {}, theme: { extend: function () {} } }; } catch (e) {}
      var doc = new DOMParser().parseFromString(html, 'text/html');

      // 1. styles, once
      var styles = doc.querySelectorAll('style');
      for (var i = 0; i < styles.length; i++) {
        var s = document.createElement('style');
        s.textContent = styles[i].textContent;
        s.setAttribute('data-desk', '1');
        document.head.appendChild(s);
      }
      // the tab strip belongs to the tabbed desk, not to a tile
      var hide = document.createElement('style');
      hide.setAttribute('data-desk', '1');
      hide.textContent = '#tab-navigation{display:none !important}';
      document.head.appendChild(hide);

      // 2. markup into a detached host - it is never displayed, only moved from
      var host = document.createElement('div');
      host.id = 'deskHost';
      host.style.display = 'none';
      host.innerHTML = doc.body.innerHTML;
      document.body.appendChild(host);

      // 3. the script, once, after the markup exists
      var scripts = doc.querySelectorAll('script');
      for (var j = 0; j < scripts.length; j++) {
        if (scripts[j].src) continue;                 // no external loads
        try {
          var el = document.createElement('script');
          el.textContent = scripts[j].textContent;
          document.body.appendChild(el);
        } catch (e) { console.warn('desk script failed:', e && e.message); }
      }

      // 4. some builds wait for DOMContentLoaded, which has already fired here
      try { document.dispatchEvent(new Event('DOMContentLoaded')); } catch (e) {}
      try { window.dispatchEvent(new Event('load')); } catch (e) {}

      DESK.loaded = true;
      return true;
    });
  return DESK.loading;
}

function deskMount(view, box) {
  // ask the app to switch first, so anything it renders on activation happens
  var btn = document.getElementById('tab-' + view);
  if (btn) { try { btn.click(); } catch (e) {} }

  var slot = document.createElement('div');
  slot.style.cssText = 'height:100%;overflow:auto';
  box.innerHTML = '';
  box.appendChild(slot);

  var host = document.getElementById('deskHost');
  for (var i = 0; i < DESK_VIEWS.length; i++) {
    var v = DESK_VIEWS[i];
    var sec = host ? host.querySelector('#view-' + v) : null;
    if (!sec) continue;
    if (v === view) {
      sec.classList.remove('hidden');
      slot.appendChild(sec);            // the node moves, keeping its listeners and its id
    } else {
      sec.classList.add('hidden');
    }
  }
  if (!slot.children.length) {
    slot.innerHTML = '<p class="note">That section did not render. The desk loaded but ' +
      '“' + HUB.esc(view) + '” produced nothing - check the console for an error from the desk script.</p>';
  }
}

for (var k = 0; k < DESK_VIEWS.length; k++) {
  (function (view) {
    HUB.reg({
      id: 'prod-' + view,
      title: DESK_LABEL[view],
      sub: 'the production desk',
      tag: 'production',
      colour: '#E8703A',
      render: function (box) {
        box.innerHTML = '<p class="note">loading the production desk…</p>';
        deskLoad().then(function () {
          deskMount(view, box);
        }).catch(function (e) {
          box.innerHTML = '<p class="note">The desk could not be loaded: ' +
            HUB.esc((e && e.message) || String(e)) + '</p>';
        });
      }
    });
  })(DESK_VIEWS[k]);
}
