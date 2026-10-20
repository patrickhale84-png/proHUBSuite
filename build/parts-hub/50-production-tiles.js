/* the production desk, split into nine single-view files. Each tile opens its own file. */
var PRODUCTION_TILES=[
 {tab:"schedule",file:"desk/schedule.html",title:"One-line schedule"},
 {tab:"callsheet",file:"desk/callsheet.html",title:"Call sheets"},
 {tab:"screenplay",file:"desk/screenplay.html",title:"Screenwriter"},
 {tab:"cast",file:"desk/cast.html",title:"Crew and cast"},
 {tab:"shots",file:"desk/shots.html",title:"A/V studio"},
 {tab:"props",file:"desk/props.html",title:"Assets and locations"},
 {tab:"budget",file:"desk/budget.html",title:"Standard budget"},
 {tab:"indieplus",file:"desk/indieplus.html",title:"indiePLUS"},
 {tab:"shootingscript",file:"desk/shootingscript.html",title:"Shooting script"},
];

for (var i = 0; i < PRODUCTION_TILES.length; i++) {
  (function (spec) {
    HUB.reg({
      id: 'prod-' + spec.tab, title: spec.title, sub: 'the production desk', tag: 'production',
      colour: '#E8703A',
      render: function (box) {
        box.innerHTML = '<div style="height:100%;border:1px solid var(--line);border-radius:8px;overflow:hidden">' +
                        '<iframe src="' + spec.file + '" style="width:100%;height:100%;border:0;background:#05070B"></iframe></div>';
      }
    });
  })(PRODUCTION_TILES[i]);
}
