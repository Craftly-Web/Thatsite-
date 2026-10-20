# FineCars Görlitz – Website

Website für **FineCars Görlitz** (M.V. FineCars – Matthias Volprich GmbH), Gebrauchtwagenhandel in der Rothenburger Straße 27f, 02828 Görlitz.

Statische Website mit eigenem, abhängigkeitsfreiem Build (Node.js ≥ 20) und einer optionalen Vercel-Funktion für das Kontaktformular.

> **Status: Vorschau.** Die Fahrzeuge sind Beispieldaten, Rechtstexte enthalten markierte Platzhalter, das Kontaktformular ist nicht angeschlossen. Vor dem Livegang **[CHECKLISTE.md](CHECKLISTE.md)** abarbeiten.

---

## Schnellstart

```bash
cd finecars
npm start          # baut nach dist/ und startet http://localhost:4173
npm run dev        # wie start, plus automatischer Neuaufbau bei Änderungen
npm test           # Unit- und Integrationstests (node:test)
npm run check      # Build + Prüfung von Links, Überschriften, Alt-Texten, IDs, CSP
npm run release    # Build mit Release-Sperre (bricht ab, solange Demo-Daten/Platzhalter aktiv sind)
npm run export     # fertige HTML-Dateien mit relativen Pfaden → export/finecars-website/ (+ .zip)
```

### Fertige HTML-Dateien (ohne Server)

`npm run export` erzeugt in `export/finecars-website/` eine eigenständige Fassung: `index.html` lässt sich per Doppelklick öffnen oder der Ordnerinhalt bei jedem Webhoster hochladen (z. B. per FTP). Links zeigen dort direkt auf `…/index.html`, Schriften sind ins CSS eingebettet, Skripte ohne ES-Module gebündelt. Das Kontaktformular hat in dieser Fassung keinen Server-Endpunkt; dafür die Vercel-Version verwenden.

Es müssen keine Pakete installiert werden (`npm install` ist nicht nötig).

## Seiten

| Pfad | Inhalt |
|---|---|
| `/` | Startseite: Hero mit Schnellsuche, Vertrauensleiste, Fahrzeug-Highlights, „Warum FineCars“, Ablauf, Standort, Abschluss-CTA |
| `/fahrzeuge/` | Fahrzeugbestand mit Suche, Filtern (Marke, Modell, Preis von/bis, Erstzulassung, Kilometerstand, Kraftstoff, Getriebe, Leistung), Sortierung, Trefferzahl, Leerzustand, mobilem Filterpanel; Filterzustand in der URL |
| `/fahrzeuge/<slug>/` | Detailseite je Fahrzeug (aus den Daten erzeugt): Galerie mit Lightbox, Tastatur und Wischgesten, technische Daten, Beschreibung, Ausstattung, Kontaktbox, ähnliche Fahrzeuge, mobile Kontaktleiste |
| `/ueber-uns/` | Unternehmensseite ohne erfundene Historie |
| `/kontakt/` | Telefon, Adresse, Routenlink, Anfrageformular mit Fahrzeugbezug (`?fahrzeug=<slug>`) |
| `/impressum/`, `/datenschutz/` | Entwürfe mit markierten Platzhaltern |
| `/404.html` | Eigene Fehlerseite |

## Projektstruktur

```
finecars/
├─ site.config.js          Unternehmensdaten, Schalter (Demo, Formular, Bewertungen)
├─ data/vehicles.json      Fahrzeugdaten (derzeit BEISPIELDATEN)
├─ build.js                Statischer Build → dist/
├─ api/contact.js          Vercel-Funktion: Formularversand über Resend
├─ src/
│  ├─ lib/                 html-Helfer, Formatierung, Datenschicht (vehicles.js)
│  ├─ templates/           Layout (Kopf/Fuß), Komponenten, Icons
│  ├─ pages/               Seiten-Templates
│  ├─ demo/car-art.js      Generator für markenneutrale Fahrzeug-Illustrationen
│  └─ assets/              CSS, Browser-JS, Schriften (lokal), Logo & Icons
├─ scripts/                Dev-Server, Build-Prüfung, Bildgenerator
└─ tests/                  node:test-Tests
```

## Technische Entscheidungen

