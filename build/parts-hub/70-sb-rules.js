/* Storyboard rules engine and script sync.

   No AI, no network, deterministic. Every inference is a set of scored keyword matches, and the
   engine returns the scores it used - so a director can see exactly why a frame was called MCU.

   spec: four axes, each a list of [regex, value, points]; all matching rules accumulate toward
   their value, highest total wins, fallbacks apply when nothing fires. */
var SB_RULES = {
  size: [
    [/aerial|drone shot|birds.?eye|extreme wide|establishing shot/, 'ELS', 10],
    [/wide shot|wide angle|master shot|full shot/, 'WS', 9],
    [/exterior/, 'WS', 6],
    [/medium shot|waist up|two shot|over the shoulder/, 'MS', 9],
    [/dialogue|conversation|sitting/, 'MS', 7],
    [/medium close|chest up|medium close.?up/, 'MCU', 9],
    [/close.?up|\bface\b|reaction|tight on/, 'CU', 9],
    [/extreme close|eyes only|detail shot|macro/, 'ECU', 10],
    [/texture|insert shot/, 'ECU', 7]
  ],
  angle: [
    [/low angle|worm.?s eye|from below|ground level/, 'LOW', 9],
    [/high angle|overhead|bird.?s eye|looking down/, 'HIGH', 9],
    [/point of view|pov shot|first person|through his eyes/, 'POV', 9],
    [/dutch angle|canted|tilted frame/, 'DUTCH', 8],
    [/eye level/, 'EYE', 6]
  ],
  movement: [
    [/\bpan\b|panning|pan left|pan right|swish pan/, 'PAN', 8],
    [/tilt up|tilt down|tilting/, 'TILT', 8],
    [/dolly in|dolly out|dolly shot|dolly/, 'DOLLY', 8],
    [/tracking shot|follow shot|trucking/, 'TRACK', 8],
    [/crane shot|\bjib\b|boom shot/, 'CRANE', 8],
    [/hand.?held|shaky cam|verit/, 'HANDHELD', 9],
    [/steadicam|stabilized|smooth follow/, 'STEADICAM', 9],
    [/zoom in|zoom out|push zoom|smash zoom/, 'ZOOM', 8],
    [/one.?r\b|one shot|continuous take|unbroken/, 'ONER', 9]
  ],
  lighting: [
    [/golden hour|magic hour|sunrise|sunset/, 'GOLDEN', 9],
    [/warm light|late afternoon/, 'GOLDEN', 7],
    [/low key|noir|shadows|dark alley|moonlight/, 'LOW_KEY', 8],
    [/night/, 'LOW_KEY', 7],
    [/single source|candle|flashlight/, 'LOW_KEY', 8],
    [/neon|cyberpunk|fluorescent|club lighting/, 'NEON', 9],
    [/bright|well lit|daytime interior|studio/, 'HIGH_KEY', 7],
    [/white/, 'HIGH_KEY', 4],
    [/natural light|sunlight|overcast|diffused light/, 'NATURAL', 7],
    [/exterior/, 'NATURAL', 6]
  ]
};

function sbScore(text, rules) {
  var acc = {}, best = null, bestPts = 0;
  for (var i = 0; i < rules.length; i++) {
    if (rules[i][0].test(text)) {
      var v = rules[i][1], p = rules[i][2];
      acc[v] = (acc[v] || 0) + p;
      if (acc[v] > bestPts) { bestPts = acc[v]; best = v; }
    }
  }
  return { value: best, points: bestPts, scores: acc };
}

function inferShot(heading, action) {
  var h = String(heading || '').toUpperCase();
  var text = (String(heading || '') + ' ' + String(action || '')).toLowerCase();
  var s = sbScore(text, SB_RULES.size);
  var a = sbScore(text, SB_RULES.angle);
  var m = sbScore(text, SB_RULES.movement);
  var l = sbScore(text, SB_RULES.lighting);
  var isExt = /\bEXT\b/.test(h), isNight = /NIGHT/.test(h);
  var out = {
    size: s.value || (isExt ? 'WS' : 'MS'),
    angle: a.value || 'EYE',
    movement: m.value || 'STATIC',
    lighting: l.value || (isNight ? 'LOW_KEY' : (isExt ? 'NATURAL' : 'HIGH_KEY')),
    why: { size: s.scores, angle: a.scores, movement: m.scores, lighting: l.scores },
    fallback: { size: !s.value, angle: !a.value, movement: !m.value, lighting: !l.value }
  };
  return out;
}

