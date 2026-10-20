/* FilmCraft, running on your own ArtCraft launcher, as one tile.

   The launcher serves each installed app at /apps/<name>/ - so the tile needs the server's base
   address and nothing else. Paste it once: it is remembered in localStorage and published on the
   bus, so it follows the profile rather than being baked into this file. */
var ART = { base: '' };

HUB.reg({
  id: 'filmcraft', title: 'FilmCraft', sub: 'Non-linear editor and colour, in the browser',
  tag: 'production', colour: '#E8703A',
  render: function (box) {
    try { ART.base = localStorage.getItem('artcraft_base') || ''; } catch (e) {}
    try { var t = ModalSync.get('ui:artcraft'); if (t && t.base) ART.base = t.base; } catch (e) {}

    function clean(u) {
      return String(u || '').trim().replace(/\/+$/, '').replace(/\/apps\/[a-z]+\/?$/i, '');
    }
    function draw() {
      if (!ART.base) {
        box.innerHTML =
          '<p class="note" style="line-height:1.7">FilmCraft runs from an ArtCraft launcher - the ' +
          'server from <b>mccoy88f/craft-launcher-docker</b>. Paste its address once and this tile ' +
          'frames <b>/apps/filmcraft/</b> on it.</p>' +
          '<div class="row" style="gap:6px;margin-top:10px;flex-wrap:wrap">' +
            '<input id="artBase" placeholder="https://prohub.yourdomain.com" style="flex:1;min-width:240px">' +
            '<button class="pri" id="artSave">Connect</button></div>' +
          '<p class="note" style="margin-top:10px">Two things must be true on that server: the ' +
          'app is <b>installed</b> through the launcher (otherwise /apps/filmcraft/ is a 404) and ' +
          'ports 80/443 reach it so Caddy can hold the certificate.</p>';
        document.getElementById('artSave').onclick = function () {
          ART.base = clean(document.getElementById('artBase').value);
          if (!ART.base) return;
          if (!/^https?:\/\//.test(ART.base)) ART.base = 'https://' + ART.base;
          try { localStorage.setItem('artcraft_base', ART.base); } catch (e) {}
          try { ModalSync.publish('ui:artcraft', { base: ART.base }, 'hub'); } catch (e) {}
          draw();
        };
        return;
      }
      var url = ART.base + '/apps/filmcraft/';
      box.innerHTML =
        '<div class="row" style="gap:8px;margin-bottom:8px;flex-wrap:wrap">' +
          '<button class="pri" id="artOpen">Open in a new tab</button>' +
          '<button id="artChange">Change server</button>' +
          '<span class="note">' + HUB.esc(url) + '</span></div>' +
        '<div style="height:calc(100% - 46px);border:1px solid var(--line);border-radius:8px;overflow:hidden;background:#1b1c1f">' +
          '<iframe src="' + HUB.esc(url) + '" title="FilmCraft" style="width:100%;height:100%;border:0" ' +
          'allow="clipboard-read; clipboard-write; fullscreen"></iframe></div>' +
        '<p class="note" style="margin-top:6px">Nothing is stored here: the editor and your media ' +
        'stay in that browser. A blank frame almost always means the app is not installed on the ' +
        'launcher, or the host is missing the certificate.</p>';
      document.getElementById('artOpen').onclick = function () { window.open(url, '_blank', 'noopener'); };
      document.getElementById('artChange').onclick = function () {
        ART.base = '';
        try { localStorage.removeItem('artcraft_base'); } catch (e) {}
        draw();
      };
    }
    draw();
  }
});
