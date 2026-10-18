/* filmHUB - contacts
   The distributors, sales agents and labs the suite pitches to, prefilled with their sites and
   submission e-mails, so nobody has to look them up. Searching never goes to the open web: it runs
   over this list (saved in this browser, and portable as a JSON file), and the one outward search
   is limited to these companies' own sites. The script preHUB sent ranks the list by genre. */
var C_KEY = 'filmhub_contacts_v1';
var SEED = [
  { id: 'a24', name: 'A24', type: 'Production/Distribution', focus: 'Arthouse, Drama, Horror, Comedy', genres: ['drama', 'horror', 'comedy'], accept: false, note: 'Representation only. Submit through a WGA-licensed agent or manager.', web: 'a24films.com', email: '', contact: 'Development Dept.' },
  { id: 'blumhouse', name: 'Blumhouse Productions', type: 'Production', focus: 'Horror, Thriller, Micro-budget', genres: ['horror', 'thriller'], accept: false, note: 'Through representation. Occasional open-call windows announced via social media. Horror and thriller only.', web: 'blumhouse.com', email: '', contact: 'Jason Blum, Jeanette Volturno' },
  { id: 'neon', name: 'NEON', type: 'Distribution', focus: 'Arthouse, Documentary, World Cinema', genres: ['arthouse', 'documentary'], accept: false, note: 'Through sales agents only. Known for international arthouse acquisitions.', web: 'neonrated.com', email: '', contact: 'Tom Quinn (CEO)' },
  { id: 'ifc', name: 'IFC Films', type: 'Distribution', focus: 'Independent, Arthouse', genres: ['indie', 'arthouse'], accept: false, note: 'Through sales agents and representation. Part of AMC Networks.', web: 'ifcfilms.com', email: '', contact: 'Acquisitions Dept.' },
  { id: 'xyz', name: 'XYZ Films', type: 'Production/Sales', focus: 'Genre, Action, Sci-Fi, Horror', genres: ['genre', 'action', 'sci-fi', 'horror', 'thriller'], accept: true, note: 'Accepts select unsolicited loglines via website form. Keep pitch under 1 page. Genre films with talent a plus.', web: 'xyzfilms.com', email: 'submissions@xyzfilms.com', contact: 'Nate Bolotin (Partner), Nick Spicer (Partner)' },
  { id: 'highland', name: 'Highland Film Group', type: 'Sales/Finance', focus: 'Action, Horror, Thriller', genres: ['action', 'horror', 'thriller'], accept: true, note: 'International sales. Accepts submissions for projects with some talent attached. Include logline + synopsis.', web: 'highlandfilmgroup.com', email: 'submissions@highlandfilmgroup.com', contact: 'Arianne Fraser (Co-CEO), Delphine Perrier (Co-CEO)' },
  { id: 'myriad', name: 'Myriad Pictures', type: 'Sales/Finance', focus: 'Drama, Thriller, Comedy', genres: ['drama', 'thriller', 'comedy'], accept: true, note: 'International sales company. Submit logline, synopsis, and writer bio. Projects at any stage considered.', web: 'myriadpictures.com', email: 'info@myriadpictures.com', contact: "Kirk D'Amico (CEO/President)" },
  { id: 'gravitas', name: 'Gravitas Ventures', type: 'Distribution', focus: 'Independent, Genre, VOD', genres: ['indie', 'genre', 'thriller', 'drama'], accept: true, note: 'VOD/digital-first distributor. Include one-sheet and screener link if available. Very accessible to indie filmmakers.', web: 'gravitasventures.com', email: 'acquisitions@gravitasventures.com', contact: 'Acquisitions Team' },
  { id: 'brainstorm', name: 'Brainstorm Media', type: 'Distribution', focus: 'Drama, Action, Thriller', genres: ['drama', 'action', 'thriller'], accept: true, note: 'Indie distributor. Accepts unsolicited submissions via email with logline + synopsis. North America focus.', web: 'brainstormmedia.com', email: 'submissions@brainstormmedia.com', contact: 'Acquisitions Dept.' },
  { id: 'vertical', name: 'Vertical Entertainment', type: 'Distribution', focus: 'Drama, Comedy, Genre', genres: ['drama', 'comedy', 'genre'], accept: true, note: 'Digital-first. Pitches from producers with completed or late-stage projects. Include trailer or scene samples.', web: 'vertical-entertainment.com', email: 'acquisitions@vertical-entertainment.com', contact: 'Acquisitions Dept.' },
  { id: 'cinedigm', name: 'Cinedigm', type: 'Distribution', focus: 'Independent, Genre, Family', genres: ['indie', 'genre', 'family'], accept: true, note: 'Indie digital distribution. Accepts submissions for VOD release consideration. Include screener link.', web: 'cinedigm.com', email: 'acquisitions@cinedigm.com', contact: 'Erick Opeka (President)' },
  { id: 'kino', name: 'Kino Lorber', type: 'Distribution', focus: 'Arthouse, World Cinema, Documentary', genres: ['arthouse', 'world', 'documentary'], accept: true, note: 'Arthouse distributor. Check website for current intake period. Theatrical + home video.', web: 'kinolorber.com', email: 'acquisitions@kinolorber.com', contact: 'Richard Lorber (CEO)' },
  { id: 'magnolia', name: 'Magnolia Pictures', type: 'Distribution', focus: 'Documentary, Arthouse, World', genres: ['documentary', 'arthouse', 'world'], accept: false, note: 'Through sales agents and representation. Part of Magnolia Entertainment.', web: 'magpictures.com', email: '', contact: 'Eamonn Bowles (President)' },
  { id: 'participant', name: 'Participant Media', type: 'Production', focus: 'Social Impact, Documentary, Drama', genres: ['drama', 'documentary'], accept: false, note: 'Through WGA agents. Social impact angle required. Content must have a clear societal message.', web: 'participant.com', email: '', contact: 'David Linde (CEO)' },
  { id: 'samuel', name: 'Samuel Goldwyn Films', type: 'Distribution', focus: 'Drama, Comedy, Documentary', genres: ['drama', 'comedy', 'documentary'], accept: false, note: 'Through sales agents. Selective acquisitions. Festival titles strongly preferred.', web: 'samuelgoldwyn.com', email: '', contact: 'Samuel Goldwyn Jr. (CEO)' },
  { id: 'sundance', name: 'Sundance Institute', type: 'Lab/Grant', focus: 'All genres, emerging filmmakers', genres: ['all'], accept: true, note: 'Not a production company. Labs, grants, fellowships. Annual deadlines in Oct-Dec. Apply via website for Screenwriters and Directors Labs.', web: 'sundance.org', email: 'institute@sundance.org', contact: 'Labs Team / Fellowships' },
  { id: 'filmindependent', name: 'Film Independent', type: 'Lab/Support', focus: 'Spirit of independence', genres: ['all'], accept: true, note: 'Not a production company. Labs, mentorship, Spirit Awards, fiscal sponsorship. Open membership. Very accessible.', web: 'filmindependent.org', email: 'info@filmindependent.org', contact: 'Josh Welsh (President)' },
  { id: 'bron', name: 'BRON Studios', type: 'Production/Finance', focus: 'Drama, Comedy, Animation', genres: ['drama', 'comedy', 'animation'], accept: false, note: 'Through representation. International co-productions. Canada-based.', web: 'bronstudios.com', email: '', contact: 'Aaron Gilbert (CEO)' },
  { id: 'roadside', name: 'Roadside Attractions', type: 'Distribution', focus: 'Drama, Comedy, Documentary', genres: ['drama', 'comedy', 'documentary'], accept: false, note: 'Through sales agents and festival acquisitions. Known for awards-season releases.', web: 'roadsideattractions.com', email: '', contact: "Howard Cohen, Eric d'Arbeloff (Co-Presidents)" },
  { id: 'topic', name: 'Topic Studios', type: 'Production', focus: 'Drama, Documentary, Limited Series', genres: ['drama', 'documentary'], accept: false, note: 'Through agents and managers. Drama and documentary focus.', web: 'topic.com', email: '', contact: 'Nellie Kim (SVP Development)' }
];
function cread() { try { var r = localStorage.getItem(C_KEY); var a = r ? JSON.parse(r) : null; return a instanceof Array && a.length ? a : null; } catch (e) { return null; } }
function cwrite(a) { try { localStorage.setItem(C_KEY, JSON.stringify(a)); return true; } catch (e) { return false; } }
function list() {
  var a = cread();
  if (!a) {
    a = SEED.slice();
    /* contacts added in preHUB's outreach desk come along too */
    try { var extra = JSON.parse(localStorage.getItem('ob_custom') || '[]'); if (extra instanceof Array) a = a.concat(extra.filter(function (x) { return x && x.name; })); } catch (e) {}
    cwrite(a);
  }
  return a;
}

