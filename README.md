# youtube-filter-extension

A Chrome extension (Manifest V3) that hides old videos from the YouTube home feed. It filters YouTube's InnerTube JSON before the page renders it, so old videos never appear and infinite scroll keeps working.

Spike quality: home feed only, English dates only.

## Install

```sh
npm install
npm run build
```

Then open `chrome://extensions`, enable Developer mode, choose **Load unpacked** and select the repo root.

## Settings

Click the extension icon to choose the cut-off: 1 week, 1 month, 3 months, 6 months (default), 1 year, 2 years or Off.

A new setting applies to rows loaded afterwards. Reload YouTube to refilter what is already on screen.

## What it filters

- Videos on the home feed (`youtube.com/`) whose published date is older than the cut-off.
- Ads, Shorts shelves, live streams, premieres without a date and anything it can't read are left alone.
- Search, subscriptions, the sidebar and the watch page are not touched.

YouTube shows rounded dates ("1 yr ago" covers 12 to 23 months), so the cut-off works in those steps: a month counts as 30 days and a year as 365.

## How it works

- `src/content.ts` runs in the page's MAIN world at `document_start`.
  - It traps the `ytInitialData` assignment for the first page.
  - It wraps `fetch` to rewrite `/youtubei/v1/browse` responses for continuations and SPA navigation.
- `src/feed.ts` finds video items (`richItemRenderer.content.lockupViewModel`) and normalises them to `{ videoId, title, channel, publishedText, ageDays }`.
  - It removes only items that fail a filter and never removes the `continuationItemRenderer`.
  - It recognises the home feed by `browse_id: FEwhat_to_watch` in `responseContext.serviceTrackingParams`.
- `src/filters/age.ts` is the only filter. Filters are plain predicates over the normalised item.
- `src/bridge.ts` runs in the isolated world. It copies the popup setting from `chrome.storage` into the page's `localStorage`, because the MAIN world can't use `chrome.*` APIs.

## Development

```sh
npm test           # vitest
npm run typecheck  # tsc
npm run build      # esbuild to dist/
```

The tests run against `fixtures/home-browse.json` (a scroll continuation) and `fixtures/home-initial.json` (first-load `ytInitialData`). These are reduced, anonymised copies: one item per case, fake IDs, titles and channels.

To refresh them after YouTube changes its format:

1. Logged in, on `https://www.youtube.com/?hl=en`, save a `browse?prettyPrint=false` response from DevTools as `fixtures/raw/home-browse.json`.
2. On a fresh load, run `copy(JSON.stringify(ytInitialData))` in the Console and save it as `fixtures/raw/home-initial.json`.
3. Run `node scripts/sanitise-fixtures.mjs`.

`fixtures/raw/` is git-ignored. Raw captures contain account identifiers and your recommendations, so don't commit them.

## Likely to break

- The date lives in a loose list of metadata parts, and the visible text has already moved from "hours" to "hr". If the accessibility label changes, videos stop being filtered rather than erroring.
- YouTube moving browse requests off `fetch`, or assigning `ytInitialData` differently.
