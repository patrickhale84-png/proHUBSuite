# postHUB - the edit desk

File 3 of 4. **Local only.** Media is read from the client's own drive. Nothing is fetched from
the web, no proxy is pulled, no cloud transcode, nothing uploaded. Follows the suite invariants
already in force.

## The capability boundary, stated first

A browser plays what browsers decode, and professional camera originals are not on that list.

| Format | Plays in the edit desk | Note |
|---|---|---|
| H.264 MP4 / M4V | **yes** | the working format - ask the client for these |
| WebM / VP9 | yes | |
| HEVC / H.265 MP4 | Chrome and Edge yes, Safari yes, Firefox conditional | |
| ProRes (.mov) | **no** | no decoder in any browser |
| BRAW, R3D, DNxHD, MXF | **no** | no decoder in any browser |
| WAV / AIFF / MP3 / AAC audio | yes | for sync and sound passes |
| Cineform / h.264 in .mxf | no | |

So the desk edits **web-playable media from the drive**, and says so plainly when handed
something it cannot open - rather than silently failing. That means the client supplies
H.264/WebM proxies *on their own drive*, which is exactly what the brief asks for: proxy from
the drive, never from the web.

**And the honest ceiling:** this is a review-and-conform desk - real playback, real in/out
marking, a real cut list, real notes, real EDL/XML out. It is not Premiere: no effects, no
colour, no multi-stream compositing, and no conform of camera originals in the browser.

## How media is read

- **Chromium (Chrome, Edge):** `showDirectoryPicker()` - pick a folder once, keep the handle in
  IndexedDB, and reconnect with one click next session. The desk never copies media.
- **Safari, Firefox:** directory handles are unavailable, so a multi-file picker. Same desk,
  manual re-pick each session.
- **What is stored:** edit decisions only - references, in/out points, notes, order. Never the
  video. A project file stays kilobytes, which is why export and import stay trivial.

## Modules, in build order

| # | Module | What it does | CI hooks |
|---|---|---|---|
| 1 | `00-shell.html` | Metro shell, tiles, dialogs, storage, vault | 9 tiles, `postHUB` defined, no errors |
| 2 | `10-library.js` | folder or file ingest from the drive, persisted handles, bin with codec/resolution/duration, honest refusal of unplayable files | bin count, handles persisted, refused list |
| 3 | `20-player.js` | single and dual view, JKL transport, timecode readout, in/out marking | playback starts, marks set, timecode |
| 4 | `30-timeline.js` | assembly by dragging from the bin, cut list with source and record in/out, ripple delete, EDL and XML text both ways | cut count, EDL text length |
| 5 | `40-notes.js` | timecoded notes per take and per version, open and resolved | note rows, status counts |
| 6 | `50-sync.js` | line up takes by timecode where the container carries it; side-by-side dual playback where it does not | sync pairs, offset reported |
| 7 | `60-deliverables.js` | EDL, XML, cut CSV, marker list, string-out sheets | export sizes, row counts |

Dropped from the earlier plan as irrelevant to a local cut desk: music cue sheet, ADR passes,
VFX shot tracking, QC checklist. Those belong to a finishing schedule, not an editor.

## Still reads proHUB

`proHUB --writes posthub_staged_payload_v1--> postHUB` for project name, shoot days and the
scene breakdown, so takes can be tagged with the scene they belong to. Nothing is sent back.

## Order and reasoning

Shell first, nothing is testable without it. Library next, because every later stage consumes
the bin. Then the player - it must be right before a timeline is worth building. Timeline,
then notes and sync, which hang off it. Deliverables last, since it reads everything else.
