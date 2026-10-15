/* filmHUB - roles
   The front desk adapts to who is holding it. Pick a role and the grid rearranges to that
   person's jobs - a director does not need a call sheet, a 1st AD does not need the pitch deck.

   Each role owns a set of tiles. Switching removes the previous role's tiles and adds the new
   one's through FILM.addTile/removeTile, so the tile manager's reorder and sizing still work. */
var ROLE_KEY = 'filmhub_role_v1';
var APP = { pre: '#00ABA9', pro: '#E51400', post: '#7137C8', desk: '#E2A93B' };

var ROLES = [
  { id: 'director', label: 'Director', blurb: 'Script, boards and the money',
    tiles: [
      { id: 'role-desk',   title: 'Writing desk',   sub: 'Script · navigator · breakdown', colour: APP.pre,  icon: 'grid',  url: 'prehub.html' },
      { id: 'role-boards', title: 'Storyboards',    sub: 'Panels · shot deck · staging',   colour: APP.pre,  icon: 'film',  url: 'prehub.html' },
      { id: 'role-budget', title: 'Budget',         sub: 'Macro · fringes · cost report',  colour: APP.pro,  icon: 'out',   url: 'prohub.html' },
      { id: 'role-pitch',  title: 'Pitch deck',     sub: 'Slides from the boards',         colour: APP.pro,  icon: 'grid',  url: 'prohub.html' },
      { id: 'role-review', title: 'Review notes',   sub: 'Timecoded notes on cuts',        colour: APP.post, icon: 'note',  url: 'posthub.html' }
    ] },
  { id: 'first', label: '1st AD', blurb: 'The day, the sheet, the crew',
    tiles: [
      { id: 'role-oneline', title: 'One-line schedule', sub: 'Stripboard · day breakdown',  colour: APP.pro,  icon: 'list',  url: 'prohub.html#board' },
      { id: 'role-sheet',   title: 'Call sheets',       sub: 'Times · locations · weather', colour: APP.pro,  icon: 'clock', url: 'prohub.html#sheet' },
      { id: 'role-crew',    title: 'Crew and dept heads', sub: 'Call times · contacts',     colour: APP.pro,  icon: 'grid',  url: 'prohub.html#checkin' },
      { id: 'role-gear',    title: 'Gear',              sub: 'Kit list · allocations',      colour: APP.pro,  icon: 'out',   url: 'prohub.html#gear' },
      { id: 'role-locs',    title: 'Locations',         sub: 'Units · access · contacts',   colour: APP.pro,  icon: 'map',   url: 'prohub.html#locations' },
      { id: 'role-sides',   title: 'Sides',             sub: 'The day\'s scenes to print',  colour: APP.pre,  icon: 'film',  url: 'prehub.html' }
    ] },
  { id: 'editor', label: 'Editor', blurb: 'The cut and everything around it',
    tiles: [
      { id: 'role-ingest',  title: 'Ingest',            sub: 'Media from the drive',        colour: APP.post, icon: 'in',    url: 'posthub.html#ingest' },
      { id: 'role-cut',     title: 'Timeline',          sub: 'Cut list · Build By Storyboard', colour: APP.post, icon: 'list',  url: 'posthub.html#timeline' },
      { id: 'role-notes',   title: 'Notes',             sub: 'Timecoded annotations',       colour: APP.post, icon: 'note',  url: 'posthub.html#notes' },
      { id: 'role-sync',    title: 'Sync and delivery', sub: 'Platforms · send times',      colour: APP.post, icon: 'out',   url: 'posthub.html#sync' },
      { id: 'role-boards2', title: 'Storyboards',       sub: 'What each shot was for',      colour: APP.pre,  icon: 'film',  url: 'prehub.html' },
      { id: 'role-script',  title: 'Shooting script',   sub: 'The draft as shot',           colour: APP.pre,  icon: 'grid',  url: 'prehub.html' }
    ] },
  { id: 'crew', label: 'Crew', blurb: 'Your day, your kit, your sides',
    tiles: [
      { id: 'role-calltime', title: 'My call time',   sub: 'When you are wanted',           colour: APP.desk, icon: 'clock', url: 'prohub.html#sheet' },
      { id: 'role-mysides',  title: 'My sides',       sub: 'Only your scenes',              colour: APP.pre,  icon: 'film',  url: 'prehub.html' },
      { id: 'role-mygear',   title: 'My gear',        sub: 'What you are responsible for',  colour: APP.pro,  icon: 'out',   url: 'prohub.html#gear' },
      { id: 'role-checkin',  title: 'Check in',       sub: 'Tell the desk you have landed', colour: APP.pro,  icon: 'in',    url: 'prohub.html#checkin' },
      { id: 'role-here',     title: 'Where we are',   sub: 'Unit and access',               colour: APP.pro,  icon: 'map',   url: 'prohub.html#locations' }
    ] }
];