/* the genres of the script preHUB sent, from its words */
var GENRE_WORDS = { 'sci-fi': /\b(alien|nasa|satellite|orbit|planet|spaceship|signal|infrared|glyph)/gi, horror: /\b(blood|scream|cleaver|monster|burned|claw|corpse|demon)/gi,
  thriller: /\b(chase|gun|escape|police|kidnap|hostage|conspiracy)/gi, drama: /\b(mother|father|grief|therapist|memory|family|child)/gi, comedy: /\b(laughs|joke|awkward|deadpan|sitcom)/gi,
  action: /\b(explosion|fight|punch|crash|shootout)/gi, documentary: /\b(interview|archival|footage of)/gi, family: /\b(kids|puppy|birthday|grandma)/gi };
function scriptGenres() {
  var text = '';
  try { var m = JSON.parse(localStorage.getItem('prehub_master_v1') || 'null'); if (m && m.lines) text = m.lines.map(function (l) { return l.text; }).join(' '); } catch (e) {}
  if (!text) return [];
  return Object.keys(GENRE_WORDS).map(function (g) { return [g, (text.match(GENRE_WORDS[g]) || []).length]; })
    .filter(function (x) { return x[1] >= 3; }).sort(function (a, b) { return b[1] - a[1]; }).map(function (x) { return x[0]; });
}
function rank(c, gs) {
  var s = (c.accept ? 5 : 0) + (c.email ? 2 : 0);
  (c.genres || []).forEach(function (g) { if (g === 'all') s += 1; else if (gs.indexOf(g) >= 0) s += 4 - Math.min(3, gs.indexOf(g)); if (g === 'genre' && gs.length) s += 1; });
  return s;
}
function matches(c, q) {
  if (!q) return true;
  var hay = [c.name, c.type, c.focus, (c.genres || []).join(' '), c.note, c.email, c.contact, c.web].join(' ').toLowerCase();
  return q.toLowerCase().split(/\s+/).every(function (w) { return hay.indexOf(w) >= 0; });
}
function siteSearch(q, rows) {
  var sites = rows.filter(function (c) { return c.web; }).slice(0, 12).map(function (c) { return 'site:' + c.web.replace(/^https?:\/\//, '').replace(/\/.*$/, ''); });
  var url = 'https://duckduckgo.com/?q=' + encodeURIComponent((q || 'submissions') + ' (' + sites.join(' OR ') + ')');
  try { window.open(url, '_blank', 'noopener'); } catch (e) {}
}
function download(name, text) {
  try { var b = new Blob([text], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000); FILM.toast('Saved ' + name, 'good'); } catch (e) { FILM.toast('Could not save the file', 'bad'); }
}
function panel() {
  var gs = scriptGenres(), q = '', onlyOpen = false, d = document.createElement('dialog');
  d.innerHTML = '<div class="dlg" style="max-width:720px"><div class="dh"><h3>Contacts</h3><span style="margin-left:auto;font-size:12px;color:var(--mu)" data-c="count"></span></div>' +
    '<div class="db" style="padding:12px 15px">' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px"><input data-c="q" placeholder="Search name, genre, e-mail or notes" style="flex:1;min-width:200px">' +
    '<label style="display:flex;gap:6px;align-items:center;font-size:13px;color:var(--mu);white-space:nowrap"><input type="checkbox" data-c="open" style="width:auto"> Takes submissions</label></div>' +
    '<p data-c="genres" style="margin:0 0 8px;font-size:12.5px;color:var(--mu)"></p><div data-c="rows" style="display:grid;gap:6px"></div></div>' +
    '<div class="df" style="flex-wrap:wrap"><button class="btn sm" data-c="sites" title="Searches only these companies\' own websites">Search their sites</button>' +
    '<button class="btn sm" data-c="export">Save as JSON</button><button class="btn sm" data-c="import">Load JSON</button><button class="btn sm" data-c="add">Add contact</button>' +
    '<button class="btn sm pri" data-c="close">Done</button></div></div>';
  document.body.appendChild(d);
  var $ = function (k) { return d.querySelector('[data-c="' + k + '"]'); };
  function rows() { var a = list().filter(function (c) { return (!onlyOpen || c.accept) && matches(c, q); }); return a.sort(function (x, y) { return rank(y, gs) - rank(x, gs) || x.name.localeCompare(y.name); }); }
  function draw() {
    var r = rows();
    $('count').textContent = r.length + ' of ' + list().length;
    $('genres').textContent = gs.length ? 'Ranked for the script preHUB sent: ' + gs.join(', ') + '. Open submissions first.' : 'Open submissions first. Transmit a script from preHUB to rank these by its genre.';
    $('rows').innerHTML = r.length ? r.map(function (c) {
      var e = FILM.esc;
      return '<div style="border:1px solid var(--line2);border-radius:6px;padding:9px 11px;background:#0A0F1D">' +
        '<div style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap"><b style="color:#fff">' + e(c.name) + '</b><span style="font-size:12px;color:var(--mu)">' + e(c.type || '') + '</span>' +
        '<span style="margin-left:auto;font-size:12px;color:' + (c.accept ? 'var(--lime)' : 'var(--mu)') + '">' + (c.accept ? 'Takes submissions' : 'Through representation') + '</span></div>' +
        '<div style="font-size:13px;color:#C6D1DC;margin-top:2px">' + e(c.focus || '') + '</div>' +
        '<div style="font-size:12.5px;color:var(--mu);margin-top:4px">' + e(c.note || '') + '</div>' +
        '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:6px;font-size:13px">' +
        (c.email ? '<a href="mailto:' + e(c.email) + '" style="color:var(--gold)">' + e(c.email) + '</a>' : '<span style="color:var(--mu)">No public e-mail</span>') +
        (c.web ? '<a href="https://' + e(c.web.replace(/^https?:\/\//, '')) + '" target="_blank" rel="noopener" style="color:var(--cyan)">' + e(c.web) + '</a>' : '') +
        (c.contact ? '<span style="color:var(--mu)">' + e(c.contact) + '</span>' : '') + '</div></div>';
    }).join('') : '<p style="color:var(--mu);margin:8px 0">No contact matches "' + FILM.esc(q) + '". Clear the search, or add the company with Add contact.</p>';
  }
  $('q').addEventListener('input', function () { q = this.value.trim(); draw(); });
  $('open').addEventListener('change', function () { onlyOpen = this.checked; draw(); });
  $('sites').addEventListener('click', function () { siteSearch(q, rows()); });
  $('export').addEventListener('click', function () { download('filmhub-contacts.json', JSON.stringify(list(), null, 2)); });
  $('import').addEventListener('click', function () {
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = function () { var f = inp.files[0]; if (!f) return; f.text().then(function (t) {
      var a = JSON.parse(t); if (!(a instanceof Array)) throw new Error('not a list');
      var cur = list(), byId = {}; cur.forEach(function (c) { byId[c.id || c.name] = c; });
      a.forEach(function (c) { if (c && c.name) byId[c.id || c.name] = c; });
      cwrite(Object.keys(byId).map(function (k) { return byId[k]; })); draw(); FILM.toast('Loaded ' + a.length + ' contacts from ' + f.name, 'good');
    }).catch(function () { FILM.toast('That file is not a contacts list. Use one saved with Save as JSON.', 'bad'); }); };
    inp.click();
  });
  $('add').addEventListener('click', function () {
    FILM.ask({ title: 'Add contact', icon: 'note', ok: 'Add', fields: [{ k: 'name', label: 'Company' }, { k: 'email', label: 'Submission e-mail' }, { k: 'web', label: 'Website' }, { k: 'focus', label: 'Genres they buy' }, { k: 'note', label: 'Notes' }] })
      .then(function (r) { if (!r || !r.name) return; var a = list(); a.push({ id: 'c' + Date.now(), name: r.name, email: r.email || '', web: r.web || '', focus: r.focus || '', genres: (r.focus || '').toLowerCase().split(/[,/]\s*/).filter(Boolean), accept: !!r.email, note: r.note || '', type: 'Custom', contact: '' }); cwrite(a); draw(); FILM.toast(r.name + ' added', 'good'); });
  });
  $('close').addEventListener('click', function () { d.close(); });
  d.addEventListener('close', function () { d.remove(); });
  draw(); d.showModal(); setTimeout(function () { $('q').focus(); }, 40);
}
FILM.register({
  id: 'contacts',
  mount: function () {
    FILM.addTile({ id: 'contacts', title: 'Contacts', sub: 'Distributors, sales, labs · e-mails prefilled', colour: '#00ABA9', icon: 'note', tag: 'MARKET', run: panel });
  },
  state: function () { return { count: list().length, genres: scriptGenres() }; }
});
FILM.contacts = { list: list, open: panel, genres: scriptGenres };
