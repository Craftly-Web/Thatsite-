# E-Book: „Das Herz heilt leiser, als es bricht“

Ein warmherziger, wissenschaftlich fundierter Begleiter durch die Zeit nach einer Trennung.
14 Kapitel + Vorwort, 30-Tage-Begleiter, Nachwort, Zitatsammlung und Quellenverzeichnis (~23.000 Wörter).

## Fertige Dateien (`ausgabe/`)

| Datei | Wofür |
|---|---|
| `Das-Herz-heilt-leiser.pdf` | Gestaltetes E-Book im A5-Format (161 Seiten), klickbares Inhaltsverzeichnis, Lesezeichen. Ideal zum Verkaufen/Verschicken (z. B. Digistore24, Gumroad, eigene Website). |
| `Das-Herz-heilt-leiser.epub` | EPUB 3 für E-Reader (Tolino, Kindle über KDP, Apple Books, Google Play Books). Geprüft mit EPUBCheck 5.2.1: 0 Fehler, 0 Warnungen. |
| `cover.jpg` | Cover 1600 × 2263 px für Shops. |
| `instagram/zitat-XX-*.png` | 60 Zitatkarten im Instagram-Hochformat 1080 × 1350 px, fünf Farbvarianten. |
| `instagram/zitate.md` | Alle Zitate als Text zum Kopieren, mit Hashtag-Vorschlag. |

## Anpassen

- **Autor:in, Instagram-Name, Widmung:** in `buch.json` eintragen (`autor`, `instagram_name`, `widmung`). Danach neu bauen – Name erscheint dann auf Cover, Titelseite, Impressum und Zitatkarten.
- **Texte:** in `inhalt/*.md` (Markdown). Sonderblöcke:
  `:::zitat` (letzte Zeile `— Quelle` optional), `:::spiegel`, `:::studie`, `:::uebung Titel`, `:::journal`, `:::merke`, `:::plan Titel` – jeweils mit `:::` schließen.
- **Design:** `build/buch.css` (PDF), `build/epub.css` (EPUB), Zitatkarten-Farben in `build/build.js` (`THEMEN`).

## Neu bauen

```bash
cd ebook
npm install
npm run build
```

Voraussetzungen: Node.js, Playwright mit Chromium (`npm i -g playwright && npx playwright install chromium`), python3.

## Rechtliches zu den Zitaten

- Zitate **ohne Namensangabe** wurden für dieses Buch geschrieben und dürfen frei gepostet werden.
- Gibran, Rilke, Kierkegaard und Laozi sind gemeinfrei – als Karten enthalten.
- Hesse, Camus und Cohen sind noch urheberrechtlich geschützt: Sie stehen nur im Buch (Zitatrecht), es wurden bewusst **keine** Instagram-Karten dafür erzeugt.
- Schriften: Fraunces, Literata, DM Sans (SIL Open Font License, frei auch für kommerzielle Nutzung).

Hinweis: Der Ordner `ebook/` ist in `.vercelignore` eingetragen, damit das E-Book nicht öffentlich über die Website ausgeliefert wird.
