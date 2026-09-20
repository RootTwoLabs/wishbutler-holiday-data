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

Nager.Date reports weekend **substitute days** ("observed": US Christmas 2027 on
24 Dec, UK Boxing Day 2026 on 28 Dec). The occasion itself does not move, so
`detectRule` still emits `fixed` when the only deviations from the majority
date are such substitutes (fixed date on Sat/Sun, substitute ≤ 3 days later or
Sat → Fri, see `detectObservedFixed` in `scripts/lib/ruleDetection.mjs`).
Genuine date changes (NL Koningsdag Sun → Sat, astronomical equinox holidays,
"nearest Friday" rules) stay `precomputed`. Existing packages were migrated once
with `npm run migrate:observed-rules` (offline, bumps only changed packages).

Nager marks unconfirmed future dates with a "(tentative date)" name suffix
(Islamic feasts, AFL Grand Final …). The suffix is stripped before slugging
(`stripTentativeSuffix` in `scripts/lib/nagerSlug.mjs`), so confirmed and
tentative years end up in **one** `precomputed` definition instead of a
`<id>` (this year only) + `<id>_tentative_date` (following years) pair that
made the activated holiday silently end after the current year. Existing
packages were merged once with `npm run migrate:tentative-rules` (offline;
canonical years win on collision, tentative labels/articles/image keys are
dropped, orphaned `_tentative_date` keys are pruned from
`content/holiday-labels/`).

`npm run validate` enforces the look-ahead: every `precomputed` rule must
carry at least `currentYear + 1` (`checkPrecomputedHorizon` in
`scripts/validate.mjs`). Genuine one-off dates listed in `ONE_OFF_HOLIDAY_IDS`
only warn; a recurring holiday the source does not (yet) deliver for next
year can be parked in `STALE_PRECOMPUTED_ALLOWLIST` **with an expiry date** —
after `until` it fails again. Fix by refreshing the source
(`npm run build:holidays -- <CC>`), not by extending the allowlist.
`VALIDATE_YEAR` / `VALIDATE_TODAY` override the clock for reproduction.

### Regional holidays (`regions`) and `category`

Nager.Date marks holidays that apply only in some subdivisions with
`global: false` plus a `counties` list (ISO 3166-2 codes). Since data tag
`data-2026-09-20-regions` (Audit G-5) the package keeps that information:

```json
{
  "id": "DE_world_childrens_day",
  "countryCode": "DE",
  "kind": "fixed",
  "labelKey": "holidays.world_childrens_day",
  "iconName": "event",
  "category": "public",
  "regions": ["DE-TH"],
  "rule": { "type": "fixed", "month": 9, "day": 20 }
}
```

- `regions` is **only present for regional holidays**: the sorted, deduplicated
  union of Nager's `counties` over all fetched years (1–64 codes matching
  `^[A-Z]{2}-[A-Z0-9]{1,5}$`, always prefixed with the package's country code —
  `npm run validate` fails otherwise). Nationwide holidays carry **no** field.
  If an occasion is nationwide in any year it is nationwide (no `regions`);
  `global: false` without `counties` counts as nationwide too. Regional
  variants of a bundled global holiday keep the global `labelKey`
  (`DE_corpus_christi` → `holidays.corpus_christi`) and add `regions`.
  Nager lists some holidays per subdivision even when every subdivision has
  them (GB New Year's Day → all four nations, AU King's Birthday → all eight
  states/territories). `NAGER_FULL_REGION_SETS` in `scripts/config.mjs` holds
  the curated complete set for such countries; a union covering it is
  nationwide and gets no `regions` (`npm run validate` fails if a package
  still carries one).
- `category` follows Nager's `types`: `Public` in at least one year →
  `public`, otherwise (`Bank`, `School`, `Authorities`, `Optional`,
  `Observance`) → `observance`. `religious` is only emitted by the Hebcal
  generator (Israel). The app decides how to present each category.
- Both are derived in `scripts/lib/nagerScope.mjs`; the contract is mirrored by
  `sanitizeRegions` in the app's `packageManager.ts`.

