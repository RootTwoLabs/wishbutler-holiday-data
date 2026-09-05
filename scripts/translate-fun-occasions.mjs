#!/usr/bin/env node
/**
 * Füllt fehlende Sprach-Labels der Fun-Occasions über den FREIEN Google-
 * Übersetzungs-Endpoint (kein API-Key, kostenlos — derselbe wie
 * translate-holiday-labels.mjs). Quelle EN (immer vorhanden) → Zielsprache.
 *
 * LIZENZ: Wikidata-Labels sind CC0. Maschinelle Übersetzungen kurzer
 * Sachbegriffe/Namen sind nicht schutzrechtsbehaftet (funktionale Übersetzung
 * von Fakten) → lizenzfrei für kommerzielle Nutzung. Es werden KEINE Texte aus
 * kommerziellen „Feiertags"-Seiten übernommen.
 *
 * Verarbeitet content/fun-occasions.json (Harvest) UND
 * content/fun-occasions-curated.json (kuratiert) in-place; Übersetzungen werden
 * in content/.fun-occasions-translation-cache.json gecacht (reproduzierbar,
 * spart Calls). Idempotent: vorhandene Labels werden nie überschrieben.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONTENT = join(ROOT, 'content');
const HARVEST = join(CONTENT, 'fun-occasions.json');
const CURATED = join(CONTENT, 'fun-occasions-curated.json');
const CACHE = join(CONTENT, '.fun-occasions-translation-cache.json');

const ALL_LOCALES = ['de', 'en', 'es', 'fr', 'it', 'pl', 'pt', 'nl', 'sv', 'ru', 'ja', 'ko', 'zh-Hant'];
const DELAY_MS = Number(process.env.TRANSLATE_DELAY_MS ?? 200);

/** Google-Sprachcode (Traditionelles Chinesisch = zh-TW). */
function gLang(loc) {
  return loc === 'zh-Hant' ? 'zh-TW' : loc;
}

async function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(await readFile(path, 'utf8'));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function translateOnce(text, target) {
  const params = new URLSearchParams({ client: 'gtx', sl: 'en', tl: gLang(target), dt: 't', q: text });
  const url = `https://translate.googleapis.com/translate_a/single?${params}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.status === 429) {
        await sleep(2000 * attempt);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const out = (data[0] ?? []).map((seg) => seg[0]).join('').trim();
      if (!out) throw new Error('empty');
      return out;
    } catch (err) {
      if (attempt === 3) {
        console.warn(`translate: "${text}" -> ${target} failed (${err.message})`);
        return null;
      }
      await sleep(800 * attempt);
    }
  }
  return null;
}

/** Sammelt alle Occasion-Objekte (mit .labels) aus einer geladenen Datei. */
function collectOccasions(doc) {
  if (!doc) return [];
  if (Array.isArray(doc.occasions)) return doc.occasions;
  const out = [];
  for (const key of ['dated', 'evergreen']) if (Array.isArray(doc[key])) out.push(...doc[key]);
  return out;
}

async function main() {
  const cache = await readJson(CACHE, {});
  const harvest = await readJson(HARVEST, null);
  const curated = await readJson(CURATED, null);

  const files = [
    [HARVEST, harvest],
    [CURATED, curated],
  ].filter(([, doc]) => doc);

  let calls = 0;
  let filled = 0;
  for (const [, doc] of files) {
    for (const occ of collectOccasions(doc)) {
      const en = occ.labels?.en;
      if (!en) continue;
      for (const loc of ALL_LOCALES) {
        if (occ.labels[loc]) continue; // nie überschreiben (CC0-Labels bleiben)
        const cacheKey = `${loc}::${en}`;
        let val = cache[cacheKey];
        if (val === undefined) {
          val = await translateOnce(en, loc);
          calls++;
          cache[cacheKey] = val ?? null;
          if (calls % 50 === 0) {
            await writeFile(CACHE, JSON.stringify(cache, null, 2) + '\n', 'utf8');
            console.log(`  …${calls} Übersetzungen`);
          }
          await sleep(DELAY_MS);
        }
        if (val) {
          occ.labels[loc] = val;
          filled++;
        }
      }
    }
  }

  await writeFile(CACHE, JSON.stringify(cache, null, 2) + '\n', 'utf8');
  for (const [path, doc] of files) {
    await writeFile(path, JSON.stringify(doc, null, 2) + '\n', 'utf8');
  }
  console.log(`translate-fun-occasions: ${calls} API-Calls, ${filled} Labels gefüllt.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
