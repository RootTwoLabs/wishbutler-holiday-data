import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CONTENT_LOCALES} from '../content/key-map.mjs';
import {classifyLicense, needsCredit} from './lib/imageLicense.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('../content/memorial/catalog.json',import.meta.url)));
const index=JSON.parse(fs.readFileSync(new URL('../data/index.json',import.meta.url)));
const pkg=JSON.parse(fs.readFileSync(new URL('../data/'+index.memorial.package,import.meta.url)));
test('every current memorial card has a locally available, freely licensed image with provenance',()=>{
 const catalog=JSON.parse(fs.readFileSync(new URL('../content/memorial/images.json',import.meta.url)));
 const credits=fs.readFileSync(new URL('../CREDITS.md',import.meta.url),'utf8');
 for(const def of pkg.definitions){
  const image=pkg.images[def.labelKey.slice(9)][0];
  assert(classifyLicense(image.license),def.id+': '+image.license);
  const source=Object.values(catalog).find(c=>c.path===image.path);
  assert(source,def.id+': keine Provenienz in images.json');
  assert.match(source.source,/^https:\/\/commons.wikimedia.org\/wiki\/File:/);
  assert(source.author && !source.author.includes('lacking'));
  assert.equal(image.sourceUrl,source.source);
  // Attributionspflichtige Lizenzen (CC BY / CC BY-SA) muessen in CREDITS.md stehen.
  if(needsCredit(image.license))assert(credits.includes('`'+image.path+'`'),def.id+': fehlt in CREDITS.md');
  const bytes=fs.readFileSync(new URL('../data/'+image.path,import.meta.url));assert(bytes.length>10000);assert.equal(bytes[0],255);assert.equal(bytes[1],216);
 }
});
test('memorial images are curated per entry, not one shared motif',()=>{
 const paths=new Set(pkg.definitions.map(d=>pkg.images[d.labelKey.slice(9)][0].path));
 assert(paths.size>=pkg.definitions.length*0.9,'zu viele Eintraege teilen ein Symbolbild: '+paths.size);
});
test('memorial catalog is separate, sourced, complete in all app languages',()=>{
 assert.equal(rows.length,80);assert.equal(new Set(rows.map(r=>r.definition.id)).size,80);
 for(const r of rows){assert.equal(r.definition.countryCode,'MEMORIAL');assert(r.definition.id.startsWith('MEMORIAL_'));assert(['memorial','awareness'].includes(r.meta.topic));assert.match(r.meta.source,/^https:\/\//);}
 for(const l of CONTENT_LOCALES){const t=JSON.parse(fs.readFileSync(new URL(`../content/memorial/${l}.json`,import.meta.url)));for(const r of rows)assert(t.labels[r.definition.labelKey.slice(9)]?.trim(),l+'/'+r.definition.id);}
});
test('every memorial day has a full article in every content locale',()=>{
 for(const l of CONTENT_LOCALES){
  const t=JSON.parse(fs.readFileSync(new URL(`../content/memorial/${l}.json`,import.meta.url)));
  for(const r of rows){
   const a=t.articles?.[r.definition.labelKey.slice(9)];
   assert(a,l+'/'+r.definition.id+': kein Artikel');
   for(const f of ['intro','history','traditions'])assert(typeof a[f]==='string'&&a[f].trim().length>20,l+'/'+r.definition.id+': '+f);
   assert(Array.isArray(a.funFacts)&&a.funFacts.length>=2,l+'/'+r.definition.id+': funFacts');
  }
 }
});
test('three German remembrance days have stable annual identities, not numbered anniversaries',()=>{
 for(const [slug,month,day] of [['june_17_uprising',6,17],['november_pogroms',11,9],['victims_of_national_socialism',1,27]]){
  const row=rows.find(r=>r.definition.id==='MEMORIAL_DE_'+slug);assert.deepEqual(row.definition.rule,{type:'fixed',month,day});assert.equal(row.meta.topic,'memorial');
 }
});
test('memorial translations contain no English fallback prose and ship without missing fields',()=>{
 const english=JSON.parse(fs.readFileSync(new URL('../content/memorial/en.json',import.meta.url))).articles;
 for(const locale of CONTENT_LOCALES){
  const content=JSON.parse(fs.readFileSync(new URL(`../content/memorial/${locale}.json`,import.meta.url)));
  assert.deepEqual(pkg.i18n.holidayInfo[locale],content.articles,locale+': published package differs from source');
  for(const row of rows){
   const slug=row.definition.labelKey.slice(9),article=content.articles[slug];
   for(const field of ['intro','history','traditions']){
    if(locale!=='en')assert.notEqual(article[field],english[slug][field],locale+'/'+slug+'/'+field+': English fallback');
    assert(!/@@WB_\d+@@|\uFFFD/.test(article[field]),locale+'/'+slug+'/'+field+': damaged translation');
   }
   article.funFacts.forEach((fact,i)=>{
    assert(typeof fact==='string'&&fact.trim().length>0,locale+'/'+slug+'/funFacts/'+i);
    if(locale!=='en')assert.notEqual(fact,english[slug].funFacts[i],locale+'/'+slug+'/funFacts/'+i+': English fallback');
   });
  }
 }
});
test('Slovenian and Moldovan dates follow the official calendars',()=>{
 const rule=id=>rows.find(r=>r.definition.id===id).definition.rule;
 assert.deepEqual(rule('MEMORIAL_SI_primoz_trubar_day'),{type:'fixed',month:6,day:8});
 assert.deepEqual(rule('MEMORIAL_SI_sovereignty_day'),{type:'fixed',month:10,day:25});
 assert.deepEqual(rule('MEMORIAL_SI_unification_of_prekmurje_slovenes_with_the_mother_nation'),{type:'fixed',month:8,day:17});
 // Pastele Blajinilor = Montag nach der orthodoxen Osterwoche = Radonitsa (BY) minus ein Tag
 const md=rule('MEMORIAL_MD_memorial_day'),by=rule('MEMORIAL_BY_commemoration_day');
 assert.equal(md.type,'precomputed');
 for(const [y,d] of Object.entries(md.dates)){const a=new Date(`${y}-${d}T12:00:00Z`),b=new Date(`${y}-${by.dates[y]}T12:00:00Z`);assert.equal((b-a)/864e5,1,y);}
});
