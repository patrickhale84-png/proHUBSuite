# Obfuscate and deploy - the remaining steps

Two jobs, in this order. Both are mechanical once the pieces below exist.

## 1. Obfuscation (a CI step, not a hand job)

Node lives in CI, not in the agent sandbox, so this belongs in the workflow. Order matters:

```
assemble  ->  syntax check  ->  boot suite  ->  ONLY IF VERDICT PASS  ->  obfuscate  ->  dist/
```

Never obfuscate before the suite passes. Obfuscated output is hard to debug, so it is produced
only from a build already proven to boot.

Planned workflow addition, after the boot suite and before promotion:

```yaml
      - name: Obfuscate the deployable builds
        if: success()
        run: |
          mkdir -p dist
          cp prohub.html dist/prohub.html
          cp build/out/prehub.html dist/prehub.html
          npx --yes javascript-obfuscator dist/prehub.html \
            --output dist/prehub.html \
            --compact true --self-defending true --string-array true \
            --string-array-encoding base64 --identifier-names-generator hexadecimal \
            --disable-console-output false
          npx --yes javascript-obfuscator dist/prohub.html --output dist/prohub.html \
            --compact true --self-defending true --string-array true \
            --string-array-encoding base64 --identifier-names-generator hexadecimal
          ls -l dist
```

Notes that matter:

- **`self-defending` and `string-array` are the settings that actually raise the effort.** Without
  them you have minification, which is not protection.
- **Keep the readable source.** `dist/` holds only the shipped copies; the repo keeps `build/parts/`
  and the un-obfuscated root files. A bug you cannot reproduce in the obfuscated build is a bug you
  fix in the source and re-generate.
- **Test the obfuscated output too.** The suite should be run a second time against `dist/*.html`,
  because obfuscators can break reflection and `eval` patterns. Add a target rather than assuming.
- Expect roughly 30-50% size growth. Acceptable.

## 2. Deploy (his click, not the agent's)

The agent can write the artefacts; it cannot sign into a hosting account. Steps:

1. Run the workflow, or locally: `python3 build/build.py && npm run obfuscate` once the step exists
2. Take `dist/prehub.html` and `dist/prohub.html`
3. Drag the folder onto **app.netlify.com/drop** - live URL in seconds, HTTPS included
4. Add `hub.rooksproductions.com` in Domain settings, CNAME at the registrar
5. Put a link on the Wix site pointing at it

**Static hosts have no image proxy.** The `/img` endpoint in `deploy/server.mjs` needs a Node host
(Render, Fly, Railway) or a serverless function. Without it, image import in the staging desk stays
link-only. Not a blocker.

## 3. filmHUB front end - the outline, for one clean pass

File 4 of 4. Smaller than the other three because it is a launcher, not a tool.

| Part | Job |
|---|---|
| Metro shell | the tile grid the suite already wears - same tiles, same palette |
| **Live banner** | master clock, current call, next set-up, countdown |
| **Launcher tiles** | open preHUB, proHUB, postHUB - each a full-page switch, no iframe |
| **Tile manager** | add your own boxes, resize, drag to reorder, save a preset |
| **Rooks mark** | the rook in the header, black on light or inverted on dark |
| Hand-offs | reads the last project name from storage so the header is never empty |

Build order: shell and banner first (they are the identity), then the launcher, then the tile
manager. The tile manager is the only part with real state to persist.

**One decision still open:** whether filmHUB launches the other three as **separate pages** (clean,
each app stays single-file, no cross-app iframe) or **embeds them in panes** (feels integrated, but
reintroduces the iframe sandbox limits that caused most of the suite's pain). Recommendation:
separate pages, linked. The suite already carries the same look, so it will feel like one product
without the sandbox cost.
