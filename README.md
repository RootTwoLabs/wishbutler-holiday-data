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
content/fun-days/
  days/<MM>.json                   # kuriose Feiertage: Datum, Slug, Bild-Suchbegriffe (1 pro Kalendertag)
  <locale>/<MM>.json               # Label, Intro, 3 Fun Facts je Slug in 17 Sprachen (alle App-Locales)
  blackout.json                    # Tage, die bewusst OHNE kuriosen Feiertag bleiben ("MM-DD" -> Begründung)
data/images/FUN/<slug>/01.jpg      # ein freies Bild pro kuriosem Feiertag
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
- Fun days (`FUN` package): curated in `content/fun-days/` — names and dates are
  facts (Wikipedia lists, Wikidata); all texts are our own wording. Check with
  `npm run check:fun-days`, build with `npm run build:fun-occasions`. FUN images
  are only fetched explicitly via `node scripts/fetch-images.mjs --fun` — the
  regular CI run does not fetch them.

### Title length (`label`)

The app shows a fun day's `label` as the big headline of its hero card, so titles
have hard limits enforced by `npm run check:fun-days` (constants in
`scripts/lib/funDays.mjs`):

- `LABEL_MAX = 36` characters per label — in **every** locale (`label too long`).
- `LABEL_WORD_MAX = 24` characters for a single space-delimited word, in the
  Latin-script locales `de, en, fr, es, pt, it, pl, nl, sv, nb, da, fi`
  (`LABEL_WORD_LOCALES`); a hyphen does not count as a word break, so German,
  Dutch and Finnish compounds are caught too (`label word too long`).
  `ja`, `ko` and `zh-Hant` write without spaces — there only `LABEL_MAX` applies.

Keep titles short and idiomatic rather than literal: drop
"International/National/World" prefixes and parenthetical English originals
("Internationaler Sprich-wie-ein-Pirat-Tag" → "Sprich-wie-ein-Pirat-Tag"), and
shorten compounds ("Tag des Erdnussbutter-Marmeladen-Brots" → "Tag des
Erdnussbutterbrots"). The full name belongs in `intro`, not in the headline.

### Deliberately empty days (`blackout.json`)

Normally every calendar day carries exactly one fun day. A day that must stay
**without** one — e.g. 27 January, International Holocaust Remembrance Day —
is listed in `content/fun-days/blackout.json`:

```json
{ "01-27": "Internationaler Tag des Gedenkens an die Opfer des Holocaust — bewusst kein kurioser Feiertag" }
```

The key is the `MM-DD` day, the value a non-empty rationale. Blacked-out days
drop out of the expected set (`expectedFunDays()` in `scripts/lib/funDays.mjs`),
so no entry is required for them — and an entry *on* such a day is a validation
error ("day is blacked out"), in `content/fun-days/days/<MM>.json` as well as in
the built package. The blackout list is authoring metadata only and is never
written into `data/packages/FUN/`. To free a day, remove its entry, add the day
to `days/<MM>.json` plus all 17 locale files, and fetch its image.

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
