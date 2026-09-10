# Text corrections, 10 September 2026

The review covered structural completeness in all 17 app languages and targeted
semantic comparisons. It is not a claim that every sentence in the full corpus
has received a complete editorial review.

## Corrected content

- Added 52 missing holiday keys in each of 11 languages (572 translations), covering
  AU, EG, LV, SG and TR. Existing day-specific and tentative-date distinctions remain.
- Corrected mistranslations involving Amazigh New Year, Niger/Nigeria, the territory
  of Nicoya, Garifuna settlement, the Maroons, Annunciation and the Senior TT race.
- Retained the Spanish name Día de la Raza, with explanatory names in some scripts,
  instead of translating “race” as a sporting contest. The key is unchanged.
- Localized descriptive English labels, especially in Swedish, Norwegian, Danish,
  Finnish and Traditional Chinese. Proper names such as Purim, Chuseok, Matariki,
  Bloomsday and Thanksgiving can legitimately remain unchanged.
- Reworked the International Women's Day history in all 17 languages to distinguish
  the first UN observance in 1975 from the General Assembly resolution in 1977.
  Replaced the incorrectly attributed 2024 UN theme and corrected associated
  grammar, meaning and style problems. Polish retains its different local fun fact.
- Translated the seven unchanged English passages and an additional mixed-language
  introduction in the Danish New Zealand articles, with related grammatical fixes.

## Sources for semantic corrections

- [UN history](https://www.un.org/womenwatch/feature/iwd/iwdarchives.html): first UN
  observance in 1975 and General Assembly resolution in December 1977.
- [UN Women, 2024 theme](https://www.unwomen.org/en/articles/explainer/five-things-to-accelerate-womens-economic-empowerment):
  “Invest in women: Accelerate progress”. The theme is translated in localized texts.
- [Costa Rican Ministry of Education](https://mep.go.cr/noticias/197%C2%BA-aniversario-anexion-partido-nicoya-costa-rica):
  incorporation of the communities of the historical Partido de Nicoya, not a political party.
- [Travel Belize](https://www.travelbelize.org/event/garifuna-settlement-day/):
  Garifuna arrival and settlement, not a financial settlement.
- [IOM TT](https://www.iomtt.com/news/2011/04/14/murray-walker-to-be-guest-of-honour-at-centenary-dinner):
  Senior Race Day belongs to the motorcycle TT, not a race for elderly people.
- [Algerian Ministry of Tourism](https://www.mta.gov.dz/yennayer-2971-lancement-a-batna-des-festivites-officielles-et-nationale/?lang=fr):
  Yennayer is the Amazigh New Year; Amazigh is a proper name.

## Build and regression protection

Editorial catalogs take precedence over cached machine translations. Both article
translation scripts preserve existing articles. Their reruns were checked with
network requests disabled and all existing content compared before and after.

The article build merges corrected labels and articles together. Both article and
standalone label builds create new versions for content changes and leave old
package files untouched. A second article build produced no additional versions.
The 126 previously indexed package files were checked byte for byte; all are unchanged.

All 17 catalogs contain every English reference key; indexed packages have no
missing label translations or article fields relative to English. Additional
regression tests cover label completeness, preservation of curated translations,
native-language labels and Danish/English article leakage.

## Remaining review scope

Follow-up: [long-text review, 10 September 2026](long-text-review-2026-09-10.md)
documents 451 additional corrected fields, validation and exact review coverage.

Matching English strings are candidates for review, not an error count: proper
names and international festival names may be identical across languages.
Historical package text is intentionally preserved. Existing advisory length
warnings remain, especially in shared holiday articles. A full sentence-by-sentence
review of all other long articles and fun facts has not been completed.
