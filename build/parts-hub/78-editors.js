/* Third-party web editors, as tiles.

   These are not our code and none of it is bundled: each tile frames the editor where its authors
   host it, with attribution, and a button to open it full tab. Their terms and their storage
   apply - a drawing made in Photopea does not live in proHUB, and for Graphite and SVG-Edit the
   licence (Apache-2.0 / MIT) would allow bundling, but a WASM editor is not something to paste
   into a single HTML file.

   miniPaint is deliberately marked unverified: GitHub reports NOASSERTION for its licence, so it
   is framed and linked, never copied. */
var EDITORS = [
  { id:'photopea', title:'Photopea', sub:'Photoshop-class raster editor - not open source',
    url:'https://www.photopea.com/', colour:'#3B7BF6', note:'closest to Photoshop; hosted by Photopea' },
  { id:'graphite', title:'Graphite', sub:'Vector and raster - Apache-2.0, 27k stars',
    url:'https://editor.graphite.rs/', colour:'#E2A93B', note:'Illustrator-class, runs in the browser' },
  { id:'svgedit', title:'SVG-Edit', sub:'SVG vector editor - MIT',
    url:'https://svg-edit.github.io/svgedit/', colour:'#8FC13F', note:'light, made for SVG' },
  { id:'minipaint', title:'miniPaint', sub:'Photoshop-like - licence unverified (NOASSERTION)',
    url:'https://viliusle.github.io/miniPaint/', colour:'#B07CE8', note:'framed only; licence to be confirmed' },
  { id:'jspaint', title:'JS Paint', sub:'MS Paint, revived - MIT',
    url:'https://jspaint.app/', colour:'#5AA9E6', note:'quick touch-ups, tiny and reliable' }
];

for (var ei = 0; ei < EDITORS.length; ei++) {
  (function (ed) {
    HUB.reg({
      id: 'edit-' + ed.id, title: ed.title, sub: ed.sub, tag: 'tools', colour: ed.colour,
      render: function (box) {
        box.innerHTML =
          '<div class="row" style="gap:8px;margin-bottom:8px;flex-wrap:wrap">' +
            '<button class="pri" id="edOpen">Open in a new tab</button>' +
            '<span class="note">' + HUB.esc(ed.note) + '</span>' +
          '</div>' +
          '<div style="height:calc(100% - 46px);border:1px solid var(--line);border-radius:8px;overflow:hidden;background:#fff">' +
            '<iframe src="' + ed.url + '" title="' + HUB.esc(ed.title) + '" ' +
            'style="width:100%;height:100%;border:0" allow="clipboard-read; clipboard-write; fullscreen"></iframe>' +
          '</div>' +
          '<p class="note" style="margin-top:6px">Nothing you make here is stored in proHUB - the editor is ' +
          'their application, running from ' + HUB.esc(ed.url.replace(/^https?:\/\//,'').split('/')[0]) +
          '. Save your file from inside it, then attach it to a frame in the storyboard tile.</p>';
        var b = document.getElementById('edOpen');
        if (b) b.onclick = function () { window.open(ed.url, '_blank', 'noopener'); };
      }
    });
  })(EDITORS[ei]);
}
