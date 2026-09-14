# Bildprüfung wishbutler-holiday-data — Aufstellung vor dem Austausch

Stand: 2026-09-14. Geprüft wurden alle 887 Bilder unter `data/images/` (887 aus den aktuellen Paketen, dazu `FUN/checkers_day/01.jpg` als nur historisch referenziertes Bild). Jedes Bild wurde in einer 640-px-Prüfkopie mit Anlass-Label betrachtet und in drei Stufen bewertet. Stichproben der „unpassend"-Urteile wurden nachgeprüft und bestätigt.

| Urteil | Anzahl |
|---|---|
| ok | 581 |
| fraglich (nur lose passend, schwache Qualität, Personen/Politik prüfen) | 202 |
| unpassend (falsches Thema/Land, Politik/Parolen, Gewalt, reine Textseiten) | 103 |

**Stand 2026-09-14: alle 305 Befunde sind ersetzt**, siehe [image-replacement-proposals-2026-09-14.md](image-replacement-proposals-2026-09-14.md) (Abschnitt 4). Diese Datei dokumentiert den Zustand vor dem Austausch; die Bildlinks zeigen auf die inzwischen ersetzten Dateien. Die Bildlinks zeigen relativ auf `data/images/`, die Spalte „Quelle" auf die Commons-Dateiseite, soweit im Repo dokumentiert (CC0-Bilder der alten Automatik-Suche haben keine).

## 1. Der 1. Mai (`images/labour_day/`, globaler Feiertag „Tag der Arbeit")

Alle drei Bilder sind unbrauchbar. Sie kamen aus der automatischen Suche mit dem Begriff „workers solidarity may day" (`content/image-queries.mjs`) und sind als CC0 ohne Quellenangabe abgelegt.

| Bild | Zu sehen | Problem |
|---|---|---|
| [labour_day/01.jpg](../data/images/labour_day/01.jpg) (Titelbild) | Pro-Palästina-Kundgebung vor dem Naturhistorischen Museum Oxford, Palästina-Flaggen, Schild „Freedom for Palestine", Gesichter verpixelt | Politische Demo zum Nahostkonflikt, kein Bezug zum Tag der Arbeit |
| [labour_day/02.jpg](../data/images/labour_day/02.jpg) | Graffiti „1 Мая — день солидарности рабочих" mit Anarchie-Symbol auf Backsteinwand | Anarchisten-Parole, politisch aufgeladen |
| [labour_day/03.jpg](../data/images/labour_day/03.jpg) | Bodenplakat mit Namensliste (Ärzte/Pflegekräfte) bei derselben Oxford-Demo, Palästina-Flagge | Gedenkaktion zum Nahostkonflikt, Textwüste |

### Vorschlag für den Austausch (Wikimedia Commons, Lizenz geprüft)

