/* Outreach tracker: a production-company database, priority scoring, query letters, a submission
   log, a weekly nudge and a calendar export. All local - nothing leaves the browser.

   The seed lists companies, tiers, genres and submission policy. Contacts are deliberately BLANK:
   a plausible-looking invented email is worse than an empty field, and the scoring already
   rewards a real address. Fill them from your own research. */
var OB_SEED = [
  { id:'xyz',        name:'XYZ Films',            type:'sales',      tier:'mid',   focus:'genre, elevated action',   genres:['THRILLER','ACTION','SCI-FI'], accept:false, note:'Sales and financing, mostly packaged projects' },
  { id:'highland',   name:'Highland Film Group',  type:'sales',      tier:'mid',   focus:'commercial thriller',      genres:['THRILLER','ACTION'],           accept:false, note:'Prefers attachments' },
  { id:'gravitas',   name:'Gravitas Ventures',    type:'distributor',tier:'indie', focus:'VOD, documentary',         genres:['DRAMA','DOCUMENTARY'],         accept:true,  note:'Acquires finished films' },
  { id:'a24',        name:'A24',                  type:'distributor',tier:'major', focus:'auteur, festival',         genres:['DRAMA','HORROR','THRILLER'],   accept:false, note:'Repped submissions only' },
  { id:'neon',       name:'NEON',                 type:'distributor',tier:'major', focus:'festival acquisitions',    genres:['HORROR','DRAMA','THRILLER'],   accept:false, note:'Via reps and festivals' },
  { id:'bleecker',   name:'Bleecker Street',      type:'distributor',tier:'mid',   focus:'adult drama',              genres:['DRAMA','BIOPIC'],              accept:false, note:'' },
  { id:'ifc',        name:'IFC Films',            type:'distributor',tier:'mid',   focus:'indie, arthouse',          genres:['DRAMA','HORROR'],              accept:true,  note:'Occasional open submissions' },
  { id:'magnolia',   name:'Magnolia Pictures',    type:'distributor',tier:'mid',   focus:'genre, docs',              genres:['DOCUMENTARY','THRILLER'],      accept:true,  note:'' },
  { id:'screenmedia',name:'Screen Media',         type:'distributor',tier:'indie', focus:'commercial indie',         genres:['ACTION','THRILLER'],           accept:true,  note:'' },
  { id:'vertical',   name:'Vertical Entertainment',type:'distributor',tier:'indie',focus:'fast turnaround VOD',      genres:['THRILLER','HORROR'],           accept:true,  note:'' },
  { id:'saban',      name:'Saban Films',          type:'distributor',tier:'mid',   focus:'action, thriller',         genres:['ACTION','THRILLER'],           accept:false, note:'' },
  { id:'rlje',       name:'RLJE Films',           type:'distributor',tier:'mid',   focus:'genre',                    genres:['HORROR','ACTION'],             accept:false, note:'' },
  { id:'shudder',    name:'Shudder',              type:'platform',   tier:'mid',   focus:'horror only',              genres:['HORROR'],                      accept:true,  note:'Originals, horror-specific' },
  { id:'cbsfilms',   name:'CBS Films',            type:'studio',     tier:'major', focus:'wide commercial',          genres:['DRAMA','ACTION'],              accept:false, note:'' },
  { id:'lionsgate',  name:'Lionsgate',            type:'studio',     tier:'major', focus:'commercial genre',         genres:['ACTION','HORROR'],             accept:false, note:'Agency submissions only' },
  { id:'stx',        name:'STX Entertainment',    type:'studio',     tier:'major', focus:'star-driven',              genres:['ACTION','COMEDY'],             accept:false, note:'' },
  { id:'protagonist',name:'Protagonist Pictures', type:'sales',      tier:'mid',   focus:'international',            genres:['DRAMA','THRILLER'],            accept:false, note:'' },
  { id:'altitude',   name:'Altitude Film Sales',  type:'sales',      tier:'mid',   focus:'UK indie',                 genres:['DRAMA','THRILLER'],            accept:false, note:'' },
  { id:'filmnation', name:'FilmNation',           type:'sales',      tier:'major', focus:'prestige international',   genres:['DRAMA','BIOPIC'],              accept:false, note:'' },
  { id:'utah',       name:'Utah Film Center',     type:'grant',      tier:'indie', focus:'regional grants',          genres:['DRAMA','DOCUMENTARY'],         accept:true,  note:'Grant programmes, not distribution' }
];
var OB = { filter:'ALL', custom:[], letters:[], lastNudge:0, sel:null, letter:'' };