- **Kein Framework, keine Laufzeitabhängigkeiten.** Ein kleines Node-Skript rendert alle Seiten als statisches HTML (gut für Ladezeit und SEO). Fahrzeugkarten werden serverseitig erzeugt; das Browser-JavaScript blendet bei Filterung nur ein/aus und sortiert um.
- **Datenschutzfreundlich:** keine Cookies, kein Local Storage, kein Tracking, keine externen Skripte, Schriften (Inter, Manrope – SIL OFL) werden lokal ausgeliefert. Karten werden nicht eingebettet, sondern nur verlinkt.
- **Strenge Content-Security-Policy** (`vercel.json`): nur eigene Ressourcen, keine Inline-Skripte oder -Styles. Der Dev-Server sendet dieselben Header.
- **Barrierearm:** semantische Struktur, Skip-Link, sichtbare Fokuszustände, beschriftete Formulare mit Fehlerzusammenfassung, zugängliche Menüs/Dialoge, `prefers-reduced-motion`.
- **Logo:** aus der gelieferten JPG-Datei vektorisiert (`src/assets/img/logo.svg`). Liegt eine Original-Vektordatei vor, bitte diese einsetzen.
- **Bilder:** Es gibt keine echten Fotos. Beispielfahrzeuge zeigen gezeichnete, markenneutrale Seitenansichten, die sichtbar als „Illustration · Beispieldaten“ gekennzeichnet sind.

## Fahrzeugdaten

Alle Fahrzeuge stehen in `data/vehicles.json`. Jeder Datensatz:

| Feld | Pflicht | Beschreibung |
|---|---|---|
| `id` | ✔ | Eindeutige Fahrzeugnummer (wird auf der Seite und in Anfragen angezeigt) |
| `slug` | ✔ | URL-Teil, nur `a–z`, `0–9`, `-`, eindeutig |
| `make`, `model` | ✔ | Marke, Modell |
| `variant`, `bodyType` | | Variante, Fahrzeugtyp |
| `price` | | Bruttopreis in Euro (Zahl). Fehlt er → „Preis auf Anfrage“ |
| `vatDeductible` | | `true` → „MwSt. ausweisbar“ |
| `firstRegistration`, `huAu` | | Monat als `"JJJJ-MM"` |
| `mileage`, `powerKw`, `doors`, `seats`, `previousOwners` | | Zahlen |
| `fuel`, `transmission`, `color`, `emissionClass` | | Text |
| `features` | | Liste der Ausstattungsmerkmale |
| `description` | | Freitext; Absätze durch Leerzeile trennen |
| `images` | | `[{ "src": "/media/…jpg", "alt": "…", "width": 1600, "height": 1000, "srcset": "…" }]` |
| `status` | | `available` (Standard), `reserved` (Hinweis „Reserviert“), `sold` (wird nicht veröffentlicht) |
| `featured` | | `true` → auf der Startseite als Highlight |
| `mobileDeUrl` | | Link zum konkreten mobile.de-Inserat (nur `https://…mobile.de`) |
| `isDemo`, `demoArt` | | Nur für Beispieldaten – bei echten Fahrzeugen weglassen |

Fehlende Angaben werden nie als „0“ dargestellt: In Karten werden sie ausgelassen, in den technischen Daten steht „Keine Angabe“. Ungültige Werte werden beim Build verworfen und gemeldet.

**Fotos** im Ordner `src/media/` ablegen (z. B. `src/media/fahrzeuge/<slug>/1.jpg`); sie werden beim Build nach `/media/…` kopiert und im Datensatz als `"src": "/media/fahrzeuge/<slug>/1.jpg"` eingetragen. `npm run check` meldet fehlende Bilddateien. Empfehlung: 1600 × 1000 px als WebP/JPEG, zusätzlich 800 px Breite über `srcset`.

### Aktualisieren

1. `data/vehicles.json` bearbeiten (oder per Export ersetzen).
2. `npm run check` ausführen.
3. Committen und pushen – Vercel baut automatisch neu.

### Spätere Schnittstelle

Die Datenschicht (`src/lib/vehicles.js`) trennt Quelle und Darstellung. Eine Quelle ist eine async-Funktion, die `{ meta, vehicles }` im obigen Format liefert. Für einen Import aus einer Händlerverwaltung oder einer **zulässigen** Schnittstelle (z. B. offizieller Export/API mit Vertrag) eine neue Quelle schreiben, die die Felder abbildet, und in `build.js` statt `jsonFileSource` verwenden. Alternativ eine konvertierte JSON-Datei per `FINECARS_DATA=pfad/zur/datei.json` einbinden.

