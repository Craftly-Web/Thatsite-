# Gaststätte Spreetal — Website-Entwurf

Entwurf einer neuen Website für die Gaststätte Spreetal, Spreedorfer Straße 30,
02730 Ebersbach-Neugersdorf. Rustikal gestaltet nach dem Oberlausitzer Umgebindehaus:
dunkles Balkenholz, Kalkputz, Schiefer, Ochsenblut und Tannengrün.

Reines HTML, CSS und JavaScript ohne Build-Schritt. Der Ordner ist in sich geschlossen
und kann später unverändert auf eine eigene Domain umziehen.

## Aufbau

```
index.html            Startseite (One-Pager): Kopf, Unser Haus, Speisekarte, Stimmen,
                      Feiern, Öffnungszeiten, Anfahrt, Reservieren
impressum.html        Impressum mit markierten Lücken
datenschutz.html      Datenschutzerklärung, Entwurf mit markierten Lücken
css/schriften.css     Selbst gehostete Schriften (Vollkorn, Source Sans 3; SIL OFL 1.1)
css/stil.css          Gesamtes Design
js/seite.js           „Jetzt geöffnet“-Anzeige und Markierung des heutigen Tages
bilder/umgebindehaus.svg      Illustration im Kopfbereich (selbst gezeichnet)
bilder/bogenfries.svg         Bogenfries unter dem Kopf: die Bögen des Umgebindes
bilder/bogenfries-unten.svg   Gespiegeltes Zierbrett über dem Reservieren-Bereich
fonts/                Schriftdateien (woff2) und Lizenztexte
bilder/fotos/         Fotos (WebP + JPG), siehe unten
bilder/taefelung.svg  Wandtäfelung wie in der Gaststube
```

Die Symbole stammen aus Lucide (ISC-Lizenz) und stehen als `<symbol>` am Anfang jeder Seite.

## Stand der Inhalte

Grundlage: Online-Recherche, das Google-Unternehmensprofil (September 2026) und Fotos,
die Gäste in Google-Rezensionen veröffentlicht haben – darunter zwei Seiten der Speisekarte.

- **Öffnungszeiten** laut Google-Profil: Mi–Do 17–20, Fr 11–13 und 17–20,
  Sa–So 11–13:30 und 17–20 Uhr, Mo–Di Ruhetag. Branchenbücher nennen mittags 11–14 Uhr –
  mit der Inhaberin klären.
- **Speisekarte** vollständig nach den Kartenfotos, inklusive Preisen und Seniorenportion
  (gekennzeichnete Gerichte 1,50 € günstiger). Unsicher und im Quelltext mit `PRÜFEN`
  markiert: Preis des kleinen Salattellers (auf der Karte von Hand geändert, 3,50 oder
  3,90 €) und der angeschnittene Name „…urger Schnitzel“ (eingetragen als Hamburger Schnitzel).
  Getränke- und Nachtischkarte lagen nicht vor.
- **Gästestimmen:** Die ersten beiden Zitate sind wörtlich aus Google-Rezensionen, das dritte
  stammt aus einem Suchergebnis-Auszug und muss noch abgeglichen werden.

## Fotos

`bilder/fotos/` enthält Gaststube, Terrassentür, Eingangsschild und sechs Gerichte, jeweils
als WebP mit JPG-Rückfallebene. **Alle stammen aus Google-Rezensionen von Gästen.** Für den
Entwurf in Ordnung, vor dem Livegang aber entweder die Erlaubnis der Fotografen einholen
oder durch eigene Fotos der Gaststätte ersetzen (gleiche Dateinamen, dann ändert sich am
HTML nichts). Bildnachweis im Impressum ergänzen.

## Gestaltung nach der echten Gaststätte

- Eingangsschild „Original Oberlausitzer Gaststätte Spreetal“: cremegelb mit rostroter
  Schrift – aufgegriffen im Schild unter der Illustration und am Wirtshausschild darin.
- Wagenrad und Jägerzaun vom Eingang stehen jetzt in der Illustration.
- Die getäfelten Wände der Gaststube (graubraune Felder mit hellen Rahmen) bilden den
  Hintergrund der Gästestimmen (`bilder/taefelung.svg`), die dunklen Deckenbalken den Rahmen.
- Herzmotiv der Stühle im Abschnitt „Ein Familienbetrieb mit Herz“.
- „Nur Bares ist Wahres“ ist der eigene Spruch der Gaststätte von der Speisekarte.

## Vor dem Livegang

- `<meta name="robots" content="noindex, nofollow">` auf allen drei Seiten entfernen.
- Den gelben Entwurfshinweis (`<p class="entwurf">`) auf allen drei Seiten entfernen.
- Impressum und Datenschutz vervollständigen (gelb markierte Lücken) und prüfen lassen.
- Domain festlegen, z. B. `gaststaette-spreetal.de` oder `spreetal-ebersbach.de`
  (beide waren im September 2026 laut Vercel frei, bei einem .de-Anbieter gegenprüfen).
  Danach `canonical`, `og:url` und `og:image` ergänzen, `sitemap.xml` und `robots.txt` anlegen.
- Das Google-Unternehmensprofil auf die neue Domain verweisen lassen und dort die falschen
  Angaben korrigieren (z. B. „Lieferung“).
- Öffnungszeiten stehen an drei Stellen und müssen zusammenpassen: Tabelle und Fuß in
  `index.html`, die strukturierten Daten im `<head>` und `OEFFNUNGSZEITEN` in `js/seite.js`.

## Bewusste Entscheidungen

- **Keine eingebettete Karte.** Links zu Google Maps und OpenStreetMap statt eines iframes:
  kein Datenaustausch, solange niemand klickt, und damit kein Cookie-Banner nötig.
- **Große Schrift, klare Knöpfe.** Damit auch ältere Gäste gut zurechtkommen: Grundschrift 18–19 px,
  Telefonnummer als großer Knopf, auf dem Handy eine feste Anrufleiste am unteren Rand.
- **Barzahlung sichtbar.** Steht bei der Speisekarte, bei den Öffnungszeiten und im Fuß,
  damit sich niemand erst an der Kasse ärgert.
- **Keine Bewertungssterne in den strukturierten Daten.** Google wertet selbst
  eingetragene Bewertungen bei Gaststätten nicht und kann sie abstrafen.
