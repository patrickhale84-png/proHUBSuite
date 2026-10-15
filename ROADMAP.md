# proHUB Suite - roadmap and current build

Four single-file apps, one per stage of a production. Each is one `.html` you paste into a Wix
**Embed HTML** element. No build step, no server, no accounts, no AI, no uploads.

## Status

| File | State | Notes |
|---|---|---|
| `prohub.html` | **Built, tested, verified** | 9 modules, embed harness passed inside a Wix-shaped sandbox |
| `prehub.html` | **Built, stages 1-3 - untested** | 61,511 bytes on `main` |
| `posthub.html` | Not started | |
| `filmhub.html` | Not started | Front end; Rooks Productions mark goes in the header |
| CI | Wired | Red until all four files exist at the root |

## preHUB feature set (tagged snapshot)

**Stage 1 - writing desk**
- Screenplay editor: Tab cycles the line type, Enter starts the right next element, Backspace merges
- Live line, page and scene count; print
- Intake: paste, plain text, Final Draft (.fdx), Fountain, PDF (lazy reader), JSON
- Reformat and sync: re-types a whole draft in one pass
- Hand-off to proHUB: writes `prehub_master_v1` in the shape proHUB reads, verifies the write, and
  falls back to a copy-paste payload when the browser blocks storage
- Storage vault: snapshots, project-file export and restore, honest storage warning

**Stage 2 - the four studios**
- Coverage studio, pitch deck (10 editable slides), macro budget (ATL/BTL/post/contingency),
  storyboard panels with sketch canvases
- The macro budget now travels with the hand-off, so proHUB starts with your above-the-line figure

**Stage 3 - staging desk**
- Ten rooms drawn in code: kitchen, office, bedroom, bathroom, stairs, storefront, car interior,
  car exterior, exterior house, exterior office building
- Heads and bodies (3 each): click to select, drag to move, turn and scale
- Camera arrows with turn and scale
- Image import by URL or upload, converted to line art by a pencil-sketch pass, animated as a
  draw-on reveal; save PNG; copy shot plan
- **Use for** selector: bind a staged frame to any storyboard panel or pitch slide, replacing it
- Coverage engine calibrated to the Black List and WeScreenplay benchmarks (see below)

## Coverage engine calibration

Categories match the reference coverage: Premise, Plot, Character, Dialogue, Setting, Overall.
Grading is measured from the draft - scene and location count, dialogue cadence and share, action
length, cast size, era markers, genre signals.

- Black List band = mean minus 0.7 (that scale grades harder), matching the spread between the
  two reference reports on the same draft
- Bands: 0-49th improve / 50-84th good / 85-97th excellent / 98-100th virtually perfect
- Rating: pass, consider, recommend, weighted to the published rates (~3% recommend, ~20% consider)
- Weaknesses cite measured specifics with line numbers
- **Limit:** rules can measure and grade consistently. They cannot judge theme, subtext or
  structure the way a reader does. Matching that prose needs a language model, which the suite's
  rules forbid.

## Test queue (must pass before any file is called done)

1. All six preHUB desks open
2. All ten rooms paint, each producing a different canvas signature
3. Figures add, turn, scale and drag
4. Sketch conversion returns real PNG data
5. Animate plays through
6. Save-into-panel binds a frame to a storyboard panel and a pitch slide
7. Two budget edits in a row both persist (listener bug fixed, unverified)
8. Hand-off still carries the script and the budget
9. Zero page and console errors

## Invariants, true in every file

Rules not AI. Nothing leaves the browser. Nothing loaded from the internet (one exception: the PDF
reader, fetched only on PDF import). No browser pop-ups. Exports always available by copy and
print. Storage that admits when it is off.
