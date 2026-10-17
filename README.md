# proHUBSuite
proHUB suite - preHUB, proHUB, filmHUB, postHUB. Rules engine, no AI, no upload, no tracking. Single-file Wix embeds.

## Plugging into filmHUB

`filmhub.html` is the front desk. Its three launcher tiles open `prehub.html`, `prohub.html` and `posthub.html` (siblings by default; override with `filmhub_endpoints_v1`). Each hub links back to it with a **filmHUB** item in its top nav.

The filmHUB banner (current call, next set-up, countdown, day) reads staged data the hubs write to localStorage:

| Key | Written by | Read by | Shape |
| --- | --- | --- | --- |
| `prohub_staged_payload_v1` | proHUB call sheet (not built yet) | filmHUB banner, postHUB | `{ sheets: [{ day, call, next, move }] }` |
| `posthub_staged_payload_v1` | postHUB | filmHUB banner, postHUB | same shape |
| `prehub_master_v1` | preHUB "Transmit to proHUB" | proHUB bridge | `{ origin, target, projectName, lines, ts }` (script, not a call sheet) |

The banner only uses the first two keys. Until proHUB's call sheet exists, the banner shows "manual" unless one of those payloads is written by hand.
