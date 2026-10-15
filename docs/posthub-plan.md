# postHUB - build plan

File 3 of 4. The finishing stage: everything from the first take to the delivered master.

Built the way preHUB was eventually built - one module per file, assembled, boot-tested in CI,
promoted only on a green verdict. No in-place patching of a large single file.

## Data in

postHUB reads what proHUB stages, from the browser's own storage:

```
proHUB  --writes posthub_staged_payload_v1-->  postHUB
```

Expected shape: `{ origin, target, projectName, days[], scenes[], dood[], sheets[], budget, ts }`
Where `days[]` are stripboard days with scene numbers, `scenes[]` carry the breakdown (cast,
props, wardrobe, sound, SFX, location), `dood[]` are day-out-of-days entries and `sheets[]` the
call sheets. Same contract shape as the preHUB hand-off, so the reader is written once.

## Modules, in build order

| # | Module | What it does | Test hooks (for CI) |
|---|---|---|---|
| 1 | `00-shell.html` | Metro shell, tiles, dialogs, storage, vault | 9 tiles render, `postHUB` defined, no errors |
| 2 | `10-ingest.js` | dailies log: take, camera, sound, LUT grid, sync markers | ingest panel opens, take count |
| 3 | `20-timeline.js` | cut list / EDL: assemblies, source in/out, record in/out, EDL and XML text in/out | timeline rows, EDL export text length |
| 4 | `30-markers.js` | marker exchange: pull DooD markers from proHUB, note back | markers found, round trip |
| 5 | `40-sound.js` | music cue sheet, ADR and Foley passes, room tone | cue count, ADR rows |
| 6 | `50-vfx.js` | shot tracker: shot ID, vendor, status, version, frames | shot rows, status counts |
| 7 | `60-review.js` | timecoded notes per version, resolve status | note rows, open/resolved |
| 8 | `70-deliverables.js` | deliverable list (master, HDR, social), specs, QC checklist | deliverable rows, QC checks |

## Invariants

Rules, not AI. Nothing uploaded. Nothing loaded from the internet - including the PDF reader,
which postHUB should not need at all. No browser pop-ups; in-app panels only. Exports always
available by copy and print. Storage that says so when it is off.

## Test hooks the harness will use

`window.postHUB` exposing: `state`, `ingest()`, `timeline()`, `markers()`, `sound()`, `vfx()`,
`review()`, `deliverables()`, `storageOk()`. Each module reports its own counts so the CI report
can name exactly which stage broke rather than pointing at the whole file.

## Why this order

The shell first - nothing else can be tested without it. Then ingest, because every later stage
consumes takes. Timeline and markers next, since they are the spine of an edit. Sound, VFX and
review are independent passes that hang off the timeline. Deliverables last, because it reads
everything else.
