# build

`prehub.html` is assembled from parts rather than patched in place.

```
build/
  build.py          assembler: shell + one file per module
  parts/
    00-shell.html   the app shell, with the anchor the modules are inserted at
    20-lighting.js  lighting rigs, cast shadows
    30-camera.js    angle and framing, per-shot room detail
   out/              assembled output (not committed)
  out.js            the extracted script, for the syntax check
```

## Why

A 100 KB single file patched in place means a single bad edit takes down the whole
app, and nothing can be verified in isolation. Today that happened three times.

The assembler also enforces one rule the hard way: **every module is wrapped in its
own IIFE**. A bare block appended after the previous `})();` fails to parse with
`Unexpected token ':'` even when the block is clean on its own. The wrapper makes
that impossible by construction.

## Running it

```bash
python3 build/build.py           # assemble
python3 build/build.py --check   # assemble, then report bracket balance
node --check build/out.js        # the real syntax gate
```

CI does all three, then boots the assembled file inside a Wix-shaped embed.

## Adding a module

1. Drop `build/parts/NN-name.js` in
2. Run the build and the check
3. Push — CI assembles, syntax-checks and boots it

No module ever edits another. Nothing is inserted by hand.
<!-- ci trigger 08:59:35 -->
<!-- rerun 09:01:28 -->

## Phone frame (all four hubs)

On phones (and phones held sideways) every hub sits inside one film-strip frame
that always matches the visible screen, and shrinks above the keyboard. The page
itself never scrolls; dashboards fit their tiles to the frame, and modules scroll
inside it.

```
build/shared/phone-frame.css   frame, one-row header, metro grid, stacked boxes
build/shared/phone-frame.js    fitting, long-press labels, tile colour borders
build/inject_frame.py          writes both into each hub between PF:BEGIN / PF:END
```

After editing either shared file:

```bash
python3 build/inject_frame.py            # updates prehub, prohub, posthub and the filmHUB shell
python3 build/build.py --app filmhub     # rebuild filmHUB
cp build/out/filmhub.html filmhub.html
```

Per-hub settings (tile grid, main region, drawer, blocks hidden on phones, extra
tiles for actions that live in hidden blocks) are in `HUBS` in `inject_frame.py`.
Desktop is untouched: everything is scoped to `html.pf-on`.
