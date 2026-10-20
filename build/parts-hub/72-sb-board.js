/* the storyboard board: frame cards, drawing, metadata, statuses and the four exports.
   Every frame's shot metadata comes from SB.inferShot() unless a person overrides it, and the
   whole board rides the bus as storyboard:board so it saves with the profile. */
var SBB = { board: [], drawing: { mode: 'pen', size: 2.5, colour: '#E2A93B' } };
var SB_STATUS = ['DRAFT','APPROVED','VFX','PICKUP','CUT'];
var SB_SIZES = ['ELS','WS','MS','MCU','CU','ECU'];
var SB_ANGLES = ['LOW','EYE','HIGH','POV','DUTCH'];
var SB_MOVES = ['STATIC','PAN','TILT','DOLLY IN-OUT','TRACKING','CRANE-JIB','HANDHELD','STEADICAM','PUSH ZOOM',"ONE'R"];
var SB_LIGHT = ['HIGH KEY','NATURAL','GOLDEN','LOW KEY','NEON'];
var SB_COLOURS = ['#E2A93B','#F4F1EA','#D64541','#5AA9E6','#8FC13F','#0A0E16'];
var SB_SIZES_PX = [1, 2.5, 5, 10];

function sbLoad() {
  var r = ModalSync.get('storyboard:board');
  SBB.board = (r && r.frames) ? r.frames : [];
}
function sbPub() {
  try { ModalSync.publish('storyboard:board', { frames: SBB.board, at: new Date().toISOString() }, 'board'); } catch (e) {}
}
function sbScriptLines() {
  var sp = ModalSync.get('screenplay:main');
  return (sp && sp.lines) ? sp.lines : null;
}
function sbFromScript() {
  var lines = sbScriptLines();
  if (!lines) { alert('Import a script first - the board is built from it.'); return; }
  var scenes = SB.parseScenes(lines);
  SBB.board = scenes.map(function (s, i) {
    var inf = SB.inferShot(s.heading, s.action);
    return { id: 'f' + Date.now() + '_' + i, heading: s.heading, chars: s.chars.slice(0), notes: s.action,
             size: inf.size, angle: inf.angle, movement: inf.movement, lighting: inf.lighting,
             status: 'DRAFT', why: inf.why };
  });
  sbPub(); sbRender();
}
function sbSyncBoard() {
  var lines = sbScriptLines();
  if (!lines) { alert('Import a script first.'); return; }
  SBB.board = SB.sync(SBB.board, SB.parseScenes(lines));
  sbPub(); sbRender();
}
function sbAddFrame() {
  SBB.board.push({ id: 'f' + Date.now(), heading: 'INT. NEW SCENE - DAY', chars: [], notes: '',
                   size: 'MS', angle: 'EYE', movement: 'STATIC', lighting: 'HIGH_KEY', status: 'DRAFT' });
  sbPub(); sbRender();
}
function sbdl(name, text, mime) {
  try {
    var b = new Blob([text], { type: mime || 'text/plain' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  } catch (e) { console.warn('download failed', e); }
}
function sbJSON() { sbdl('storyboard.json', JSON.stringify({ frames: SBB.board }, null, 2), 'application/json'); }
function sbCSV() {
  var head = ['Frame','Scene','Shot','Angle','Movement','Lighting','Characters','Status','Notes'];
  var rows = [head.join(',')];
  SBB.board.forEach(function (f, i) {
    rows.push([i + 1, f.heading, f.size, f.angle, f.movement, f.lighting,
               (f.chars || []).join(' / '), f.status, (f.notes || '').replace(/\s+/g, ' ')]
      .map(function (x) { return '"' + String(x == null ? '' : x).replace(/"/g, '""') + '"'; }).join(','));
  });
  sbdl('shot-list.csv', rows.join('\n'), 'text/csv');
}
function sbScript() { sbdl('storyboard-script.txt', SB.exportScript(SBB.board), 'text/plain'); }

function sbSelect(options, value, onchange) {
  var s = document.createElement('select');
  s.style.cssText = 'font-size:11.5px;padding:3px 5px;border-radius:5px';
  options.forEach(function (o) {
    var op = document.createElement('option');
    op.textContent = o; if (String(o) === String(value)) op.selected = true;
    s.appendChild(op);
  });
  s.onchange = function () { onchange(s.value); };
  return s;
}
function sbInput(value, ph, onchange, w) {
  var i = document.createElement('input');
  i.value = value == null ? '' : value; i.placeholder = ph || '';
  i.style.cssText = 'font-size:12px;padding:3px 6px;border-radius:5px;width:' + (w || '100%');
  i.onchange = function () { onchange(i.value); };
  return i;
}

function sbFrameCard(f, index) {
  var card = document.createElement('div');
  card.style.cssText = 'display:grid;grid-template-columns:170px 1fr;gap:12px;border:1px solid var(--line);' +
    'border-radius:9px;padding:10px;background:var(--panel);margin-bottom:10px';

  // canvas
  var left = document.createElement('div');
  var cv = document.createElement('canvas');
  cv.width = 320; cv.height = 180;
  cv.style.cssText = 'width:160px;height:90px;background:#0A0F1D;border-radius:6px;cursor:crosshair;display:block';
  left.appendChild(cv);
  var badge = document.createElement('button');
  badge.textContent = f.status;
  badge.style.cssText = 'margin-top:6px;font-size:10.5px;letter-spacing:.08em;padding:3px 7px;border-radius:5px;' +
    'background:transparent;border:1px solid ' + (f.status === 'CUT' ? 'var(--red)' : 'var(--line)') +
    ';color:' + (f.status === 'CUT' ? 'var(--red)' : '#C6D1DC');
  badge.onclick = function () {
    f.status = SB_STATUS[(SB_STATUS.indexOf(f.status) + 1) % SB_STATUS.length];
    sbPub(); sbRender();
  };
  left.appendChild(badge);
  card.appendChild(left);

  // right side fields
  var right = document.createElement('div');
  var row1 = document.createElement('div');
  row1.style.cssText = 'display:flex;gap:6px;align-items:center;margin-bottom:6px';
  var num = document.createElement('span');
  num.textContent = ('0' + (index + 1)).slice(-2);
  num.style.cssText = 'font-family:var(--fm);font-size:11px;color:var(--amber)';
  row1.appendChild(num);
  row1.appendChild(sbInput(f.heading, 'scene heading', function (v) { f.heading = v.toUpperCase(); sbPub(); }, '56%'));
  right.appendChild(row1);

  var row2 = document.createElement('div');
  row2.style.cssText = 'display:flex;gap:5px;flex-wrap:wrap;margin-bottom:6px';
  row2.appendChild(sbSelect(SB_SIZES, f.size, function (v) { f.size = v; sbPub(); }));
  row2.appendChild(sbSelect(SB_ANGLES, f.angle, function (v) { f.angle = v; sbPub(); }));
  row2.appendChild(sbSelect(SB_MOVES, f.movement, function (v) { f.movement = v; sbPub(); }));
  row2.appendChild(sbSelect(SB_LIGHT, f.lighting, function (v) { f.lighting = v; sbPub(); }));
  right.appendChild(row2);

  var row3 = document.createElement('div');
  row3.style.cssText = 'display:flex;gap:6px;margin-bottom:6px';
  row3.appendChild(sbInput((f.chars || []).join(', '), 'characters, comma separated',
    function (v) { f.chars = v.split(',').map(function (x) { return x.trim().toUpperCase(); }).filter(Boolean); sbPub(); }, '52%'));
  var photoBtn = document.createElement('button');
  photoBtn.textContent = f.photo ? 'photo ✓' : 'photo';
  photoBtn.style.cssText = 'font-size:11px;padding:3px 8px';
  photoBtn.onclick = function () {
    var url = window.prompt('Image URL (or leave blank to choose a file):', f.photo && f.photo.indexOf('data:') !== 0 ? f.photo : '');
    if (url) { f.photo = url; sbPub(); sbRender(); return; }
    var inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = function () {
      var file = inp.files && inp.files[0]; if (!file) return;
      var fr = new FileReader();
      fr.onload = function () { f.photo = fr.result; sbPub(); sbRender(); };
      fr.readAsDataURL(file);
    };
    inp.click();
  };
  row3.appendChild(photoBtn);
  right.appendChild(row3);

  var notes = document.createElement('textarea');
  notes.rows = 2; notes.value = f.notes || '';
  notes.placeholder = 'action notes for this shot';
  notes.style.cssText = 'width:100%;font-size:12px;border-radius:5px';
  notes.onchange = function () { f.notes = notes.value; sbPub(); };
  right.appendChild(notes);
  card.appendChild(right);

  // restore a sketch or a photo onto the canvas
  var ctx = cv.getContext('2d');
  ctx.fillStyle = '#0A0F1D'; ctx.fillRect(0, 0, cv.width, cv.height);
  if (f.sketch) { var im = new Image(); im.onload = function () { ctx.drawImage(im, 0, 0, cv.width, cv.height); }; im.src = f.sketch; }
  else if (f.photo) { var im2 = new Image(); im2.crossOrigin = 'anonymous';
    im2.onload = function () { ctx.drawImage(im2, 0, 0, cv.width, cv.height); }; im2.src = f.photo; }

  // drawing
  var drawing = false, last = null;
  function pos(e) {
    var r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (cv.width / r.width), y: (e.clientY - r.top) * (cv.height / r.height) };
  }
  cv.addEventListener('pointerdown', function (e) {
    drawing = true; last = pos(e); cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', function (e) {
    if (!drawing) return;
    var p = pos(e);
    ctx.globalCompositeOperation = SBB.drawing.mode === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = SBB.drawing.colour;
    ctx.lineWidth = SBB.drawing.size * (SBB.drawing.mode === 'eraser' ? 5 : 1);
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last = p;
  });
  function finish() {
    if (!drawing) return;
    drawing = false;
    try { f.sketch = cv.toDataURL('image/png'); } catch (e) {}
    if (f.sketch) { f.hasSketch = true; sbPub(); }
  }
  cv.addEventListener('pointerup', finish);
  cv.addEventListener('pointerleave', finish);
  return card;
}

function sbRender() {
  var host = document.getElementById('sbBoard');
  if (!host) return;
  host.innerHTML = '';
  if (!SBB.board.length) {
    host.innerHTML = '<p class="note">No frames yet. Import a script, then press <b>From Script</b> to build ' +
      'one frame per scene with the shot metadata already inferred.</p>';
    return;
  }
  SBB.board.forEach(function (f, i) { host.appendChild(sbFrameCard(f, i)); });
}

HUB.reg({
  id: 'storyboard', title: 'Storyboard', sub: 'Frames, drawing, shot metadata, sync and exports',
  tag: 'pre-production', colour: '#E2A93B',
  render: function (box) {
    box.innerHTML =
      '<div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:8px">' +
        '<button class="pri" id="sbAdd">Add frame</button>' +
        '<button id="sbFrom">From script</button>' +
        '<button id="sbSync">Sync board</button>' +
        '<button id="sbJson">Export JSON</button>' +
        '<button id="sbCsv">Export CSV</button>' +
        '<button id="sbDoc">Board to script</button>' +
      '</div>' +
      '<div class="row" style="gap:4px;flex-wrap:wrap;margin-bottom:10px;align-items:center">' +
        '<span class="note" style="margin-right:4px">Pen</span>' +
        '<button id="sbPen">pen</button><button id="sbEra">eraser</button>' +
        '<span class="note" style="margin:0 4px">Size</span>' +
        '<button data-size="1">XS</button><button data-size="2.5">S</button>' +
        '<button data-size="5">M</button><button data-size="10">L</button>' +
        '<span class="note" style="margin:0 4px">Colour</span>' +
        SB_COLOURS.map(function (c) {
          return '<button data-col="' + c + '" style="width:22px;height:22px;padding:0;background:' + c + ';border-radius:5px"></button>';
        }).join('') +
      '</div>' +
      '<div id="sbBoard"></div>';

    sbLoad();
    sbRender();

    document.getElementById('sbAdd').onclick = sbAddFrame;
    document.getElementById('sbFrom').onclick = sbFromScript;
    document.getElementById('sbSync').onclick = sbSyncBoard;
    document.getElementById('sbJson').onclick = sbJSON;
    document.getElementById('sbCsv').onclick = sbCSV;
    document.getElementById('sbDoc').onclick = sbScript;
    document.getElementById('sbPen').onclick = function () { SBB.drawing.mode = 'pen'; };
    document.getElementById('sbEra').onclick = function () { SBB.drawing.mode = 'eraser'; };
    box.querySelectorAll('[data-size]').forEach(function (b) {
      b.onclick = function () { SBB.drawing.size = parseFloat(b.getAttribute('data-size')); };
    });
    box.querySelectorAll('[data-col]').forEach(function (b) {
      b.onclick = function () { SBB.drawing.colour = b.getAttribute('data-col'); };
    });
    // keep the board current when a script is imported elsewhere
    try {
      ModalSync.watch('screenplay:main', function (rec) {
        if (rec.source === 'import' && document.getElementById('sbBoard')) {
          var hint = document.createElement('p');
          hint.className = 'note';
          hint.textContent = 'A new script arrived (' + ((rec.data && rec.data.lines) || []).length +
            ' lines). Press From Script to rebuild, or Sync Board to keep your drawings.';
          var host = document.getElementById('sbBoard');
          if (host && !document.getElementById('sbHint')) { hint.id = 'sbHint'; host.parentNode.insertBefore(hint, host); }
        }
      });
    } catch (e) {}
  }
});
