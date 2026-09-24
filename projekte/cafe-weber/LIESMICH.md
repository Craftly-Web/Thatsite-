# Konditorei & Café Weber, Zittau — Website-Entwurf

Einseitige Website für die Konditorei und Café Weber (Inh. Katrin Weber,
Reichenberger Straße 27, 02763 Zittau). Schwerpunkt sind die **Torten**:
eine filterbare Galerie mit Großansicht, ein eigener Abschnitt für
Hochzeitstorten und ein klarer Weg zur Bestellung.

Reines HTML, CSS und JavaScript, genau wie die THATSITE!-Seite selbst.
Es gibt keinen Build-Schritt und keine Verbindung zu fremden Servern. Der
Ordner ist in sich geschlossen und lässt sich später unverändert auf eine
eigene Domain der Konditorei umziehen.

Erreichbar unter `/projekte/cafe-weber/`, in der Vercel-Vorschau also unter
`<vorschau-adresse>/projekte/cafe-weber/`.

```
index.html               die Seite
stil.css                 gesamtes Design, Farben ganz oben unter :root
skript.js                Galerie-Filter, Großansicht, Menü, „Jetzt geöffnet“
schriften/               Cormorant Garamond + Jost (SIL Open Font License)
bilder/                  hierhin gehören die Fotos
bilder/platzhalter/      Zeichnungen, die erscheinen, solange ein Foto fehlt
bilder/spitze.svg        Tortenspitze (Zierelement)
```

## Fotos einsetzen

Solange ein Foto fehlt, zeigt die Seite an seiner Stelle eine gezeichnete
Torte mit dem Hinweis „Foto folgt“. Sobald eine Datei mit dem passenden
Namen in `bilder/` liegt, erscheint automatisch das Foto. Am HTML muss dafür
nichts geändert werden.

| Datei                 | Wo auf der Seite                      | Passendes Motiv                    |
|-----------------------|---------------------------------------|------------------------------------|
| `titel.jpg`           | Titel, großes Bogenbild               | das schönste Tortenfoto überhaupt  |
| `titel-detail.jpg`    | Titel, kleines rundes Bild            | Nahaufnahme, Törtchen, Detail      |
| `hochzeit-01.jpg`     | Galerie, großes Feld                  | Hochzeitstorte (Hochformat ideal)  |
| `hochzeit-02.jpg`     | Galerie                               | Hochzeitstorte                     |
| `hochzeit-03.jpg`     | Galerie                               | Hochzeitstorte                     |
| `festtag-01.jpg`      | Galerie                               | Festtagstorte                      |
| `festtag-02.jpg`      | Galerie, breites Feld                 | Geburtstagstorte (Querformat)      |
| `obst-01.jpg`         | Galerie                               | Obsttorte                          |
| `obst-02.jpg`         | Galerie                               | Obstkuchen                         |
| `sahne-01.jpg`        | Galerie                               | Sahnetorte / Tortenstück           |
| `minis-01.jpg`        | Galerie                               | Minis, Petit Fours                 |
| `minis-02.jpg`        | Galerie                               | kleine Törtchen                    |
| `schulanfang-01.jpg`  | Galerie                               | Torte zur Schuleinführung          |
| `kinder-01.jpg`       | Galerie                               | Motivtorte, Kindergeburtstag       |
| `hochzeit-gross.jpg`  | Abschnitt Hochzeitstorten             | Hochzeitstorte (Hochformat)        |
| `cafe-vitrine.jpg`    | Abschnitt Café, großes Bild           | Kuchenvitrine / Gastraum           |
| `cafe-kaffee.jpg`     | Abschnitt Café, kleines Bild          | Kaffee und Kuchen am Tisch         |

- Format **JPG**, lange Seite etwa **1600 px**, möglichst unter 400 KB.
  Die Bilder werden automatisch zugeschnitten (`object-fit: cover`), das
  Hauptmotiv sollte also mittig liegen.
- Die Bildunterschriften in der Galerie (`<figcaption>`) und die `alt`-Texte
  in `index.html` sind allgemein gehalten. Nach dem Einsetzen an das
  tatsächliche Foto anpassen.
