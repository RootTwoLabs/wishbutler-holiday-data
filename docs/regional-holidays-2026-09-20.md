# Regionale Feiertage (`regions`) und Namenstags-Abdeckung – 20. September 2026

Umsetzung von Audit-Paket 2a (Befunde G-5 und G-11 aus
`ai_docs/develop/audits/2026-09-20-full-project-audit.md`). Datenstand: Lauf gegen
Nager.Date am 20.09.2026 (1230/1230 Jahresantworten, 2026–2035), Namenstage
offline aus den veröffentlichten Tabellen bereinigt.

## G-5 – Datenvertrag `regions` / `category`

Bisher verwarf `fetch-holidays.mjs` die Nager-Felder `global`, `counties` und
`types`. Folge: 131 rein regionale Einträge (z. B. Weltkindertag nur Thüringen,
Näfelser Fahrt nur Glarus) und 106 Einträge ohne Public-Typ standen als
landesweite `public`-Feiertage im Paket und wurden in der App für alle
vorausgewählt.

### Form eines regionalen Eintrags (Beispiel DE v31)

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

Landesweite Einträge sind unverändert (kein `regions`-Feld):

```json
{ "id": "DE_german_unity_day", "countryCode": "DE", "kind": "fixed", "labelKey": "holidays.german_unity_day", "iconName": "event", "category": "public", "rule": { "type": "fixed", "month": 10, "day": 3 } }
```

### Regeln

| Regel | Umsetzung |
|---|---|
| `regions` = Nager `counties` unverändert (ISO 3166-2, z. B. `DE-BY`, `CH-GL`, `AT-4`) | `scripts/lib/nagerScope.mjs` `collectScope`/`resolveScope`; sortiert, dedupliziert |
| Nur wenn `global: false` UND `counties` nicht leer; landesweite Feiertage ohne Feld | `collectScope`: jede andere Zeile setzt `national = true` |
| National + regional im selben Jahr → national; Regionsmenge variiert → Vereinigung | Sammler über alle Jahre und Zeilen |
| Schema: Array, 1–64, `uniqueItems`, Items `^[A-Z]{2}-[A-Z0-9]{1,5}$` | `schema/package.schema.json` (`holidayDefinition.regions`, `additionalProperties: false` bleibt) |
| Codes müssen mit dem Paketland beginnen | `checkRegions` in `scripts/validate.mjs` (Fehler) |
| `category`: `types` enthält `Public` → `public`, sonst `observance`; `religious` nur Hebcal (IL) | `categoryFromTypes`; kein neuer Enum-Wert |
| Kein Merge regionaler Einträge auf GLOBAL-Slugs | Die Merge-Bedingung (`fetch-holidays.mjs`, Alias + identische Regel) bestimmt nur den `labelKey`; die Definition bleibt eine eigene Länderdefinition mit `regions` (`DE_corpus_christi` → `holidays.corpus_christi` + `regions`) |
| Vereinigung ⊇ komplette Regionsmenge des Landes → landesweit, kein `regions` | `NAGER_FULL_REGION_SETS` in `scripts/config.mjs` (kuratiert: GB 4 Nationen, AU 8 Bundesstaaten/Territorien), `coversFullRegionSet` in `nagerScope.mjs`; Validator-Fehler, wenn ein Paket trotzdem ein Full-Set trägt. Betroffen: `GB_new_years_day`, `GB_summer_bank_holiday`, `AU_kings_birthday`. Geprüft und nicht betroffen: AT (Nager kennt alle 9, keine Definition trägt alle), BA (Nager kennt nur BIH/SRP von 3), PT (nur PT-20/PT-30), BR/CL/IT (Full-Set 1 = echte Einzelregion) |

App-Seite: `sanitizeRegions` in `wishbutler_app/src/features/holidays/remote/packageManager.ts`
(gleiches Pattern, max. 64, dedupliziert; ungültiges Feld → Definition gilt als landesweit).

### Zahlen (Lauf 2026-09-20)

- **128 Definitionen mit `regions` in 14 Ländern** (Anteil an den Definitionen des Pakets):
  AT 5/19 (alle `observance`), AU 12/20, BA 11/13, BR 1/14, CA 21/29, CH 19/23 (2 `observance`),
  CL 1/17, DE 10/19, ES 22/32, GB 6/13, IT 1/14, NZ 12/23, PT 3/17, US 4/15 (2 `observance`).
  119 davon `public` (Audit-Zählung vom 11.09.: 124 – Differenz: Tentative-Zusammenführung
  vom 20.09. bei AU sowie die drei Full-Set-Einträge GB ×2 / AU ×1, die jetzt landesweit sind).
- **106 Einträge `public` → `observance`** – exakt die 106 Einträge ohne Public-Typ aus
  `docs/holiday-relevance-2026-09-11.md` (AT 5, BE 3, BR 1, BZ 1, CH 2, CY 1, DK 4, GL 4, IE 1,
  LI 5, LU 1, LV 32, ME 9, MX 2, NL 2, PT 1, SI 6, SK 2, US 2, VE 22).
- **34 Länderpakete gebumpt** (nur inhaltliche Änderung, inhaltsgleiche Zwischenversionen
  verworfen): AT AU BA BE BR BZ CA CH CL CY CZ DE DK ES FR GB GL HR IE IT LI LU LV ME MX NL
  NZ PE PT SE SI SK US VE. GLOBAL v20, FUN v19, MEMORIAL v13, IL v19 unverändert.
