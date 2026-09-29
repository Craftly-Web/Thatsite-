# Elektro Ronneberger — Website-Entwurf

Entwurf einer neuen Website für Elektro Ronneberger, Elektrotechnikermeister,
Am Pließnitztal 2, 02748 Bernstadt auf dem Eigen. Umgesetzt nach dem Konzept
„Industrial · präzise · regional · modern“: sehr dunkles Anthrazit, Off-White und eine
einzige Akzentfarbe (Kupfer, wie im Leiter). Kein Gelb, keine Blitz-Symbole, keine Stockfotos.

Reines HTML, CSS und JavaScript ohne Build-Schritt. Der Ordner ist in sich geschlossen
und kann später unverändert auf die eigene Domain umziehen.

## Aufbau

```
index.html         Startseite: Hero, Vertrauensleiste, Leistungen (8 Kacheln), Seit 1991,
                   Projekte aus der Region, Ausbildung, Abschluss „Projekt anfragen“
leistungen.html    Alle 8 Leistungen mit Sprungmarken (#elektroinstallation, #beleuchtung,
                   #gebaeudeautomation, #pruefung-wartung, #zaehleranlagen,
                   #kabelmontage-20-kv, #photovoltaik, #glasfaser); 20 kV dunkel hervorgehoben
ueber-uns.html     Text, Zeitleiste 1991 → Ausbau → Heute → Zukunft, Damals & heute
referenzen.html    KITA Kemnitz, kommunale Bauprojekte, moderne Beleuchtung
ausbildung.html    Du-Ansprache, Fakten, „Was dich erwartet“, Einblicke
kontakt.html       Kontaktkarte, Anfrageformular mit Themenauswahl und Datei-Upload
impressum.html     Impressum mit gelb markierten Lücken
datenschutz.html   Datenschutzerklärung als Entwurf mit gelb markierten Lücken
css/schriften.css  Selbst gehostete Schriften (Manrope, Inter; SIL OFL 1.1)
css/stil.css       Gesamtes Design
js/seite.js        Menü, Einblenden, Sprungleiste, Formular, mitlaufende Jahreszahlen
fonts/             Schriftdateien (woff2) und Lizenztexte
```

Die Navigation im Kopf ist auf allen Seiten gleich: Leistungen (mit Aufklappmenü der
8 Bereiche) · Über uns · Referenzen · Ausbildung · Kontakt, dazu der Knopf „Projekt anfragen“.
Impressum und Datenschutz stehen im Fuß. Auf dem Handy gibt es unten eine feste Leiste
mit „Anrufen“ und „Projekt anfragen“.

Die Leistungen haben bewusst keine eigenen Unterseiten: Pro Bereich gibt es derzeit zwei
bis drei Sätze, eigene Seiten wären zu dünn. Sobald je Leistung mehr Inhalt und Fotos da
sind, lassen sich die Abschnitte eins zu eins in eigene Seiten auslagern.

Die Symbole sind im Stil von Lucide (ISC-Lizenz) gezeichnet und stehen als `<symbol>` am
Anfang jeder Seite.

## Fotos

Es gibt noch keine Fotos. Jeder Bildplatz ist ein Platzhalter mit Schnittmarken und einer
Beschreibung, was dort hingehört. Die Beschreibungen folgen der Fotoliste aus dem Konzept
(Tom Ronneberger, Team, Firmengebäude, Verteiler, Messung, Beleuchtung, Gebäudeautomation,
PV, Glasfaser, Mittelspannung, Ausbildung, historische Aufnahme). Empfehlung: ein Fototermin
von 2–3 Stunden deckt die ganze Website ab.

Foto einsetzen:

```html
<!-- vorher -->
<figure class="foto leer"> … Platzhalter … </figure>
<!-- nachher -->
<figure class="foto"><img src="bilder/team-1200.webp" alt="Das Team vor dem Firmengebäude" width="1200" height="960" loading="lazy"></figure>
```

Das Format jedes Bildplatzes ist festgelegt (Hero 4:5, Leistungen und Referenzen 4:3 usw.),
Fotos werden passend zugeschnitten (`object-fit: cover`).

## Was der Betrieb noch bestätigen muss

Nach dem Konzept (Abschnitt 14) steht auf der Website nichts, was nicht belegt ist. Offen:

- **Referenzen:** Alle drei tragen den gestrichelten Hinweis „Freigabe durch den Betrieb
  ausstehend“. Besonders KITA Kemnitz und die Nennung kommunaler Projekte freigeben lassen.
