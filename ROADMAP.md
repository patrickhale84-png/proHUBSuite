# proHUB Suite - roadmap and current state

Four single-file apps, one per stage of a production. Each is one `.html` you paste into a Wix
**Embed HTML** element, or serve standalone. No build step at run time, no accounts, no AI.

## Status

| File | Size | State |
|---|---|---|
| `prohub.html` | 139,788 | **Built, verified in CI 8/0** - nine module tiles, all nine desks open, storage, no console errors |
| `prehub.html` | 86,914 | **Built, verified in CI 9/0** - assembled from parts with lighting, pose and camera modules |
| `filmhub.html` | 39,502 | **Built, verified in CI 3/0** - assembled from parts; shell, banner and launcher measured working |
| `posthub.html` | 82,861 | **Built, five desks, partially verified** - assembled from parts |

## Assembly and parse gates

Three of the four apps are **assembled from parts** (`build/parts`, `build/parts-filmhub`,
`build/parts-posthub`) by `build/build.py`, and CI assembles and `node --check`s every one on
every push:

```
python3 build/build.py                # every app -> build/out/<app>.html + <app>.js
python3 build/build.py --app posthub  # one app
```

Each app declares an **anchor**, and modules are inserted immediately before it:

| App | Anchor | Why |
|---|---|---|
| prehub | `window.preHUB={version:'1.0'` | modules land *inside* the shell IIFE |
| filmhub | `</script>` | modules land *after* the shell IIFE, because `FILM` is defined at its end |
| posthub | `</script>` | same reason, for `POST` |

Modules are wrapped in their own IIFE by the assembler. A bare block appended after the previous
`})();` does not parse - that rule cost this project three broken files, and the assembler exists
so nobody has to remember it.

**`prohub.html` is the exception: a single hand-maintained file, not assembled, and therefore the
only app without a parse gate.** Splitting it into parts is the outstanding structural work.

## CI

`.github/workflows/embed-compat.yml` runs on every push:

1. assemble every app, `node --check` each script
2. install deps and Chromium
3. boot each file inside an iframe carrying Wix's exact embed permissions
4. write `build/out/report.json` and publish it to the `ci-report` branch
5. promote the assembled prehub to `main` - **only** when the verdict is PASS and all six staging
   checks are green

Manual runs: **Actions -> Wix embed compatibility -> Run workflow**, with optional inputs
`target` (scope to one file) and `promote` (untick to verify without promoting). Do not fire runs
back to back; that trips the account's workflow-run limit.

### Assertions per app

- **prehub** - nine tiles, staging canvas opens, five lighting rigs, six poses, three angles and
  framings, no console errors
- **prohub** - nine module tiles, script state readable, storage available, all nine desks open
- **filmhub** - three modules registered (banner, launcher, tiles), launcher and tile-manager
  tiles present, state readable
- **posthub** - five desk modules registered, desk registry holds five, tab bar renders five tabs
  with correct labels, notes/sync/deliverables answer `state()`, sync ships platform columns,
  deliverables carry QC checklists

## Verified by measurement

- **proHUB** - nine desks open, nine module tiles, storage, clean console, in a Wix-shaped embed
- **preHUB** - the staging desk canvas opens; navigator lists scenes with numbers and slugs;
  clicking a row drives the inspector; department dots and element chips come from the prose
- **filmHUB** - master clock ticks; banner slots fill from a call sheet or manual entry, with the
  countdown amber at 15 minutes and red past; three launcher tiles, and all three open the right
  app; the tile-manager tile mounts and the grid lays out
- **postHUB** - ingest refuses undecodable files with a plain reason (ProRes and friends) rather
  than listing them as broken; *Build By Storyboard* lays panels on the timeline in scene order,
  reel SB, board-tagged, with record times contiguous

## Written but not yet measured

- filmHUB tile manager **interactions** - add, arrow reorder, size cycling, presets
- postHUB notes, sync and deliverables desks - mounting and behaviour
- postHUB desk tab bar - five tabs, switching without closing
- postHUB *replace with the shot* - needs real decodable media in the bin
- preHUB's white page, page themes, icon toolbar, type floor, mobile pass and zoom. These were
  built and lost in a rollback when a splice broke the file; the desk itself is verified

## Still to build

- **Optional**: split `prohub.html` into parts so it gets the same parse gate as the others
- **Optional**: Wix install steps for each file, with embed heights (preHUB ~1200px,
  proHUB ~1400px, filmHUB ~900px, postHUB ~1000px)
- postHUB ingest against real H.264 footage - the first true test of the decoder probe

## Deployment

- **Standalone**: `node deploy/server.mjs` serves the suite with an image proxy and working
  localStorage. See `deploy/README.md`
- **Embed**: paste the file into Wix's Embed HTML. `prohub.html` at 139 KB is a large paste; host
  it instead if Wix trims it
- **Obfuscation**: planned, not enabled. `docs/obfuscate-and-deploy.md`

## Invariants, true in every file

Rules, not AI. Nothing uploaded. Nothing fetched from the internet at run time. No browser
pop-ups - in-app panels only. Exports always available by copy and print. Media is never copied:
postHUB keeps edit decisions, not footage. Storage that admits when it is off.