function obLoad() {
  try {
    OB.custom = JSON.parse(localStorage.getItem('ob_custom') || '[]');
    OB.letters = JSON.parse(localStorage.getItem('ob_letters') || '[]');
    OB.lastNudge = +(localStorage.getItem('ob_last_nudge') || 0);
  } catch (e) { OB.custom = []; OB.letters = []; OB.lastNudge = 0; }
}
function obSave() {
  try {
    localStorage.setItem('ob_custom', JSON.stringify(OB.custom));
    localStorage.setItem('ob_letters', JSON.stringify(OB.letters));
  } catch (e) {}
}
function obAll() { return OB_SEED.concat(OB.custom); }

function obScript() {
  var sp = ModalSync.get('screenplay:main') || {};
  var genres = [];
  try {
    var text = String(sp.content || '').toLowerCase();
    if (/blood|corpse|scream|ghost|haunt/.test(text)) genres.push('HORROR');
    if (/chase|gun|explosion|fight/.test(text)) genres.push('ACTION');
    if (/secret|investigat|betray/.test(text)) genres.push('THRILLER');
    if (/love|kiss|wedding/.test(text)) genres.push('ROMANCE');
    if (/court|election|president/.test(text)) genres.push('DRAMA');
  } catch (e) {}
  var title = (sp.filename || '').replace(/\.[a-z]+$/, '') || '';
  return { genres: genres, title: title, lines: (sp.lines || []).length };
}

function obPriority(c) {
  var s = 0, script = obScript();
  if (c.accept) s += 5;
  if (c.email) s += 2;
  if (c.contact) s += 1;
  if (c.tier === 'indie') s += 2; else if (c.tier === 'mid') s += 1;
  var matches = 0;
  (c.genres || []).forEach(function (g) { if (script.genres.indexOf(g) >= 0) matches++; });
  s += Math.min(15, matches * 3);
  return s;
}
function obStars(n) {
  var stars = Math.max(1, Math.min(5, Math.round(n / 5)));
  var out = '';
  for (var i = 0; i < 5; i++) out += (i < stars ? '\u2605' : '\u2606');
  return out;
}
function obTierColour(t) { return t === 'indie' ? '#34D399' : (t === 'mid' ? '#FBBF24' : '#F87171'); }

function obList() {
  var list = obAll().map(function (c) {
    var copy = {}; for (var k in c) copy[k] = c[k];
    copy._score = obPriority(c);
    return copy;
  });
  if (OB.filter === 'OPEN') list = list.filter(function (c) { return c.accept; });
  if (OB.filter === 'REP') list = list.filter(function (c) { return !c.accept; });
  if (OB.filter === 'TOP') list = list.filter(function (c) { return c._score >= 8; });
  list.sort(function (a, b) { return b._score - a._score; });
  return list;
}

