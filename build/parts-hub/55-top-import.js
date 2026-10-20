/* the master import strip. Three ways in - the member's saved profile, a file, or pasted text -
   and every one of them ends in the same place: HubImport parses it and publishes
   screenplay:main, cast:updated, locations:updated and scenes:list, so every tile has it at once.

   Formats: .fdx (final draft - typed), .json (writerduet or a saved profile - typed where it
   says so), .pdf (positions on a page - classified), .fountain/.txt (classified). */
(function () {
  function el(id) { return document.getElementById(id); }
  function say(msg) { var s = el('tiState'); if (s) s.textContent = msg; }

  function announce(res, counts) {
    say(res.format + ' · ' + counts.lines + ' lines · ' + counts.scenes + ' scenes · ' +
        counts.cast + ' characters · ' + counts.locations + ' locations');
    try { HubBridge.saveScript(); } catch (e) {}
  }

  function parseAndPublish(res) {
    var counts = HubImport.publish(res);
    announce(res, counts);
    return counts;
  }

  function fromFile(file) {
    say('reading ' + file.name + '…');
    HubImport.fromFile(file).then(parseAndPublish).catch(function (e) {
      say('could not read that file: ' + ((e && e.message) || e));
    });
  }

  function fromText(text) {
    if (!text || !text.trim()) { say('nothing pasted'); return; }
    parseAndPublish({ format: 'pasted text', filename: '', lines: HubImport.classifyLines(text),
                      confidence: 'classified from the text' });
  }

  function fromProfile() {
    say('asking the member profile…');
    try { HubBridge.load(); } catch (e) {}
    setTimeout(function () {
      var sp = ModalSync.get('screenplay:main');
      if (sp && sp.content) {
        var lines = (sp.lines && sp.lines.length) ? sp.lines.length : (sp.content || '').split('\n').length;
        say('from the member profile · ' + lines + ' lines · ' + ((sp.scenes || []).length) + ' scenes');
      } else {
        say('no script in the profile yet');
      }
    }, 1400);
  }

  function pasteDialog() {
    var t = window.prompt('Paste a screenplay, Fountain or plain text:', '');
    if (t) fromText(t);
  }

  function start() {
    var pick = el('tiPick'), input = el('tiFile'), prof = el('tiProfile'), past = el('tiPaste');
    if (pick && input) pick.onclick = function () { input.click(); };
    if (input) input.onchange = function () { if (this.files && this.files[0]) fromFile(this.files[0]); };
    if (prof) prof.onclick = fromProfile;
    if (past) past.onclick = pasteDialog;

    // a profile that arrives from the page should be reported here too
    try {
      ModalSync.watch('screenplay:main', function (rec) {
        if (rec.source === 'profile') {
          var d = rec.data || {};
          var n = (d.lines && d.lines.length) ? d.lines.length : (d.content || '').split('\n').length;
          say('from the member profile · ' + n + ' lines · ' + ((d.scenes || []).length) + ' scenes');
        }
      });
    } catch (e) {}
  }

  // test hook: run an import without the file picker
  window.TopImport = { run: parseAndPublish, fromText: fromText, fromProfile: fromProfile };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
