/* filmHUB - launcher
   Three tiles that open the three apps. Contributes to the shell rather than patching it:
   it calls FILM.addTile() and hands each tile a run() of its own.

   Where the apps live: siblings of filmhub.html by default, so a folder deploy just works.
   Override any of them (a Wix page, a hosted URL) with localStorage filmhub_endpoints_v1,
   or FILM.setEndpoint('prohub', 'https://...'). */
var EP_KEY = 'filmhub_endpoints_v1';

var APPS = [
  { id: 'prehub',  title: 'preHUB',  sub: 'Writing desk · script · breakdown', colour: '#00ABA9', icon: 'grid',   tag: 'PRE',  file: 'prehub.html'  },
  { id: 'prohub',  title: 'proHUB',  sub: 'Production desk · nine modules',     colour: '#E51400', icon: 'rocket', tag: 'PROD', file: 'prohub.html'  },
  { id: 'posthub', title: 'postHUB', sub: 'Edit desk · ingest · timeline',      colour: '#7137C8', icon: 'play',   tag: 'POST', file: 'posthub.html' }
];

function readEP() { try { var r = localStorage.getItem(EP_KEY); return r ? JSON.parse(r) : {}; } catch (e) { return {}; } }
function urlFor(a) { var ep = readEP(); var raw = ep[a.id] || a.file;
  try { if (window.FILM && FILM.resolve) return FILM.resolve(raw); } catch (e) {}
  return raw; }
function embedded() { try { return window.self !== window.top; } catch (e) { return true; } }

function launch(a) {
  var u = urlFor(a);
  if (typeof FILM.toast === 'function') FILM.toast('Opening ' + a.title + '…');
  /* inside an embed a new tab is the only way out; on a plain page, navigate. */
  if (embedded()) {
    var w = null;
    try { w = window.open(u, '_blank'); } catch (e) { w = null; }
    if (w) return;
    try { window.top.location.href = u; return; } catch (e) { /* cross-origin top - fall through */ }
  }
  try { location.href = u; } catch (e) {
    if (typeof FILM.toast === 'function') FILM.toast('Could not open ' + a.title, 'bad');
  }
}

/* a best-effort check so a tile can say "not uploaded yet" rather than failing silently */
function reachable(a, cb) {
  var u = urlFor(a);
  if (typeof fetch !== 'function') { cb(null); return; }
  if (/^https?:/i.test(u) && u.indexOf(location.origin) !== 0) { cb(null); return; }
  try {
    fetch(u, { method: 'HEAD' }).then(function (r) { cb(r && r.ok === true); })
      .catch(function () { cb(false); });
  } catch (e) { cb(null); }
}

function tileFor(a) {
  var sub = a.sub;
  if (a.ready === true) sub = sub + ' · ready';
  else if (a.ready === false) sub = sub + ' · not uploaded yet';
  return { id: 'app-' + a.id, title: a.title, sub: sub, colour: a.colour, icon: a.icon, tag: a.tag,
           run: function () { launch(a); } };
}
function addAll() { for (var i = 0; i < APPS.length; i++) FILM.addTile(tileFor(APPS[i])); }

FILM.register({
  id: 'launcher',
  mount: function () {
    addAll();
    /* annotate each tile once the reachability check answers - guarded so a failure
       leaves the tile exactly as it was rather than blanking it */
    for (var i = 0; i < APPS.length; i++) {
      (function (a) {
        reachable(a, function (ok) {
          if (ok === null || a.ready === ok) return;
          a.ready = ok;
          try { FILM.addTile(tileFor(a)); } catch (e) { /* leave it be */ }
        });
      })(APPS[i]);
    }
  },
  state: function () {
    return {
      apps: APPS.map(function (a) { return { id: a.id, url: urlFor(a), ready: (a.ready === undefined ? null : a.ready) }; }),
      endpoints: readEP(),
      embedded: embedded()
    };
  }
});

/* public helpers so the tile manager and the console can drive it */
FILM.launch = function (id) {
  for (var i = 0; i < APPS.length; i++) { if (APPS[i].id === id) { launch(APPS[i]); return true; } }
  return false;
};
FILM.setEndpoint = function (id, url) {
  var ep = readEP();
  if (url) ep[id] = url; else delete ep[id];
  try { localStorage.setItem(EP_KEY, JSON.stringify(ep)); } catch (e) { return false; }
  addAll();
  return true;
};
FILM.apps = function () { return APPS.map(function (a) { return a.id; }); };
