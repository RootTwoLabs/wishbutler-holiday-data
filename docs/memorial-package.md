# Globales MEMORIAL-Paket

80 Einträge, 17 Sprachen: 45 Gedenktage und 35 Aktionstage. Die Herkunftsländer
sind Hintergrundinformationen, keine Aktivierungseinheiten. Das Paket steht
allen Nutzern unabhängig vom Abo und von Länderpaketen zur Verfügung.

content/memorial/catalog.json enthält die kuratierten Definitionen und Themen.
Das Thema memorial führt zu stillem Gedenken, awareness zu einem sachlichen
Aktionstag. Die App übermittelt diese Unterscheidung bei Nachrichten an die KI.

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
