# wishbutler-holiday-data

Public data repository for the WishButler app: country-specific **public holidays**,
**nameday calendars**, localized **holiday articles**, and **holiday images** — packaged
as versioned JSON and delivered worldwide for free through the
[jsDelivr](https://www.jsdelivr.com/) CDN.

> This repository must stay **public**. jsDelivr only serves public GitHub repos,
> and the data here contains no secrets. Images are sourced from Public Domain / CC
> works with attribution recorded in [`CREDITS.md`](./CREDITS.md).

## How the app consumes it

The app reads a pinned release tag so the CDN cache busts deterministically
(use `@main` until the first CI release tag exists):

```
https://cdn.jsdelivr.net/gh/RootTwoLabs/wishbutler-holiday-data@main/data/index.json
```

1. Fetch `data/index.json` — the manifest of available countries + versions.
2. When a user activates a country, download `data/packages/<CC>/v<N>/package.json`.
3. Resolve concrete dates **on-device** with the rule engine (no server compute).
4. Lazy-load images by relative path against the same base URL.

## Layout

```
data/
  index.json                       # manifest: countries + versions + schema version
  packages/<CC>/v<N>/package.json  # one package per country + version
  images/<articleKey>/<nn>.jpg     # holiday images, multiple per holiday allowed
schema/
  index.schema.json                # JSON Schema for index.json
  package.schema.json              # JSON Schema for a country package
scripts/                           # data generators (run in CI)
```

## Date rules

Dates are described by rules so the client computes any year offline:

- `fixed` — month/day (e.g. Christmas 12-25)
- `easter_relative` — offset in days from Western Easter (e.g. Good Friday `-2`)
- `nth_weekday` — n-th weekday of a month (e.g. 2nd Sunday in May)
- `precomputed` — `year -> "MM-DD"` table for non-Gregorian feasts (Islamic, Jewish,
  Orthodox, …) that have no closed-form rule

## Data sources

- Public holidays: [Nager.Date](https://date.nager.at/), [OpenHolidays API](https://openholidaysapi.org/),
  plus a curated static list in this repo (religious/non-Gregorian, regional specials)
- Israel (IL): [Hebcal](https://www.hebcal.com/) (neither Nager.Date nor OpenHolidays cover it);
  the holiday selection is curated in `scripts/lib/hebcalHolidays.mjs`, multi-day feasts
  are dated by their first day (`npm run build:holidays:il`)
- Namedays: [abalin](https://nameday.abalin.net/) + country-specific calendars
- Images: [Wikimedia Commons](https://commons.wikimedia.org/) (PD / CC)

See [`CREDITS.md`](./CREDITS.md) for per-asset attribution and licenses.

## Regenerating

```bash
npm install
npm run build        # fetch sources -> write data/ -> rebuild index.json
```

CI (`.github/workflows/build.yml`) runs the generators, commits `data/`, and tags a release.

### Adding articles + images for a holiday

1. Register the slug in `content/key-map.mjs` (`COUNTRY_ARTICLE_MAP` + `NAMESPACED_SLUGS`
   for country-specific holidays; global holidays go straight into `content/articles/<locale>.json`).
2. Write the article in `content/articles/<CC>/en.json` and `de.json` (fields `intro`, `history`,
   `traditions`, `funFacts`; keep `intro` ≤ 280 chars, 3–5 fun facts ≤ 160 chars each).
3. `node scripts/translate-articles-google.mjs` fills the remaining locales (keyless Google endpoint,
   only slugs that are still missing, hand-written texts are never overwritten).
4. Add search terms to `content/image-queries.mjs`, then `node scripts/fetch-images.mjs [CC/slug …]`.
   Review the results — `node scripts/curate-images.mjs promote|drop <dir> <n>` swaps the hero image
   or removes a bad hit (keeps `CREDITS.md` in sync). Re-fetch a single target with `--force CC/slug`.
5. `npm run build:articles && npm run build:index && npm run validate`.

Alias slugs (Nager's observed variants such as `christmas_day`, Eid follow-up days, "tentative"
dates) automatically reuse the canonical slug's article and images — see `ARTICLE_ALIASES` /
`canonicalArticleSlug()` in `content/key-map.mjs`.
