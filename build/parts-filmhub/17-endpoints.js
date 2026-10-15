/* filmHUB - app addresses
   The other three apps are not siblings of this file when it is embedded - relative links
   resolve against the host page and the host answers FORBIDDEN. So every tile routes its
   destination through FILM.resolve(), and this module owns the table it resolves against.

   Set them once in the panel; they are stored per browser and can be changed any time. */
var AD_KEY = 'filmhub_endpoints_v1';
var APPS = [
  { key: 'prehub',  label: 'preHUB',  hint: 'the writing desk page' },
  { key: 'prohub',  label: 'proHUB',  hint: 'the production desk page' },
  { key: 'posthub', label: 'postHUB', hint: 'the edit desk page' }
];
function aRead() { try { var r = localStorage.getItem(AD_KEY); return r ? JSON.parse(r) : {}; } catch (e) { return {}; } }
function aWrite(o) { try { localStorage.setItem(AD_KEY, JSON.stringify(o)); return true; } catch (e) { return false; } }

/* absolute stays absolute; a bare filename is looked up by app key */
function resolve(url) {
  var u = String(url || '');
  if (/^(https?:)?\/\//i.test(u)) return u;
  var table = aRead();
  for (var i = 0; i < APPS.length; i++) {
    var k = APPS[i].key;
    if (u.indexOf(k) === 0 && table[k]) return table[k];
  }
  return u;
}
function panel() {
  var table = aRead(), rows = [];
  for (var i = 0; i < APPS.length; i++) {
    var a = APPS[i];
    rows.push('<label class="fl" style="margin-top:10px">' + a.label + ' - ' + a.hint + '</label>' +
      '<input data-ep="' + a.key + '" value="' + FILM.esc(table[a.key] || '') + '" placeholder="/' + a.key + '  or  https://...">');
  }
  FILM.ask({
    title: 'Where the apps live', icon: 'link', ok: 'Save', fields: [],
    html: '<div class="db" style="padding:0">' +
      '<p style="margin:0 0 6px;font-size:13px;color:#8794A6">A tile cannot reach a file that is not next to this one. ' +
      'If each app is a page on your site, put the page address here (e.g. <b>/prehub</b>). ' +
      'If they sit together on a host, put that address once for each.</p>' + rows.join('') + '</div>'
  }).then(function (r) {
    if (!r) return;
    var t = {};
    for (var j = 0; j < APPS.length; j++) {
      var v = r['ep_' + APPS[j].key];
      if (v === undefined) { var el = document.querySelector('[data-ep="' + APPS[j].key + '"]'); v = el ? el.value : ''; }
      v = String(v || '').trim();
      if (v) t[APPS[j].key] = v;
    }
    /* the ask() helper reads fields by data-k, so fall back to reading the inputs directly */
    if (!Object.keys(t).length) {
      for (var m = 0; m < APPS.length; m++) {
        var el2 = document.querySelector('[data-ep="' + APPS[m].key + '"]');
        var val = el2 ? String(el2.value || '').trim() : '';
        if (val) t[APPS[m].key] = val;
      }
    }
    aWrite(t);
    if (typeof FILM.toast === 'function') FILM.toast(Object.keys(t).length ? 'Addresses saved' : 'No addresses set', 'good');
  });
  /* bind the inputs so ask() picks them up */
  setTimeout(function () {
    var d = document.querySelector('dialog[open]'); if (!d) return;
    var ins = d.querySelectorAll('[data-ep]');
    for (var n = 0; n < ins.length; n++) ins[n].setAttribute('data-k', 'ep_' + ins[n].getAttribute('data-ep'));
  }, 60);
}
FILM.register({
  id: 'endpoints',
  mount: function () {
    FILM.addTile({ id: 'app-addresses', title: 'App addresses', sub: 'Where preHUB, proHUB and postHUB live', colour: '#8794A6', icon: 'link', tag: 'SETUP', run: panel });
  },
  state: function () { return { set: Object.keys(aRead()), resolved: { prehub: resolve('prehub.html'), prohub: resolve('prohub.html'), posthub: resolve('posthub.html') } }; }
});
FILM.resolve = resolve;
FILM.addresses = { get: aRead, set: aWrite, panel: panel };
