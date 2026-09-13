import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CONTENT_LOCALES} from '../content/key-map.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('../content/memorial/catalog.json',import.meta.url)));
test('every current memorial card has a locally available CC0 image with provenance',()=>{
 const index=JSON.parse(fs.readFileSync(new URL('../data/index.json',import.meta.url)));
 const pkg=JSON.parse(fs.readFileSync(new URL('../data/'+index.memorial.package,import.meta.url)));
 const credits=Object.values(JSON.parse(fs.readFileSync(new URL('../content/memorial/images.json',import.meta.url))));
 for(const def of pkg.definitions){
  const image=pkg.images[def.labelKey.slice(9)][0];
  assert.equal(image.license,'CC0');
  const credit=credits.find(c=>c.path===image.path);assert(credit);assert.match(credit.source,/^https:\/\/commons.wikimedia.org\/wiki\/File:/);
  assert(credit.author && !credit.author.includes('lacking'));assert(credit.symbolic);
  const bytes=fs.readFileSync(new URL('../data/'+image.path,import.meta.url));assert(bytes.length>10000);assert.equal(bytes[0],255);assert.equal(bytes[1],216);
 }
});
test('memorial catalog is separate, sourced, complete in all app languages',()=>{
 assert.equal(rows.length,80);assert.equal(new Set(rows.map(r=>r.definition.id)).size,80);
 for(const r of rows){assert.equal(r.definition.countryCode,'MEMORIAL');assert(r.definition.id.startsWith('MEMORIAL_'));assert(['memorial','awareness'].includes(r.meta.topic));assert.match(r.meta.source,/^https:\/\//);}
 for(const l of CONTENT_LOCALES){const t=JSON.parse(fs.readFileSync(new URL(`../content/memorial/${l}.json`,import.meta.url)));for(const r of rows)assert(t.labels[r.definition.labelKey.slice(9)]?.trim(),l+'/'+r.definition.id);}
});
test('three German remembrance days have stable annual identities, not numbered anniversaries',()=>{
 for(const [slug,month,day] of [['june_17_uprising',6,17],['november_pogroms',11,9],['victims_of_national_socialism',1,27]]){
  const row=rows.find(r=>r.definition.id==='MEMORIAL_DE_'+slug);assert.deepEqual(row.definition.rule,{type:'fixed',month,day});assert.equal(row.meta.topic,'memorial');
 }
});
