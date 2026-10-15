/* filmHUB - live banner
   Reads a staged call sheet if one is in the browser, otherwise takes manual entry.
   Registers as a contribution, not a patch: the shell ticks it, it never reaches into
   another module, and every write is defensive so a missing element cannot throw. */
var BANNER_KEY = 'filmhub_banner_v1';
var STAGED_KEYS = ['prohub_staged_payload_v1', 'posthub_staged_payload_v1', 'prehub_master_v1'];
var SOON_MINUTES = 15;

var B = { call: '', next: '', day: 0, move: false, source: 'manual' };

function readJSON(k) { try { var r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
function pad2(n) { return (n < 10 ? '0' : '') + n; }
function el(id) { return document.getElementById(id); }

function parseHM(s) {
  if (!s) return null;
  var m = String(s).match(/(\d{1,2})[:.](\d{2})/);
  if (!m) return null;
  var h = parseInt(m[1], 10), mi = parseInt(m[2], 10);
  if (h > 23 || mi > 59) return null;
  return { h: h, m: mi };
}
function atToday(hm) { if (!hm) return null; var d = new Date(); d.setHours(hm.h, hm.m, 0, 0); return d; }

/* look for a call sheet staged by another app, without depending on one being there */
function findStaged() {
  for (var i = 0; i < STAGED_KEYS.length; i++) {
    var p = readJSON(STAGED_KEYS[i]);
    if (!p) continue;
    var sheets = p.sheets || p.callSheets || [];
    if (!sheets.length) continue;
    var day = p.day || 1;
    var sheet = null;
    for (var j = 0; j < sheets.length; j++) { if ((sheets[j].day || 1) === day) { sheet = sheets[j]; break; } }
    if (!sheet) sheet = sheets[0];
    var call = sheet.call || sheet.callTime || sheet.generalCall || sheet.castCall || null;
    if (!call) continue;
    return {
      key: STAGED_KEYS[i], call: call,
      next: sheet.next || sheet.nextSetup || sheet.firstShot || null,
      day: sheet.day || day, move: !!(sheet.move || sheet.companyMove)
    };
  }
  return null;
}

function load() {
  var m = readJSON(BANNER_KEY);
  if (m) { B.call = m.call || ''; B.next = m.next || ''; B.move = !!m.move; if (m.day) B.day = m.day; }
  var s = findStaged();
  if (s) {
    B.call = s.call; B.next = s.next || B.next; B.move = s.move; B.day = s.day;
    B.source = 'staged (' + s.key + ')';
  } else {
    B.source = B.call ? 'manual' : 'manual (nothing staged)';
  }
}
function keep() {
  try { localStorage.setItem(BANNER_KEY, JSON.stringify({ call: B.call, next: B.next, move: B.move, day: B.day })); }
  catch (e) { /* storage refused - the shell already warns about that */ }
}

function status() {
  var hm = parseHM(B.call);
  if (!hm) return { status: 'none', minutes: null };
  var target = atToday(hm);
  var mins = Math.round((target.getTime() - Date.now()) / 60000);
  return { status: mins < 0 ? 'over' : (mins <= SOON_MINUTES ? 'soon' : 'ok'), minutes: mins, at: pad2(hm.h) + ':' + pad2(hm.m) };
}
function span(mins) {
  if (mins < 60) return mins + ' min';
  return Math.floor(mins / 60) + 'h ' + pad2(mins % 60) + 'm';
}

var lastCount = null;

/* crew mode: the call time leads the banner for a crew member */
var _lastRole=null;
function roleNow(){try{return localStorage.getItem('filmhub_role_v1')||''}catch(e){return ''}}
function emphasiseRole(){
 var r=roleNow(); if(r===_lastRole) return; _lastRole=r;
 var bar=document.getElementById('banner'); if(!bar) return;
 bar.setAttribute('data-role',r||'none');
 var v=document.getElementById('bnCall'),slot=v?v.parentNode:null;
 if(slot){slot.classList.add('call-slot');
  var label=slot.querySelector('.k'); if(label) label.textContent=(r==='crew')?'My call':'Current call';}
}
(function(){if(document.getElementById('crewBannerStyle'))return;
 var s=document.createElement('style');s.id='crewBannerStyle';
 s.textContent='.banner[data-role="crew"] .call-slot{order:-1;padding-left:0;border-left:0}'+
  '.banner[data-role="crew"] .call-slot .v{font-size:40px;line-height:1;color:#E2A93B;font-weight:600}';
 document.head.appendChild(s);})();

function paint() {
  try{emphasiseRole()}catch(e){}
  var e = el('bnCall'); if (e && e.textContent !== (B.call || 'not set')) e.textContent = B.call || 'not set';
  e = el('bnNext'); if (e && e.textContent !== (B.next || 'not set')) e.textContent = B.next || 'not set';
  e = el('bnDay'); if (e && B.day) { var d = 'DAY ' + B.day; if (e.textContent !== d) e.textContent = d; }

  var s = status(), c = el('bnCount');
  if (c) {
    var text, cls;
    if (s.status === 'none') { text = '--'; cls = 'v'; }
    else if (s.status === 'over') { text = '-' + span(Math.abs(s.minutes)); cls = 'v over'; }
    else { text = span(s.minutes); cls = 'v' + (s.status === 'soon' ? ' hot' : ''); }
    if (text + cls !== lastCount) { c.textContent = text; c.className = cls; lastCount = text + cls; }
  }
  var mv = el('bnMove');
  if (mv) {
    var t = B.move ? 'COMPANY MOVE' : 'NO COMPANY MOVE';
    if (mv.textContent !== t) {
      mv.textContent = t;
      mv.style.borderColor = B.move ? 'var(--amber)' : '';
      mv.style.color = B.move ? 'var(--amber)' : '';
    }
  }
}

function edit() {
  FILM.ask({
    title: 'Call sheet', icon: 'clock',
    fields: [
      { k: 'call', label: 'Current call (24h, e.g. 07:30)', value: B.call },
      { k: 'next', label: 'Next set-up', value: B.next },
      { k: 'day', label: 'Shoot day', value: B.day || '' }
    ],
    html: '<label class="fl">Company move today?</label>' +
          '<label style="display:flex;gap:8px;align-items:center;font-size:15px">' +
          '<input type="checkbox" id="bnmv" style="width:auto"' + (B.move ? ' checked' : '') + '> Yes, moving location</label>' +
          '<p style="margin:10px 0 0;font-size:13px;color:#8794A6">Source: ' + FILM.esc(B.source) + '</p>'
  }).then(function (r) {
    if (!r) return;
    B.call = (r.call || '').trim();
    B.next = (r.next || '').trim();
    B.day = parseInt(r.day, 10) || B.day || 0;
    var mv = el('bnmv');
    B.move = mv ? !!mv.checked : false;
    B.source = 'manual';
    keep(); paint();
    if (typeof FILM.save === 'function') FILM.save();
    FILM.toast(B.call ? 'Call sheet updated' : 'Call sheet cleared', 'good');
  });
}

FILM.register({
  id: 'banner',
  mount: function () {
    load(); paint();
    var b = el('banner');
    if (b) {
      b.style.cursor = 'pointer';
      b.title = 'Click to edit the call sheet';
      b.addEventListener('click', function (ev) {
        if (ev.target && ev.target.tagName === 'BUTTON') return;
        edit();
      });
    }
  },
  tick: function () { paint(); },
  state: function () {
    var s = status();
    return { callAt: B.call || null, nextAt: B.next || null, day: B.day || 0,
             move: !!B.move, status: s.status, minutesToCall: s.minutes, source: B.source };
  }
});
