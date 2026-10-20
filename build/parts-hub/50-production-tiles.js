/* the production desk's nine views, as tiles.
   Each tile does not copy the panel: it asks the desk to switch to that view, so the
   JS that fills the panel keeps running where it lives.
   The desk must be listening - see 51-production-view-bridge.js */

var PRODUCTION_TILES=[
 { tab:'schedule', title:"One-line schedule", sub:"Stripboard, day breaks, shoot order", colour:'#E8703A' },
 { tab:'callsheet', title:"Call sheets", sub:"Per-day sheet, cast in-times, crew calls", colour:'#A78BFA' },
 { tab:'screenplay', title:"Screenwriter", sub:"The draft and its tabs", colour:'#E2A93B' },
 { tab:'cast', title:"Crew and cast", sub:"The people and their calls", colour:'#8FC13F' },
 { tab:'shots', title:"A/V studio", sub:"Shot list, camera, capture", colour:'#5AA9E6' },
 { tab:'props', title:"Assets and locations", sub:"Props, SFX, VFX, locations", colour:'#C08457' },
 { tab:'budget', title:"Standard budget", sub:"Line items and totals", colour:'#D64541' },
 { tab:'indieplus', title:"indiePLUS", sub:"The locked master budget", colour:'#B07CE8' },
 { tab:'shootingscript', title:"Shooting script", sub:"Script order, optimised for the day", colour:'#4FB3A6' },
];

for (var i = 0; i < PRODUCTION_TILES.length; i++) {
  (function (spec) {
    HUB.reg({
      id: 'prod-' + spec.tab,
      title: spec.title,
      sub: spec.sub || 'the production desk',
      tag: 'production',
      colour: spec.colour,
      render: function (box) {
        box.innerHTML = '<div class="row" style="margin-bottom:10px"><button class="pri" id="pGo">Open ' +
          HUB.esc(spec.title) + '</button><span class="note">the desk opens on this view</span></div>' +
          '<div id="pFrame" style="height:calc(100% - 52px);border:1px solid var(--line);border-radius:8px;overflow:hidden"></div>';
        var f = document.createElement('iframe');
        f.src = 'proHUBADpro.html';
        f.style.cssText = 'width:100%;height:100%;border:0;background:#05070B';
        f.onload = function () {
          try { f.contentWindow.postMessage({ hub: 'view', tab: spec.tab }, '*'); } catch (e) {}
        };
        document.getElementById('pFrame').appendChild(f);
        document.getElementById('pGo').onclick = function () {
          try { f.contentWindow.postMessage({ hub: 'view', tab: spec.tab }, '*'); } catch (e) {}
        };
      }
    });
  })(PRODUCTION_TILES[i]);
}
