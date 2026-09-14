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
 // Kuratierung 2026-09-14 (Evgeny): nur historische Gedenktage — v11 41, v12 93, v13 (max. ein Anlass pro Kalendertag) 78 Einträge.
 assert.equal(rows.length,78);assert.equal(new Set(rows.map(r=>r.definition.id)).size,78);
 for(const r of rows){assert.equal(r.definition.countryCode,'MEMORIAL');assert(r.definition.id.startsWith('MEMORIAL_'));assert(['memorial','awareness'].includes(r.meta.topic));assert.match(r.meta.source,/^https:\/\//);assert(['global','national'].includes(r.meta.scope),r.definition.id+': scope');}
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
test('curation 2026-09-14: only historical remembrance days, no duplicates per date, remembrance dates instead of substitute holidays',()=>{
 const ids=new Set(rows.map(r=>r.definition.id));
 // Berufs-/Themen-/Verwaltungstage, Staatsfeiertage, religiöse Totengedenken und Doppelungen sind raus.
 for(const gone of ['MEMORIAL_LV_police_day','MEMORIAL_LV_medical_worker_day','MEMORIAL_LV_international_day_of_the_family','MEMORIAL_SI_slovenian_sports_day','MEMORIAL_SI_sovereignty_day','MEMORIAL_SK_day_of_the_constitution_of_the_slovak_republic','MEMORIAL_VE_journalists_day','MEMORIAL_US_lincolns_birthday','MEMORIAL_PR_memorial_day','MEMORIAL_NZ_anzac_day','MEMORIAL_CA_armistice_day','MEMORIAL_BE_armistice_day','MEMORIAL_RS_armistice_day','MEMORIAL_BY_commemoration_day','MEMORIAL_MD_memorial_day','MEMORIAL_IL_tisha_bav'])assert(!ids.has(gone),gone+' sollte entfernt sein');
 // Weltweit begangene Tage tragen scope global — genau diese zwölf (v12: + EU-Terrorismusopfer, UN-Sklaverei, Kwibuka, Srebrenica; v13: + Kriegsende in Europa 8. Mai).
 const global=rows.filter(r=>r.meta.scope==='global').map(r=>r.definition.id).sort();
 assert.deepEqual(global,['MEMORIAL_AM_armenian_genocide_remembrance_day','MEMORIAL_AU_anzac_day','MEMORIAL_BA_srebrenica_remembrance_day','MEMORIAL_DE_victims_of_national_socialism','MEMORIAL_EU_day_of_remembrance_for_victims_of_terrorism','MEMORIAL_EU_end_of_second_world_war_in_europe','MEMORIAL_FR_armistice_day','MEMORIAL_GI_workers_memorial_day','MEMORIAL_IL_yom_hashoah','MEMORIAL_LV_day_of_remembrance_for_victims_of_stalinism_and_nazism','MEMORIAL_RW_genocide_remembrance_day','MEMORIAL_UN_remembrance_of_victims_of_slavery']);
 // Gedenkdatum statt Ersatzfeiertag.
 const rule=id=>rows.find(r=>r.definition.id===id).definition.rule;
 assert.deepEqual(rule('MEMORIAL_AR_general_jose_de_san_martin_memorial_day'),{type:'fixed',month:8,day:17});
 assert.deepEqual(rule('MEMORIAL_ZA_human_rights_day'),{type:'fixed',month:3,day:21});
 assert.deepEqual(rule('MEMORIAL_AU_anzac_day'),{type:'fixed',month:4,day:25});
 // Opfer-/Gefallenengedenken sind stilles Gedenken, kein neutraler Aktionstag (LV Besetzung/Lāčplēsis sind seit v13 der Ein-Anlass-pro-Tag-Regel gewichen).
 for(const id of ['MEMORIAL_LV_commemoration_day_of_victims_of_communist_terror','MEMORIAL_DE_volkstrauertag','MEMORIAL_EU_end_of_second_world_war_in_europe'])assert.equal(rows.find(r=>r.definition.id===id).meta.topic,'memorial',id);
 // Entscheidung Evgeny 2026-09-14: höchstens EIN Gedenktag je festem Kalendertag (11.11., 8.5. und 9.5. sind ein Anlass).
 const byDate=new Map();
 for(const r of rows){const d=r.definition.rule;if(d.type!=='fixed')continue;const k=`${d.month}-${d.day}`;const list=byDate.get(k)??[];list.push(r.definition.id);byDate.set(k,list);}
 for(const [k,list] of byDate)assert.equal(list.length,1,k+': mehrere Einträge '+list.join(','));
 assert(!rows.some(r=>r.definition.rule.type==='fixed'&&r.definition.rule.month===5&&r.definition.rule.day===9),'9. Mai ist dasselbe Gedenken wie der 8. Mai');
});