function jread(k, d) { try { var r = localStorage.getItem(k); return r ? JSON.parse(r) : d; } catch (e) { return d; } }
function jwrite(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
function find(id) { for (var i = 0; i < ROLES.length; i++) if (ROLES[i].id === id) return ROLES[i]; return null; }
function current() { return jread(ROLE_KEY, null); }
function openUrl(u) {
  if (!u) return;
  var emb = false; try { emb = window.self !== window.top; } catch (e) { emb = true; }
  if (emb) { var w = null; try { w = window.open(u, '_blank'); } catch (e) { w = null; } if (w) return;
             try { window.top.location.href = u; return; } catch (e) {} }
  try { location.href = u; } catch (e) {}
}
function toTile(t) {
  return { id: t.id, title: t.title, sub: t.sub, colour: t.colour, icon: t.icon, tag: 'ROLE',
           run: function () { openUrl(t.url); } };
}
function clearRoleTiles() {
  var all = FILM.tiles() || [];
  for (var i = 0; i < all.length; i++) if (String(all[i].id).indexOf('role-') === 0) FILM.removeTile(all[i].id);
}
function applyRole() {
  var r = find(current());
  if (!r) return false;
  clearRoleTiles();
  for (var i = 0; i < r.tiles.length; i++) FILM.addTile(toTile(r.tiles[i]));
  if (r.tiles.length) FILM.tileOps.nudge(r.tiles[0].id, -1);   /* pull the role's tiles up */
  return r.id;
}
function setRole(id) {
  var r = find(id);
  if (!r) return false;
  jwrite(ROLE_KEY, id);
  applyRole();
  var chip = document.getElementById('roleChip');
  if (chip) chip.textContent = r.label.toUpperCase();
  if (typeof FILM.toast === 'function') FILM.toast('Layout set for ' + r.label, 'good');
  return true;
}
function chooser() {
  var rows = [];
  for (var i = 0; i < ROLES.length; i++) {
    var r = ROLES[i], on = (current() === r.id);
    rows.push('<button type="button" class="btn" data-role="' + r.id + '" style="display:block;width:100%;text-align:left;margin-bottom:8px' +
      (on ? ';border-color:#E2A93B;color:#fff' : '') + '">' +
      '<b style="font-family:var(--fd);font-size:18px;letter-spacing:.03em">' + r.label.toUpperCase() + '</b>' +
      '<span style="display:block;font-size:13px;color:#8794A6;font-weight:400">' + r.blurb + ' · ' + r.tiles.length + ' tiles</span></button>');
  }
  FILM.ask({
    title: 'Who is holding the desk?', icon: 'grid', ok: 'Close', cancel: false,
    html: '<div class="db" style="padding:0">' + rows.join('') +
      '<p style="margin:6px 0 0;font-size:13px;color:#8794A6">The grid rearranges to that role. Switch any time from the top bar.</p></div>'
  }).then(function () {});
  setTimeout(function () {
    var d = document.querySelector('dialog[open]'); if (!d) return;
    var bs = d.querySelectorAll('[data-role]');
    for (var j = 0; j < bs.length; j++) {
      bs[j].onclick = function () { setRole(this.getAttribute('data-role')); d.close(); };
    }
  }, 80);
}

FILM.register({
  id: 'roles',
  mount: function () {
    var bar = document.querySelector('.topbar .tright');
    if (bar && !document.getElementById('roleChip')) {
      var chip = document.createElement('button');
      chip.className = 'chip'; chip.id = 'roleChip';
      chip.style.cursor = 'pointer';
      chip.textContent = (find(current()) ? find(current()).label.toUpperCase() : 'CHOOSE ROLE');
      chip.onclick = chooser;
      bar.insertBefore(chip, bar.firstChild);
    }
    if (!current()) {
      FILM.addTile({ id: 'role-choose', title: 'Choose your role', sub: 'The desk adapts to it', colour: '#E2A93B', icon: 'grid', tag: 'START', run: chooser });
      setTimeout(chooser, 600);
    } else {
      applyRole();
    }
  },
  state: function () {
    var r = find(current());
    return { role: r ? r.id : null, roles: ROLES.map(function (x) { return x.id; }),
             tiles: r ? r.tiles.map(function (t) { return t.id; }) : [],
             chosen: !!r };
  }
});
FILM.roles = function () { return ROLES.map(function (r) { return { id: r.id, label: r.label, tiles: r.tiles.length }; }); };
FILM.setRole = setRole;
FILM.chooseRole = chooser;