| Slot | Motiv | Commons-Datei | Lizenz / Autor | Größe |
|---|---|---|---|---|
| 01 (Titelbild) | Geschmückter Maibaum auf einem Dorfplatz unter Sommerhimmel (Querformat, Commons „Quality Image") | [File:Hausdülmen, Dorfplatz -- 2012 -- 3779.jpg](https://commons.wikimedia.org/wiki/File:Hausd%C3%BClmen,_Dorfplatz_--_2012_--_3779.jpg) | CC BY-SA 4.0 / Dietmar Rabich | 4782×2690 |
| 02 | Maibaum mit Kranz und Zunftschildern von unten (Hochformat, Quality Image) | [File:Dülmen, Hausdülmen, Maibaum auf dem Dorfplatz -- 2018 -- 0055.jpg](https://commons.wikimedia.org/wiki/File:D%C3%BClmen,_Hausd%C3%BClmen,_Maibaum_auf_dem_Dorfplatz_--_2018_--_0055.jpg) | CC BY-SA 4.0 / Dietmar Rabich | 3953×5929 |
| 03 | Maiglöckchen (Muguet du 1er Mai, Glücksbringer zum 1. Mai in Frankreich/Belgien/Schweiz) | [File:2018-05-13 (168) Convallaria majalis (lily-of-the-valley) at Bichlhäusl in Frankenfels, Austria.jpg](https://commons.wikimedia.org/wiki/File:2018-05-13_%28168%29_Convallaria_majalis_%28lily-of-the-valley%29_at_Bichlh%C3%A4usl_in_Frankenfels,_Austria.jpg) | CC BY-SA 4.0 / GT1976 | 4000×3000 |

Begründung: Maibaum und Maiglöckchen sind die verbreiteten, unpolitischen Symbole des 1. Mai in Deutschland, Österreich, der Schweiz, Frankreich und Benelux. Da das Bild global (in allen Länderpaketen mit `labour_day`) genutzt wird, ist ein neutrales Frühlings-/Brauchtumsmotiv sinnvoller als eine Gewerkschaftskundgebung. Verworfene Kandidaten: „Workers Day 2025 in Lamego" (CC0, aber Gewerkschaftsbanner mit Text), „Wien SPÖ-Maiaufmarsch" (Parteiveranstaltung), Kieler Stadtarchiv-Fotos (Schwarzweiß, 1960er).

Umsetzung nach Freigabe: drei Dateien laden, auf 1280 px verkleinern, Attribution in `CREDITS.md` (CC BY-SA 4.0 ist attributionspflichtig), Thumbnails per `npm run build:thumbnails -- labour_day`, Pakete neu bauen.

## 2. Unpassende Bilder (103) — Ersatz empfohlen

Auffällige Muster: Die **globalen Feiertagsbilder** (Ostern, Pfingsten, Muttertag, Vatertag, Karfreitag, Josefstag, Epiphanias, Silvester) stammen fast alle aus der ungeprüften Automatik-Suche vom Juni und treffen das Thema oft gar nicht. Bei **Ländern** dominieren „falsches Land" (US-Flaggen bei Canada Day, Luxemburg, Niederlande; ukrainische Flaggen bei polnischen Feiertagen; russische/ukrainische Marine beim chilenischen Navy Day; norwegische Tracht am dänischen Grundlovsdag) und **reine Textseiten** (Briefe, Buchscans, Briefmarken, Plakate).

### Globale Feiertage (alle Länder) — 24

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [assumption/01.jpg](../data/images/assumption/01.jpg) | – | assumption | Barocke Bischofsstatue mit Monstranz und Kreuzstab auf Figur tretend | Zeigt einen Bischofsheiligen (vermutlich Norbert), nicht Maria; besser Mariä-Himmelfahrt-Gemälde oder Marienstatue mit Kräuterbüschel. |
| [christmas_eve/03.jpg](../data/images/christmas_eve/03.jpg) | – | Christmas Eve | Verwackeltes Nachtfoto eines Lichterbaums durch nasse Autoscheibe | Sehr schlechte Qualität mit Regentropfen, Blendflecken und Unschärfe; besser ein sauberes Foto eines beleuchteten Weihnachtsbaums oder einer Krippe. |
| [easter_sunday/01.jpg](../data/images/easter_sunday/01.jpg) | – | Easter Sunday | Riesige pinke Ei-Skulptur in Hotel-Lobby, Datumsstempel | Dekorative Ei-Installation in einer Casino-Lobby (Aufnahme November 2023, Zeitstempel im Bild) hat keinen Osterbezug; besser Ostereier, Osterkorb oder Frühlingsblumen. |
| [easter_sunday/02.jpg](../data/images/easter_sunday/02.jpg) | – | Easter Sunday | Dieselbe Ei-Installation geöffnet, Kuppelhalle, Datumsstempel | Wie Bild 01: Casino-Dekoration ohne Osterbezug, mit Zeitstempel; besser klassisches Ostermotiv wie bunte Eier oder Osterlamm. |
| [easter_sunday/03.jpg](../data/images/easter_sunday/03.jpg) | – | Easter Sunday | Dieselbe Ei-Installation im Blumenrondell, Datumsstempel | Drittes Bild derselben Casino-Installation, kein Osterbezug, Zeitstempel im Bild; besser Osterhase, Eiersuche oder Osterfrühstück. |
| [epiphany/03.jpg](../data/images/epiphany/03.jpg) | – | epiphany | Museums-Diorama mit Waffenwand voller Säbel und Dolche, Figur mit Turban | Waffensammlung hat keinen Bezug zu Epiphanias/Heilige Drei Könige und wirkt irreführend; besser Sternsinger, Krippe mit den drei Königen oder Dreikönigskuchen. |
| [fathers_day/01.jpg](../data/images/fathers_day/01.jpg) | – | Father's Day | Corot-Landschaftsgemälde mit Weg, Bäumen, Spaziergängern und Hund | Landschaftsgemälde ohne erkennbaren Vater-Kind-Bezug; besser Vater mit Kind auf den Schultern oder gemeinsam beim Spielen. |
| [fathers_day/02.jpg](../data/images/fathers_day/02.jpg) | – | Father's Day | Impressionistisches Gemälde zweier Frauen in einem Boot unter Weiden | Zwei Frauen im Boot haben keinen Bezug zum Vatertag; besser Vater mit Kind oder Geschenk/Karte für Papa. |
| [good_friday/01.jpg](../data/images/good_friday/01.jpg) | – | good_friday | Landstraße mit Bahnübergang, Strommasten, kahle Bäume | Bahnübergang hat keinerlei Bezug zu Karfreitag; besser ein schlichtes Holzkreuz, Kirchenfenster oder Kerze im stillen Licht. |
| [good_friday/02.jpg](../data/images/good_friday/02.jpg) | – | good_friday | Aquarell-Skizze einer Ebene mit Zeltlager und Reitern | Landschaftsskizze (vermutlich Kriegslager) ohne Bezug zu Karfreitag; besser Kreuz, Kirche oder Passionsmotiv in ruhiger Bildsprache. |
| [labour_day/01.jpg](../data/images/labour_day/01.jpg) | – | labour_day | Demonstration mit Palästina-Flaggen vor Oxford-Museum | Politische Kundgebung zum Nahostkonflikt ohne Bezug zum Tag der Arbeit; besser Maibaum, Handwerker oder Nelken. |
| [labour_day/02.jpg](../data/images/labour_day/02.jpg) | – | labour_day | Graffiti 1 Mai mit Anarchie-Symbol auf Backsteinwand | Anarchisten-Graffiti mit Parolen ist politisch aufgeladen; besser Maibaum, Arbeiterhände oder Maiglöckchen. |
| [labour_day/03.jpg](../data/images/labour_day/03.jpg) | – | labour_day | Namensliste auf Boden bei Protest, verpixelte Personen | Gedenkliste einer Protestaktion, Textwüste ohne Bezug zum Tag der Arbeit; besser Maibaum oder Werkzeuge. |
| [mothers_day/01.jpg](../data/images/mothers_day/01.jpg) | – | Mother's Day | Vergilbter handgeschriebener Brief in Kursivschrift | Unleserliche Textseite ohne Muttertagsbezug; besser Blumenstrauß, Mutter mit Kind oder Grußkarte. |
| [mothers_day/02.jpg](../data/images/mothers_day/02.jpg) | – | Mother's Day | Historischer Brief mit kreuzweise beschriebenen Zeilen | Unleserliche Textseite ohne Muttertagsbezug; besser Blumen oder Mutter-Kind-Motiv. |
| [mothers_day/03.jpg](../data/images/mothers_day/03.jpg) | – | Mother's Day | Alter handgeschriebener Brief auf hellem Papier | Unleserliche Textseite ohne Muttertagsbezug; besser Blumen oder Mutter-Kind-Motiv. |
| [pentecost/02.jpg](../data/images/pentecost/02.jpg) | – | Pentecost | Weiße Kreidefelsen von Dover mit Leuchtturm | Klippen von Dover haben keinen Bezug zu Pfingsten; besser Taube, Flammenzungen oder Pfingstrosen. |
| [pentecost/03.jpg](../data/images/pentecost/03.jpg) | – | Pentecost | Gemälde mit Kriegsschiffen vor Dover, Museumsfarbkeil am Rand | Kriegsgemälde mit Kalibrierungsstreifen hat nichts mit Pfingsten zu tun; besser Taube, Flammen oder Pfingstgottesdienst. |
| [saint_josephs_day/02.jpg](../data/images/saint_josephs_day/02.jpg) | – | Saint Joseph's Day | Statue des heiligen Antonius mit Lilie und Jesuskind | Falscher Heiliger (Antonius von Padua in Franziskanerkutte statt Josef); besser Josef mit Zimmermannswerkzeug oder Lilienstab und Kind. |
| [saint_josephs_day/03.jpg](../data/images/saint_josephs_day/03.jpg) | – | Saint Joseph's Day | Statue eines Jesuitenheiligen in schwarzer Soutane mit Buch | Falscher Heiliger (vermutlich Ignatius von Loyola), kein Josef-Bezug; besser Josefsstatue mit Werkzeug oder Zimmermannsmotiv. |
| [st_stephen/03.jpg](../data/images/st_stephen/03.jpg) | – | st_stephen | Gedenktafel mit Text über Rettung des Stephansturms 1945 | Reine Texttafel mit Kriegsbezug, nicht als Grußkarte geeignet; besser Stephanus-Darstellung oder Stephansdom in festlicher Stimmung. |
| [whit_monday/01.jpg](../data/images/whit_monday/01.jpg) | – | whit_monday | Kreidefelsen von Dover mit Leuchtturm bei blauem Himmel | Kein Bezug zu Pfingsten (vermutlich „white“-Treffer); besser Taube, Pfingstrosen, Kirchenfenster oder Frühlingsausflug im Grünen. |
| [whit_monday/02.jpg](../data/images/whit_monday/02.jpg) | – | whit_monday | Gemälde: Kriegsschiffe vor Dover, Museumsfarbkeil am Rand | Kriegsmarine-Gemälde ohne Pfingstbezug, dazu Museumsbeschriftung im Bild; besser Taube oder Pfingstrosen. |
| [whit_monday/03.jpg](../data/images/whit_monday/03.jpg) | – | whit_monday | Kupferstich: Darstellung Jesu im Tempel, lateinischer Text unten | Falsches Fest (Lichtmess/Darstellung im Tempel statt Pfingsten), textlastiger Stich; besser Pfingstwunder-Darstellung, Taube oder Frühlingsmotiv. |

### Gedenk- und Aktionstage (MEMORIAL) — 3

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [MEMORIAL/cd_congolese_genocide_day/01.jpg](../data/images/MEMORIAL/cd_congolese_genocide_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:2013_Boulevard_du_30_Juin_Kinshasa_8756682965.jpg) | Congolese Genocide Day | Boulevard in Kinshasa mit Autos und Werbeplakat | Alltägliche Straßenszene ohne jeden Gedenkbezug; besser Kerzen, Kranz oder ein Gedenkort in Kinshasa. |
| [MEMORIAL/lv_baltic_unity_day/01.jpg](../data/images/MEMORIAL/lv_baltic_unity_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Constructing_of_monument_to_Saules_Battle%2C_AD1236_-_panoramio.jpg) | Baltic Unity Day | Findling auf Baustelle mit Rasengittersteinen und Brettern | Unfertige Baustelle des Saule-Denkmals, nicht als Gedenkmotiv erkennbar; besser fertiges Denkmal oder die drei baltischen Flaggen. |
| [MEMORIAL/na_genocide_remembrance_day/01.jpg](../data/images/MEMORIAL/na_genocide_remembrance_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Genozid-Denkmal_vor_der_Alten_Feste_in_Windhoek3.jpg) | Genocide Remembrance Day | Bronzerelief mit erhängten Menschen und bewaffneten Soldaten, Windhoek | Das Relief zeigt Gehängte und Soldaten mit Gewehren, also explizite Gewaltdarstellung; besser die Skulptur des stehenden Paares am Genozid-Denkmal oder ein Kranz. |

### Kuriose Feiertage (FUN) — 4

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [FUN/checkers_day/00.jpg](../data/images/FUN/checkers_day/00.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:American_Cocker_Spaniel.jpg) | Checkers Day (09-23) | Zotteliger heller Cocker Spaniel auf Holzboden, Blitzfoto | Der Hund verweist auf Nixons Hund „Checkers“, Nutzer erwarten beim Label aber das Dame-Spiel, zudem schwache Bildqualität; besser ein Dame-Brett mit Spielsteinen. |
| [FUN/international_animation_day/01.jpg](../data/images/FUN/international_animation_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Zoetrope_NN.jpg) | International Animation Day (10-28) | Antikes Zoetrop mit Bildstreifen tanzender Figuren | Der Bildstreifen zeigt rassistische Minstrel-Karikaturen (Blackface-Stil), als Grußkarten-Motiv anstößig; besser ein Daumenkino, Zeichentrick-Skizzen oder ein Zoetrop mit neutralem Motiv (z. B. galoppierendes Pferd). |
| [FUN/mechanical_pencil_day/01.jpg](../data/images/FUN/mechanical_pencil_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Taking_notes_with_a_pencil_%28Unsplash%29.jpg) | Mechanical Pencil Day (07-05) | Hand schreibt mit gelbem Holzbleistift, Spitzerspäne daneben | Zeigt einen klassischen Holzbleistift mit Anspitzspänen, also genau das Gegenteil eines Druckbleistifts; besser ein Druckbleistift mit Minen-Nahaufnahme. |
| [FUN/world_goth_day/01.jpg](../data/images/FUN/world_goth_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Albi-cathedral-gothic-vault-geometry.jpg) | World Goth Day (05-22) | Schwarzweiß-Foto eines gotischen Kathedralen-Rippengewölbes mit Wappen | World Goth Day feiert die Goth-Subkultur (Musik, schwarze Mode), nicht die gotische Architektur, das Gewölbe führt in die Irre; besser ein Stillleben mit schwarzen Rosen, Kerzen und Spitze oder dezente Goth-Mode/Make-up ohne erkennbare Personen. |

### Land AR — 2

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [AR/independence_day/02.jpg](../data/images/AR/independence_day/02.jpg) | – | Independence Day | Umriss der Provinz Buenos Aires mit Provinzflagge gefüllt | Provinzkarte mit Provinzwappen statt Nationalsymbol, für Laien nicht als Unabhängigkeitstag lesbar; besser Casa de Tucumán, Escarapela oder Fahnenmeer. |
| [AR/independence_day/03.jpg](../data/images/AR/independence_day/03.jpg) | – | Independence Day | Umriss einer argentinischen Provinz mit Regionalflagge gefüllt | Abstrakte Provinzkarte ohne erkennbaren Bezug zum nationalen Feiertag; besser Casa Histórica de Tucumán oder argentinische Flaggen bei Feierlichkeiten. |

### Land AT — 3

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [AT/national_holiday/02.jpg](../data/images/AT/national_holiday/02.jpg) | – | National Holiday | US-Briefmarke von 1943 mit Österreich-Flagge und viel Text | US-Postwertzeichen aus dem Zweiten Weltkrieg mit dominanter Beschriftung, falscher Kontext für den Nationalfeiertag; besser Bundesflagge am Parlament oder Leistungsschau am Heldenplatz. |
| [AT/saint_martins_day/02.jpg](../data/images/AT/saint_martins_day/02.jpg) | – | Saint Martin's Day | Handschriftliche englische Tagebuchseite | Alte englische Handschrift ohne jeden Bezug zum Martinstag; besser Laternenumzug, Martinsgans oder Mantelteilung. |
| [AT/saint_martins_day/03.jpg](../data/images/AT/saint_martins_day/03.jpg) | – | Saint Martin's Day | Handschriftlicher englischer Brief, zwei Seiten | Historischer Brief ohne Bezug zum Martinstag; besser Kinder mit Laternen oder St. Martin auf dem Pferd. |

### Land AU — 2

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [AU/anzac_day/03.jpg](../data/images/AU/anzac_day/03.jpg) | – | Anzac Day | Leere Innenstadtstraße mit Straßenbahnschienen (Adelaide) | Leere Straße ohne erkennbaren Gedenkbezug; besser Dawn Service, Kranzniederlegung oder Mohnblumen am Ehrenmal. |
| [AU/labour_day_au/03.jpg](../data/images/AU/labour_day_au/03.jpg) | – | Labour Day | Paradewagen mit riesigem Fisch und Schriftzug 'Eat More Fish' | Werbewagen der Fischereibehörde mit dominantem Text, kein Bezug zum Tag der Arbeit; besser Arbeiter-/Gewerkschaftsmotiv oder entspannter Feiertag im Freien. |

### Land BR — 1

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [BR/independence_day/02.jpg](../data/images/BR/independence_day/02.jpg) | – | Independence Day | Panzer mit Soldaten bei Militärparade vor Zuschauern | Panzer wirkt martialisch und passt nicht zu einer freundlichen Grußkarte; besser Flagge, Feuerwerk oder feiernde Menschen in Grün-Gelb. |

### Land CA — 7

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [CA/canada_day/01.jpg](../data/images/CA/canada_day/01.jpg) | – | Canada Day | US-Flagge über kanadischer Flagge, Soldaten salutieren auf Militärbasis | US-Flagge dominiert und Militärkontext passt nicht zum Canada Day; besser Ahornblatt-Flagge, Feuerwerk über Ottawa oder feiernde Menschen in Rot-Weiß. |
| [CA/canada_day/02.jpg](../data/images/CA/canada_day/02.jpg) | – | Canada Day | Große US-Flagge an Gebäude mit Bannern 'Happy 4th of July' | Falsches Land und falscher Feiertag (US-Unabhängigkeitstag); besser kanadische Flagge oder Canada-Day-Feier. |
| [CA/canada_day/03.jpg](../data/images/CA/canada_day/03.jpg) | – | Canada Day | US-Marines-Fahnenwache mit US-Flagge auf Rasen vor Zelten | US-Militär und US-Flagge, kein Kanada-Bezug; besser kanadische Flaggen, Ahornblatt-Deko oder Feuerwerk. |
| [CA/civic_holiday/02.jpg](../data/images/CA/civic_holiday/02.jpg) | – | Civic Holiday | Japanische Tanzgruppe mit Fächer vor Sapporo-Bier-Werbewand | Werbebanner einer Biermarke und kein erkennbarer Bezug zum Civic Holiday; besser Sommerfest, See oder Picknick. |
| [CA/labour_day_ca/02.jpg](../data/images/CA/labour_day_ca/02.jpg) | – | Labour Day | Paradewagen 'Sanitation & Health – Help keep it clean' mit Mülltonnen | Werbewagen der Stadtreinigung mit dominantem Text, kein Bezug zum Tag der Arbeit; besser Gewerkschaftsparade oder Handwerker-Motiv. |
| [CA/remembrance_day/03.jpg](../data/images/CA/remembrance_day/03.jpg) | – | Remembrance Day | Spanische Soldaten übergeben Kranz an Gedenkstein mit spanischer Flagge | Spanische Armee und spanische Flagge an ausländischem Stützpunkt, kein Kanada-Bezug; besser Mohnblumen, kanadisches Kriegerdenkmal oder Kranzniederlegung in Ottawa. |
| [CA/victoria_day/01.jpg](../data/images/CA/victoria_day/01.jpg) | – | Victoria Day | Historischer Paradewagen mit Kuppeln, Singer-Werbeschild, Zuschauer, Schwarzweiß | Alter Reklame-Paradewagen ohne erkennbaren Bezug zu Victoria Day; besser Feuerwerk am Maiwochenende, Krone/Queen-Victoria-Statue oder Frühlingsgarten. |

### Land CH — 3

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [CH/federal_day_of_thanksgiving/01.jpg](../data/images/CH/federal_day_of_thanksgiving/01.jpg) | – | Federal Day of Thanksgiving | Vergilbtes Titelblatt eines Bettags-Büchleins von 1929 in Frakturschrift | Reine Textseite in Fraktur, thematisch zwar korrekt, aber als Grußkarten-Titelbild ungeeignet; besser eine Kirche in Herbstlandschaft, Erntegaben oder ein Gottesdienst-Motiv. |
| [CH/st_berchtolds_day/03.jpg](../data/images/CH/st_berchtolds_day/03.jpg) | – | St. Berchtold's Day | Gescannte englische Buchseite über Nussverarbeitung in Fabriken | Reine Textseite ohne Bezug zum Berchtoldstag, nur das Stichwort Nuss hat wohl zur Auswahl geführt; besser ein Foto von Haselnüssen oder einem Winterbrauch. |
| [CH/swiss_national_day/01.jpg](../data/images/CH/swiss_national_day/01.jpg) | – | Swiss National Day | Hubble-Aufnahme einer Galaxie im Weltall | Astronomiebild ohne jeden Bezug zur Schweiz oder zum 1. August; besser Schweizer Fahne, Höhenfeuer, Lampions oder Feuerwerk wie in Bild 02/03. |

### Land CL — 3

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [CL/navy_day/01.jpg](../data/images/CL/navy_day/01.jpg) | – | Navy Day | Weiß gekleidete Matrosen paradieren am Ufer von Sewastopol | Zeigt die russische bzw. ukrainische Marineparade in Sewastopol, nicht Chile; besser die Esmeralda, ein Denkmal für Arturo Prat oder chilenische Marineparade in Valparaíso. |
| [CL/navy_day/02.jpg](../data/images/CL/navy_day/02.jpg) | – | Navy Day | Matrosen mit ukrainischer Marineflagge auf Ponton, Sewastopol | Falsches Land, ukrainische Marineflagge statt Chile; besser chilenische Marine mit Landesflagge. |
| [CL/navy_day/03.jpg](../data/images/CL/navy_day/03.jpg) | – | Navy Day | Matrosen mit Andreasflagge der russischen Marine auf Ponton | Russische Marineflagge, falsches Land; besser ein Motiv der chilenischen Armada, z. B. Segelschulschiff Esmeralda. |

### Land CO — 1

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [CO/battle_of_boyaca/03.jpg](../data/images/CO/battle_of_boyaca/03.jpg) | – | Battle of Boyacá | Schlachtengemälde mit kämpfenden Soldaten und Gefallenen | Gewaltdarstellung mit toten und verwundeten Soldaten passt nicht zu einer freundlichen Grußkarte; besser das Denkmal an der Brücke von Boyacá oder kolumbianische Flaggen. |

### Land DK — 1

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [DK/constitution_day/03.jpg](../data/images/DK/constitution_day/03.jpg) | – | Constitution Day | Zwei Frauen in norwegischer Tracht mit Norwegen-Fahne | Falsches Land: Bunad und norwegische Flagge gehören zum 17. Mai in Norwegen, nicht zum dänischen Grundlovsdag; besser Dannebrog-Fahnen oder Christiansborg. |

### Land EG — 9

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [EG/armed_forces_day/01.jpg](../data/images/EG/armed_forces_day/01.jpg) | – | Armed Forces Day | Altes Schwarzweißfoto: Dampfschiff im Suezkanal | Ziviler Dampfer aus den 1930ern hat nichts mit dem Tag der Streitkräfte (6. Oktober 1973) zu tun; besser ägyptische Flagge, Militärparade oder das 6.-Oktober-Panorama. |
| [EG/armed_forces_day/02.jpg](../data/images/EG/armed_forces_day/02.jpg) | – | Armed Forces Day | Koloriertes altes Foto: Frachtschiff im Suezkanal | Wieder ein historisches Handelsschiff ohne Bezug zu den Streitkräften; besser Ägyptische Flagge oder Ehrenformation. |
| [EG/armed_forces_day/03.jpg](../data/images/EG/armed_forces_day/03.jpg) | – | Armed Forces Day | Schwarzweißfoto: Bergungskran hebt Schiffswrack | Bergungsarbeiten eines Wracks (Kanalräumung) wirken wie ein Unglück und passen nicht zu einem Feiertag; besser Flagge, Parade oder Denkmal des Unbekannten Soldaten. |
| [EG/islamic_new_year/03.jpg](../data/images/EG/islamic_new_year/03.jpg) | – | Islamic New Year | Collage: Mondsichel, Iftar-Tafeln, Gebet, Zakat-al-Fitr-Kartons | Sechsteilige Collage zeigt Ramadan/Eid-al-Fitr-Motive (Iftar, Zakat-al-Fitr-Spendenboxen mit Schrift), nicht das islamische Neujahr; besser ein einzelnes Motiv mit Mondsichel oder Kalender/Hidschra-Bezug. |
| [EG/june_30_revolution/03.jpg](../data/images/EG/june_30_revolution/03.jpg) | – | June 30 Revolution | Beschädigtes altes Schwarzweißfoto einer Uferstraße mit Karren | Stark beschädigte Glasplatte (weißer Fleck über ein Drittel des Bildes) ohne Anlassbezug; besser ägyptische Flagge oder Kairo-Panorama. |
| [EG/revolution_day_2011_national_police_day/01.jpg](../data/images/EG/revolution_day_2011_national_police_day/01.jpg) | – | Revolution Day 2011 / National Police Day | Historische Luftaufnahme von Kairo mit Nil und Brücken | Altes Luftbild hat keinen Bezug zu Revolution 2011 oder Polizeitag; besser ägyptische Flagge oder friedlicher Tahrir-Platz bei Tag. |
| [EG/revolution_day_2011_national_police_day/02.jpg](../data/images/EG/revolution_day_2011_national_police_day/02.jpg) | – | Revolution Day 2011 / National Police Day | Kuppelbau mit Mondsichel in Kairo vor Wolkenhimmel | Mausoleumsähnliches Gebäude ohne erkennbaren Bezug zum Anlass, Schuttfläche im Vordergrund; besser Flagge oder Tahrir-Platz. |
| [EG/revolution_day_2011_national_police_day/03.jpg](../data/images/EG/revolution_day_2011_national_police_day/03.jpg) | – | Revolution Day 2011 / National Police Day | Derselbe Kuppelbau von nahem, blauer Himmel | Wie Bild 02: Gebäude ohne Bezug zu Revolution oder Polizeitag; besser Flagge oder Feiernde auf dem Tahrir-Platz. |
| [EG/sinai_liberation_day/02.jpg](../data/images/EG/sinai_liberation_day/02.jpg) | – | Sinai Liberation Day | Alte englische Landkarte der Sinai-Halbinsel mit viel Kleintext | Historische Karte ist auf Handygröße unleserlich und besteht überwiegend aus Text; besser Sinai-Landschaft, Berg Sinai oder Flagge über dem Sinai. |

### Land ES — 2

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [ES/constitution_day/01.jpg](../data/images/ES/constitution_day/01.jpg) | – | Constitution Day | Rote Flagge mit fünf weißen Sternen | Das ist nicht die spanische Nationalflagge, sondern eine regionale bzw. militärische Flagge, für Nutzer missverständlich; besser spanische Flagge oder das Congreso-de-los-Diputados-Gebäude. |
| [ES/constitution_day/03.jpg](../data/images/ES/constitution_day/03.jpg) | – | Constitution Day | Wand voller Wahlplakate von PSOE, PCE, Centro, Partido Carlista | Parteiplakate und Parolen sind politisch aufgeladen und als Grußkarten-Titelbild ungeeignet; besser Verfassungsurkunde oder Congreso-Fassade. |

### Land GB — 1

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [GB/spring_bank_holiday/01.jpg](../data/images/GB/spring_bank_holiday/01.jpg) | – | Spring Bank Holiday | Hochhaus-Wohnblock mit Klimaanlagen und chinesischem Ladenschild | Hongkonger Wohnturm hat mit einem britischen Frühlingsfeiertag nichts zu tun; besser englischer Park, Picknick oder Frühlingslandschaft. |

### Land HK — 1

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [HK/hong_kong_special_administrative_region_establishment_day/02.jpg](../data/images/HK/hong_kong_special_administrative_region_establishment_day/02.jpg) | – | Hong Kong Special Administrative Region Establishment Day | HSBC-100-Dollar-Banknote, Vorder- und Rückseite, viel Text | Ein Geldschein mit Banklogo und Kleintext ist kein Grußkarten-Motiv, auch wenn die Rückseite den Tag nennt; besser Feuerwerk über Victoria Harbour oder die Bauhinia-Flagge. |

### Land IE — 1

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [IE/saint_brigids_day/03.jpg](../data/images/IE/saint_brigids_day/03.jpg) | – | Saint Brigid's Day | Historisches Stereofoto: Zechende in einer Wirtsstube | Trinkszene in einer Kneipe hat keinen erkennbaren Bezug zur Heiligen Brigid; besser ein aus Binsen geflochtenes Brigidskreuz oder Frühlingsblumen (Imbolc). |

### Land IL — 2

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [IL/passover/02.jpg](../data/images/IL/passover/02.jpg) | – | Passover | Haggada-Manuskriptseite, fast nur hebräischer Text, kleine Randfigur | Nahezu reine Textseite ohne erkennbares Pessach-Motiv; besser Sederteller, Matzot oder eine festlich gedeckte Sedertafel. |
| [IL/shavuot/03.jpg](../data/images/IL/shavuot/03.jpg) | – | Shavuot | Schokoladentarte mit Sahne, Minze und Geist-förmiger Zuckerdeko | Schokoladenkuchen mit Gespenster-Deko wirkt wie Halloween und hat keinen Schawuot-Bezug; besser Käsekuchen, Blintzes oder Weizenähren. |

### Land IT — 2

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [IT/liberation_day/02.jpg](../data/images/IT/liberation_day/02.jpg) | – | Liberation Day | Veranstaltungsplakat '25 Aprile con il Polo', Programmtext, Logos | Reines Textplakat mit Programm und Sponsorenlogos ist kein Titelbild; besser Trikolore, Gedenkfeier oder Blumen am Partisanendenkmal. |
| [IT/liberation_day/03.jpg](../data/images/IT/liberation_day/03.jpg) | – | Liberation Day | Ausschnitt desselben Plakats, Text und Gebäudecollage | Wie Bild 02: Textgrafik einer lokalen Veranstaltung ohne eigenständiges Motiv; besser Trikolore oder Kranzniederlegung. |

### Land JP — 2

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [JP/foundation_day/01.jpg](../data/images/JP/foundation_day/01.jpg) | – | Foundation Day | Alte Hinomaru-Flagge voller handschriftlicher Kalligraphie (Kriegs-Glücksflagge) | Militärische Yosegaki-Hinomaru aus dem Zweiten Weltkrieg mit Textwüste, nicht als freundliches Titelbild geeignet; besser Chrysanthemenwappen, Kashihara-Schrein oder einfache japanische Flagge. |
| [JP/foundation_day/02.jpg](../data/images/JP/foundation_day/02.jpg) | – | Foundation Day | Vintage-Postkarte, Frau vor Strahlenflagge, Aufdruck JAPAN | Kriegsflagge (Rising Sun) ist politisch belastet und Postkartentext irritiert; besser Kashihara-Schrein oder Hinomaru-Flaggen an Häusern. |

### Land KR — 2

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [KR/chuseok/01.jpg](../data/images/KR/chuseok/01.jpg) | – | Chuseok | Drei Frauen in roten Schürzen bei Kochaktion | Wirkt wie ein Wohltätigkeits-Kochevent ohne erkennbaren Chuseok-Bezug; besser Songpyeon, Vollmond oder Hanbok-Familie beim Charye-Ritual. |
| [KR/hangul_day/02.jpg](../data/images/KR/hangul_day/02.jpg) | – | Hangul Day | Zwei Männer in Mänteln posieren vor Sejong-Statue | Prominente US-Diplomaten im Fokus, Statue nur Kulisse; besser Sejong-Statue allein oder Hangul-Kalligraphie. |

### Land LU — 6

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [LU/europe_day/01.jpg](../data/images/LU/europe_day/01.jpg) | – | Europe Day | EU-Flagge mit teils regenbogenfarbenen Sternen | Verfremdete Flaggenvariante, nicht die offizielle Europaflagge; besser echte EU-Flagge vor Gebäude oder Schuman-Motiv. |
| [LU/europe_day/02.jpg](../data/images/LU/europe_day/02.jpg) | – | Europe Day | EU-Flagge mit bunten Sternen, einer braun | Verfremdete Flaggenvariante mit irritierendem braunem Stern; besser offizielle Europaflagge oder Europaviertel Luxemburg. |
| [LU/europe_day/03.jpg](../data/images/LU/europe_day/03.jpg) | – | Europe Day | US-Flagge mit vielen Sternen, historische Variante | Falsches Land, US-Flagge hat mit dem Europatag nichts zu tun; besser EU-Flagge oder Kirchberg-Europaviertel. |
| [LU/sovereigns_birthday/01.jpg](../data/images/LU/sovereigns_birthday/01.jpg) | – | Sovereign's birthday | US-Ehrengarde mit US- und Luxemburg-Flagge auf Soldatenfriedhof | US-Militärzeremonie am Soldatenfriedhof passt nicht zum Nationalfeiertag; besser Feuerwerk über Luxemburg-Stadt, Großherzogspalast oder Fahnenschmuck. |
| [LU/sovereigns_birthday/02.jpg](../data/images/LU/sovereigns_birthday/02.jpg) | – | Sovereign's birthday | US-General am Rednerpult, Gedenkfeier in Ettelbrück | Militärische Gedenkveranstaltung mit prominenter Einzelperson ohne Nationalfeiertagsbezug; besser Palais grand-ducal oder Feuerwerk. |
| [LU/sovereigns_birthday/03.jpg](../data/images/LU/sovereigns_birthday/03.jpg) | – | Sovereign's birthday | Historisches Schwarzweißfoto, Frauen schwenken britische und US-Flaggen | Waffenstillstandsjubel 1918 mit fremden Flaggen, kein Luxemburg-Bezug; besser Großherzogspalast oder rot-weiß-blaue Flaggen. |

### Land MX — 2

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [MX/independence_day/01.jpg](../data/images/MX/independence_day/01.jpg) | – | Independence Day | Tanzgruppe in Kostümen auf US-Straße, Sheraton-Hotel | Parade in den USA ohne mexikanische Symbole; besser Grito-Feier, Zócalo mit Flagge oder grün-weiß-rote Dekoration. |
| [MX/independence_day/02.jpg](../data/images/MX/independence_day/02.jpg) | – | Independence Day | Pavillon in Park unter großer Eiche | Beliebiger Parkpavillon ohne Mexiko-Bezug; besser mexikanische Flagge, Feuerwerk oder Kiosk mit Festschmuck. |

### Land NL — 2

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [NL/kings_day/03.jpg](../data/images/NL/kings_day/03.jpg) | – | King's Day | Peruanische Briefmarke zur Stadtgründung von Ica | Völlig falsches Land und Thema; besser Oranje-Feiernde, Grachtenboote oder Vrijmarkt. |
| [NL/liberation_day/02.jpg](../data/images/NL/liberation_day/02.jpg) | – | Liberation Day | Granit-Gedenktafel mit langem zweisprachigem Text | Übermäßig Text, als Titelbild unleserlich; besser Flaggen, Befreiungsfeuer oder Kranzniederlegung. |

### Land NZ — 3

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [NZ/chatham_islands_anniversary_day/03.jpg](../data/images/NZ/chatham_islands_anniversary_day/03.jpg) | – | Chatham Islands Anniversary Day | Unscharfe Satellitenaufnahme: Küstenstreifen und großflächig blaues Meer | Fast nur Wasser, nichts Erkennbares und kein Bezug zu den Chatham-Inseln; besser Strand-, Klippen- oder Tiermotiv der Inseln. |
| [NZ/marlborough_anniversary_day/03.jpg](../data/images/NZ/marlborough_anniversary_day/03.jpg) | – | Marlborough Anniversary Day | Dunkle Weltraumaufnahme mit Wolkenfeldern und kaum erkennbarer Küste | Nichts Erkennbares, dunkel und ohne Bezug zu Marlborough; besser Queen Charlotte Sound, Picton oder Weinberge. |
| [NZ/wellington_anniversary_day/02.jpg](../data/images/NZ/wellington_anniversary_day/02.jpg) | – | Wellington Anniversary Day | Logo des Wellington Harbour Board mit Anker und Fisch | Reines Emblem mit Text ist kein Titelbild-Motiv; besser Wellington-Stadtansicht oder Cable Car. |

### Land PL — 2

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [PL/constitution_day/01.jpg](../data/images/PL/constitution_day/01.jpg) | – | Constitution Day | Ukrainische und Warschauer Flagge an Laterne vor Fassade | Ukraine-Flagge führt in die Irre, kein Bezug zur Verfassung vom 3. Mai; besser Matejkos Gemälde zur Verfassung, Königsschloss Warschau oder rot-weiße Polen-Flaggen. |
| [PL/independence_day/01.jpg](../data/images/PL/independence_day/01.jpg) | – | Independence Day | Ukrainische und Warschauer Flagge an Laterne vor Fassade | Ukraine-Flagge ist ein falsches Land für den polnischen Unabhängigkeitstag; besser polnische Flaggen, Piłsudski-Denkmal oder Grab des Unbekannten Soldaten in Warschau. |

### Land PT — 2

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [PT/freedom_day/01.jpg](../data/images/PT/freedom_day/01.jpg) | – | Freedom Day | Zwei Personen mit Clownsnasen und schwarz-roter Fahne bei Demo | Demo-Szene mit anarchistischer Fahne ohne erkennbaren Bezug zum 25. April; besser rote Nelken (Nelkenrevolution) oder Feierumzug in Lissabon. |
| [PT/freedom_day/02.jpg](../data/images/PT/freedom_day/02.jpg) | – | Freedom Day | Rollstuhlfahrer bei Straßenumzug, Fahnen der Westsahara im Hintergrund | Politischer Demonstrationszug mit landesfremden Fahnen, kein Bezug zur Nelkenrevolution; besser rote Nelken oder Avenida da Liberdade mit portugiesischen Flaggen. |

### Land SE — 1

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [SE/national_day_of_sweden/01.jpg](../data/images/SE/national_day_of_sweden/01.jpg) | – | National Day of Sweden | Polizei mit Helmen eskortiert Marsch, Menschenmenge mit Fahnen | Polizeibegleiteter Demonstrationszug wirkt konfrontativ, nicht wie ein Nationalfeiertag; besser Skansen-Feier, Königsfamilie oder schwedische Flaggen. |

### Land TR — 4

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [TR/ataturk_commemoration_youth_day/02.jpg](../data/images/TR/ataturk_commemoration_youth_day/02.jpg) | – | Atatürk Commemoration & Youth Day | Museumstafeln mit alten Zeitungsseiten zu Trauerausgabe 1938 | Übermäßig Text, Ausstellungsstück zur Staatstrauer, nicht als Titelbild lesbar; besser Atatürk-Porträt, Jugendliche mit Fahnen oder Samsun-Denkmal. |
| [TR/democracy_and_national_unity_day/01.jpg](../data/images/TR/democracy_and_national_unity_day/01.jpg) | – | Democracy and National Unity Day | Rostiges Schiffswrack in der Brandung | Kein Bezug zum 15. Juli, wirkt wie Zufallsbild; besser türkische Flaggen, Bosporus-Brücke oder Gedenkstätte ohne Gewaltdarstellung. |
| [TR/democracy_and_national_unity_day/02.jpg](../data/images/TR/democracy_and_national_unity_day/02.jpg) | – | Democracy and National Unity Day | Britischer Satire-Kupferstich des 18. Jahrhunderts | Völlig anderes Thema und Land, unleserlich als Titelbild; besser türkische Flaggen oder Bosporus-Brücke. |
| [TR/democracy_and_national_unity_day/03.jpg](../data/images/TR/democracy_and_national_unity_day/03.jpg) | – | Democracy and National Unity Day | Englischer Kupferstich 'The European Race' von 1739 | Kein Bezug zur Türkei oder zum 15. Juli, textlastig; besser türkische Flaggen oder Gedenkmotiv. |

### Land US — 5

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [US/independence_day/01.jpg](../data/images/US/independence_day/01.jpg) | – | Independence Day | Alte Werbeanzeige für Feuerwerk, fast nur Text | Reine textlastige Reklame, kein Bildmotiv; besser Feuerwerk über einer Skyline oder US-Flaggen beim Picknick. |
| [US/labour_day_us/02.jpg](../data/images/US/labour_day_us/02.jpg) | – | Labour Day | S/W-Foto: Reihe salutierender Jungen in Uniform vor Gebäude | Kein erkennbarer Bezug zum Tag der Arbeit; besser Arbeiter-Parade, Werkzeuge oder Sommerpicknick. |
| [US/labour_day_us/03.jpg](../data/images/US/labour_day_us/03.jpg) | – | Labour Day | Buchscan einer kleinteiligen Puck-Karikatur „Labor Day“, Buchrand sichtbar | Scan mit Buchrand, extrem kleinteilig und textlastig, als Hero unleserlich; besser eine klare Parade- oder Picknickszene. |
| [US/memorial_day/01.jpg](../data/images/US/memorial_day/01.jpg) | – | Memorial Day | Alte dunkelblaue Fahne mit Adler und Aufschrift „PLENTY-COOS“ | Historisches Museumsartefakt ohne erkennbaren Memorial-Day-Bezug, irreführende Aufschrift; besser Gräberreihen mit kleinen US-Flaggen in Arlington. |
| [US/presidents_day/02.jpg](../data/images/US/presidents_day/02.jpg) | – | Presidents' Day | Sepia-Porträt von George Washington Carver mit Schnurrbart | Namensverwechslung: George Washington Carver war Botaniker, kein Präsident; besser Washington-/Lincoln-Porträt oder Mount Rushmore. |

## 3. Fragliche Bilder (202) — Einzelfallentscheidung

Diese Bilder sind nicht falsch, aber schwach: generische Symbolbilder, historische Schwarzweiß-Scans, Militärparaden, Prominente/Politiker im Bild, Privatpersonen im Fokus, Werbe-/Firmenlogos, Bildfehler (Datumsstempel, Panorama-Format). Vorschlag: zuerst nur die Titelbilder (`01.jpg`) davon ersetzen, Rest bei Gelegenheit.

### Globale Feiertage (alle Länder) — 21

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [ascension/01.jpg](../data/images/ascension/01.jpg) | – | ascension | Ruhiger See mit Wolkenspiegelung und Morgenhimmel | Generische Landschaft, nur über den Himmel lose mit Christi Himmelfahrt verknüpft; besser Himmelfahrtsgemälde, Kirchenfenster oder Lichtstrahlen durch Wolken. |
| [ascension/02.jpg](../data/images/ascension/02.jpg) | – | ascension | Blauer Himmel mit Schleierwolken über Baumsilhouetten | Reines Himmel-Symbolbild ohne erkennbaren Feiertagsbezug; besser Himmelfahrtsmotiv aus Kunst oder Kirche. |
| [ascension/03.jpg](../data/images/ascension/03.jpg) | – | ascension | Sonnenuntergang mit Bergsilhouette und Farbverlauf | Generischer Sonnenuntergang, könnte auch Abschied/Trauer signalisieren; besser eindeutiges Himmelfahrtsmotiv. |
| [boxing_day/02.jpg](../data/images/boxing_day/02.jpg) | – | boxing_day | US-Soldaten in Uniform mit weihnachtlichen Geschenktüten in einem Büro | US-Militär-Motiv ohne Boxing-Day-Bezug (Boxing Day wird in UK/Commonwealth gefeiert); besser Geschenke, Sales-Shopping oder gemütlicher Feiertag nach Weihnachten. |
| [christmas_day_orthodox/01.jpg](../data/images/christmas_day_orthodox/01.jpg) | – | Christmas Day (Orthodox) | Reich verzierte Gottesmutter-Ikone mit goldenen Lampen und Engelfiguren | Orthodoxe Ikone, aber keine Weihnachts- bzw. Geburtsdarstellung, dazu schwer erkennbar und mit kyrillischer Beschriftung; besser eine Geburt-Christi-Ikone wie in Bild 02. |
| [christmas_eve/01.jpg](../data/images/christmas_eve/01.jpg) | – | Christmas Eve | Lichter-Engel auf Weihnachtsmarkt, Verkaufsstand und Mann im Vordergrund | Engel passt, aber Stand, Werbeschilder und Person im Vordergrund machen das Bild unruhig; besser ein freistehender Lichter-Engel oder eine stille Heiligabend-Szene mit Kerzen. |
| [corpus_christi/02.jpg](../data/images/corpus_christi/02.jpg) | – | corpus_christi | Dunkles Schwarzweißfoto, Priester mit Monstranz unter Baldachin | Motiv passt, aber sehr dunkel, unscharf und wenig ansprechend; besser eine helle Prozession mit Blumenteppich oder Monstranz. |
| [epiphany/01.jpg](../data/images/epiphany/01.jpg) | – | epiphany | Krippen-Diorama mit Lehmhaus, Palmen, Tieren, Zettel oben rechts | Krippenmodell ohne sichtbare Heilige Drei Könige und mit Notizzettel im Bild; besser die Drei Könige, Stern von Bethlehem, Sternsinger oder Dreikönigskuchen. |
| [epiphany/02.jpg](../data/images/epiphany/02.jpg) | – | epiphany | Krippen-Diorama mit Steinen, Wasserlauf, Ziegen, weißer Stadt | Zweite Ansicht desselben Dioramas, Könige nicht erkennbar, wirkt wie Bastelmodell; besser Heilige Drei Könige oder Sternsinger. |
| [good_friday/03.jpg](../data/images/good_friday/03.jpg) | – | good_friday | Barockgemälde der Kreuzigung mit Maria und Johannes, Totenschädel | Thematisch passend, aber blutig und düster mit Schädel am Kreuzfuß für eine Grußkarten-Optik; besser ein schlichtes Kreuz vor Himmel oder ein Kirchenfenster. |
| [holy_saturday/01.jpg](../data/images/holy_saturday/01.jpg) | – | Holy Saturday | Osterfeuer im Freien, Ministranten in Weiß, Gemeinde mit Masken | Osternacht-Feuer passt, aber Schnappschussqualität, Parkplatz im Hintergrund und Corona-Masken wirken beliebig; besser eine stimmungsvolle Osterkerze oder ein Osterfeuer bei Dämmerung. |
| [holy_saturday/02.jpg](../data/images/holy_saturday/02.jpg) | – | Holy Saturday | Ministrant geht an kleinem Osterfeuer vorbei, Kies-Labyrinth | Das Feuer ist winzig und das Motiv unscheinbar, Person mit Maske abgeschnitten; besser die Entzündung der Osterkerze am Feuer in Nahaufnahme. |
| [holy_saturday/03.jpg](../data/images/holy_saturday/03.jpg) | – | Holy Saturday | Osterkerze auf Tisch, Priester und Ministranten mit Masken und Visieren | Osterkerze passt zur Osternacht, aber Gesichtsvisiere und Masken datieren das Bild und lenken ab; besser eine Osterkerze allein im dunklen Kirchenraum. |
| [immaculate_conception/01.jpg](../data/images/immaculate_conception/01.jpg) | – | Immaculate Conception | Goldene Krone mit Smaragden und Kreuz vor grauem Hintergrund | Die Anden-Krone gehört zwar einer Marienstatue der Unbefleckten Empfängnis, wirkt ohne Kontext aber wie ein Königsschatz; besser eine Mariendarstellung (blau-weiß, Mondsichel, Sternenkranz). |
| [immaculate_conception/03.jpg](../data/images/immaculate_conception/03.jpg) | – | Immaculate Conception | Weiße Marienstatue über Kirchenschild mit Messzeiten-Text | Das Schild mit Messzeiten und Beichtterminen dominiert die untere Hälfte; besser die Marienstatue allein oder ein Gemälde der Immaculata. |
| [new_years_eve/01.jpg](../data/images/new_years_eve/01.jpg) | – | new_years_eve | Feuerwerk über Lincoln Memorial und Washington Monument | Deutlich US-Nationalfeiertag-Motiv (4. Juli) für einen globalen Silvester-Eintrag; besser neutrales Skyline-Feuerwerk. |
| [saint_peter_and_saint_paul/03.jpg](../data/images/saint_peter_and_saint_paul/03.jpg) | – | Saint Peter and Saint Paul | Verwitterter Kapellenraum mit kleinen Ikonen auf Tischen | Heilige nur winzig erkennbar, Motiv wirkt verfallen und generisch; besser Nahaufnahme einer Petrus-und-Paulus-Ikone. |
| [st_stephen/01.jpg](../data/images/st_stephen/01.jpg) | – | st_stephen | Südturm des Stephansdoms in Wien vor Himmel | Nur Namensbezug über die Kirche, Heiliger selbst nicht erkennbar; besser Darstellung des heiligen Stephanus (Ikone/Statue mit Palmzweig) oder Weihnachtsstimmung. |
| [st_stephen/02.jpg](../data/images/st_stephen/02.jpg) | – | st_stephen | Gotisches Gewölbe des Stephansdoms von unten | Generisches Kircheninnere ohne erkennbaren Stephanus-Bezug; besser Stephanus-Darstellung oder festliches Weihnachtsmotiv. |
| [valentines_day/03.jpg](../data/images/valentines_day/03.jpg) | – | valentines_day | Rückseite der Klappkarte mit Handschrift, Herz kaum sichtbar | Rückansicht des Papierobjekts, Valentinsmotiv nicht erkennbar; besser Frontansicht der Karte, Herzen oder Rosen. |
| [womens_day/01.jpg](../data/images/womens_day/01.jpg) | – | womens_day | Zwei Männer von hinten kaufen Blumen in Blumenladen, Teddys | Nur lose erkennbar (osteuropäische 8.-März-Blumenkauf-Szene), Männer von hinten im Fokus; besser Mimosen-/Tulpenstrauß oder Frauen gemeinsam feiernd. |

### Gedenk- und Aktionstage (MEMORIAL) — 20

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [MEMORIAL/ar_day_of_remembrance_for_truth_and_justice/01.jpg](../data/images/MEMORIAL/ar_day_of_remembrance_for_truth_and_justice/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Parque_de_la_Memoria%2C_Buenos_Aires_-_7.JPG) | Day of Remembrance for Truth and Justice | Weite Parkfläche mit Rasenraster, Monument nur klein | Parque de la Memoria wirkt wie ein gewöhnlicher Stadtpark, Gedenkstele kaum erkennbar; besser Nahaufnahme der Namenswand oder Denkmal. |
| [MEMORIAL/de_june_17_uprising/01.jpg](../data/images/MEMORIAL/de_june_17_uprising/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Berlin_Tiergarten_Stra%C3%9Fe_des_17_Juni.jpg) | East German uprising of 17 June 1953 | Luftbild Straße des 17. Juni durch grünen Tiergarten | Nur der Straßenname stellt den Bezug her, das Bild zeigt eine Parklandschaft; besser Gedenkstein am Bundesfinanzministerium oder Gedenkkranz. |
| [MEMORIAL/il_yom_hazikaron/01.jpg](../data/images/MEMORIAL/il_yom_hazikaron/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:PikiWiki_Israel_12579_entrance_to_the_military_cemetery_on_mount_herzl.jpg) | Yom HaZikaron (Memorial Day) | Eingangsbau Militärfriedhof Herzlberg, Parkplatz mit Auto | Eingangsgebäude mit Parkplatz wirkt wie Architekturfoto, Gedenkcharakter kaum erkennbar; besser Gräberreihen mit Flaggen oder Gedenkkerze. |
| [MEMORIAL/lv_border_guards_day/01.jpg](../data/images/MEMORIAL/lv_border_guards_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Estonia-Latvia_border_in_Valka.jpg) | Border Guards Day | Graue Straßenszene mit EU-Grenzschild Latvija/Valka, kahle Bäume | Nur ein Ortsschild an grauer Straße, Grenzschutz selbst nicht erkennbar; besser lettische Grenzschützer bei einer Zeremonie oder ein Grenzstein mit Flagge. |
| [MEMORIAL/lv_commemoration_day_of_victims_of_genocide_against_the_latvian_people_by_the_totalitarian_communist_regime/01.jpg](../data/images/MEMORIAL/lv_commemoration_day_of_victims_of_genocide_against_the_latvian_people_by_the_totalitarian_communist_regime/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:St%C5%ABra_m%C4%81ja_%28Corner_House%29_in_Riga.02.jpg) | Commemoration Day of Victims of Genocide Against the Latvian People By the Totalitarian Communist Regime | Weißes Jugendstil-Eckgebäude (Stūra māja) an Straßenkreuzung mit Verkehr | Das ehemalige KGB-Haus wirkt ohne Kontext wie ein beliebiges Stadtgebäude; besser Kerzen/Kränze am Gedenkort oder das Viehwaggon-Denkmal. |
| [MEMORIAL/lv_day_of_remembrance_for_victims_of_stalinism_and_nazism/01.jpg](../data/images/MEMORIAL/lv_day_of_remembrance_for_victims_of_stalinism_and_nazism/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Baltsk%C3%BD%C5%98et%C4%9Bz.jpg) | Day of Remembrance for Victims of Stalinism and Nazism | Menschenkette Baltischer Weg 1989 mit litauischer Flagge, jubelnd | Litauische statt lettische Flagge und feiernde Stimmung passen nicht zu einem stillen Opfer-Gedenktag; besser Kerzen am Freiheitsdenkmal oder ein Gedenkstein. |
| [MEMORIAL/lv_day_of_the_sea_festival/01.jpg](../data/images/MEMORIAL/lv_day_of_the_sea_festival/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Boats_in_Ventspils_harbour_-_panoramio.jpg) | Day of the Sea Festival | Zwei Arbeitsschiffe mit Kränen an schäbigem Kai, Ventspils | Industrielle Baggerschiffe an einem verwahrlosten Kai wirken nicht festlich; besser geschmückte Boote, Segelschiffe oder Leuchtturm beim Meeresfest. |
| [MEMORIAL/lv_knowledge_day/01.jpg](../data/images/MEMORIAL/lv_knowledge_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Knowledge_Day_in_Kelmentsi_2025_%2801%29.jpg) | Knowledge Day | Schulkinder in Weiß, Traktor mit kostümierten Erwachsenen auf Schulhof | Der Traktor dominiert und macht die Schulfeier unverständlich; besser Erstklässler mit Blumen und Schulglocke. |
| [MEMORIAL/lv_medical_worker_day/01.jpg](../data/images/MEMORIAL/lv_medical_worker_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Hospital_%28J.Stradina%29_entrance_-_ainars_br%C5%ABvelis_-_Panoramio.jpg) | Medical Worker Day | Backstein-Krankenhausgebäude Stradiņš, geparkte Autos im Vordergrund | Generisches Gebäude mit Parkplatz, medizinisches Personal nicht erkennbar; besser Pflegekräfte/Ärzte oder Stethoskop-Motiv. |
| [MEMORIAL/lv_national_resistance_movement_remembrance_day/01.jpg](../data/images/MEMORIAL/lv_national_resistance_movement_remembrance_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Commemorative_plaque-Konstant%C4%ABns_%C4%8Cakste_01.JPG) | National Resistance Movement Remembrance Day | Textlastige Gedenktafel Konstantīns Čakste an Hauswand, Schaufenster | Kleine Tafel mit dichtem lettischem Text zwischen Schaufenstern, als Titelbild unleserlich; besser Gedenkzeremonie oder Freiheitsdenkmal mit Kranz. |
| [MEMORIAL/lv_official_language_day/01.jpg](../data/images/MEMORIAL/lv_official_language_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Riga_-_Latvian_National_Library_%22Gaismas_pils%22_-_Latvijos_nacionalin%C4%97_biblioteka_%22%C5%A0viesos_pilis%22_-_panoramio.jpg) | Official Language Day | Nationalbibliothek Riga im Rohbau mit Baukran und Gerüst | Baustelle mit Kran wirkt unfertig; besser die fertige Nationalbibliothek oder ein Motiv mit lettischer Schrift/Büchern. |
| [MEMORIAL/lv_world_non_governmental_organization_day/01.jpg](../data/images/MEMORIAL/lv_world_non_governmental_organization_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Volunteers_from_the_community_lend_a_helping_hand._%285913279092%29.jpg) | World Non-Governmental Organization Day | Gruppe posierender Freiwilliger unter Pavillon mit US-Flagge | US-Flagge und Gruppenfoto passen nicht zu einem Welttag der NGOs in Lettland; besser Freiwillige bei der Arbeit ohne Nationalflagge. |
| [MEMORIAL/pg_remembrance_day/01.jpg](../data/images/MEMORIAL/pg_remembrance_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:CDRUSINDOPACOM_Visits_Port_Moresby_%28Bomana%29_War_Cemetery_%288529269%29.jpg) | Remembrance Day | Zwei Männer (Marineoffizier) im Gespräch vor Soldatenfriedhof Bomana | Die Personen dominieren, der Friedhof ist nur Hintergrund; besser Gräberreihen oder Mohnblumen/Kranz in Bomana. |
| [MEMORIAL/si_rudolf_maister_day/01.jpg](../data/images/MEMORIAL/si_rudolf_maister_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Republika_Slovenija-Maribor_2021.jpg) | Rudolf Maister Day | Rudolf-Maister-Statue Maribor, kahle Bäume, Datumsstempel im Bild | Motiv passt, aber ein eingebrannter Datumsstempel 28/12/2021 stört; beschneiden oder anderes Foto der Statue nehmen. |
| [MEMORIAL/si_slovenian_sports_day/01.jpg](../data/images/MEMORIAL/si_slovenian_sports_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Postcard_of_Planica_ski_jumping_hill.jpg) | Slovenian Sports Day | Alte Schwarzweiß-Postkarte Skispringer Planica mit Museums-Wasserzeichen | Vergilbte Postkarte mit Bildunterschrift und SEM-Logo wirkt wie Archivscan; besser aktuelles Foto von Planica oder slowenischen Sportlern. |
| [MEMORIAL/sm_commemoration_of_all_those_who_died_at_war/01.jpg](../data/images/MEMORIAL/sm_commemoration_of_all_those_who_died_at_war/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Fortress_of_Guaita_2013-09-19.jpg) | Commemoration of all those who died at war | Festung Guaita in San Marino auf dem Monte Titano | Reines Wahrzeichen-Foto ohne Gedenkbezug; besser ein Kriegerdenkmal oder Kranzniederlegung in San Marino. |
| [MEMORIAL/ve_journalists_day/01.jpg](../data/images/MEMORIAL/ve_journalists_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Casa_del_Correo_del_Orinoco.jpg) | Journalists' Day | Schlichte weiße Hausfassade des Correo del Orinoco | Bezug zum Journalismus ist nur für Kenner erkennbar; besser Zeitungsseiten, Druckerpresse oder eine Reporter-Szene. |
| [MEMORIAL/ve_slavery_abolition_anniversary/01.jpg](../data/images/MEMORIAL/ve_slavery_abolition_anniversary/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Monumento_a_los_precursores%2C_Paseo_Los_Pr%C3%B3ceres%2C_Paseo_de_los_Precursores.jpg) | Slavery Abolition Anniversary | Bronze-Reiterstatue vor Obelisk am Paseo Los Próceres | Denkmal ehrt Unabhängigkeitshelden, nicht die Abschaffung der Sklaverei; besser ein Motiv zu Freiheit oder zerbrochenen Ketten. |
| [MEMORIAL/ve_teachers_day/01.jpg](../data/images/MEMORIAL/ve_teachers_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Instituto_de_Ni%C3%B1os_Cantores_del_Zulia_001.jpg) | Teachers' Day | Eingang eines Theaters für Kinderchor, karger Vorplatz | Kein Lehrer- oder Schulbezug erkennbar, unattraktives Gebäudefoto; besser Klassenzimmer, Tafel oder Schulkinder. |
| [MEMORIAL/za_human_rights_day/01.jpg](../data/images/MEMORIAL/za_human_rights_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Constitutional_Court_of_South_Africa_judges_view.jpg) | Human Rights Day | Leerer Saal des südafrikanischen Verfassungsgerichts | Trockene Innenaufnahme ohne erkennbaren Menschenrechtsbezug; besser Sharpeville-Gedenkstätte oder Verfassungsgericht von außen. |

### Kuriose Feiertage (FUN) — 54

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [FUN/absurdity_day/01.jpg](../data/images/FUN/absurdity_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Two_Rubber_Chickens.jpg) | National Absurdity Day (11-20) | Zwei Gummihühner hängen an Haken einer Schießbude, Schild '7 SHOTS' | Gummihühner passen zum Absurden, aber aufgehängt an einer Schießbude mit 'SHOTS'-Schild wirkt es leicht makaber; besser ein Gummihuhn allein oder eine bewusst absurde Szene. |
| [FUN/alice_in_wonderland_day/01.jpg](../data/images/FUN/alice_in_wonderland_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Teapot_2010_G1.jpg) | Alice in Wonderland Day (07-04) | Porzellan-Teekanne mit japanischem Dekor auf blauem Tuch | Nur lose über die Teeparty verknüpft, das japanische Motiv führt eher nach Ostasien; besser ein Teeparty-Tisch, Taschenuhr mit weißem Kaninchen oder Alice-Illustration von Tenniel. |
| [FUN/backwards_day/01.jpg](../data/images/FUN/backwards_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Ambigram_Magic_Dream_-_mirror_symmetry_with_a_handheld_pattern_giving_a_reversed_shadow_on_a_blue_wall.jpg) | Backwards Day (01-31) | Hand hält Wolke mit 'DREAM', Schatten zeigt gespiegelt 'MAGIC' | Ambigramm-Kunst ist clever, aber textlastig und der Bezug zu 'verkehrt herum' erschließt sich erst beim Nachdenken; besser Person mit Kleidung verkehrt herum oder Spiegelschrift-Schild. |
| [FUN/bloomsday/01.jpg](../data/images/FUN/bloomsday/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Georgian_Dublin_%2811926449375%29.jpg) | Bloomsday (06-16) | Georgianische Dubliner Backsteinfassade mit roter und blauer Haustür | Nur ein allgemeines Dublin-Motiv ohne Bezug zu Joyce/Ulysses; besser James-Joyce-Statue, Strohhut mit Edwardian-Outfit oder Ulysses-Buchausgabe. |
| [FUN/book_lovers_day/01.jpg](../data/images/FUN/book_lovers_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:A_Baroque_library%2C_Prague_-_7555.jpg) | Book Lovers Day (08-09) | Alte Bücherrücken im Regal, Titel „Die katholische Kirche“ lesbar | Gut lesbare religiöse deutsche Buchtitel wirken für ein neutrales, internationales Titelbild unpassend; besser aufgeschlagenes Buch oder Bücherstapel ohne lesbare Titel. |
| [FUN/bubble_bath_day/01.jpg](../data/images/FUN/bubble_bath_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Bathtub_Bath_Feet_Relax.jpg) | National Bubble Bath Day (01-08) | Nackte Füße ragen aus Schaumbad, Kerze und Blumen | Bloße Füße dominieren das Bild und wirken als Grußkarten-Motiv wenig ansprechend; besser Wanne mit Schaum, Badeente oder Schaumkrone. |
| [FUN/cake_day/01.jpg](../data/images/FUN/cake_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Italy_-_birthday_cake_with_candles_5.jpg) | National Cake Day (11-26) | Sahnetorte mit vielen Kerzen und Zahl „23“ | Wirkt wie eine Geburtstagstorte mit Alterszahl und ist in einer Geburtstags-App missverständlich; besser eine Torte ohne Kerzen und Zahl. |
| [FUN/cake_decorating_day/01.jpg](../data/images/FUN/cake_decorating_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Fondant-covered_cake_sewing_kit.jpg) | National Cake Decorating Day (10-10) | Fondant-Torte in Form eines Nähkästchens mit Garnrollen | Auf den ersten Blick sieht man ein Nähkästchen, nicht eine Torte; besser eine Szene mit Spritzbeutel/Verzieren einer Torte. |
| [FUN/caramel_day/01.jpg](../data/images/FUN/caramel_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Caramel-3.jpg) | National Caramel Day (04-05) | Zerbrochene Hartkaramell-Scherben auf weißem Teller | Sieht eher wie zerbrochenes Bernsteinglas als nach Karamell aus; besser Karamellbonbons oder fließende Karamellsauce. |
| [FUN/cartoonists_day/01.jpg](../data/images/FUN/cartoonists_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Cartoonist_Mike_Russell_in_2009.jpg) | National Cartoonists Day (05-05) | Lächelnder Mann zeichnet mit Stift am Tisch | Porträt einer erkennbaren Privatperson, das Zeichnen ist kaum zu sehen; besser Nahaufnahme einer Hand, die Comicfiguren skizziert. |
| [FUN/chocolate_pudding_day/01.jpg](../data/images/FUN/chocolate_pudding_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Chocolate_pudding_at_Antell_Martintalo.jpg) | National Chocolate Pudding Day (06-26) | Flache Schale mit dunkler Schokoladenmasse, Plastiklöffel, Pappbecher | Wirkt wie geschmolzene Schokosauce im Imbiss und wenig appetitlich; besser klassischer Schokopudding im Glas mit Sahnehaube. |
| [FUN/comic_book_day/01.jpg](../data/images/FUN/comic_book_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:008_Anime_and_manga_bookshop_in_Japan_-_bookstore_in_Kyoto%2C_Japan.jpg) | National Comic Book Day (09-25) | Manga-Regale in japanischer Buchhandlung, großes pinkes Schild | Sehr textlastig mit dominantem japanischem Werbeschild, Comic-Thema nur über Manga-Regale; besser Stapel bunter Comichefte oder Sprechblasen-Motiv. |
| [FUN/day_of_the_ninja/01.jpg](../data/images/FUN/day_of_the_ninja/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Koka_Ninja_House_20090823.jpg) | Day of the Ninja (12-05) | Strohgedecktes Ninja-Haus in Koka, parkende Autos, Ninja-Fotoaufsteller | Ninja-Bezug nur über kleine Comic-Aufsteller erkennbar, parkende Autos dominieren den Vordergrund; besser eine Ninja-Figur, Shuriken oder ein Ninja-Kostüm. |
| [FUN/donald_duck_day/01.jpg](../data/images/FUN/donald_duck_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:American_Pekin_Duck.jpg) | National Donald Duck Day (06-09) | Weiße Pekingente schwimmt auf blauem Wasser | Echte Ente statt der Comicfigur, nur lose Assoziation; lizenzfrei kaum besser lösbar, alternativ Matrosenmütze/Stoffente als Anspielung. |
| [FUN/escargot_day/01.jpg](../data/images/FUN/escargot_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Escargots_%C3%A0_la_bourguignonne.jpg) | National Escargot Day (05-24) | Weinbergschnecken mit Kräuterbutter auf Teller, dunkel fotografiert | Motiv passt, aber Foto ist dunkel, unscharf und wenig appetitlich; besser ein helles Restaurantfoto mit Escargot-Pfanne. |
| [FUN/frankenstein_day/01.jpg](../data/images/FUN/frankenstein_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Burg_Frankenstein_%28Pfalz%29-0432.jpg) | Frankenstein Day (08-30) | Burgruine Frankenstein in der Pfalz auf bewaldetem Hügel | Nur Namensgleichheit, der Tag meint Mary Shelleys Roman und das Monster; besser eine Illustration der Monsterfigur oder ein Porträt von Mary Shelley. |
| [FUN/german_beer_day/01.jpg](../data/images/FUN/german_beer_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Brewery_kettles_-_Carlsberg_-_panoramio.jpg) | German Beer Day (04-23) | Kupferne Sudkessel in einer Brauerei (Carlsberg, Dänemark) | Generische Braukessel einer dänischen Brauerei ohne erkennbaren Deutschland- oder Bierbezug; besser ein gefülltes Bierglas/Maßkrug oder eine deutsche Brauerei mit Bier im Bild. |
| [FUN/good_neighbor_day/01.jpg](../data/images/FUN/good_neighbor_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Colourful_row_of_houses_at_Gamlingay_Cinques_-_geograph.org.uk_-_5819363.jpg) | National Good Neighbor Day (09-28) | Reihe pastellfarbener Reihenhäuser an einer Dorfstraße | Generische Häuserzeile ohne Menschen, Nachbarschaft nur indirekt erkennbar; besser Nachbarn am Gartenzaun oder gemeinsames Straßenfest. |
| [FUN/goof_off_day/01.jpg](../data/images/FUN/goof_off_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:River_Kwai_Hammock_-_Flickr_-_Mark_Fischer.jpg) | National Goof Off Day (03-22) | Hängematten auf Bambusterrasse am Fluss, tropisch | Zeigt nur Entspannung (und dupliziert das Hammock-Day-Motiv), Faulenzen/Blödeln nicht spezifisch; besser jemand, der lachend Unsinn macht oder Füße hochlegt am Schreibtisch. |
| [FUN/grammar_day/01.jpg](../data/images/FUN/grammar_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Wood_letterpress_type.jpg) | National Grammar Day (03-04) | Haufen alter Holz-Druckbuchstaben, Letterpress-Lettern | Typografie statt Grammatik, Bezug nur lose und optisch etwas düster; besser Text mit Rotstift-Korrekturen, Satzzeichen oder aufgeschlagenes Wörterbuch. |
| [FUN/grape_popsicle_day/01.jpg](../data/images/FUN/grape_popsicle_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Fruit_ice_lollies_%288588758339%29.jpg) | National Grape Popsicle Day (05-27) | Pinkes Beeren-Eis am Stiel mit gefrorenen Beeren | Beeren-Eis in Pink statt lila Trauben-Eis, Motiv passt nur teilweise; besser violettes Eis am Stiel oder Trauben-Eis. |
| [FUN/guy_fawkes_night/01.jpg](../data/images/FUN/guy_fawkes_night/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:1_singapore_national_day_parade_2011_fireworks.jpg) | Guy Fawkes Night (11-05) | Feuerwerk über Marina Bay Singapur, Skyline nachts | Feuerwerk passt, aber die Singapur-Skyline (Nationalfeiertag Singapur) ist für den britischen Anlass falsch verortet; besser Bonfire-Night-Feuerwerk oder Lagerfeuer in Großbritannien. |
| [FUN/i_love_honey_day/01.jpg](../data/images/FUN/i_love_honey_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Honeycomb_15_03_2012.jpg) | I Love Honey Day (12-18) | Leere, dunkle Bienenwabe auf trockenem Laub | Wabe wirkt alt, leer und ungepflegt, kein goldener Honig sichtbar; besser Honigglas mit Honiglöffel oder tropfende goldene Wabe. |
| [FUN/internet_day/01.jpg](../data/images/FUN/internet_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Chemicumi_serverid_03.jpg) | International Internet Day (10-29) | Server-Rack mit blauen Netzwerkkabeln | Rechenzentrum wirkt technisch-kühl und für eine Grußkarte wenig einladend; besser Weltkugel mit Netzverbindungen oder Menschen mit Laptop/Smartphone. |
| [FUN/inventors_day/01.jpg](../data/images/FUN/inventors_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Hedy_Lamarr_in_The_Heavenly_Body_1944.jpg) | Inventors' Day (11-09) | Schwarzweiß-Studioporträt von Hedy Lamarr, 1944 | Glamour-Porträt einer Schauspielerin, der Erfinder-Bezug (Lamarrs Frequenzsprung-Patent) ist ohne Vorwissen nicht erkennbar; besser Glühbirne, Patentzeichnung oder Werkstatt-Motiv. |
| [FUN/leap_day/01.jpg](../data/images/FUN/leap_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:WallCalendar.jpg) | Leap Day (02-29) | Wandkalender 2007 mit rot markiertem 24. Oktober | Kalender zeigt September bis November 2007 mit markiertem 24. Oktober, kein Bezug zum 29. Februar; besser ein Kalenderblatt Februar mit dem 29. oder ein Frosch-Motiv. |
| [FUN/lefthanders_day/01.jpg](../data/images/FUN/lefthanders_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Left-handed_writing_with_wristwatch.jpg) | International Lefthanders Day (08-13) | Hand mit Armbanduhr schreibt in Notizbuch neben Laptop | Linkshändigkeit ist im Bildausschnitt kaum erkennbar, wirkt wie generisches Büro-Motiv; besser eine klar linke Hand beim Schreiben von vorne oder eine Linkshänder-Schere. |
| [FUN/limerick_day/01.jpg](../data/images/FUN/limerick_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Old_typewriter_on_brown_wooden_desk_closeup.jpg) | Limerick Day (05-12) | Nahaufnahme alter Schreibmaschinentasten | Schreibmaschine ist nur ein generisches Schreib-Symbol, der Limerick als Reimform oder Irland-Bezug ist nicht erkennbar; besser ein handgeschriebener fünfzeiliger Reim oder Limerick-Stadtansicht. |
| [FUN/lost_sock_memorial_day/01.jpg](../data/images/FUN/lost_sock_memorial_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Colourful_socks.jpg) | Lost Sock Memorial Day (05-09) | Beine in passenden gestreiften Kniestrümpfen vor blauer Wand | Zwei vollständig passende Socken zeigen nicht das Thema der verlorenen Einzelsocke; besser eine einzelne einsame Socke oder ein Haufen ungepaarter Socken. |
| [FUN/magic_day/01.jpg](../data/images/FUN/magic_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Queen_playing_cards.jpg) | National Magic Day (10-31) | Hand fächert vier Damen-Spielkarten auf | Spielkarten wirken eher wie Kartenspiel als Zauberei, Magie-Thema nur indirekt; besser Zauberhut mit Zauberstab oder Kartentrick-Szene. |
| [FUN/mean_girls_day/01.jpg](../data/images/FUN/mean_girls_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Pink_Cupcakes.jpg) | Mean Girls Day (10-03) | Cupcakes mit rosa Buttercreme-Frosting | Pinke Cupcakes verweisen nur über das Insider-Zitat auf den Film und wirken wie ein Backtag; besser etwas pinkfarbenes mit deutlichem Mittwoch- oder Highschool-Bezug, notfalls akzeptabel. |
| [FUN/microwave_oven_day/01.jpg](../data/images/FUN/microwave_oven_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Microwave_Oven.jpg) | National Microwave Oven Day (12-06) | Frontansicht einer weißen Bajaj-Mikrowelle mit Drehknöpfen | Amateurhaftes Foto mit prominentem Markenlogo und Modellnummer, wenig Grußkarten-Charme; besser eine markenfreie Mikrowelle in Küchenszene oder Popcorn-Motiv. |
| [FUN/peanut_cluster_day/01.jpg](../data/images/FUN/peanut_cluster_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Chocolate_clusters_%285045974531%29.jpg) | National Peanut Cluster Day (03-08) | Schokoladen-Cluster mit Obststücken und Mandeln in Papierförmchen | Zu sehen sind Schoko-Obst-Cluster mit Mandelsplittern, keine Erdnuss-Cluster; besser ein Foto klassischer Schokoladen-Erdnuss-Cluster. |
| [FUN/pinata_day/01.jpg](../data/images/FUN/pinata_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Mexican_traditional_pi%C3%B1ata_for_sale.jpg) | National Piñata Day (04-18) | Lila Stern-Piñata vor blauer Wand mit Weihnachtskranz | Piñata ist klar erkennbar, aber der Weihnachtskranz im Hintergrund passt nicht zum Datum im April; besser eine Piñata auf einem Fest oder Markt ohne Weihnachtsdeko. |
| [FUN/pizza_with_the_works_day/01.jpg](../data/images/FUN/pizza_with_the_works_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Vegetarian_Pizza.jpg) | Pizza with Everything but Anchovies (11-12) | Fladenbrot mit Tomaten, Brokkoli, Oliven auf weißem Teller | Wirkt wie ein dünner Gemüse-Fladen ohne Käse, nicht wie eine reich belegte Pizza mit allem; besser eine üppig belegte Supreme-Pizza. |
| [FUN/plant_a_flower_day/01.jpg](../data/images/FUN/plant_a_flower_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Plant_a_Sapling_for_Better_Future.jpg) | Plant a Flower Day (03-12) | Hände pflanzen einen Setzling in Erde | Es wird ein Baumsetzling und keine Blume gepflanzt; besser ein Motiv mit blühender Pflanze beim Einsetzen ins Beet. |
| [FUN/rock_paper_scissors_day/01.jpg](../data/images/FUN/rock_paper_scissors_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Rock-paper-scissors_%28scissors%29.png) | World Rock Paper Scissors Day (08-27) | Freigestellte Hand mit Schere-Geste vor gesprenkeltem Schwarz | Nur die Schere-Geste, grob freigestellt mit störendem Rauschhintergrund und niedriger Qualität; besser ein Foto mit allen drei Gesten (Stein, Papier, Schere) zweier Hände. |
| [FUN/science_fiction_day/01.jpg](../data/images/FUN/science_fiction_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Humanoid_robot_at_Science_Square_Tsukuba.jpg) | National Science Fiction Day (01-02) | Blauer humanoider Roboter in Ausstellung, Sponsorenaufkleber, zweiter Roboter | Ein Forschungs-/Messeroboter mit Sponsorenlogos wirkt technisch statt nach Science-Fiction; besser ein Raumschiff-/Weltraum-Motiv, futuristische Skyline oder stilisiertes Retro-Sci-Fi-Bild. |
| [FUN/send_a_card_to_a_friend_day/01.jpg](../data/images/FUN/send_a_card_to_a_friend_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Postcard_racks%2C_Avenue_des_Champs-%C3%89lys%C3%A9es_%281%29.jpg) | Send a Card to a Friend Day (02-07) | Postkartenständer auf den Champs-Élysées, viel Text (FRANCE, PARIS, SUISSE) | Touristische Straßenszene mit viel Schrift und Paris-Bezug wirkt eher wie Städtereise als wie Grußkarte an einen Freund; besser eine handgeschriebene Karte mit Umschlag und Stift. |
| [FUN/singing_telegram_day/01.jpg](../data/images/FUN/singing_telegram_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Morse_Key.jpg) | Singing Telegram Day (07-28) | Alte Morsetaste aus Messing auf Holzsockel, freigestellt | Eine Morsetaste steht nur für Telegramm, nicht für das Singen – der kuriose Kern des Tags fehlt; besser ein Sänger mit Mikrofon oder Brief/Notenblatt-Kombination. |
| [FUN/smoke_and_mirrors_day/01.jpg](../data/images/FUN/smoke_and_mirrors_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Smoke_and_light_beams_%28Unsplash%29.jpg) | Smoke and Mirrors Day (03-29) | Konzertpublikum vor Lichtstrahlen und Nebel auf Bühne | Konzertszene mit Publikum ist eine Nebel-Assoziation, aber weder Spiegel noch Illusion/Zauberei erkennbar; besser Zauberhut mit Spiegel, Spiegelkabinett oder Magier-Requisiten. |
| [FUN/star_trek_day/01.jpg](../data/images/FUN/star_trek_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Starry_skies_in_the_planetarium_%28BX-06-CC2%29.jpg) | Star Trek Day (09-08) | Planetariumskuppel mit Sternenhimmel und Sitzreihen | Generischer Sternenhimmel im Planetarium hat keinen erkennbaren Star-Trek-Bezug (markenrechtlich verständlich), wirkt austauschbar; besser ein Vulkanier-Gruß, Sternenflotten-ähnliches Cosplay-Event oder Retro-Raumschiff-Illustration. |
| [FUN/star_wars_day/01.jpg](../data/images/FUN/star_wars_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Milky_way_seen_from_bolivian_high_altiplano_03.jpg) | Star Wars Day (05-04) | Milchstraße über beleuchtetem Felsen im Altiplano | Schöne Landschaft, aber ohne jeden Star-Wars-Hinweis und nahezu identisches Motiv wie Star Trek Day; besser Lichtschwert-Cosplay, Stormtrooper-Fans bei Parade oder wüstenartige Doppelsonnen-Stimmung. |
| [FUN/sugar_cookie_day/01.jpg](../data/images/FUN/sugar_cookie_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Decorated_sugar_cookies_2.jpg) | National Sugar Cookie Day (07-09) | Bunt glasierte Zuckerkekse in Weihnachtsformen (Bäume, Sterne, Herz) | Tannenbaum- und Sternformen in Rot/Grün wirken weihnachtlich, der Tag ist aber am 9. Juli; besser schlichte runde Zuckerkekse oder sommerlich dekorierte Kekse. |
| [FUN/tapioca_pudding_day/01.jpg](../data/images/FUN/tapioca_pudding_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Tapiokov%C3%A9-perly.jpg) | National Tapioca Pudding Day (07-15) | Bunte Tapioka-/Popping-Perlen auf Löffeln, Nahaufnahme | Bunte Perlen erinnern eher an Bubble Tea oder Molekularküche als an Tapiokapudding; besser eine Schale cremiger Tapiokapudding mit Löffel. |
| [FUN/tau_day/01.jpg](../data/images/FUN/tau_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Blackboard_bold_on_a_blackboard.jpg) | Tau Day (06-28) | Tafel mit Definition der komplexen Zahlen (C = {a+bi ...}) | Die Formel handelt von komplexen Zahlen, nicht von Tau (2π) – für Kenner irreführend, für andere nur reiner Formeltext; besser ein Kreis mit τ/2π-Beschriftung oder Tau-Symbol auf Tafel. |
| [FUN/tooth_fairy_day/01.jpg](../data/images/FUN/tooth_fairy_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:ToothLost-2917.jpg) | National Tooth Fairy Day (02-28) | Nahaufnahme Kindermund mit Zahnlücke, Finger zieht Lippe herunter | Extreme Mund-Nahaufnahme mit Zunge und Zahnfleisch wirkt als Grußkarte wenig freundlich; besser Milchzahn unter dem Kopfkissen mit Münze oder ein lächelndes Kind mit Zahnlücke. |
| [FUN/twilight_zone_day/01.jpg](../data/images/FUN/twilight_zone_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Philco-Ford_Orange_Retro_TV_%281970s%29.jpg) | National Twilight Zone Day (05-11) | Oranger Retro-Fernseher zeigt Nachrichtensendung mit Fox-Logo | Der Bildschirm zeigt einen aktuellen Nachrichtensender statt etwas Mysteriöses, nur der Retro-Fernseher trägt den Bezug; besser Retro-TV mit Rauschen/Schwarzweißbild oder ein Spiral-/Sternenhimmel-Motiv. |
| [FUN/winnie_the_pooh_day/01.jpg](../data/images/FUN/winnie_the_pooh_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Teddy_Bear_-_13.jpg) | Winnie the Pooh Day (01-18) | Hellbrauner Teddybär auf hellblauer Decke | Generischer Teddybär ohne erkennbaren Pooh-Bezug (weder Honig noch rotes Shirt); besser ein Teddy mit Honigtopf oder ein Honigtopf-Stillleben, sofern keine markenrechtlich geschützte Figur nutzbar ist. |
| [FUN/world_kindness_day/01.jpg](../data/images/FUN/world_kindness_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:The_Kindness_Rocks_Project.jpg) | World Kindness Day (11-13) | Bunt bemalte Steine im Sand, Holzschild mit Corona-Text, Projektlogo | Viel Text und Logo, Schild bezieht sich auf die Corona-Zeit; besser ein textfreies Motiv wie helfende Hände oder ein Herz-Stein in Nahaufnahme. |
| [FUN/world_listening_day/01.jpg](../data/images/FUN/world_listening_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Veerse_in_Zahrensen%2C_Field_Recording.jpg) | World Listening Day (07-18) | Mikrofon mit Windschutz auf Stativ an einem Bach | Field-Recording-Mikrofon ist als Thema Zuhören nur für Eingeweihte erkennbar; besser eine Person, die lauschend die Hand ans Ohr hält, oder Kopfhörer in der Natur. |
| [FUN/world_sauntering_day/01.jpg](../data/images/FUN/world_sauntering_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Norderney%2C_Promenade_--_2025_--_9281.jpg) | World Sauntering Day (06-19) | Strandpromenade bei Dämmerung, verwischte Spaziergänger, Laternen | Langzeitbelichtung mit geisterhaft verwischten Personen wirkt eher düster als gemütlich; besser Flaneure bei Tageslicht in Park oder Allee. |
| [FUN/world_tourism_day/01.jpg](../data/images/FUN/world_tourism_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Cologne_Main_Station_May_2015.JPG) | World Tourism Day (09-27) | Bahnsteig im Kölner Hauptbahnhof, roter Zug, Glasdach | Bahnhof ist nur lose mit Tourismus verbunden und wirkt wie ein Pendler-Motiv; besser Koffer und Reisepass, Sehenswürdigkeit mit Touristen oder Weltkarte. |
| [FUN/world_ufo_day/01.jpg](../data/images/FUN/world_ufo_day/01.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Lenticular_Cloud_Above_Dunes_and_Medano_Pass_%2830416185870%29.jpg) | World UFO Day (07-02) | Rosa Lenticularis-Wolke über Bergen bei Sonnenuntergang | Die UFO-Anspielung der Wolke ist kaum erkennbar, es wirkt wie eine Sonnenuntergangslandschaft; besser eine fliegende Untertasse als Modell, Roswell-Motiv oder Sternenhimmel mit Teleskop. |

### Land AR — 1

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [AR/may_revolution/03.jpg](../data/images/AR/may_revolution/03.jpg) | – | May Revolution | Porträtgemälde eines Offiziers in Uniform (Cornelio Saavedra) | Einzelporträt einer historischen Person, ohne Kontext nicht als Mairevolution erkennbar; besser Cabildo-Gebäude, Escarapela oder Pirámide de Mayo. |

### Land AT — 4

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [AT/saint_florians_day/02.jpg](../data/images/AT/saint_florians_day/02.jpg) | – | Saint Florian's Day | Stadtplatz mit Sgraffito-Häusern und kleinem Brunnen mit Statue | Die Florian-Figur ist winzig, Platz und Häuser dominieren, Bezug nicht erkennbar; besser Nahaufnahme einer Florian-Statue oder Feuerwehr-Motiv. |
| [AT/saint_florians_day/03.jpg](../data/images/AT/saint_florians_day/03.jpg) | – | Saint Florian's Day | Steinbrunnen mit kleiner Statue in grünem Park | Statue klein und nicht als Florian identifizierbar, wirkt wie beliebiger Dorfbrunnen; besser Florian-Nahaufnahme oder Feuerwehrfest. |
| [AT/saint_leopolds_day/01.jpg](../data/images/AT/saint_leopolds_day/01.jpg) | – | Saint Leopold's Day | Goldener Verduner Altar mit Reliquienschrein, starker Lichtreflex | Überstrahlt durch Lens-Flare, Motiv schwer lesbar und ohne Vorwissen nicht Leopold zuzuordnen; besser Leopold-Statue oder Stift Klosterneuburg. |
| [AT/saint_ruperts_day/03.jpg](../data/images/AT/saint_ruperts_day/03.jpg) | – | Saint Rupert's Day | Stand der Salzburger Bürgergarde mit Uniformierten und Besuchern | Privatpersonen prominent im Vordergrund, Bezug zu Rupert nur über das Schild erschließbar; besser Kirtag-Totale oder Rupert-Statue. |

### Land AU — 10

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [AU/australia_day/01.jpg](../data/images/AU/australia_day/01.jpg) | – | Australia Day | Historisches Schwarzweißfoto einer Straße mit Tram und Menschen | Altes Straßenfoto ohne sichtbaren Feiertagsbezug, düstere Wirkung; besser Feuerwerk, Flaggen oder Strandszene am Australia Day. |
| [AU/australia_day/03.jpg](../data/images/AU/australia_day/03.jpg) | – | Australia Day | Vergilbtes, grobkörniges Foto einer Menschenmenge vor Gebäude | Sehr schlechte Bildqualität und kein erkennbarer Bezug zum Australia Day; besser aktuelles Festmotiv mit Flaggen. |
| [AU/canberra_day/01.jpg](../data/images/AU/canberra_day/01.jpg) | – | Canberra Day | Leerer Plenarsaal des australischen Repräsentantenhauses | Parlamentssaal wirkt politisch-nüchtern statt festlich; besser Parliament House außen, Lake Burley Griffin oder Canberra-Ballonfestival. |
| [AU/friday_before_afl_grand_final/01.jpg](../data/images/AU/friday_before_afl_grand_final/01.jpg) | – | Friday before AFL Grand Final (Tentative Date) | Historische Schwarzweißaufnahme voller Tribünen mit Hüten am MCG | Altes Foto, Sport nur an Torstangen erkennbar, wirkt wenig festlich; besser aktuelles Grand-Final-Stadionbild. |
| [AU/kings_birthday/03.jpg](../data/images/AU/kings_birthday/03.jpg) | – | King's Birthday | Junger Prinz Charles in den 1980ern mit Blume am Revers | Stark veraltetes Foto, als heutiger König kaum wiedererkennbar; besser aktuelles Porträt oder Krone/Flagge. |
| [AU/labour_day_au/01.jpg](../data/images/AU/labour_day_au/01.jpg) | – | Labour Day | Historische Schwarzweiß-Aufnahme einer Straßenparade mit Menschenmenge und Gewerbebannern | Alte, grobkörnige Archivaufnahme ohne erkennbaren Bezug zum Tag der Arbeit; besser ein farbiges Motiv einer Eight-Hour-Day-Parade oder Arbeitersymbolik (Werkzeuge, Handschlag). |
| [AU/labour_day_au/02.jpg](../data/images/AU/labour_day_au/02.jpg) | – | Labour Day | Mann in Anwaltsrobe und Perücke, flankiert von Männern in Ketten, Parade | Szene wirkt wie Gefangenenvorführung und ist ohne Kontext missverständlich; besser eine klar erkennbare Gewerkschafts-/Arbeiterparade oder Feiertagsstimmung. |
| [AU/melbourne_cup/02.jpg](../data/images/AU/melbourne_cup/02.jpg) | – | Melbourne Cup | Alte Postkarte 'Melbourne Cup Finish 1905' mit Handschrift und Beschriftungen | Stark textlastige, verblasste Postkarte mit handschriftlichen Notizen; besser ein Foto von Rennpferden im Galopp oder Hüten/Flemington-Stimmung. |
| [AU/melbourne_cup/03.jpg](../data/images/AU/melbourne_cup/03.jpg) | – | Melbourne Cup | Postkarten-Scan: einzelnes Rennpferd, viel Text 'Mail Card' und Bildunterschrift | Halbe Bildfläche ist Postkartentext, Motiv statisch; besser ein dynamisches Rennfoto oder Siegerkranz. |
| [AU/western_australia_day/03.jpg](../data/images/AU/western_australia_day/03.jpg) | – | Western Australia Day | Aboriginal-Flagge als Umriss von Western Australia | Aboriginal-Flagge zum kolonial begründeten WA Day kann als politische Aussage gelesen werden; besser Landschaft/Skyline oder die WA-Staatsflagge. |

### Land BR — 1

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [BR/independence_day/03.jpg](../data/images/BR/independence_day/03.jpg) | – | Independence Day | Marschierende Soldaten mit Gewehren, Brasilien-Flaggen und Schriftzug 'BRASIL' | Militärparade mit Waffen ist für eine Grußkarte eher hart, obwohl Flaggen den Anlass zeigen; besser zivile Feier oder Flaggenmotiv. |

### Land CA — 10

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [CA/civic_holiday/01.jpg](../data/images/CA/civic_holiday/01.jpg) | – | Civic Holiday | Modernes Cottage am felsigen Seeufer mit Kiefern, alte Dia-Aufnahme | Nur lose passend (Sommer-Cottage zum Augustwochenende), Dia-Rahmen und Farbstich mindern Qualität; besser sommerliches Seebild mit Familie/Kanu. |
| [CA/civic_holiday/03.jpg](../data/images/CA/civic_holiday/03.jpg) | – | Civic Holiday | Ölgemälde einer kanadischen Fluss- und Hügellandschaft | Generische Landschaftsmalerei ohne Feiertagsbezug, wirkt eher düster; besser sonniges Sommermotiv am See. |
| [CA/family_day/01.jpg](../data/images/CA/family_day/01.jpg) | – | Family Day | Menschenmenge auf Schneefläche aus der Ferne, Nokia-Werbebanner | Weit entfernte, unscharfe Menge mit Werbefahnen, Familien kaum erkennbar; besser Nahaufnahme einer Familie beim Schlittschuhlaufen oder Rodeln. |
| [CA/labour_day_ca/01.jpg](../data/images/CA/labour_day_ca/01.jpg) | – | Labour Day | Historische Schwarzweiß-Straßenszene mit Menschenmenge vor Geschäften | Alte Archivaufnahme ohne erkennbaren Arbeitstag-Bezug; besser farbige Labour-Day-Parade oder Arbeiter-Motiv. |
| [CA/labour_day_ca/03.jpg](../data/images/CA/labour_day_ca/03.jpg) | – | Labour Day | Gewerkschaftsmarsch mit Kanada-Flagge und CAW-Banner 'Speak out in defence…' | Gewerkschaftsbanner mit politischer Parole und Fahnen; passt thematisch, sollte aber wegen Slogan geprüft werden – besser Motiv ohne lesbare Forderung. |
| [CA/national_day_for_truth_and_reconciliation/01.jpg](../data/images/CA/national_day_for_truth_and_reconciliation/01.jpg) | – | National Day for Truth and Reconciliation | Drei Frauen in orangen 'Every Child Matters'-Shirts, Nahaufnahme | Orange-Shirt-Motiv passt, aber Nahporträt von Privatpersonen ist als Titelbild heikel; besser die Menge in Orange oder ein Orange-Shirt-Symbol. |
| [CA/national_holiday/02.jpg](../data/images/CA/national_holiday/02.jpg) | – | National Holiday | Graue Gebäudefassade, kleine Québec-Flagge auf dem Dach | Flagge ist winzig, Bild von leerer Fassade dominiert; besser große Québec-Flagge, Fête-nationale-Feuerwerk oder Feiernde in Blau-Weiß. |
| [CA/national_holiday/03.jpg](../data/images/CA/national_holiday/03.jpg) | – | National Holiday | Historische Schwarzweiß-Parade mit Kadetten und Geistlichem, Zuschauer | Alte Archivaufnahme ohne erkennbaren Québec-Bezug; besser Fête-nationale-Motiv mit Lilienflagge. |
| [CA/thanksgiving/01.jpg](../data/images/CA/thanksgiving/01.jpg) | – | Thanksgiving | Teller mit Bratenfleisch, Yorkshire Pudding, Kartoffeln und Soße | Britischer Sunday Roast statt Thanksgiving-Essen, Anlass nicht erkennbar; besser Truthahn, Kürbisse oder Herbst-Erntetisch. |
| [CA/victoria_day/02.jpg](../data/images/CA/victoria_day/02.jpg) | – | Victoria Day | Sehr dunkles Nachtfoto, unscharfe Funkenspur einer Feuerwerksrakete | Feuerwerk passt zum Victoria Day, aber das Bild ist fast schwarz und kaum als Motiv erkennbar; besser ein helles Feuerwerk über einer kanadischen Skyline oder eine Victoria-Day-Parade. |

### Land CH — 5

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [CH/federal_fast_monday/03.jpg](../data/images/CH/federal_fast_monday/03.jpg) | – | Federal Fast Monday | Extrem schmales Panorama einer Bergkette über einem See | Sehr breites, niedriges Format und graues Licht, kein erkennbarer Bezug zum Bettagsmontag; besser eine Waadtländer Landschaft im Normalformat wie die beiden anderen Bilder. |
| [CH/geneva_prayday/01.jpg](../data/images/CH/geneva_prayday/01.jpg) | – | Geneva Prayday | Jet d'Eau in Genf hinter kahlen Platanen, Auto im Vordergrund | Genfer Wahrzeichen passt, aber parkendes Auto, Straße und kahle Bäume wirken lieblos; besser eine freie Ansicht des Jet d'Eau wie in Bild 02. |
| [CH/restoration_day/01.jpg](../data/images/CH/restoration_day/01.jpg) | – | Restoration Day | Genfer Straße mit Genfer Fahnen, SOLDES-Schildern und Lieferwagen | Genfer Fahnen passen, aber Ausverkaufsschilder, Lieferwagen und Baustelle wirken wie eine Alltagsszene; besser die Escalade-Gedenkfeier, das Genfer Wappen oder eine festliche Altstadtansicht. |
| [CH/st_berchtolds_day/01.jpg](../data/images/CH/st_berchtolds_day/01.jpg) | – | St. Berchtold's Day | Barockes Stillleben mit Obst, Nüssen, Brot und Weinglas | Nüsse passen lose zum Berchtoldstag-Brauch, aber das dunkle Stillleben ist ohne Erklärung nicht zuzuordnen; besser Nüsse im Schnee, ein Winterbrauch-Motiv oder Kinder beim Nüsse-Spiel. |
| [CH/st_berchtolds_day/02.jpg](../data/images/CH/st_berchtolds_day/02.jpg) | – | St. Berchtold's Day | Stillleben mit Zitronen, Haselnüssen, Katze und Maus | Nur die Haselnüsse verweisen auf den Berchtoldstag, Katze und Maus lenken ab; besser ein klares Nuss- oder Wintermotiv. |

### Land CL — 2

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [CL/national_holiday/01.jpg](../data/images/CL/national_holiday/01.jpg) | – | National Holiday | Paar tanzt Cueca in Tracht neben chilenischer Flagge | Cueca und Flagge passen ideal, der Tänzer ist aber offenbar Präsident Sebastián Piñera, also ein prominenter Politiker; besser ein Foto anonymer Cueca-Tänzer oder einer Fonda. |
| [CL/national_holiday/02.jpg](../data/images/CL/national_holiday/02.jpg) | – | National Holiday | Cueca-Tanz auf Bühne, Mann mit Poncho und Hut, Bicentenario-Schärpe | Gleiche Veranstaltung mit Präsident Piñera und Ehefrau, politische Prominenz; besser anonyme Cueca-Tänzer, Empanadas oder chilenische Fahnenschmuck-Motive. |

### Land CO — 4

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [CO/battle_of_boyaca/01.jpg](../data/images/CO/battle_of_boyaca/01.jpg) | – | Battle of Boyacá | Kohleskizze von Reitern mit Hüten in hügeliger Landschaft | Grobe, kontrastarme Skizze, Bezug zur Schlacht von Boyacá nicht erkennbar; besser die Brücke von Boyacá mit Denkmal oder Bolívar-Statue. |
| [CO/battle_of_boyaca/02.jpg](../data/images/CO/battle_of_boyaca/02.jpg) | – | Battle of Boyacá | Fleckiger historischer Stich der Schlacht mit viel Kleintext | Vergilbt, kleinteilig und mit Textblöcken, als Titelbild kaum lesbar; besser das Puente-de-Boyacá-Denkmal. |
| [CO/declaration_of_independence/01.jpg](../data/images/CO/declaration_of_independence/01.jpg) | – | Declaration of Independence | Schwarzweißfoto einer Straße mit Fahnen und Menschen, alt | Altes, graues Foto ohne erkennbaren Bezug zu Kolumbien oder dem 20. Juli; besser Kolumbien-Flaggen, Bolívar-Statue oder Unabhängigkeitsparade in Farbe. |
| [CO/declaration_of_independence/03.jpg](../data/images/CO/declaration_of_independence/03.jpg) | – | Declaration of Independence | Soldaten und Polizisten in Formation vor Fahnenmasten, grauer Himmel | Militärisch-nüchterne Szene mit Rücken zum Betrachter, wenig festlich; besser Parade mit Publikum oder wehende Kolumbien-Flagge. |

### Land DE — 6

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [DE/german_unity_day/01.jpg](../data/images/DE/german_unity_day/01.jpg) | – | German Unity Day | Modell eines Gitterturm-Monuments vor schwarzem Hintergrund, Textbeschriftung | Entwurfsmodell eines nie gebauten Ost-West-Monuments mit eingebranntem Text ist ohne Erklärung nicht als Einheitstag erkennbar; besser Brandenburger Tor oder feiernde Menschen mit Deutschlandfahnen. |
| [DE/reformation_day/01.jpg](../data/images/DE/reformation_day/01.jpg) | – | Reformation Day | Thesentür der Schlosskirche Wittenberg, unscharfe Aufnahme | Motiv passt gut, aber die Aufnahme ist deutlich unscharf und flau; besser eine scharfe Aufnahme derselben Thesentür oder eine Lutherrose. |
| [DE/repentance_and_prayer_day/01.jpg](../data/images/DE/repentance_and_prayer_day/01.jpg) | – | Repentance and Prayer Day | Schwarz-weiße Stichzeichnung eines Kircheninnenraums mit Kanzel | Generischer historischer Kircheninnenraum ohne erkennbaren Bezug zum Buß- und Gebetstag; besser ein stilles Motiv wie gefaltete Hände, Kerze in Kirche oder Kirchenbank im Licht. |
| [DE/repentance_and_prayer_day/02.jpg](../data/images/DE/repentance_and_prayer_day/02.jpg) | – | Repentance and Prayer Day | Ausschnitt derselben Stichzeichnung, Kirchenschiff mit Altar | Praktisch identisch mit Bild 01 und ebenso generisch; ein zweites Motiv sollte etwas anderes zeigen, z. B. Kerzenlicht oder betende Hände. |
| [DE/world_childrens_day/02.jpg](../data/images/DE/world_childrens_day/02.jpg) | – | World Children's Day | Junge und Frau mit Ballon an Partytisch | Wirkt wie eine private Geburtstagsfeier mit nur einem Kind, kaum als Weltkindertag lesbar; besser eine Gruppe spielender Kinder im Freien. |
| [DE/world_childrens_day/03.jpg](../data/images/DE/world_childrens_day/03.jpg) | – | World Children's Day | Tanzende Mädchen mit Ballons vor bunten Maskentänzern | Fröhlich, aber die indischen Volksmasken (Gomira) verorten das Bild kulturell weit weg vom deutschen Weltkindertag; besser Kinder auf Spielplatz oder Kinderfest in Deutschland. |

### Land EG — 10

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [EG/easter_monday_eg/01.jpg](../data/images/EG/easter_monday_eg/01.jpg) | – | Easter Monday | Altägyptische Grabmalerei: Männer tragen Fisch, Vögel, Trauben | Spielt auf den pharaonischen Ursprung von Sham el-Nessim an, ist aber unter dem Label Ostermontag kaum verständlich; besser Frühlingspicknick am Nil oder bunte Eier. |
| [EG/easter_monday_eg/02.jpg](../data/images/EG/easter_monday_eg/02.jpg) | – | Easter Monday | Rohe gesalzene Fische (Feseekh) in grüner Plastikfolie | Nahaufnahme roher Salzfische wirkt unappetitlich und ist nur für Insider als Sham-el-Nessim-Speise erkennbar; besser Familie beim Frühlingspicknick oder gefärbte Eier mit Frühlingszwiebeln. |
| [EG/easter_monday_eg/03.jpg](../data/images/EG/easter_monday_eg/03.jpg) | – | Easter Monday | Menschenmenge vor Lautsprecherboxen in ägyptischem Park | Generische Konzert-/Parkmenge ohne erkennbaren Feiertagsbezug; besser Familien beim Picknick im Grünen. |
| [EG/eid_al_adha/01.jpg](../data/images/EG/eid_al_adha/01.jpg) | – | Eid Al-Adha | Kunstvoll verzierte Bronzetür in Kairoer Moschee | Schöne, aber generische Moscheearchitektur ohne Bezug zum Opferfest; besser Festgebet im Freien, Familie beim Festessen oder Schaf/Widder-Motiv. |
| [EG/eid_al_adha/02.jpg](../data/images/EG/eid_al_adha/02.jpg) | – | Eid Al-Adha | Holzgeschnitzter Koranständer in Moschee auf rotem Teppich | Möbelstück im Moscheeinneren ist ein reines Symbolbild ohne Opferfest-Bezug; besser Eid-Gebet oder festlich gedeckter Tisch. |
| [EG/eid_al_adha/03.jpg](../data/images/EG/eid_al_adha/03.jpg) | – | Eid Al-Adha | Moscheeinnenraum mit hölzernem Gitterschrein und Kuppel | Drittes generisches Moscheeinterieur ohne spezifisches Festmotiv; besser Menschen beim Eid-Gebet oder Eid-Dekoration. |
| [EG/june_30_revolution/01.jpg](../data/images/EG/june_30_revolution/01.jpg) | – | June 30 Revolution | Koloriertes altes Foto: Feluken auf dem Nil | Stimmungsvolle Nil-Szene, aber ohne jeden Bezug zum Jahrestag vom 30. Juni; als neutrales Symbolbild vertretbar, besser ägyptische Flagge oder Kairoer Skyline mit Fahnen. |
| [EG/june_30_revolution/02.jpg](../data/images/EG/june_30_revolution/02.jpg) | – | June 30 Revolution | Sonnenuntergang über dem Nil mit Feluke und Palmen | Gleiche Einschränkung: schöne Nil-Stimmung, kein Bezug zum Anlass; besser Flagge oder Feiernde mit Fahnen. |
| [EG/prophet_muhammads_birthday/03.jpg](../data/images/EG/prophet_muhammads_birthday/03.jpg) | – | Prophet Muhammad's Birthday (Tentative Date) | Marktstand mit plastikverpackten Mawlid-Süßigkeiten | Mawlid-Süßigkeiten sind das richtige Thema, aber Plastikfolie und unaufgeräumter Stand wirken wenig grußkartentauglich; besser eine Zuckerpuppe (Arouset el-Mouled) oder schön arrangierte Süßigkeitenbox. |
| [EG/revolution_day/01.jpg](../data/images/EG/revolution_day/01.jpg) | – | Revolution Day | Sonnenuntergang über dem Nil mit Feluke und Palmen | Identisch mit june_30_revolution/02: neutrale Nil-Stimmung ohne Bezug zur Revolution vom 23. Juli; besser ägyptische Flagge oder Feiernde mit Fahnen. |

### Land ES — 2

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [ES/constitution_day/02.jpg](../data/images/ES/constitution_day/02.jpg) | – | Constitution Day | EU-, Spanien-, Madrid- und grüne Uni-Flagge vor Bürogebäude | Spanische Flagge ist zwar dabei, aber der Rahmen (Universitätsgebäude mit UAM/CSIC-Banner) ist beliebig; besser Flagge allein oder das Parlamentsgebäude mit den Löwen. |
| [ES/national_day_of_spain/01.jpg](../data/images/ES/national_day_of_spain/01.jpg) | – | National Day of Spain | Porträt eines Soldaten in Paradeuniform mit rotem Fangschnur | Nahporträt einer einzelnen Person, Bezug zum Nationalfeiertag nur über Parade erkennbar; besser Paradeszene oder spanische Flagge über Madrid. |

### Land FI — 1

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [FI/independence_day/01.jpg](../data/images/FI/independence_day/01.jpg) | – | Independence Day | Altar des Doms von Helsinki mit Kerzen und blau-weißen Blumen | Bezug (Festgottesdienst, blau-weiße Blumen) ist nur für Kenner erkennbar, wirkt sonst wie ein Kirchenbild; besser zwei Kerzen im Fenster oder finnische Flagge. |

### Land FR — 2

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [FR/bastille_day/01.jpg](../data/images/FR/bastille_day/01.jpg) | – | Bastille Day | Dunkle Nachtszene, Menschenmenge, winziges Feuerwerk in der Ferne | Fast schwarzes, verwackeltes Bild, Feuerwerk kaum erkennbar; besser ein helles Feuerwerk am Eiffelturm oder Parade auf den Champs-Élysées. |
| [FR/bastille_day/02.jpg](../data/images/FR/bastille_day/02.jpg) | – | Bastille Day | Feuerwerk neben dem Eiffelturm bei Nacht, Schnappschussqualität | Motiv passt, aber das Bild ist sehr dunkel und unscharf; ein professionelleres Feuerwerksfoto wie 03 wäre besser. |

### Land GR — 1

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [GR/independence_day/01.jpg](../data/images/GR/independence_day/01.jpg) | – | Independence Day | Militärparade mit griechischen Flaggen in Athen | Soldaten in Tarnuniform dominieren das Bild; besser griechische Flagge, Schülerparade in Tracht oder Akropolis mit Flagge. |

### Land HK — 1

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [HK/dragon_boat_festival/03.jpg](../data/images/HK/dragon_boat_festival/03.jpg) | – | Dragon Boat Festival | Paddler-Team unter Pavillon mit Banner, keine Boote | Nur Teamzelt mit Personen von hinten und Textbanner, das Drachenboot selbst ist nicht zu sehen; besser Bild 01 oder 02 mit Booten im Wasser. |

### Land IL — 5

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [IL/passover/01.jpg](../data/images/IL/passover/01.jpg) | – | Passover | Mittelalterliche Haggada-Seite, illuminierte Matza-Rosette, hebräischer Text | Schöne Illumination, aber überwiegend Textseite und als kleines Titelbild kaum zu deuten; besser ein Sederteller oder Matzot mit Weinkelch. |
| [IL/passover/03.jpg](../data/images/IL/passover/03.jpg) | – | Passover | Schwarzweiß-Foto einer Sedertafel mit Matza, Kerze, Wein (IWM-Wasserzeichen) | Sedertafel erkennbar, aber Kriegszeit-Archivbild in Schwarzweiß mit Wasserzeichen wirkt nicht wie eine freundliche Grußkarte; besser eine farbige, festliche Sedertafel. |
| [IL/purim/02.jpg](../data/images/IL/purim/02.jpg) | – | Purim | Historisches Schwarzweiß-Foto: verkleidete Kinder in Reihe im Freien | Purim-Kostüme sind erahnbar, aber altes Archivfoto in Schwarzweiß wirkt wenig festlich; besser bunte Masken, Kostüme oder Hamantaschen in Farbe. |
| [IL/purim/03.jpg](../data/images/IL/purim/03.jpg) | – | Purim | Historisches Schwarzweiß-Foto: verkleidete Kinder, Erwachsene abgeschnitten | Wie Bild 02: Kostümfest erkennbar, aber körniges Archivbild mit angeschnittenen Personen; besser farbenfrohe Purim-Masken oder Rasseln (Gragger). |
| [IL/shavuot/01.jpg](../data/images/IL/shavuot/01.jpg) | – | Shavuot | Stück heller Kuchen mit Apfelkompott und Rosmarin auf Teller | Generisches Café-Dessert, der Bezug zu Schawuot (Milchspeisen/Käsekuchen) ist nicht erkennbar; besser ein klar erkennbarer Käsekuchen oder Ähren/Erstlingsfrüchte. |

### Land IT — 2

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [IT/republic_day/01.jpg](../data/images/IT/republic_day/01.jpg) | – | Republic Day | Parade vor Kolosseum, Soldaten mit UN-Flagge, Zuschauer | Vom 2.-Juni-Umzug in Rom, aber die blaue UN-Flagge statt Trikolore wirkt irritierend und Zuschauerköpfe verdecken den Vordergrund; besser ein Motiv mit Frecce Tricolori oder italienischen Fahnen. |
| [IT/republic_day/02.jpg](../data/images/IT/republic_day/02.jpg) | – | Republic Day | Uniformierte mit blauer Fahne vor Kolosseum, Zuschauerköpfe vorn | Blaue (UN-)Fahne statt italienischer Symbolik und Köpfe im Vordergrund; besser Frecce Tricolori über Rom oder Trikolore am Altare della Patria. |

### Land JP — 2

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [JP/coming_of_age_day/01.jpg](../data/images/JP/coming_of_age_day/01.jpg) | – | Coming of Age Day | Historisches Schwarzweiß-Foto: vier Frauen in Kimono im Hof | Altes Archivfoto ohne erkennbaren Bezug zum Seijin no Hi, wirkt wie ein allgemeines Japan-Bild; besser junge Frauen in Furisode mit Pelzkragen vor Schrein. |
| [JP/foundation_day/03.jpg](../data/images/JP/foundation_day/03.jpg) | – | Foundation Day | Ukiyo-e-Druck, Kabuki-Figur, kleine Hinomaru-Flaggen | Kunstdruck nur lose über die Flaggen mit dem Gründungstag verbunden und textlastig; besser Kashihara-Schrein oder Nationalflagge. |

### Land KR — 3

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [KR/hangul_day/01.jpg](../data/images/KR/hangul_day/01.jpg) | – | Hangul Day | Sejong-Statue nachts, zwei Polizisten mit Leuchtstäben davor | Polizisten im Vordergrund dominieren und wirken wie Sicherheitslage; besser die Sejong-Statue bei Tag oder Hangul-Schriftzeichen. |
| [KR/hangul_day/03.jpg](../data/images/KR/hangul_day/03.jpg) | – | Hangul Day | Gwanghwamun-Straße mit Yi-Sun-sin-Statue, Verkehr, Schilder | Admiral-Yi-Statue und Verkehr dominieren, Sejong nur winzig im Hintergrund; besser Nahaufnahme der Sejong-Statue oder Hangul-Schrift. |
| [KR/lunar_new_year/01.jpg](../data/images/KR/lunar_new_year/01.jpg) | – | Lunar New Year | Unscharfe Nudelsuppe mit Ei und Seetang | Sieht nach Kalguksu statt Tteokguk aus und ist unscharf; besser klar erkennbares Tteokguk, Sebae-Verbeugung oder Hanbok-Familie. |

### Land MX — 1

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [MX/independence_day/03.jpg](../data/images/MX/independence_day/03.jpg) | – | Independence Day | Straßenschilder Plaza del Carmen, kleine Mexiko-Flagge | Textlastige Nahaufnahme, Flagge nur klein im Hintergrund; besser eine prominente Flagge oder Festdekoration. |

### Land NL — 1

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [NL/liberation_day/03.jpg](../data/images/NL/liberation_day/03.jpg) | – | Liberation Day | Gruppenfoto heutiger US-Soldaten mit US-Flagge | Moderne Militär-Gruppenaufnahme mit dominanter US-Flagge, Bezug zur niederländischen Befreiung nicht sichtbar; besser Gedenkfeier mit NL-Flaggen. |

### Land NZ — 14

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [NZ/anzac_day/01.jpg](../data/images/NZ/anzac_day/01.jpg) | – | Anzac Day | Historisches Schwarzweißfoto marschierender Soldaten in Jerusalem | Archivbild ohne erkennbaren Anzac- oder Neuseeland-Bezug; besser Dawn Service, Mohnkränze oder Anzac-Denkmal. |
| [NZ/canterbury_anniversary_day/03.jpg](../data/images/NZ/canterbury_anniversary_day/03.jpg) | – | Canterbury Anniversary Day | Satellitenaufnahme der Canterbury-Ebene mit Alpen und Banks Peninsula | Satellitenbild wirkt als Grußkarten-Titelbild kühl und für Laien nicht als Canterbury erkennbar; besser Christchurch-Stadtmotiv oder Landschaft vom Boden. |
| [NZ/chatham_islands_anniversary_day/01.jpg](../data/images/NZ/chatham_islands_anniversary_day/01.jpg) | – | Chatham Islands Anniversary Day | Satellitenaufnahme der Chatham-Inseln im blauen Meer | Satellitenbild ist als freundliches Titelbild wenig ansprechend und ohne Wissen nicht zuzuordnen; besser Küstenlandschaft oder Tierwelt der Inseln. |
| [NZ/hawkes_bay_anniversary_day/02.jpg](../data/images/NZ/hawkes_bay_anniversary_day/02.jpg) | – | Hawke's Bay Anniversary Day | Art-déco-Ladenfassaden mit Firmenschildern und parkenden Autos | Werbeschilder und Autos im Vordergrund wirken wie ein Straßenschnappschuss; besser das Art-déco-Ensemble ohne Firmenlogos oder die Marine Parade. |
| [NZ/kings_birthday/03.jpg](../data/images/NZ/kings_birthday/03.jpg) | – | King's Birthday | Beehive-Parlamentsgebäude Wellington mit neuseeländischer Flagge | Parlamentsgebäude hat keinen Bezug zum Königsgeburtstag und wirkt eher politisch; besser Krone, Royal Standard oder Porträt des Königs. |
| [NZ/labour_day_nz/02.jpg](../data/images/NZ/labour_day_nz/02.jpg) | – | Labour Day | Abfotografierte Buchtafel: Arbeiter beim Flachs-Schwingen, mit Bildunterschrift | Scan mit Rahmen, Flecken und Bildunterschrift wirkt unaufbereitet; besser ein sauber freigestelltes historisches Arbeiterfoto oder ein Motiv zum Achtstundentag. |
| [NZ/marlborough_anniversary_day/01.jpg](../data/images/NZ/marlborough_anniversary_day/01.jpg) | – | Marlborough Anniversary Day | Satellitenaufnahme der Marlborough Sounds in Grün und Blau | Satellitenbild ist als Grußkarten-Titelbild abstrakt und nicht ohne Weiteres als Marlborough erkennbar; besser Sounds vom Boden oder Weinberge. |
| [NZ/nelson_anniversary_day/02.jpg](../data/images/NZ/nelson_anniversary_day/02.jpg) | – | Nelson Anniversary Day | Extrem breites Panorama: Bucht mit Segelboot und Bäumen | Extremes Panoramaformat ist als Titelbild kaum nutzbar, Motiv winzig und generisch; besser Standardformat vom Nelson-Hafen oder Abel-Tasman-Küste. |
| [NZ/nelson_anniversary_day/03.jpg](../data/images/NZ/nelson_anniversary_day/03.jpg) | – | Nelson Anniversary Day | Dunstige Luftaufnahme einer Insel vor Bergküste | Dunstig, dunkel und nicht als Nelson erkennbar; besser Tahunanui Beach, Nelson-Stadt oder Abel-Tasman-Küste. |
| [NZ/otago_anniversary_day/02.jpg](../data/images/NZ/otago_anniversary_day/02.jpg) | – | Otago Anniversary Day | Extrem breites Panorama Otago Harbour und Halbinsel | Extremes Panoramaformat ist als Titelbild kaum nutzbar, Details winzig; besser Standardformat wie Dunedin Railway Station oder Otago-Halbinsel. |
| [NZ/taranaki_anniversary_day/03.jpg](../data/images/NZ/taranaki_anniversary_day/03.jpg) | – | Taranaki Anniversary Day | Historische Lithografie einer Tangi-Trauerzeremonie vor Mount Taranaki | Tangi ist eine Trauerfeier, dazu Buchtitel und Bildunterschrift im Scan; besser reine Landschaft des Mount Taranaki oder Neuseeland-Illustration ohne Trauerbezug. |
| [NZ/waitangi_day/01.jpg](../data/images/NZ/waitangi_day/01.jpg) | – | Waitangi Day | Historisches Foto: große Menschenmenge auf Wiese bei Feier | Alte Massenszene ist ohne Kontext nicht als Waitangi erkennbar und wirkt trist; besser Treaty House, Flaggenmast oder Waka auf den Treaty Grounds. |
| [NZ/waitangi_day/02.jpg](../data/images/NZ/waitangi_day/02.jpg) | – | Waitangi Day | Extrem breites historisches Panorama einer Menschenmenge mit Hüten | Extremes Format und anonyme Menge, kein erkennbarer Waitangi-Bezug; besser Waitangi Treaty Grounds oder Zeremonienwaka. |
| [NZ/westland_anniversary_day/02.jpg](../data/images/NZ/westland_anniversary_day/02.jpg) | – | Westland Anniversary Day | Zwei Frauen machen Selfie vor türkisem Fluss | Identifizierbare Privatpersonen im Vordergrund dominieren das Bild; besser die Hokitika Gorge oder Franz-Josef-Gletscher ohne Personen. |

### Land PL — 3

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [PL/constitution_day/02.jpg](../data/images/PL/constitution_day/02.jpg) | – | Constitution Day | Historische Farbaufnahme, Straßenszene mit polnischen Fahnen an Gebäuden | Altes, unscharfes Zeitdokument ohne erkennbaren Anlass, wirkt eher wie ein Archivbild; besser ein heutiges, klares Motiv mit polnischen Flaggen oder Verfassungsmotiv. |
| [PL/independence_day/02.jpg](../data/images/PL/independence_day/02.jpg) | – | Independence Day | Historische Farbaufnahme, Straßenszene mit polnischen Fahnen an Gebäuden | Altes, unscharfes Archivbild ohne klaren Anlassbezug; besser ein modernes Motiv mit polnischen Flaggen am 11. November. |
| [PL/independence_day/03.jpg](../data/images/PL/independence_day/03.jpg) | – | Independence Day | Präsident Duda am Rednerpult mit polnischem Adler, Politiker im Publikum | Prominenter amtierender Politiker im Mittelpunkt, politisch aufgeladen; besser Flaggen, Feierlichkeiten oder Denkmal ohne Personen. |

### Land PT — 4

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [PT/freedom_day/03.jpg](../data/images/PT/freedom_day/03.jpg) | – | Freedom Day | Lachende Frau mit Sonnenbrille und Partei-Button auf Demo | Parteiabzeichen (PAN) macht das Bild parteipolitisch, kein Freiheitstag-Symbol sichtbar; besser rote Nelken als Motiv. |
| [PT/national_day/01.jpg](../data/images/PT/national_day/01.jpg) | – | National Day | Schwarzweiß-Archivfoto, Menschenmenge mit berittener Polizei in Lissabon | Unklares historisches Ereignis, düster und nicht als Nationalfeiertag erkennbar; besser Camões-Denkmal, portugiesische Flagge oder Feierlichkeiten am 10. Juni. |
| [PT/national_day/02.jpg](../data/images/PT/national_day/02.jpg) | – | National Day | Schwarzweiß-Archivfoto, dichte Menschenmenge in Gasse von Balkon aus | Historische Aufnahme ohne erkennbaren Anlass, wirkt bedrückend; besser Camões-Denkmal oder portugiesische Flaggen. |
| [PT/national_day/03.jpg](../data/images/PT/national_day/03.jpg) | – | National Day | Schwarzweiß-Archivfoto, Militärformation auf Praça do Comércio | Altes Militärbild ohne klaren Bezug zum Camões-Tag; besser ein modernes, farbiges Motiv mit portugiesischer Flagge oder Camões-Denkmal. |

### Land SE — 1

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [SE/midsummer_eve/03.jpg](../data/images/SE/midsummer_eve/03.jpg) | – | Midsummer Eve | Tanz um kleinen Maibaum, Kiefern und Palmen, See | Landschaft wirkt nicht schwedisch (Palmen, vermutlich USA), Bildqualität mäßig; besser Mittsommerfeier in Schweden mit Blumenkränzen. |

### Land SG — 1

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [SG/chinese_new_year/02.jpg](../data/images/SG/chinese_new_year/02.jpg) | – | Chinese New Year | Zwei große rote Lampions liegen auf dem Boden | Dekoration wirkt abgelegt bzw. eingelagert, nicht festlich; besser hängende Lampions oder Chinatown-Beleuchtung. |

### Land TR — 3

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [TR/eid_al_adha_first_day/01.jpg](../data/images/TR/eid_al_adha_first_day/01.jpg) | – | Eid al-Adha Fourth Day (Tentative Date) | Osmanische Kuppel mit blau-roter Ornamentik und Kalligrafie | Generische Moscheeverzierung, Opferfest nicht erkennbar; besser Moschee-Außenansicht mit Festbeleuchtung, Familienessen oder Kurban-Bayramı-Süßigkeiten. |
| [TR/republic_day/03.jpg](../data/images/TR/republic_day/03.jpg) | – | Republic Day | Menschenmenge von hinten an Straße, kleine türkische Fähnchen, Gegenlicht | Schwache Qualität, Flaggen kaum erkennbar, Motiv wirkt beliebig; besser eine große türkische Flagge oder ein Feuerwerk über dem Bosporus. |
| [TR/victory_day/01.jpg](../data/images/TR/victory_day/01.jpg) | – | Victory Day | Gepanzertes Militärfahrzeug mit türkischer Flagge bei Parade, Polizisten | Panzerfahrzeug wirkt als Grußkarten-Titelbild martialisch; besser Ehrengarde mit Fahnen, Flaggenmeer oder Atatürk-Denkmal. |

### Land UA — 1

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [UA/independence_day/01.jpg](../data/images/UA/independence_day/01.jpg) | – | Independence Day | Veteranenmarsch in Kyjiw mit ukrainischen, rot-schwarzen und Einheitenfahnen | Militärische und teils politisch aufgeladene Fahnen (rot-schwarz, Einheitsembleme) im Vordergrund; besser blau-gelbe Flagge vor Kyjiwer Skyline oder Trachtenfeier. |

### Land US — 6

| Bild | Quelle | Anlass | Zu sehen | Befund und Ersatzvorschlag |
|---|---|---|---|---|
| [US/labour_day_us/01.jpg](../data/images/US/labour_day_us/01.jpg) | – | Labour Day | Historisches Foto: zwei Mädchen mit Schärpen „Abolish Child Slavery“ | Protestschärpen zum Thema Kinderarbeit, wirkt als freundliches Titelbild schwer; besser Grillfest/Picknick am Labor-Day-Wochenende oder historische Parade ohne Parolen. |
| [US/memorial_day/02.jpg](../data/images/US/memorial_day/02.jpg) | – | Memorial Day | Arbeiter hängen Flaggen im Arlington-Amphitheater auf, Holzkiste vorn | Vorbereitungs-/Arbeitsszene mit Kiste im Vordergrund, wenig feierlich; besser Gräber mit Flaggen oder Kranzniederlegung. |
| [US/thanksgiving_day/01.jpg](../data/images/US/thanksgiving_day/01.jpg) | – | Thanksgiving Day | Zeitungskarikatur 1905: Truthahn und Speisen hoch im Baum, Mann darunter | Alte S/W-Karikatur über hohe Preise, textlastig und wenig festlich; besser gedeckte Tafel mit Truthahn, Kürbissen und Herbstlaub. |
| [US/thanksgiving_day/02.jpg](../data/images/US/thanksgiving_day/02.jpg) | – | Thanksgiving Day | Soldaten mit Kochmützen tranchieren Truthahn in Kantine | Nüchterne Militärkantine mit Neonlicht, wenig Grußkarten-Charme; besser festliche Familientafel. |
| [US/thanksgiving_day/03.jpg](../data/images/US/thanksgiving_day/03.jpg) | – | Thanksgiving Day | Koch schneidet Truthahn unter roter Wärmelampe, Kantine | Stark rotstichig und unappetitlich wirkende Kantinenszene; besser warm ausgeleuchtete Truthahn-Tafel. |
| [US/veterans_day/01.jpg](../data/images/US/veterans_day/01.jpg) | – | Veterans Day | Kranzniederlegung am Grab des Unbekannten Soldaten mit Biden, Harris, Ehrengarde | Prominente Politiker (Präsident/Vizepräsidentin) im Bildzentrum, politisch datiert; besser Kranz am Grabmal ohne Politiker oder Veteranen mit Flaggen. |

## 4. Hinweise zur Methode

- Grundlage: aktuelle Pakete in `data/index.json` (Länder, GLOBAL v19, MEMORIAL v9, FUN v18) plus `CREDITS.md` und `content/memorial/images.json`.
- Für CC0-Bilder aus der Automatik-Suche gibt es im Repo keine Quellenangabe (nur `"license": "CC0"` im Paket). Beim Ersetzen sollte künftig jede Datei mit Commons-Titel dokumentiert werden, wie es MEMORIAL und FUN schon tun.
- Bewertung durch 20 parallele Prüfläufe mit identischen Kriterien; die Formulierungen in den Tabellen stammen aus diesen Läufen. Einzelne Urteile können streng ausgefallen sein (z. B. Osterkerzen mit Corona-Masken als „fraglich").
- Ein Prüflauf hat zusätzlich einen Eintrag für ein nicht existierendes `holy_saturday/04.jpg` geliefert; er ist hier nicht mitgezählt.