Nager occasionally renames an occasion in single years (PE 2031/2033: "Labour
Day" ↔ "International Workers' Day"), which would split it into two
`precomputed` definitions with gaps. `NAGER_NAME_ALIASES` in
`scripts/config.mjs` maps such names back per country. New Nager IDs that
have no labels in all 17 locales yet are parked in `UNTRANSLATED_HOLIDAY_IDS`
(`scripts/lib/holidaySelection.mjs`) until translated — translation is a
manual step, never part of CI.

`NAGER_CACHE_DIR=<dir> npm run build:holidays` caches every Nager year
response in `<dir>` and replays it on the next run (local reproduction of a
build without re-fetching, e.g. after editing the exclusion list). CI does
not set it.

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
**without** one can be listed in `content/fun-days/blackout.json`, e.g.:

```json
{ "01-27": "Internationaler Tag des Gedenkens an die Opfer des Holocaust — bewusst kein kurioser Feiertag" }
```

The list is currently empty (`{}`): since FUN v17 all 366 days carry a fun day
(27 January = Punch the Clock Day, decided 2026-09-11 so the calendar has no gap).

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

CI (`.github/workflows/build.yml`) runs the generators, commits `data/`, and tags a
release — only when something changed. A package gets a new `v<N>` directory
only when its content (everything except `version`) differs from the latest
version (`writePackageIfChanged` in `scripts/lib/packageWriter.mjs`); an
unchanged monthly run therefore produces no commit and no tag.

**Images are never fetched by `npm run build` or CI.** `npm run build:images`
(`scripts/fetch-images.mjs [CC/slug …]`, FUN with `--fun`) is a manual,
curated step: fetch, review with `curate-images.mjs promote|drop`, run
`build:thumbnails`, then commit images + `CREDITS.md` together.

**Published versions are immutable — no script writes into an existing
`v<N>` any more:**

- `build:namedays` writes the nameday table as a new package version via
  `writePackageIfChanged` (unchanged table = no bump; a sparser table than the
  published one is still never taken over). abalin mixes feast names, role
  descriptors and junk into its name lists ("Johannes Döparens dag", "Vescovo
  E Dottore Della Chiesa", "40"); `scripts/lib/namedayFilter.mjs` drops the
  unambiguous non-names (`NON_NAME_PATTERNS`, grouped by language — only
  strings that are clearly not a given name; "Santo Stefano Primo Martire" or
  "Noël" stay). `node scripts/prune-namedays.mjs [--dry-run] [CC …]` applies
  the same filter offline to the published tables and bumps only changed
  packages — run it after extending the patterns instead of re-fetching.
  `index.json` reports `namedayDays` (days with ≥ 1 name, 0–366) next to
  `hasNamedays` (true from one day on); `npm run validate` warns when a
  country has fewer than 300 days (BG 101, GR 176 are known abalin gaps).
- `FUN_VERSION=<n> npm run build:fun-occasions` is only accepted for
  `n > latest FUN version` (exit 2 otherwise).
- `curate-images.mjs promote|drop` swaps image bytes **under the same path**,
  which the package JSON cannot see. It therefore re-runs the content merge for
  every package whose latest version references the folder and force-bumps the
  owning package (`<CC>/…` → that country, global slug → GLOBAL) even when the
  JSON is byte-identical; other referencing packages (a global folder such as
  `new_year` is referenced by ~120 country packages) bump only when their
  credit/licence changed — the app resolves image URIs against the tag-pinned
  base URL, so a new data tag serves the new bytes there anyway. FUN and
  MEMORIAL have their own generators; the script prints the exact command
  (`FUN_VERSION=<prev+1> npm run build:fun-occasions`). `--no-bump` skips the
  step for batch curation — then bump before committing.

`CREDITS.md`, `*.json` and `*.mjs` are forced to LF via `.gitattributes`
(Windows checkouts with `core.autocrlf` used to make `CREDITS.md` unparsable,
which would have written every image as CC0 without attribution). `npm run
validate` fails when a credit line does not parse or a package's image ref
disagrees with its `CREDITS.md` line, and when `index.json` `sizeBytes` does
not match the delivered (LF) file size.

### Thumbnails

List views in the app render holiday images as 52 px circles, while the full
images are ~1 MB each and jsDelivr does not resize. Every `NN.jpg` therefore
has a `NN.thumb.jpg` sidecar next to it (192×192, cover-cropped, JPEG q80,
no metadata, ~5–15 KB):

```
data/images/christmas/01.jpg        # full image, referenced by the package
data/images/christmas/01.thumb.jpg  # thumbnail, derived by convention
```

The convention is the contract: packages reference **only** the full image
(`path`), and the app derives the thumbnail URL by replacing the trailing
`.jpg` with `.thumb.jpg`, falling back to the full image on a 404. Thumbnails
are never written into `package.json` — `buildImageRefs` and `fetch-images`
ignore `*.thumb.jpg`, so adding or regenerating thumbnails does not bump any
package version.

CI does **not** build thumbnails. Run this locally after every `fetch-images`
(and after `curate-images promote|drop`, which deletes the folder's stale
thumbnails) and commit the sidecars together with the images:

```bash
npm run build:thumbnails                  # all missing/outdated thumbnails (idempotent, mtime-based)
npm run build:thumbnails -- FUN           # only data/images/FUN/**
npm run build:thumbnails -- --force       # regenerate everything
```

### Editing translations

Edit holiday names in `content/holiday-labels/<locale>.json` and articles in
`content/articles/`. Existing label translations (including editorial English)
take precedence over translation-cache output. Both article translation scripts
only fill missing article slugs. To retranslate an existing entry, remove that
entry deliberately first; changing the English source does not overwrite an
existing translation automatically.

For text-only changes, run `npm run build:articles`, `npm run build:labels`,
`npm run build:index`, `npm test`, and `npm run validate`. The article build merges
both articles and labels into a single new package version when content changes.
The standalone label build also creates a new version when needed. Existing
versions are never rewritten, and unchanged builds do not increase versions.
The full `build` command also fetches external data and is not needed for text edits.

The September 2026 corrections and their scope are documented in
[`docs/text-review-2026-09-10.md`](docs/text-review-2026-09-10.md).

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
