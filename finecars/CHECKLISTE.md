# Checkliste vor der Veröffentlichung

`npm run build` listet am Ende alle offenen Punkte auf, `npm run release` bricht ab, solange welche bestehen. Diese Liste ergänzt das um Punkte, die sich nicht automatisch prüfen lassen.

## 1. Pflichtangaben (Impressum – `site.config.js` → `company` / `legal`)

- [ ] Geschäftsführung (`legal.managingDirectors`)
- [ ] E-Mail-Adresse (`company.email`) – im Impressum Pflicht
- [ ] Registergericht und HRB-Nummer (`legal.registerCourt`, `legal.registerNumber`)
- [ ] USt-IdNr., falls vorhanden (`legal.vatId`)
- [ ] Aussage zur Verbraucherstreitbeilegung nach § 36 VSBG (`legal.disputeResolutionStatement`)
- [ ] Prüfen, ob weitere Angaben nötig sind (z. B. Aufsichtsbehörde bei Kreditvermittlung, Angaben nach § 18 Abs. 2 MStV bei redaktionellen Inhalten)
- Hinweis: Die EU-Online-Streitbeilegungsplattform wurde zum 20.07.2025 eingestellt; ein Link darauf ist daher nicht mehr enthalten.

## 2. Datenschutzerklärung (`src/pages/legal.js`)

- [ ] Hosting-Anbieter, Anschrift und Speicherdauer der Server-Logs bestätigen (`site.config.js` → `hosting`)
- [ ] Auftragsverarbeitungsvertrag mit dem Hoster abschließen/bestätigen
- [ ] Rechtsgrundlage für Übermittlungen in die USA prüfen (Hosting, Resend)
- [ ] Bei aktiviertem Formular: AV-Vertrag mit Resend, Abschnitt „Kontaktformular“ prüfen
- [ ] Zuständige Aufsichtsbehörde bestätigen
- [ ] Bei jeder neuen Funktion (Karte, Analyse, Chat, Videos …) Text anpassen
- [ ] **Beide Rechtstexte anwaltlich oder durch einen geprüften Generator freigeben lassen** – die Texte sind Entwürfe

## 3. Fahrzeugdaten (`data/vehicles.json`)

- [ ] Alle Beispieldatensätze (`isDemo: true`, IDs `demo-…`) entfernen
- [ ] Echte Fahrzeuge mit geprüften Angaben eintragen (Preise, Kilometerstand, EZ, HU, Ausstattung)
- [ ] Echte Fotos mit Alt-Texten hinterlegen (`images`), Felder `demoArt` entfernen
- [ ] `meta.isDemo` auf `false` setzen, `meta.source`/`meta.updatedAt` pflegen
- [ ] Prüfen, ob Pflichtangaben für Fahrzeugwerbung gelten (z. B. Pkw-EnVKV bei Neu- oder Vorführwagen, Gesamtpreis inkl. MwSt.)
- [ ] Ablauf festlegen, wer den Bestand wie oft aktualisiert (verkaufte Fahrzeuge zeitnah auf `"status": "sold"`)

## 4. Unternehmensangaben prüfen

- [ ] Adresse, Telefonnummer und Firmierung
- [ ] Link zum Händlerprofil `https://home.mobile.de/VOLPRICH`
- [ ] Aussage „Langjährig auf mobile.de“ (`showMobileDePresence`)
- [ ] Bewertungen nur anzeigen, wenn aktuell geprüft: `reviews.show: true` **und** `reviews.verifiedAt` (Datum der Prüfung) setzen; Werte (4,9 / ca. 500) vorher abgleichen
- [ ] Öffnungszeiten werden derzeit nirgends angezeigt; bei Bedarf bestätigte Zeiten ergänzen (Template-Erweiterung nötig)
- [ ] Texte „Besichtigung/Probefahrt nach Absprache“ mit dem Händler abstimmen
- [ ] Original-Logo als Vektordatei einsetzen (`src/assets/img/logo.svg`, danach `node scripts/generate-images.mjs`)

## 5. Technik

- [ ] Eigenes Vercel-Projekt mit Root Directory `finecars` anlegen
- [ ] `SITE_URL` auf die endgültige Domain setzen
- [ ] Kontaktformular: `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM`, `FINECARS_CONTACT_FORM=on` – danach Testnachricht senden und Empfang bestätigen
- [ ] `FINECARS_DEMO=off` setzen
- [ ] `npm run release` lokal oder als Build-Befehl ausführen – muss ohne Fehler durchlaufen
- [ ] Nach dem Livegang: Sitemap in der Google Search Console einreichen, Google-Unternehmensprofil mit der Website verknüpfen
- [ ] Stichprobe auf echten Geräten (iOS Safari, Android Chrome): Menü, Filter, Galerie, Telefonlinks, Formular
