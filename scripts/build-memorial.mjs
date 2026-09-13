import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {CONTENT_LOCALES} from '../content/key-map.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const rows=await read('content/memorial/catalog.json');
const imageCatalog=await read('content/memorial/images.json');
const images=Object.fromEntries(rows.map(({definition,meta})=>{
  const motif=meta.topic==='memorial'?'candle':/teacher|education|literacy|science|culture|reformation/.test(definition.id)?'books':'flowers';
  const image=imageCatalog[motif];
  assert.equal(image.license,'CC0');
  return [definition.labelKey.slice(9),[{path:image.path,license:image.license,credit:image.author+' · CC0',primary:true}]];
}));
const definitions=rows.map(r=>r.definition),memorial=Object.fromEntries(rows.map(r=>[r.definition.id,r.meta]));
assert.equal(new Set(definitions.map(d=>d.id)).size,definitions.length);
const holidays={},holidayInfo={};
for(const l of CONTENT_LOCALES){const t=await read(`content/memorial/${l}.json`);holidays[l]=t.labels;holidayInfo[l]=t.articles;for(const d of definitions){assert(d.id.startsWith('MEMORIAL_'));assert.equal(d.countryCode,'MEMORIAL');assert(t.labels[d.labelKey.slice(9)]?.trim(),l+'/'+d.id);assert(/^https:\/\//.test(memorial[d.id].source));}}
const dir=path.join(root,'data/packages/MEMORIAL');await fs.mkdir(dir,{recursive:true});
const versions=(await fs.readdir(dir)).filter(n=>/^v\d+$/.test(n)).map(n=>Number(n.slice(1)));
const version=Math.max(0,...versions);
const pkg={countryCode:'MEMORIAL',version:version||1,schemaVersion:1,definitions,memorial,images,i18n:{holidays,holidayInfo}};
if(version){const previous=await read(`data/packages/MEMORIAL/v${version}/package.json`);if(JSON.stringify(previous)===JSON.stringify(pkg)){console.log(`MEMORIAL v${version}: unchanged`);process.exit(0);}pkg.version=version+1;}
const out=path.join(dir,`v${pkg.version}`);await fs.mkdir(out);await fs.writeFile(path.join(out,'package.json'),JSON.stringify(pkg,null,2)+'\n');
console.log(`MEMORIAL v${pkg.version}: ${definitions.length} entries, ${CONTENT_LOCALES.length} locales`);
