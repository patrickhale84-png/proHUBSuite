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