- Weniger Fotos als Plätze? Dann die überzähligen `<li>` in der Galerie
  löschen, statt Zeichnungen stehen zu lassen.

### Fotos aus den Google-Rezensionen

Google Maps → „Konditorei und Cafe Weber“ → **Fotos** → Reiter
**„Von Besuchern“**. Ein Foto groß öffnen und mit Rechtsklick → „Bild
speichern unter …“ unter dem Namen aus der Tabelle in `bilder/` ablegen.

**Rechtlich:** Die Rechte an diesen Fotos liegen bei den Gästen, die sie
hochgeladen haben, nicht bei der Konditorei und nicht bei uns. Für den
Entwurf und das Gespräch mit Frau Weber ist das in Ordnung. Für die
**Live-Seite** braucht es entweder eigene Fotos der Konditorei (am besten ein
kurzer Fototermin, die Torten sind das Kapital dieser Seite) oder die
Zustimmung der jeweiligen Urheber.

## Vor dem Zeigen prüfen

Die Inhalte stammen aus einer Online-Recherche (September 2026). Diese
Punkte sind nicht sicher belegt:

- **Öffnungszeiten:** Die Verzeichnisse nennen Di–Sa teils 10–17 Uhr, teils
  7–17 Uhr. Eingetragen ist 10–17 Uhr. Die Zeiten stehen nur einmal, in der
  Tabelle `#zeiten` in `index.html`. Anzeige „Jetzt geöffnet“ und Hervorhebung
  des heutigen Tages lesen dort mit (`data-von` / `data-bis`), ebenso der
  Block `openingHoursSpecification` im Kopf der Seite.
- **Bewertungen:** Google 4,6 · Tripadvisor 5,0 · Restaurant Guru 4,7.
  Die Zahlen ändern sich laufend, bitte aktuell nachsehen.
- **Zitate:** Wortlaut vor der Veröffentlichung mit den Originalen
  abgleichen (werkenntdenbesten.de, Tripadvisor).
- **Lieferung von Hochzeitstorten:** Eine Bewertung erwähnt sie. Mit der
  Konditorei klären, ob das grundsätzlich angeboten wird.
- **Naschecke Neugersdorf:** Laut Verzeichnissen gehört sie zur Familie
  Weber. Ob sie auf der Seite erscheinen soll, mit Frau Weber absprechen.
- Gründungsjahr, Familiengeschichte und Logo waren online nicht zu finden.
  Liefert die Konditorei sie nach, passen sie gut in den Café-Abschnitt.

## Vor dem Livegang

1. Den Hinweisbalken `<div class="entwurf">` ganz oben in `index.html` entfernen.
2. `<meta name="robots" content="noindex, nofollow">` entfernen. Zusätzlich
   setzt `vercel.json` für `/projekte/` den Header `X-Robots-Tag: noindex`.
   Zieht die Seite auf eine eigene Domain um, entfällt das.
3. **Impressum und Datenschutzerklärung** der Konditorei ergänzen und in der
   Fußzeile verlinken. Beides fehlt im Entwurf bewusst.
4. Eigene Fotos statt Rezensionsfotos (siehe oben).
5. Die Fußzeilen-Angabe „Website-Entwurf: THATSITE!“ in einen normalen
   Urhebervermerk ändern oder entfernen.

## Design

Klassische Konditorei statt Bäckerei-Kette: sahniger Papiergrund,
Schokoladenbraun für Text, Himbeere als Akzent und Gold für Zierrat.
Wiederkehrende Motive sind Tortenhaube (Bogenbilder), Tortenspitze
(Deckchen hinter Bildern) und Bogenkante. Überschriften sind in
*Cormorant Garamond*, der Fließtext in *Jost*.

Alle Farben stehen unter `:root` in `stil.css`. Gibt es ein Logo oder ein
Ladenschild mit festen Farben, reicht es, dort die Werte zu tauschen.
Kontraste der Textfarben erfüllen WCAG AA (Werte stehen als Kommentar
daneben). Bei „Bewegung reduzieren“ entfallen alle Animationen.
