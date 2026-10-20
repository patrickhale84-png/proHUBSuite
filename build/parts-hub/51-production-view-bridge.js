// in proHUBADpro.html, inside its script - accept a view request from the hub
window.addEventListener('message', function (e) {
  var d = e.data || {};
  if (d.hub !== 'view' || !d.tab) return;
  var btn = document.getElementById('tab-' + d.tab);
  if (btn) btn.click();                     // the file already knows how to switch
});
