# Textprüfung der Gedenk- und Aktionstage – 13. September 2026

## Umfang

80 Einträge × 17 App-Sprachen = 1.360 Artikel. Die Sprachen entsprechen den
Ressourcen in `wishbutler_app/src/i18n/index.ts`: de, en, fr, es, pt, it, pl, nl,
sv, nb, da, fi, ru, uk, ja, ko und zh-Hant.

Alle Artikel und Titel waren vorhanden. Zwei koreanische Einleitungen
(Venezuelas Journalisten- und Flaggentag) waren jedoch unverändert auf Englisch.
Diese wurden auf Koreanisch ergänzt. Die Prüfung erfasst vollständige Felder,
unveränderte englische Absätze, beschädigte Übersetzungsmarker sowie die
Übereinstimmung des aktuellen Pakets mit den Quelldateien. Sachliche
Auffälligkeiten wurden anhand der unten aufgeführten Quellen korrigiert.
Die neuen Übersetzungen wurden maschinell vorübersetzt und nachgesehen;
die Prüfung ersetzt kein vollständiges muttersprachliches Lektorat aller Artikel.

## Korrekturen und Quellen

- **Slowakei:** Euro-Einführung am 1. Januar 2009; der sinnlose Vergleich mit
  Tschechien entfällt. [Europäische Zentralbank](https://www.ecb.europa.eu/press/pr/date/2009/html/pr090101.en.html)
- **Slowakische Gedenktage:** Verfassungstag und 17. November bleiben staatliche
  Feiertage, sind aber keine arbeitsfreien Tage.
  [Slowakische Regierung, Stand 2026](https://www.vlada.gov.sk/slovensko/statne-sviatky/)
- **17. Juni:** Gesetzliche Einführung bereits im August 1953; 1954 war die erste
  jährliche Begehung. [Deutscher Bundestag](https://www.bundestag.de/dokumente/textarchiv/1953-06-17-protest-sed-212820)
- **Novemberpogrome:** Über 1.400 zerstörte Synagogen und Betstuben sind nicht
  gleichbedeutend mit 1.400 niedergebrannten Synagogen. Die Verfolgung begann
  nicht erst 1938. Auch die Behauptung einer eindeutigen Herkunft des Ausdrucks
  „Kristallnacht“ wurde durch eine Erklärung seiner problematischen Wirkung ersetzt.
  [Bundeszentrale für politische Bildung](https://www.bpb.de/kurz-knapp/hintergrund-aktuell/542301/novemberpogrom-1938/)
- **Familientag:** Beschluss 1993, Begehung ab 1994; keine zeitlich unmögliche
  Einführung 1993 „nach“ dem Familienjahr 1994.
  [UN-Resolution](https://digitallibrary.un.org/record/177297?ln=en)
- **Lettlands UN-Beitritt:** Beitritt am 17. September 1991, kein Wiederbeitritt.
  [Vereinte Nationen](https://digitallibrary.un.org/record/282564?ln=en)
- **Lettische Feuerwehr:** Erster Brandeinsatz am 17. Mai 1865 statt Gründung der
  Vereinigung an diesem Datum. [VUGD](https://www.vugd.gov.lv/lv/vesture)
- **Yad Vashem:** Veraltete Zahl von 4,8 Millionen durch eine beständige Beschreibung
  der Namensdatenbank ersetzt. [Yad Vashem](https://collections.yadvashem.org/en/names/)
- **Kanadischer Armistice Day:** Gemeinsamer Termin mit Thanksgiving ab 1921,
  nicht schon ab 1919. [Kanadisches Verteidigungsministerium](https://www.canada.ca/en/department-national-defence/services/military-history/history-heritage/remembrance-ceremony/2.html)
- **23. August:** Erklärung des Europäischen Parlaments 2008, nicht 2009.
  [Europäisches Parlament](https://www.europarl.europa.eu/doceo/document/DCL-6-2008-0044_EN.pdf)
- **Zolitūde:** Drei Tage Staatstrauer vom 23. bis 25. November 2013; die unbelegte
  Behauptung einer erstmaligen Staatstrauer entfällt.
  [LV portāls](https://lvportals.lv/norises/259304-dzila-lidzjutiba-par-tragediju-zolitude-23-24-un-25-novembri-latvija-seru-diena-informacija-papildinata-2013)
- **Lāčplēsis-Orden:** Drei ausgezeichnete Frauen statt elf.
  [Lettisches Präsidialamt](https://www.president.lv/en/order-lacplesis)
- **Triest:** Freies Territorium ab 1947 und italienische Verwaltung von Zone A
  ab 1954 statt der Aussage, die Stadt sei durchgehend bei Italien geblieben.
  [Slowenische Regierung](https://www.gov.si/en/topics/history-of-slovenia/)
- **Lincoln:** Todesdatum 15. April 1865 und Bezug auf Lees Kapitulation statt eines
  pauschalen Enddatums des Bürgerkriegs. [National Park Service](https://www.nps.gov/people/abraham-lincoln.htm)
- **Waffenstillstand 1918:** Ende der Kämpfe an der Westfront präzisiert; ein
  Waffenstillstand ist kein Friedensvertrag.
- **San Cristóbal:** Irreführende zeitliche Nähe zwischen Stadtjubiläum im März
  und dem Januarfest entfernt.

## Auslieferung und Absicherung

Das aktuelle MEMORIAL-Paket wird aus den korrigierten Quelldateien gebaut und
im Datenindex referenziert. Die App synchronisiert dessen Katalog als Bundle;
die Artikel selbst werden weiterhin mit dem Remote-Paket geladen. Eine
Veröffentlichung auf dem CDN erfordert die Veröffentlichung des Daten-Repositories.

Die Daten-Tests prüfen Artikelvollständigkeit und englische Textreste in allen
17 Sprachen. Der App-Integrationstest prüft ebenfalls alle 17 statt nur de/en.

Ergebnis: MEMORIAL v8, neun Daten-/Locale-Tests und acht App-Tests bestanden.
Die Schema-Prüfung meldet alle Pakete als gültig; bestehende Hinweise zu
empfohlenen Textlängen anderer Pakete bleiben bestehen.
