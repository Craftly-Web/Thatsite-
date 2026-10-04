# E-Book „Leichter. Ohne Diät.“

Die Tausch-Methode: Abnehmen durch kleine Alltags-Tausche – mit Sonderkapitel zu Stress & Depression.

- **Fertiges PDF:** `dist/Leichter-ohne-Diaet.pdf` (93 Seiten, 170 × 240 mm, mit Lesezeichen)
- **Cover-Bild für Shop/Werbung:** `dist/cover.png` (1929 × 2718 px)

## Vor dem Verkauf anpassen

In `config.json` Name/Firma, Adresse und Kontakt fürs Impressum eintragen (optional `AUTOR` fürs Cover),
dann neu bauen. Der Ordner `ebook/` ist per `.vercelignore` von der Website ausgeschlossen,
damit das PDF nicht öffentlich abrufbar ist.

## Neu bauen

```bash
cd ebook
node build.js
```

Benötigt Node.js, Playwright mit Chromium und `pdftotext` (poppler-utils). Die Schriften
(Bangers, Fredoka, Nunito – SIL Open Font License) liegen in `src/fonts/` und werden eingebettet.

## Aufbau

| Datei | Inhalt |
|---|---|
| `src/index.html` | Gerüst, Cover, Titelei |
| `src/kapitel-*.html`, `src/anhang.html` | Kapitel und Anhang |
| `src/quellen.js` | Quellenverzeichnis; im Text mit `[[schluessel]]` zitieren, Nummern vergibt der Build |
| `src/styles.css` | Layout und Design |
| `src/art/*.svg` | Comic-Illustrationen und Maskottchen „Tauschi“ |
