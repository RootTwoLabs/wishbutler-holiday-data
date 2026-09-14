# Globales MEMORIAL-Paket

78 Einträge, 17 Sprachen (v13, Kuratierung und Erweiterung vom 14. September
2026; höchstens ein Gedenktag je Kalendertag): ausschließlich historische Gedenktage — Opfer-, Gefallenen- und
Ereignisgedenken. v11 hatte den Altbestand auf 41 Einträge gekürzt; v12 hebt
26 historische Gedenk- und Befreiungstage aus den Länderkalendern (mit
`originalId`) und ergänzt 26 neue Tage, die in keinem Paket standen
(Volkstrauertag, Remembrance Sunday, 11. September, Dodenherdenking,
Srebrenica, Kwibuka, Holodomor, Hiroshima, Nanjing …). Die 9.-Mai-Siegestage
bleiben bewusst draußen; der 8. Mai ist ein globaler Eintrag „Kriegsende in
Europa“. Regel seit v13: je Kalendertag höchstens ein Eintrag — bei
Doppelungen bleibt der bedeutendere (11.11. Armistice Day global, 14.6. LV,
17.6. DE, 15.8. JP, 25.4. Anzac, 5.5. AT); die übrigen Tage leben im
Länderkalender weiter. Berufs-, Themen- und Verwaltungstage (Polizei, Lehrer,
Familie, Europatag …), nicht arbeitsfreie Staatsfeiertage (SI, SK), religiöse
Totengedenken (Radonitsa, Paștele Blajinilor, Tischa beAv) und Doppelungen
(PR/US Memorial Day, NZ/AU Anzac Day, BE/RS/CA Armistice Day) wurden entfernt;
sie bleiben in den jeweiligen Länderkalendern. Das Paket steht allen Nutzern
unabhängig vom Abo zur Verfügung.

content/memorial/catalog.json enthält die kuratierten Definitionen und Themen.
Das Thema memorial führt zu stillem Gedenken, awareness zu einem sachlichen
Ereignisgedenken ohne Trauerton (Befreiungs-, Aufstands- und Kriegsende-Tage). Die App übermittelt diese Unterscheidung bei Nachrichten an die KI.

`scope` je Eintrag steuert die Vorauswahl in der App: `global` (zwölf weltweit
begangene Tage, z. B. 27. Januar, Anzac Day, 11. November, 23. August, 11. März,
Srebrenica, Kwibuka) wird
beim Einschalten für jeden Nutzer aktiviert; `national` nur, wenn das
Herkunftsland (`originCountry`) zu den gewählten Länderkalendern gehört. Alle
Einträge bleiben in den Einstellungen einzeln wählbar. Gedenkdaten sind feste
Kalendertage, keine Ersatzfeiertage (San Martín 17.8., Human Rights Day 21.3.).

Alle Einträge haben eine kuratierte Bildreferenz. Urheber, Quellseite und Lizenz
stehen in images.json und CREDITS.md; drei CC0-Symbolmotive dienen als Rückfall.
Alle 80 Hintergrundartikel sind in allen 17 App-Sprachen vorhanden, jeweils mit
Einleitung, Geschichte, Bräuchen und ergänzenden Fakten. Die Prüfung vom
13. September 2026 ist in memorial-text-review-2026-09-13.md dokumentiert.

npm run build:memorial erzeugt nur bei Änderung eine neue Paketversion.
npm run build:index führt das Paket unter index.memorial, getrennt von countries.
Der reguläre Daten-Build führt beide Schritte aus. Anschließend aktualisiert
node scripts/sync-memorial-bundle.mjs im benachbarten App-Repository den Offline-
Katalog und die drei Bilddateien. Die Artikel bleiben im Remote-Paket und werden
nicht ins Offline-Bundle kopiert. Alte Paketversionen bleiben erhalten.

Gesetzliche Gedenkfeiertage bleiben im Länderkalender. Die App verwendet separate
MEMORIAL-Identitäten für die freiwillige Personenauswahl und Nachrichtenerstellung.
Die Relevanzprüfung ist in holiday-relevance-2026-09-11.md dokumentiert.