- Stichproben: DE `world_childrens_day` → `DE-TH`; `international_womens_day` → `DE-BE, DE-MV`;
  `reformation_day` → BB HB HH MV NI SH SN ST TH; `corpus_christi` → BW BY HE NW RP SL;
  `assumption_day` → `DE-SL`; AT `saint_florians_day` → `AT-4` (`observance`, Nager-Typ School);
  CH `nafels_procession` → `CH-GL`; GB `new_years_day`/`summer_bank_holiday` und AU `kings_birthday`
  ohne `regions` (Full-Set), GB `2_january` → `GB-SCT`, AU `friday_before_afl_grand_final` → `AU-VIC`.

### Nebenbefunde aus dem Nager-Lauf

- **PE:** Nager benennt 2031/2033 abweichend („International Workers' Day", „Holy Thursday",
  ohne Air Force Day/Junín/Ayacucho), sonst „Labour Day"/„Maundy Thursday". Ohne Abgleich
  zerfiel der 1. Mai in zwei lückenhafte `precomputed`-Definitionen. Neu:
  `NAGER_NAME_ALIASES.PE` in `scripts/config.mjs` → `PE_international_workers_day` (fixed 01.05.)
  und `PE_holy_thursday` (Ostern −3) bleiben stabil. **Verschwunden:** `PE_maundy_thursday`
  (war ein Duplikat von `PE_holy_thursday`, gleicher Tag). **Neu mit Labels:** `PE_air_force_day`
  (`precomputed`, 8 Jahre – 2031/2033 fehlen bei Nager).
- **Nicht aufgenommen (keine Labels in 17 Sprachen):** `PE_battle_of_junin` (06.08.),
  `PE_battle_of_ayacucho` (09.12.) → `UNTRANSLATED_HOLIDAY_IDS` in `scripts/lib/holidaySelection.mjs`.
- `AU_friday_before_afl_grand_final`: nach der Tentative-Zusammenführung liegen 10 Jahre vor,
  die Regelableitung erkennt jetzt `nth_weekday` (letzter Freitag im September, `AU-VIC`) statt
  `precomputed`.
- `NAGER_CACHE_DIR` (neu in `fetch-holidays.mjs`) erlaubt Wiederholungsläufe ohne Netz.

## G-11 – Namenstage

### Filter

`NON_NAME` (bisher nur `n/a` / `support ukraine`) ist zu `NON_NAME_PATTERNS` in
`scripts/lib/namedayFilter.mjs` geworden (nach Sprache gruppiert, meist am Stringanfang
verankert). Gefiltert werden nur eindeutige Nicht-Namen: Festtage („Johannes Döparens dag",
„Rodenje Ivana Krstitelja", „Natale Del Signore", „Svátek práce", „Toussaint"),
Rollenbeschreibungen aus zerlegten Heiligenlisten („Vescovo E Dottore Della Chiesa",
„Papa E Martire"), Marienfeste („Gospa Fatimska", „Beata Vergine Maria Di Lourdes") und Müll
(„40", „-", „(Weihnachten)", „hence Božidar"). **Bewusst behalten:** Vorname + Titel/Beiname
(„Santo Stefano Primo Martire", „Severino Abate", „Benedikt opat", „Eva Hl.", „Karlo Lwanga i dr.")
und Vornamen, die zugleich Festnamen sind (FR „Noël", FI „Vappu"/„Aatto", ES „Reyes", SE „Dag",
FR „Epiphanie"). Sommerzeit-Notizen werden abgeschnitten („Jude -1h" → „Jude").

`node scripts/prune-namedays.mjs` (offline, `writePackageIfChanged`) hat **216 Einträge**
entfernt: IT 119, HR 36, FR 24, CZ 15, DE 8, SE 8, SK 4, ES 1, LV 1. In IT fallen dadurch 58 Tage
weg, an denen abalin nur noch die Rollenbeschreibung führte (der Vorname ging schon in der Quelle
verloren, z. B. 20.01. „Papa E Martire" statt Fabiano/Sebastiano) – Quellenqualität, keine
Filterschärfe.

### Index

`namedayDays` (0–366, Tage mit ≥ 1 Namen) steht neben `hasNamedays` im Ländereintrag von
`data/index.json` (`schema/index.schema.json`, `build-index.mjs`). `hasNamedays` bleibt ab einem
Tag `true`. `validate.mjs` prüft beide Felder gegen das Paket (Fehler) und warnt in einer
Sammelzeile bei `namedayDays < 300` (`NAMEDAY_MIN_DAYS`).

### Abdeckung (Stand nach dem Prune)

| Land | Version | Tage/366 | 29.02. | Namen | Anmerkung |
|---|---|---:|---|---:|---|
| PL | v27 | 366 | ja | 1676 | |
| HU | v27 | 365 | nein | 497 | |
| CZ | v27 | 357 | ja | 367 | Feiertage entfernt |
| SK | v26 | 362 | ja | 394 | |
| GR | v28 | 176 | nein | 345 | **Quellenlücke abalin** (Warnung) |
| BG | v30 | 101 | nein | 312 | **Quellenlücke abalin** (Warnung) |
| RO | v27 | 0 | nein | 0 | `hasNamedays: false` – abalin liefert für RO nichts (auch in älteren Versionen nie) |
| HR | v25 | 356 | nein | 852 | |
| LV | v33 | 365 | nein | 1008 | |
| SE | v30 | 357 | nein | 361 | |
| FI | v28 | 363 | nein | 574 | 01.01./25.12./29.02. fehlen in der Quelle |
| FR | v29 | 341 | nein | 346 | |
| AT | v29 | 366 | ja | 984 | |
| IT | v29 | 307 | nein | 423 | 58 Tage nur Rollenbeschreibung → weg |
| DE | v31 | 365 | ja | 1197 | |
| ES | v31 | 364 | nein | 922 | |

Offen (nicht Teil dieses Pakets): zweite Quelle für BG/GR/RO, 29.02. für alle Länder
außer AT/CZ/DE/PL/SK.