/* ---- script scenes ---- */
function sbNormHeading(t) {
  // scene numbers are production bookkeeping, not part of the location: "1 INT. DINER" and
  // "INT. DINER" must key to the same scene or sync invents duplicates beside the real frame
  return String(t || '')
    .replace(/^\s*\d+[A-Za-z]?[.)]?\s+/, '')
    .replace(/\s+/g, ' ').trim().toUpperCase();
}
function sbBaseHeading(t) {
  return sbNormHeading(t).replace(/\s*[-\u2013]\s*(DAY|NIGHT|DAWN|DUSK|LATER|CONTINUOUS|MOMENTS LATER)\s*$/i, '').trim();
}
function sbParseScenes(lines) {
  var scenes = [], cur = null;
  (lines || []).forEach(function (l) {
    if (l.type === 'SCENE_HEADING') {
      cur = { heading: sbNormHeading(l.text), action: '', chars: [], dialogue: '' };
      scenes.push(cur);
    } else if (cur) {
      if (l.type === 'ACTION') cur.action += (cur.action ? ' ' : '') + (l.text || '');
      if (l.type === 'CHARACTER') {
        var c = String(l.text || '').replace(/\(.*\)/g, '').trim().toUpperCase();
        if (c && cur.chars.indexOf(c) < 0) cur.chars.push(c);
      }
      if (l.type === 'DIALOGUE') cur.dialogue += (cur.dialogue ? ' ' : '') + (l.text || '');
    }
  });
  return scenes;
}

/* ---- reconcile a board against a script ---- */
/* board: [{heading, ...whatever the frame carries}]; scenes: from sbParseScenes */
function syncBoardToScript(board, scenes) {
  var exact = {}, base = {};
  for (var i = 0; i < scenes.length; i++) {
    exact[sbNormHeading(scenes[i].heading)] = i;
    base[sbBaseHeading(scenes[i].heading)] = i;
  }
  var frames = [];
  (board || []).forEach(function (f) {
    var h = sbNormHeading(f.heading), hb = sbBaseHeading(f.heading);
    var si = null;
    if (exact[h] != null) si = exact[h];
    else if (base[hb] != null) si = base[hb];
    else {
      for (var k = 0; k < scenes.length; k++) {                 // fuzzy: same INT./EXT. + first location token
        var sh = sbNormHeading(scenes[k].heading);
        if (sh.indexOf(h.split(' ').slice(0, 2).join(' ')) === 0) { si = k; break; }
      }
    }
    var copy = {};
    for (var key in f) copy[key] = f[key];
    if (si == null) { copy._si = 9999; copy.status = 'CUT'; }
    else { copy._si = si; }
    frames.push(copy);
  });
  var have = {};
  frames.forEach(function (f) { if (f._si !== 9999) have[f._si] = true; });
  for (var s = 0; s < scenes.length; s++) {
    if (!have[s]) {
      var inf = inferShot(scenes[s].heading, scenes[s].action);
      frames.push({ heading: scenes[s].heading, chars: scenes[s].chars.slice(0), action: scenes[s].action,
                    size: inf.size, angle: inf.angle, movement: inf.movement, lighting: inf.lighting,
                    status: 'DRAFT', _si: s, _new: true });
    }
  }
  frames.sort(function (x, y) { return x._si - y._si; });
  return frames;
}

/* ---- board back out to a working document ---- */
function exportBoardAsScript(frames) {
  var out = [], n = 0;
  (frames || []).forEach(function (f) {
    if (f.status === 'CUT') return;
    n++;
    var id = ('0' + n).slice(-2);
    out.push('FRAME ' + id + ' \u2014 ' + sbNormHeading(f.heading));
    out.push('Shot: ' + (f.size || '-') + ' | Angle: ' + (f.angle || '-') +
             ' | Movement: ' + (f.movement || '-') + ' | Lighting: ' + (f.lighting || '-'));
    if (f.chars && f.chars.length) out.push('Characters: ' + f.chars.join(', '));
    out.push('');
    if (f.action) { out.push('ACTION'); out.push(f.action); out.push(''); }
    if (f.hasPhoto) out.push('[VISUAL REFERENCE ATTACHED]');
    if (f.hasSketch) out.push('[SKETCH DRAWING PRESENT]');
    out.push('');
  });
  return out.join('\n');
}

if (typeof window !== 'undefined') {
  window.SB = { rules: SB_RULES, score: sbScore, inferShot: inferShot, parseScenes: sbParseScenes,
                sync: syncBoardToScript, exportScript: exportBoardAsScript,
                normHeading: sbNormHeading, baseHeading: sbBaseHeading };
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { inferShot: inferShot, sync: syncBoardToScript, parseScenes: sbParseScenes,
                     exportScript: exportBoardAsScript };
}