- **Inhaber und Impressum:** Inhaber (laut Recherche Tom Ronneberger), Handwerkskammer
  (vermutlich Dresden), Handwerksrollen-Nummer, USt-IdNr.
- **Gebäudeautomation:** Konkrete Systeme (z. B. KNX) sind bewusst nicht genannt.
- **Photovoltaik, Glasfaser, 20 kV:** Die Texte bleiben allgemein. Genaue Leistungen
  (z. B. Speicher, Wallbox, Spleißen/Messen, Muffen/Endverschlüsse) erst nach Bestätigung ergänzen.
- **Smart Home, Wallbox:** Nicht erwähnt.
- **Einsatzgebiet:** Nicht genannt, auch nicht in den strukturierten Daten (`areaServed`).
  Löbau, Zittau, Görlitz, Herrnhut usw. nur aufnehmen, wenn sie wirklich dazugehören.
- **Öffnungszeiten und zweite Telefonnummer:** Weggelassen. Platz dafür ist in der
  Kontaktkarte (`kontakt.html`, Kommentar `PRÜFEN`).
- **Mitarbeiterzahl:** Nicht genannt.
- **Ausbildungsplätze:** Überall steht „Aktuelle Ausbildungsplätze auf Anfrage“. Wenn ein Platz
  frei ist, z. B. durch „Ausbildungsplatz 2027 verfügbar“ ersetzen (Startseite, Ausbildungsseite).
- **Logo / Corporate Design:** Bisher eine schlichte Wortmarke mit Kupferbalken. Ein
  vorhandenes Logo ersetzt `.marke` im Kopf und im Fuß.

## Vor dem Livegang

- `<meta name="robots" content="noindex, nofollow">` auf allen Seiten entfernen.
- Den gelben Entwurfshinweis (`<p class="entwurf">`) auf allen Seiten entfernen.
- Die Hinweise `<span class="pruefen">` in `referenzen.html` nach der Freigabe entfernen.
- **Kontaktformular anbinden.** Im Entwurf wird nichts versendet. Stattdessen erscheint ein
  Hinweis mit einer vorbereiteten E-Mail (`js/seite.js`, Abschnitt „Kontaktformular“).
  Für den Livegang eine Serverfunktion anlegen (z. B. wie `api/contact.js` mit Resend),
  die Anhänge begrenzt (Größe, Anzahl, nur Bilder/PDF). Danach den Versanddienst in der
  Datenschutzerklärung eintragen.
- Impressum und Datenschutz vervollständigen (gelb markierte Lücken) und prüfen lassen.
- Domain festlegen (laut E-Mail-Adresse vermutlich `elektro-ronneberger.de`). Danach auf
  jeder Seite `canonical`, `og:url` und `og:image` ergänzen, `url` in den strukturierten
  Daten der Startseite eintragen, `sitemap.xml` und `robots.txt` anlegen.
- Fotos einsetzen und im Impressum den Bildnachweis ergänzen.

## SEO

- Titel und Beschreibungen jeder Seite stammen wörtlich aus dem Konzept.
- Lokaler Fokus: Bernstadt auf dem Eigen und Oberlausitz stehen in Überschriften und Texten,
  überregionale Begriffe werden bewusst nicht bedient.
- Strukturierte Daten auf der Startseite als `Electrician` mit Adresse, Telefon, E-Mail,
  Gründungsjahr und Leistungen, ohne Öffnungszeiten und Einsatzgebiet (beides offen).
- Das Google-Unternehmensprofil sollte exakt dieselben Angaben verwenden (Name, Adresse,
  Telefon, Website) und nach dem Fototermin dieselben echten Fotos bekommen.

## Bewusste Entscheidungen

- **Keine eingebettete Karte.** Links zu OpenStreetMap und Google Maps statt eines iframes:
  kein Datenaustausch, solange niemand klickt. Daher braucht es kein Cookie-Banner.
- **Schriften lokal.** Keine Verbindung zu Google Fonts.
- **Jahreszahlen laufen mit.** „35+ Jahre“ und „35 Jahre“ rechnet `js/seite.js` ab 1991 selbst
  hoch (`data-seit`). Ohne JavaScript steht 35 da.
- **20 kV hervorgehoben.** Als Spezialgebiet auf der Startseite als dunkle Kachel und auf der
  Leistungsseite als dunkler Abschnitt mit großer Kennzahl.
- **Ausbildung jünger im Ton.** Du-Ansprache, sonst durchgehend Sie. „Ausbildung anfragen“
  öffnet das Kontaktformular mit vorgewähltem Thema (`kontakt.html?thema=Ausbildung`).
  Dasselbe gilt für die „… anfragen“-Links bei jeder Leistung.
