import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { LOCALES } from '../config.mjs';

/** Existing editorial translations take precedence over provider/cache output. */
export function preserveLabelCatalog(generated, existing) {
  return { ...generated, ...Object.fromEntries(Object.entries(existing).filter(
    ([, value]) => typeof value === 'string' && value.trim(),
  )) };
}

export async function loadLabelCatalog(directory) {
  const catalog = {};
  for (const locale of LOCALES) {
    try {
      catalog[locale] = JSON.parse(await readFile(join(directory, `${locale}.json`), 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return catalog;
}

/** Preserve native source languages and only emit keys used by this package. */
export function mergeHolidayLabels(current, catalog) {
  if (!current?.en) return current ?? {};
  const result = { ...current };
  const keys = Object.keys(current.en);
  for (const locale of LOCALES) {
    const source = preserveLabelCatalog(current[locale] ?? {}, catalog[locale] ?? {});
    const labels = Object.fromEntries(keys.filter(key => typeof source[key] === 'string' && source[key].trim()).map(key => [key, source[key]]));
    if (Object.keys(labels).length) result[locale] = labels;
  }
  return result;
}
