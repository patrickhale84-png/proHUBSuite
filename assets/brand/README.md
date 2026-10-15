# Brand assets

Temporary suite logos plus the Rooks Productions mark. Original filenames are preserved wherever
possible so nothing gets mislabelled - confirm the frame-to-app mapping below and I will rename.

| File | What it is |
|---|---|
| `proHUB__edited_edited.jpg` | proHUB - blue grey, film set, script "pro" over HUB |
| `posthub-monitor.jpg` | postHUB - purple, storyboard monitor, script "post" over HUB |
| `filmhub-set.jpg` | filmHUB - amber, film set, script "film" over HUB |
| `studio-crew-lighting.jpg` | Studio frame with crew and lighting - fourth logo / suite header candidate |
| `rooks-productions.png` | Rooks Productions mark - black and white rook in a circle |

## Planned use

- **Suite header** (filmHUB front end): Rooks Productions mark, black on light or inverted on dark.
- **Each app header**: its own logo, small, left of the wordmark.
- **Wix**: the images stay in this repo as the source of truth; each app inlines a downscaled copy so
  no app ever fetches an image over the network (the no-CDN rule).

## To confirm

1. Which frame is **preHUB**? I have pro, post and film identified; the fourth is likely preHUB.
2. Do you want them **inlined** into the apps (a few KB each after downscaling, keeps the no-network
   rule) or **hotlinked** from your Wix media library (smaller files, one more external request)?
