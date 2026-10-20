// backend/profiles.js
// The member profile lives in one Wix Data record. Every read and write happens here, on the
// server, so the member id comes from the session and never from the browser.
import { currentMember } from 'wix-members-backend';
import wixData from 'wix-data';

const COLLECTION = 'MemberProfiles';

async function whoAmI() {
  try {
    const m = await currentMember.getMember({ fieldsets: ['FULL'] });
    return m && m._id ? m._id : null;
  } catch (e) { return null; }
}

function parse(item) {
  if (!item || !item.profile) return null;
  try { return JSON.parse(item.profile); } catch (e) { return null; }
}

export async function loadProfile() {
  const id = await whoAmI();
  if (!id) return { mode: 'guest', profile: null, version: 0 };
  const res = await wixData.query(COLLECTION).eq('memberId', id).limit(1).find({ suppressAuth: true });
  const item = res.items[0];
  if (!item) return { mode: 'member', profile: null, version: 0 };
  return { mode: 'member', profile: parse(item), version: item.version || 0, updatedAt: item.updatedAt };
}

export async function saveProfile(patch, expectedVersion) {
  const id = await whoAmI();
  if (!id) return { ok: false, mode: 'guest' };

  const res = await wixData.query(COLLECTION).eq('memberId', id).limit(1).find({ suppressAuth: true });
  const item = res.items[0];
  const currentVersion = item ? (item.version || 0) : 0;

  if (item && expectedVersion != null && Number(expectedVersion) !== currentVersion) {
    return { ok: false, stale: true, profile: parse(item), version: currentVersion };
  }

  const stored = parse(item) || {};
  stored.tags = stored.tags || {};
  const incoming = (patch && patch.tags) || {};
  Object.keys(incoming).forEach(function (k) { stored.tags[k] = incoming[k]; });
  if (patch && patch.script != null) stored.script = patch.script;
  stored.version = currentVersion + 1;
  stored.updatedAt = new Date().toISOString();

  const sp = stored.tags['screenplay:main'];
  const record = {
    memberId: id,
    profile: JSON.stringify(stored),
    version: stored.version,
    updatedAt: new Date(),
    title: (sp && (sp.filename || sp.title)) || '',
  };

  if (item) await wixData.update(COLLECTION, Object.assign({}, item, record), { suppressAuth: true });
  else await wixData.insert(COLLECTION, record, { suppressAuth: true });

  return { ok: true, version: stored.version, updatedAt: stored.updatedAt };
}

export async function listTitles() {
  const id = await whoAmI();
  if (!id) return [];
  const res = await wixData.query(COLLECTION).eq('memberId', id).find({ suppressAuth: true });
  return res.items.map(function (i) { return { title: i.title, version: i.version, updatedAt: i.updatedAt }; });
}
