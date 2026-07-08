# WishButler Holiday-Data

Öffentliches Daten-Repo: Feiertage, Namenstage, lokalisierte Artikel und
Bilder pro Land — versioniertes JSON, ausgeliefert via jsDelivr-CDN.
Die App zieht zur Laufzeit `index.json` + Länderpakete; Datumsregeln werden
on-device berechnet. **Das Repo MUSS public bleiben** (jsDelivr serviert nur
öffentliche Repos). Node >= 20, ESM.

## Kommandos

```bash
npm run build      # volle Pipeline: holidays → namedays → images → articles → index → validate
npm run validate   # Schema- + Cross-Checks (bricht bei Fehlern ab)
npm test           # node --test scripts/
npm run build:holidays|:namedays|:images|:articles|:index   # Einzelschritte
```

## Struktur & Workflow

- **`content/` ist die handgepflegte Quelle** — `data/` ist Generator-Output
  und wird NIE von Hand editiert.
  - `content/articles/<locale>.json` (global) bzw.
    `content/articles/<CC>/<locale>.json` (länderspezifisch)
  - `content/key-map.mjs` — App-`articleKey` → Daten-`slug`
  - `content/image-queries.mjs` — Bildsuch-Begriffe pro Slug
  - `scripts/config.mjs` — Länder-/Locale-Listen (`HOLIDAY_COUNTRIES`,
    `COUNTRY_LOCALE`, `NAMEDAY_COUNTRIES`)
- `data/index.json` — Manifest (`countries[]` + separates `global`-Feld);
  `data/packages/<CC>/v<N>/package.json` — Paket pro Land+Version (alte
  Versionen bleiben liegen); `data/images/…` — Bilder.
- `schema/` — JSON Schema (draft-07), fast überall
  `additionalProperties: false` → unbekannte Felder sind Fehler.

**Neues Land:** Code in `HOLIDAY_COUNTRIES` (`scripts/config.mjs`) +
`COUNTRY_LOCALE`, dann `npm run build`.
**Neuer Feiertag/Artikel:** Artikel-JSON in `content/articles/…`, Mapping in
`key-map.mjs`, Bild-Query in `image-queries.mjs`, dann build. Nach
Content-Änderungen die Paket-`version` bumpen.

## Datensatz-Konventionen

- Definition-`id`: `<CC>_<slug>` (z. B. `DE_new_years_day`); `labelKey`:
  `holidays.<slug>`. `kind` muss zum `rule.type` passen: `fixed`,
  `easter_relative` (Offset ab westlichem Ostern), `nth_weekday`,
  `precomputed` (für nicht-gregorianische Feste).
- Artikel-Pflichtfelder: `intro`, `history`, `traditions`, `funFacts[]`.
  Warnschwellen: intro <= 280 Zeichen, funFact <= 160, 3–5 funFacts.
- Bilder: bei mehreren pro Slug genau eines `primary: true` (sonst Fehler);
  Lizenzen/Attribution in `CREDITS.md` pflegen.

## Gotchas

- Validator prüft über das Schema hinaus: Index↔Paket-Konsistenz, doppelte
  IDs, Bild-Pfade (existieren, kein `..`-Traversal) — auch für ALTE
  Paketversionen auf dem Filesystem.
- GLOBAL-Paket hat bewusst KEINE `definitions` (globale Defs sind in der App
  gebundelt); es liegt im Index unter `global`, nicht in `countries`.
- Globale Dedup-Regeln (`GLOBAL_RULES`, `HOLIDAY_SLUG_ALIASES`): nur wenn
  Alias UND exakte Regel matchen, wird global emittiert — verhindert
  falsches Merging (z. B. „Labour Day" an verschiedenen Daten).
- Länderspezifischer Artikel gewinnt vor globalem; Owner-Länder ohne
  Country-Artikel bekommen bewusst KEINEN globalen Fallback.
- CI baut monatlich (Cron am 1., 03:00) + manuell, committet `data/` mit
  `[skip ci]` und purged danach den jsDelivr-Cache für `index.json`
  (sonst bis zu 12 h stale).
- App-Konsument: `wishbutler_app/src/features/holidays/remote/config.ts`
  (CDN-URL, Tag via `EXPO_PUBLIC_HOLIDAY_DATA_*` übersteuerbar).
