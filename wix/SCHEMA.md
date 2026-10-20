# MemberProfiles - collection schema

Create this in the Wix editor: **Content Manager -> Create Collection -> MemberProfiles**,
then add the fields exactly as below. Wix cannot create a collection from code, so this has to
be done once by hand; the backend module and the page code already assume it exists.

## Fields

| Field | Type | Notes |
|---|---|---|
| `title` | Text | internal name for the record; the field id must be lowercase `title` |
| `memberId` | Text | the Wix member `_id`; written only by the backend module |
| `profile` | Text | the whole profile as a JSON string - schema-free, so new sync tags need no migration |
| `version` | Number | incremented server-side on every accepted write |
| `updatedAt` | Date | for "last saved" and for ordering |

Wix adds `_id`, `_createdDate`, `_updatedDate` automatically.

## Permissions

- **Read:** Member
- **Write:** Member
- **Delete:** Admin

The backend module runs with `suppressAuth`, so it can read and write regardless - but keeping
the collection member-only means a visitor cannot reach it directly from a public page.

## Index

Create a **unique** index on `memberId`:

Content Manager -> MemberProfiles -> More Actions -> Manage indexes -> Add index
  Fields: memberId        Order: Ascending        Unique: yes

**This index is not optional.** Without it two tabs saving at the same moment can insert two
rows for one member, and `saveProfile` will then read whichever row happens to come back first -
so the version check passes against the wrong record and one edit silently disappears.

## Why one JSON string instead of a field per tag

The tag set grows: `screenplay:main`, `cast:updated`, `locations:updated`, `scenes:list`,
`shots:updated`, `schedule:changed`, `vendors:list`, `checkins:list`. A field-per-tag schema
means a migration every time a modality is added; one `profile` string means none.

The limit to respect: a collection item is capped at about a megabyte. **Binary content does not
belong here** - board PNGs, reference images and exported PDFs go to the Media Manager, and the
profile stores their URLs.

## Reading and writing

- `loadProfile()` returns `{ mode, profile, version, updatedAt }` - `mode` is `guest` when nobody
  is signed in, and `profile` is `null` for a member who has never saved.
- `saveProfile(patch, expectedVersion)` merges `patch.tags` into the stored tags, treats a `null`
  value as **delete that tag**, bumps `version`, and returns one of:
  `{ ok: true, version }` · `{ ok: false, stale: true, profile, version }` · `{ ok: false, mode: 'guest' }`
- `listTitles()` returns `{ title, version, updatedAt }` per record, for a project picker.

## Verifying the wiring

Sign in, then from the browser console on the page:

```js
import('backend/selftest.js').then(m => m.run()).then(console.log)
```

It writes a test tag, reads it back, attempts a stale write and expects it to be refused, then
removes the tag. If `stale write refused` is `false`, the unique index or the version comparison
is wrong - fix that before trusting saves.
