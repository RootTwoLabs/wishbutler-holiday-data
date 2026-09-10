# Textprüfung – abgeschlossen am 10. September 2026

Alle vorhandenen Texte in holiday-data wurden in allen 17 App-Sprachen durchgesehen und die festgestellten Fehler korrigiert. Die überarbeiteten Inhalte sind in den neu gebauten Paketen enthalten. Es wurde nichts veröffentlicht.

## Umfang

Geprüft wurden Deutsch, Englisch, Französisch, Spanisch, Portugiesisch, Italienisch, Polnisch, Niederländisch, Schwedisch, Norwegisch Bokmål, Dänisch, Finnisch, Russisch, Ukrainisch, Japanisch, Koreanisch und traditionelles Chinesisch.

Die Prüfung umfasst 765 lokalisierte Quelldateien mit 60.113 Textfeldern: Feiertagsnamen sowie je Sprache alle 153 Artikel und 365 Fun-Days. Die Artikel umfassen 29 globale und 124 länderspezifische Einträge. Der konfigurierte Ausschluss des 27. Januar bleibt berücksichtigt.

## Korrekturen

- 7.123 unterschiedliche Langtext- und Bildnachweisfelder in 651 Quelldateien korrigiert; 7.369 protokollierte Bearbeitungsschritte in 206 Durchgängen. Wiederholte Bearbeitungen desselben Feldes sind in der ersten Zahl nur einmal enthalten.
- Zusätzlich 969 Feiertagsnamen ergänzt oder korrigiert, separat protokolliert. Die ersten 20 Artikelkorrekturen stehen ebenfalls in einem eigenen Protokoll und sind nicht pauschal zu den Langtextzahlen addiert.
- Falsche Wortbedeutungen, Grammatik, unpassende regionale Begriffe und gemischte Schriftzeichen bereinigt. Gemeinsame Ausgangsfehler wurden sprachübergreifend abgeglichen.
- Historische Daten, Kalenderarithmetik und Sachangaben präzisiert; unbelegte Ursprungsmythen und pauschale Rekordbehauptungen entfernt oder durch belegte Angaben ersetzt.
- Checkers Day bezieht sich auf Nixons Hund. Das aktive Bild zeigt nun einen Cocker Spaniel als ausdrücklich gekennzeichnetes Symbolfoto. Das frühere Damebrett bleibt nur für historische Paketverweise erhalten; Quelle und Lizenz stehen in CREDITS.md.

## Abschlussprüfungen

| Prüfung | Ergebnis |
| --- | --- |
| Tests | 85 bestanden, 0 fehlgeschlagen |
| Quelltexte | Keine fehlenden/ leeren Felder, Platzhalter, Kodierungsfehler oder unzulässigen Kurztextlängen |
| Schriftsysteme | 60.113 Textfelder geprüft, keine offenen Treffer |
| Paketvalidierung | Alle 3.054 Paketdateien schema-gültig |
| Quellenabgleich | 66.300 Artikelfeldprüfungen und 31.025 Fun-Day-Feldprüfungen erfolgreich |
| Historische Versionen | Alle 2.335 Ausgangspakete per SHA-256 unverändert |
| Wiederholungsbuild | Keine zusätzlichen Versionen oder Byteänderungen |
| Übersetzungsskripte | Alle drei bewahren vorhandene Korrekturen ohne Netzwerkaufrufe |
| Aktive Pakete | 126; GLOBAL v18, FUN v15 |

Die 286 vom Gleichheitsvergleich gemeldeten englisch-identischen Zeichenfolgen sind geprüfte Namen und gebräuchliche Bezeichnungen, keine offenen Übersetzungslücken. Die unverbindlichen Längenempfehlungen für längere Feiertagsartikel erzeugen weiterhin Hinweise; die verbindlichen Fun-Day-Grenzen werden eingehalten.

## Nachweise und Quellen

Die feldgenauen Vorher/Nachher-Protokolle liegen im benachbarten Ordner holiday-text-audit: long-review-*.json, all-label-changes.json und article-changes.json. completion-summary.json dokumentiert den Abschluss; full-generated-verification.json und full-package-verification.json enthalten die Paketnachweise. Die Quellen und Entscheidungen der abschließenden Sachprüfung sind in final-fact-pass-sources.md und source-review-followups.md zusammengefasst.

Ausgewählte Primärquellen:

- [US Department of Labor: Labor Day](https://www.dol.gov/general/laborday/history) – historische Einordnung.
- [Japanisches Justizministerium](https://www.moj.go.jp/MINJI/minji07_00238) – Volljährigkeitsalter.
- [Niederländisches Königshaus](https://www.royal-house.nl/topics/monarchy/king%E2%80%99s-day/history-of-king%E2%80%99s-day) – Geschichte des Königstags.
- [Türkisches Parlament: Gesetz 6752](https://cdn.tbmm.gov.tr/KKBSPublicFile/D26/Y2/T2/KanunMetni/7d7d85c2-c41b-407f-a9ca-7d5e646e355d.html) – Feiertagsgesetz von 2016.
- [Französisches Verteidigungsministerium](https://www.defense.gouv.fr/terre/14-juillet/14-juillet-larmee-terre) – wechselnde Orte der Parade.
- [MIT Sea Grant: Lobster Lore](https://seagrant.mit.edu/lobster-lore/) – Untersuchung des Gefangenen-Mythos.
- [Coca-Cola-Unternehmensarchiv](https://www.coca-colacompany.com/about-us/history/haddon-sundblom-and-the-coca-cola-santas) – historische Weihnachtsmanndarstellung.
- [University of Westminster Archives](https://recordsandarchives.westminster.ac.uk/archive-blog/ghosts-and-pantos-at-the-rpi/) – Pepper’s Ghost, 1862.
- [Brookhaven National Laboratory](https://www.bnl.gov/about/history/firstvideo.php) – Tennis for Two.

Es sind keine festgestellten Fehler oder notwendigen Abschlussarbeiten dieser Prüfung offen.
