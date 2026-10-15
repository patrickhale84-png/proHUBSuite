# Running the suite as a standalone web app

No Wix, no iframe, no sandbox. Three commands:

```bash
python3 build/build.py          # assemble prehub from its parts
node deploy/server.mjs          # serve on http://localhost:8080
open http://localhost:8080/prehub.html
```

| URL | What |
|---|---|
| `http://localhost:8080/prehub.html` | the assembled prehub (shell + lighting, pose, camera) |
| `http://localhost:8080/prohub.html` | the production desk |
| `/health` | `{ ok: true, assembled: true }` - confirms the assembly ran |

`PORT=3000 node deploy/server.mjs` to change the port. The server assembles at boot, so it
serves the module build rather than the bare shell; if Python is unavailable it falls back to
the committed `prehub.html`.

## What actually changes on a real origin

| | Wix embed | Standalone |
|---|---|---|
| localStorage | sandboxed, warning bar can appear | **works normally, persists per origin** |
| `window.print()` | often blocked | reliable |
| File downloads | sometimes swallowed | normal |
| `prompt/alert` | blocked | available (the apps still use in-app panels) |
| canvas export | fine | fine |

Nothing on this server makes localStorage "more persistent" - on a real origin it simply is.
The remaining limit is the one every browser shares: clearing site data clears the projects.
The apps' own project-file export is the durable answer, and it already exists in the Storage
Vault.

## CORS, honestly

CORS is a rule the **image host** sets, not yours. Setting `Access-Control-Allow-Origin` on
your server does not let the page read images from someone else's website. What does work is
`/img?url=...`: the server fetches the image (no browser CORS involved) and returns the bytes
**same-origin**, which the staging desk can then draw and convert to line art.

The deployed page can be given an `Access-Control-Allow-Origin` header for its own assets if
you ever call it from elsewhere, but that is not what unblocks image import.

The proxy is deliberately narrow: http/https only, private and loopback addresses refused,
images only, 8 MB cap, 8 second timeout. An open proxy that will fetch anything is an
invitation for abuse.

In the staging desk, import by link as normal - a full hosted URL can be routed through
`/img`. A one-line tweak in the staging module can rewrite a pasted URL to
`/img?url=<encoded>` when the app is not embedded.

## Hosting options

| Option | Proxy | Effort |
|---|---|---|
| Any static host (GitHub Pages, Netlify, Vercel, S3) | **no** - static hosts have no server code | minutes |
| A small Node host (Render, Fly, Railway) with `deploy/server.mjs` | **yes** | ~an hour |
| Local, for personal use | yes | now |

Start static if you only need the apps online; take the Node host when the image import
matters. `prehub.html` and `prohub.html` are the only files a static host needs.

## Security note

These are single-user tools with no accounts and no uploads. Hosted publicly, anyone with the
URL can use the app - and their projects live in *their* browser, not on your server. If you
want it private, put it behind the host's access control or keep it local.