Wichtig: **keine mobile.de-Seiten scrapen**, keine API-Schlüssel ins Frontend. Zugangsdaten nur als Umgebungsvariablen im Build. Eine automatische Synchronisierung ist derzeit **nicht** implementiert.

## Kontaktformular

Das Formular hat drei Zustände (siehe `site.config.js`):

| Zustand | Bedingung | Verhalten |
|---|---|---|
| `preview` | Demomodus, Formular nicht freigeschaltet | Formular sichtbar mit Hinweis „nicht angeschlossen“; Eingabeprüfung testbar, **es wird nichts gesendet** |
| `off` | Livebetrieb, Formular nicht freigeschaltet | Kein Formular, stattdessen telefonische Kontaktaufnahme |
| `live` | `FINECARS_CONTACT_FORM=on` | Versand über `/api/contact` |

Erfolg wird nur angezeigt, wenn die Funktion den Versand bestätigt (HTTP 200 + `{ ok: true }`, nachdem Resend den Versand angenommen hat). Ohne Konfiguration antwortet die Funktion mit 503 und das Formular verweist auf das Telefon.

**Einrichtung (Vercel + Resend):**

1. Bei [Resend](https://resend.com) ein Konto anlegen und die Absender-Domain verifizieren.
2. In Vercel → Project → Settings → Environment Variables setzen:
   - `RESEND_API_KEY` – API-Schlüssel
   - `CONTACT_TO` – bestätigte Empfängeradresse von FineCars
   - `CONTACT_FROM` – z. B. `FineCars Website <formular@ihre-domain.de>`
   - `FINECARS_CONTACT_FORM=on`
3. Neu deployen und eine Testnachricht senden.
4. Datenschutzerklärung (Abschnitt Kontaktformular) und Auftragsverarbeitung prüfen.

Spamschutz: verstecktes Feld + Mindestbearbeitungszeit (3 s) + Herkunftsprüfung, serverseitige Validierung mit denselben Regeln wie im Browser (`src/assets/js/contact-validation.js`). Eine Ratenbegrenzung ist nicht eingebaut; bei Bedarf über die Vercel Firewall ergänzen.

## Veröffentlichung auf Vercel

Das Repository enthält auch die Website von thatsite.de im Hauptverzeichnis. FineCars ist ein **eigenes Vercel-Projekt**:

1. Vercel → *Add New Project* → dieses Repository importieren.
2. **Root Directory:** `finecars`. Framework Preset: *Other*. Build-/Output-Einstellungen kommen aus `finecars/vercel.json` (`node build.js` → `dist`).
3. Umgebungsvariablen:
   - `SITE_URL` – endgültige Domain, z. B. `https://www.ihre-domain.de` (für Canonical, Sitemap, Open Graph). Ohne Angabe wird die Vercel-Produktionsdomain verwendet.
   - `FINECARS_DEMO=off` – **erst**, wenn echte Daten und Pflichtangaben vorliegen.
   - Formular-Variablen (siehe oben).
4. Domain verbinden.

Der Ordner `finecars/` ist in der `.vercelignore` des thatsite.de-Projekts ausgeschlossen, damit er dort nicht mit ausgeliefert wird.

Andere Hoster: `node build.js` ausführen und `dist/` statisch ausliefern (saubere URLs über `index.html` je Verzeichnis, `404.html` als Fehlerseite). Das Kontaktformular benötigt dann einen eigenen Endpunkt; ohne ihn `FINECARS_CONTACT_FORM` nicht setzen.

## Umgebungsvariablen

| Variable | Wirkung |
|---|---|
| `SITE_URL` | Basis-URL für Canonical, Sitemap, Open Graph |
| `FINECARS_DEMO=off` | Vorschaumodus beenden (Indexierung erlaubt, sofern keine Beispieldaten mehr vorhanden sind) |
| `FINECARS_CONTACT_FORM=on` | Formular freischalten |
| `FINECARS_DATA` | Alternativer Pfad zur Fahrzeugdatei |
| `FINECARS_RELEASE=1` | Build bricht bei offenen Punkten ab (`npm run release`) |
| `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM` | Formularversand (nur serverseitig) |

## Raster-Grafiken neu erzeugen

Favicons, Open-Graph-Bild und Logo-PNG liegen fertig in `src/assets/img/`. Nach Änderungen am Logo: `node scripts/generate-images.mjs` (benötigt Playwright mit Chromium).
