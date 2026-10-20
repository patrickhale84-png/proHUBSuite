// backend/selftest.js - proves the store round-trips and that a stale write is refused.
// Call it once from the page console while signed in:  import { run } from 'backend/selftest.js'
import { loadProfile, saveProfile } from 'backend/profiles.js';

export async function run() {
  const out = [];
  const before = await loadProfile();
  out.push('mode: ' + before.mode + '   version: ' + before.version);
  if (before.mode === 'guest') { out.push('STOP: sign in first, guest mode has no profile'); return out; }

  const v0 = before.version;
  const stamp = new Date().toISOString();

  const first = await saveProfile({ tags: { 'selftest:roundtrip': { at: stamp } } }, v0);
  out.push('write accepted: ' + (first.ok === true) + '   version now ' + first.version);

  const after = await loadProfile();
  const tag = after.profile && after.profile.tags && after.profile.tags['selftest:roundtrip'];
  out.push('read back the same tag: ' + (!!tag && tag.at === stamp));

  const stale = await saveProfile({ tags: { 'selftest:stale': { n: 1 } } }, v0);
  out.push('stale write refused: ' + (stale.stale === true) + '   server version ' + stale.version);

  const clean = await saveProfile({ tags: { 'selftest:roundtrip': null } }, stale.version);
  out.push('cleanup by null: ' + (clean.ok === true) + '   version now ' + clean.version);

  const final = await loadProfile();
  out.push('tag removed: ' + !(final.profile && final.profile.tags && final.profile.tags['selftest:roundtrip']));
  return out;
}