function obLetter(c) {
  var script = obScript();
  var genre = script.genres[0] || 'drama';
  var project = script.title || 'the project';
  return 'Dear ' + (c.contact || c.name) + ',\n\n' +
    'I am writing about ' + project + ', a ' + genre.toLowerCase() + ' feature, ' + (script.lines || '?') +
    ' lines of script at present and moving toward production.\n\n' +
    'You take ' + (c.genres || []).join(', ').toLowerCase() + ' material' + (c.accept ?
      ' and consider unsolicited submissions' : ', though I understand you work through representatives') + '. ' +
    'That is exactly the company this was written for.\n\n' +
    'The letter is a short introduction; the script and a one-page summary are ready to send. ' +
    'Could I put them in front of you?\n\n' +
    'With thanks,\n' + (window.HUB_WRITER || 'the writer');
}
function obLog(c) {
  OB.letters.push({ id: 'l' + Date.now(), company: c.name, email: c.email || '', status: c.email ? 'Drafted' : 'Drafted',
                    at: new Date().toISOString(), genre: (obScript().genres[0] || '') });
  obSave(); obRender();
}
function obCSV() {
  var rows = [['Company','Status','Date','Email','Genre']];
  OB.letters.forEach(function (l) { rows.push([l.company, l.status, l.at, l.email, l.genre]); });
  var text = rows.map(function (r) {
    return r.map(function (x) { return '"' + String(x == null ? '' : x).replace(/"/g, '""') + '"'; }).join(',');
  }).join('\n');
  try { navigator.clipboard.writeText(text); } catch (e) {}
  var a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
  a.download = 'outreach-log.csv'; document.body.appendChild(a); a.click(); a.remove();
}
function obICS() {
  var script = obScript();
  var top = obList().slice(0, 3);
  var d = new Date();
  var next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + ((8 - d.getDay()) % 7 || 7), 9, 0, 0);
  function stamp(x) {
    return x.getUTCFullYear() + ('0' + (x.getUTCMonth() + 1)).slice(-2) + ('0' + x.getUTCDate()).slice(-2) +
           'T' + ('0' + x.getUTCHours()).slice(-2) + ('0' + x.getUTCMinutes()).slice(-2) + '00Z';
  }
  var desc = 'Contacts: ' + top.map(function (c) { return c.name + (c.email ? ' <' + c.email + '>' : ''); }).join('; ');
  var ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//proHUB//Outreach//EN','BEGIN:VEVENT',
    'UID:' + Date.now() + '@prohub', 'DTSTAMP:' + stamp(new Date()), 'DTSTART:' + stamp(next),
    'SUMMARY:Outreach - ' + (script.title || 'project'),
    'DESCRIPTION:' + desc.replace(/[,;]/g, ' '), 'RRULE:FREQ=WEEKLY;BYDAY=MO', 'END:VEVENT','END:VCALENDAR'].join('\r\n');
  var a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = 'outreach-nudge.ics'; document.body.appendChild(a); a.click(); a.remove();
}
function obNudge() {
  if (!OB.lastNudge || Date.now() - OB.lastNudge > 7 * 24 * 3600 * 1000) return obList().filter(function (c) {
    return !OB.letters.some(function (l) { return l.company === c.name; });
  }).slice(0, 3);
  return [];
}

function obRender() {
  var host = document.getElementById('obBody');
  if (!host) return;
  var list = obList(), script = obScript(), nudge = obNudge();
  var rows = list.map(function (c) {
    var logged = OB.letters.some(function (l) { return l.company === c.name; });
    return '<div class="obrow" data-id="' + HUB.esc(c.id) + '" style="display:flex;gap:8px;align-items:center;' +
      'padding:7px 0;border-bottom:1px solid rgba(27,36,54,.7);cursor:pointer' + (OB.sel === c.id ? ';background:#131A28' : '') + '">' +
      '<span style="font-family:var(--fm);font-size:11px;color:var(--amber);width:52px">' + obStars(c._score) + '</span>' +
      '<span style="flex:1;font-size:12.5px;color:' + (logged ? '#7E8FA6' : '#DDE5EF') + '">' + HUB.esc(c.name) +
      (c.contact ? ' <span class="note">· ' + HUB.esc(c.contact) + '</span>' : '') + '</span>' +
      '<span style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:' + obTierColour(c.tier) + '">' + c.tier + '</span>' +
      '<span style="font-size:10px;color:' + (c.accept ? '#4ADE80' : '#F87171') + '">' + (c.accept ? 'open' : 'rep') + '</span>' +
      '</div>';
  }).join('');
  var tabs = ['ALL','OPEN','REP','TOP'].map(function (t) {
    return '<button data-tab="' + t + '" class="' + (OB.filter === t ? 'pri' : '') + '" style="font-size:11px;padding:4px 9px">' + t + '</button>';
  }).join(' ');
  var sel = OB.sel ? obAll().filter(function (c) { return c.id === OB.sel; })[0] : null;
  var panel = sel ? '<div class="note" style="margin-bottom:6px"><b>' + HUB.esc(sel.name) + '</b> · ' +
      HUB.esc((sel.genres || []).join(', ')) + '</div>' +
      '<div class="row" style="gap:6px;margin-bottom:8px"><button id="obDraft" class="pri">Draft letter</button>' +
      '<button id="obLogBtn">Log submission</button>' +
      '<input id="obEmail" placeholder="email" value="' + HUB.esc(sel.email || '') + '" style="width:44%;font-size:11.5px">' +
      '<input id="obContact" placeholder="contact" value="' + HUB.esc(sel.contact || '') + '" style="width:34%;font-size:11.5px"></div>' +
      '<textarea id="obTxt" rows="12" style="width:100%;font-size:12px">' + HUB.esc(OB.letter || '') + '</textarea>'
    : '<p class="note">Choose a company to draft a letter or log a submission.</p>';
  var log = OB.letters.slice().reverse().map(function (l) {
    return '<div style="display:flex;gap:8px;padding:5px 0;border-bottom:1px solid rgba(27,36,54,.7)">' +
      '<span class="note" style="flex:1">' + HUB.esc(l.company) + '</span>' +
      '<span class="note">' + l.status + '</span>' +
      '<span class="note">' + String(l.at).slice(0, 10) + '</span>' +
      (l.email ? '<a class="note" href="mailto:' + HUB.esc(l.email) + '">mail</a>' : '') + '</div>';
  }).join('') || '<p class="note">No submissions logged yet.</p>';

  host.innerHTML =
    (nudge.length ? '<div style="border:1px solid var(--amber);border-radius:7px;padding:8px 10px;margin-bottom:10px;background:rgba(226,169,59,.08)">' +
      '<div class="note" style="color:#E2A93B">This week: ' + nudge.map(function (c) { return HUB.esc(c.name) + (c.email ? ' &lt;' + HUB.esc(c.email) + '&gt;' : ''); }).join(' · ') +
      '</div><div class="row" style="gap:6px;margin-top:6px"><button id="obDismiss">Dismiss</button><button id="obIcs">Add weekly reminder</button></div></div>' : '') +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">' +
      '<div><div class="row" style="gap:4px;margin-bottom:8px">' + tabs + '</div>' +
        '<div class="note" style="margin-bottom:6px">' + list.length + ' companies · script genres: ' +
        (script.genres.length ? script.genres.join(', ') : 'none detected') + '</div>' + rows + '</div>' +
      '<div style="border-left:1px solid var(--line);padding-left:14px">' + panel +
        '<div class="note" style="margin:14px 0 6px;letter-spacing:.12em;text-transform:uppercase;font-size:10px">Log</div>' +
        log + '<div class="row" style="gap:6px;margin-top:8px"><button id="obCsv">Export log CSV</button>' +
        '<button id="obAdd">Add company</button></div></div></div>';

  host.querySelectorAll('[data-tab]').forEach(function (b) {
    b.onclick = function () { OB.filter = b.getAttribute('data-tab'); obRender(); };
  });
  host.querySelectorAll('[data-id]').forEach(function (r) {
    r.onclick = function () { OB.sel = r.getAttribute('data-id'); OB.letter = ''; obRender(); };
  });
  var d = host.querySelector('#obDraft');
  if (d) d.onclick = function () {
    var c = obAll().filter(function (x) { return x.id === OB.sel; })[0];
    var em = host.querySelector('#obEmail'), ct = host.querySelector('#obContact');
    if (em) c.email = em.value.trim();
    if (ct) c.contact = ct.value.trim();
    OB.letter = obLetter(c);
    var idx = OB.custom.map(function (x) { return x.id; }).indexOf(c.id);
    if (idx >= 0) { OB.custom[idx] = c; obSave(); }
    obRender();
  };
  var lg = host.querySelector('#obLogBtn');
  if (lg) lg.onclick = function () {
    var c = obAll().filter(function (x) { return x.id === OB.sel; })[0];
    if (c) obLog(c);
  };
  var dz = host.querySelector('#obDismiss');
  if (dz) dz.onclick = function () { OB.lastNudge = Date.now(); try { localStorage.setItem('ob_last_nudge', String(OB.lastNudge)); } catch (e) {} obRender(); };
  var ic = host.querySelector('#obIcs'); if (ic) ic.onclick = obICS;
  var cs2 = host.querySelector('#obCsv'); if (cs2) cs2.onclick = obCSV;
  var ad = host.querySelector('#obAdd');
  if (ad) ad.onclick = function () {
    var name = window.prompt('Company name:', '');
    if (!name) return;
    OB.custom.push({ id: 'c' + Date.now(), name: name, type: 'indie', tier: 'indie', focus: '',
                     genres: (obScript().genres.length ? obScript().genres : ['DRAMA']), accept: true, note: '',
                     email: '', contact: '' });
    obSave(); obRender();
  };
}

HUB.reg({ id:'outreach', title:'Outreach', sub:'Company database, priority scoring, letters, log and weekly nudge',
  tag:'pre-production', colour:'#8FC13F',
  render:function(box){
    obLoad();
    box.innerHTML='<div id="obBody"></div>';
    obRender();
    try { ModalSync.watch('screenplay:main', function(){ if(document.getElementById('obBody')) obRender(); }); } catch(e){}
  }});
