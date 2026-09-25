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
```

Die Symbole stammen aus Lucide (ISC-Lizenz) und stehen als `<symbol>` am Anfang jeder Seite.

## Stand der Inhalte

Grundlage ist eine Online-Recherche vom September 2026. Belegt aus mehreren Quellen:
Anschrift, Telefon, Öffnungszeiten, gutbürgerliche Küche, Familienbetrieb, Biergarten
hinter dem Haus, kostenlose Parkplätze, nur Barzahlung, Google-Bewertung 4,7 bei über
200 Bewertungen, PlusBus 50 (Haltestelle August-Weise-Siedlung).

**Mit der Inhaberin zu klären, bevor die Seite live geht:**

1. **Speisekarte.** Online war nur ein Teil der rund neun Gerichte zu finden: Soljanka,
   Schnitzel, Amerikanisches Filet, ein Wurstgericht, Bratkartoffeln, Kroketten,
   etwas Vegetarisches. Alle Preise fehlen (`–,– €`), die Beschreibungen sind Vorschläge.
2. **Fotos.** Zwei Plätze sind vorbereitet und im Quelltext mit `FOTO:` markiert:
   Gaststube (Hochformat 4:5), Biergarten (Querformat 4:3). Eigene Fotos der Gaststätte
   verwenden – Fotos aus Google Maps gehören den jeweiligen Urhebern und dürfen nicht
   ohne deren Zustimmung übernommen werden. Als WebP mit JPG als Rückfallebene in zwei
   Größen ablegen und per `<picture>` mit `srcset` einbinden. Ein gutes Außenfoto des
   Hauses kann später auch die Illustration im Kopfbereich ersetzen.
3. **Umgebindehaus.** Ein Verzeichnis beschreibt das Haus so, ein anderes nennt den
   gleichen Satz bei der Pension Spreeeck. Vor Ort bestätigen lassen, bevor die
   Überschrift „Hausmannskost im Umgebindehaus“ online geht.
4. **Einzelne Aussagen prüfen:** Hunde willkommen, Kinder willkommen, Platz für größere
   Gruppen und Feiern, Nähe zum Spreeradweg bzw. zu den Spreequellen, Name der Inhaberin
   (Christina Bitterlich laut Branchenbuch).
5. **Gästestimmen.** Die drei Zitate stammen aus Auszügen von Bewertungsportalen. Mit den
   Original-Bewertungen bei Google abgleichen und wörtlich übernehmen.
6. **Tafel „Von der Tafel“.** Nur behalten, wenn die Gaststätte Tagesgerichte oder
   Saisonkarten anbietet und jemand sie hier aktuell hält.

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
