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
  [Calendarific](https://calendarific.com/) (religious/non-Gregorian)
- Namedays: [abalin](https://nameday.abalin.net/) + country-specific calendars
- Images: [Wikimedia Commons](https://commons.wikimedia.org/) (PD / CC)

See [`CREDITS.md`](./CREDITS.md) for per-asset attribution and licenses.

## Regenerating

```bash
npm install
npm run build        # fetch sources -> write data/ -> rebuild index.json
```

CI (`.github/workflows/build.yml`) runs the generators, commits `data/`, and tags a release.
