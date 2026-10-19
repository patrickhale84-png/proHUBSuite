# proHUB

One landing page (`index.html`) with 21 tiles. Each tile opens its own screen.

```
index.html                    proHUB landing page: tile grid
tiles/
  pre-production.html         tiles 1-9
  production.html             tiles 10-15
  post-production.html        tiles 16-21
filmhub.html                  front desk (add it next to index.html)
```

Every screen links back to proHUB only. Nothing links screen to screen.

## Tile map

| # | Tile | File | Entry |
|---|------|------|-------|
| 1 | Screenwriter | `tiles/pre-production.html` | `sw` writer |
| 2 | Evaluator Studio | `tiles/pre-production.html` | `sw` coverage |
| 3 | Pitch Deck | `tiles/pre-production.html` | `sw` pitch |
| 4 | Storyboards | `tiles/pre-production.html` | `sw` storyboard |
| 5 | Pre-Lim Budget | `tiles/pre-production.html` | `sw` budget |
| 6 | Script Reader | `tiles/pre-production.html` | `sw` scripts |
| 7 | Film Database | `tiles/pre-production.html` | `sw` filmdb |
| 8 | Outreach | `tiles/pre-production.html` | `sw` outreach |
| 9 | Shot List (Draft) | `tiles/pre-production.html` | `sw` shotlist |
| 10 | Shot List (Master) | `tiles/production.html` | `sw` shotlist |
| 11 | One-Liner Strip | `tiles/production.html` | `sw` oneliner |
| 12 | Master Script | `tiles/production.html` | `sw` masterscript |
| 13 | Call Sheet | `tiles/production.html` | `sw` callsheet |
| 14 | Dailies Log | `tiles/production.html` | `sw` dailies |
| 15 | Sync from preHUB | `tiles/production.html` | `fn` loadBridgeData |
| 16 | Edit Desk | `tiles/post-production.html` | `suite`  |
| 17 | Ingest Bin | `tiles/post-production.html` | `desk` ingest |
| 18 | Cut List | `tiles/post-production.html` | `desk` timeline |
| 19 | Cut Notes | `tiles/post-production.html` | `desk` notes |
| 20 | Sync Matrix | `tiles/post-production.html` | `desk` sync |
| 21 | Deliverables | `tiles/post-production.html` | `desk` deliverables |

Entry key: `sw` opens a screen by name, `fn` runs a function, `desk` clicks a launchpad tile, `suite` closes the launchpad.

## What changed from the single-file build

- The three files were carried inside the old landing page. The "post" copy was an older all-in-one bundle with the other two nested inside it. The real post-production screens are now in their own file (137 KB instead of 973 KB).
- Fixed: tiles 10-15 could not open, because the Production group name did not match its frame.
- Fixed: tiles 16-21 opened the old bundle instead of the post-production launchpad.
- Removed: the load-files sheet and embedded copies. Tiles load straight from `tiles/`.
- Removed: all hub-to-hub links and the old hub names. Each screen has one link, to proHUB.
- Saved-data keys keep their original names, so work already saved in a browser still loads.

## filmHUB access

filmHUB is the view-only front face for crew, ADs, directors and producers. `roles.json` holds who sees what.

| Section | Director | Producer | AD | Crew | Source tile |
|---|---|---|---|---|---|
| Budget | yes | yes | yes | | Pre-Lim Budget |
| One-Liner | yes | yes | yes | yes | One-Liner Strip |
| Shooting Script | yes | yes | yes | | Master Script |
| Crew calls | yes | yes | yes (sends) | yes | Call Sheet |
| Casting calls | yes | yes | yes (sends) | | Call Sheet |
| Sides | yes | yes | | yes | none yet |
| Storyboards | yes | yes | | yes | Storyboards |
| Day Out of Days | yes | yes | yes | | none yet |
| Props | yes | yes | yes | | none yet |
| Gear | yes | yes | yes | | none yet |
| Locations | yes | yes | yes | | none yet |

## Run it

Host it (GitHub Pages works) or run a local server. Opened straight from disk, browsers block the landing page from reaching into the tile frames.
