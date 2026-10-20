// page code - the HTML component talks to this, this talks to the backend module
import { loadProfile, saveProfile } from 'backend/profiles.js';

// the hub lives on its own origin; every postMessage is addressed to it, and anything arriving
// from elsewhere is ignored. Wix's onMessage may not expose event.origin - where it does not,
// the hub's own check is the one doing the work, so keep both.
const HUB_ORIGIN = 'https://silver-heliotrope-2122e8.netlify.app';   // <-- your hosted hub
const FRAME = '#hubFrame';        // rename to your HTML component id
let queue = Promise.resolve();    // serialise writes - two fast saves must not race

function send(msg) {
  try { $w(FRAME).postMessage(msg, HUB_ORIGIN); } catch (e) { /* frame not ready yet */ }
}

$w.onReady(async function () {
  const boot = await loadProfile();
  send({ hub: 'profile', profile: boot.profile, version: boot.version, mode: boot.mode });

  $w(FRAME).onMessage(function (event) {
      if (event && event.origin && event.origin !== HUB_ORIGIN) return;
    const d = event.data || {};

    if (d.hub === 'profile:load') {
      loadProfile().then(function (r) {
        send({ hub: 'profile', profile: r.profile, version: r.version, mode: r.mode });
      });
      return;
    }

    if (d.hub === 'profile:save') {
      const expected = (d.version != null) ? d.version
                     : (d.profile && d.profile.version != null) ? d.profile.version
                     : null;
      const patch = d.changes || d.profile || {};

      queue = queue.then(function () {
        return saveProfile(patch, expected).then(function (r) {
          if (r.ok) send({ hub: 'saved', id: d.id, version: r.version });
          else if (r.stale) send({ hub: 'stale', id: d.id, profile: r.profile, version: r.version });
          else send({ hub: 'guest', id: d.id });
        });
      }).catch(function (err) {
        send({ hub: 'error', id: d.id, message: String((err && err.message) || err).slice(0, 200) });
      });
      return;
    }
  });
});
