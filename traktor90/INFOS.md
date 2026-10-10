# SV 90 Traktor Mittelherwigsdorf: Recherche & offene Punkte

Stand: 10.10.2026. Grundlage für den Website-Entwurf unter `/traktor90/`.

## Alte Website

- **sv90traktor.de** (WordPress), zusätzlich beim Fußballverband Oberlausitz als **sv90traktor-mittelherwigsdorf.de** gelistet.
- Beide Domains waren bei der Recherche **nicht erreichbar** (DNS löst nicht auf). Die Inhalte stammen deshalb aus Suchmaschinen-Auszügen der alten Seite und aus Drittquellen.
- Alte Menüpunkte: News, Verein, Chronik, Fußball (Herrenmannschaft), Volleyball (1. Mannschaft), Gymnastik, Impressum.
- Achtung: Der Beitrag „Traktor 2.0 – Digitale Tickets, App und Online-Fanshop“ (Scheibeberg-Arena, QR-Tickets) ist vom **1. April 2016**. Das ist ein Aprilscherz und wurde nicht übernommen.

## Gesicherte Fakten (im Entwurf verwendet)

| Thema | Info | Quelle |
|---|---|---|
| Name | SV 90 Traktor Mittelherwigsdorf e. V. (Register: „Sportverein 90 Traktor Mittelherwigsdorf e. V.“) | Impressum alt, Northdata |
| Register | Amtsgericht Dresden, VR 14203 | Northdata |
| Anschrift | Sportzentrum 1, 02763 Mittelherwigsdorf | Impressum alt, LSB Sachsen |
| Kontakt | Kontakt@sv90traktor.de · 0176 56950879 | Impressum alt, LSB Sachsen |
| Vorsitzender | Jan Franze | Impressum alt, Herrenseite |
| Vorstand | Jan Franze, G. Häntsch-Wißner, Maik Ketzler (Bekanntmachung 03.05.2023) | Northdata |
| Mitglieder | ca. 150 | Vereinsseite alt |
| Slogan | „Sportlich aktiv seit 1863“ | Vereinsseite alt |
| Farben | Blau/Weiß; Logo-Navy ca. #032B6C, Website-Blau #0B3A8C | Logo, fussball.de |
| Fußball Herren | SpG, Kreisklasse (2025/26: Staffel 3, im März 2026 Tabellenplatz 1) · Training Do 19:00–20:30, Sportzentrum | fussball.de, Herrenseite alt |
| Fußball Ansprechpartner | Marcel Müller (Trainer), Gerold Vorbach | Herrenseite alt |
| Nachwuchs | C-, D-, E-Junioren in Spielgemeinschaften, u. a. mit ESV Lok Zittau | fussball.de, Chronik |
| Volleyball | 1 Herrenmannschaft (Bezirksliga Ost, alte Seite nennt auch „Bezirksliga Dresden“) + Hobbymannschaft; gegründet 2002 von Maik Ketzler | Volleyballseite alt, Chronik |
| Gymnastik | Frauen, Mo 19:00 (60 Min.), Turnhalle Mittelherwigsdorf, 15–24 Teilnehmerinnen, Callanetics/Pilates/Yoga im Zirkel, Theraband + Wasser mitbringen, Schnupperstunde möglich | Gymnastikseite alt |
| Sportzentrum | Naturrasen, Flutlicht, ca. 500 Plätze; Ausweichplatz „Unterer Rasenplatz“ | Europlan, fussball.de |
| Chronik | 1863 Beginn (Kunstradfahren, Turnen) · 1960er Fußballsektion der BSG Traktor · 05.09.1965 erste Punktspiele 2. Kreisklasse · Feierabendheim als Umkleide · 1970 Einweihung Sportplatz + Turnhalle an der Schule · nach der Wende Neugründung als SV 90 Traktor · 2000 SpG mit ESV Lok Zittau · 2002 Volleyball | Chronik alt |
| Gemeinde | Mittelherwigsdorf (Ortsteile Eckartsberg, Mittelherwigsdorf, Oberseifersdorf, Radgendorf), ca. 3.500 Einwohner, Landkreis Görlitz | Gemeinde |

## Offene Punkte (auf der Seite gelb markiert)

Bitte beim Verein erfragen:

1. **Domain:** Ist sv90traktor.de noch im Besitz des Vereins? Wer hat die Zugangsdaten? E-Mail-Adresse noch aktiv?
2. **Gründungsjahr der Neugründung:** 1990 (laut Name) oder 1992 (Northdata nennt 05.08.1992)?
3. **Vorstand:** Funktionen von G. Häntsch-Wißner und Maik Ketzler; ist der Vorstand noch aktuell (Stand 2023)? Fotos erwünscht?
4. **Trainingszeiten:** Nachwuchs (je Altersklasse), Volleyball Herren + Hobby (Tag, Uhrzeit, Halle). Gilt Herren Do 19:00–20:30 noch?
5. **Ansprechpartner:** Nachwuchs Fußball, Gymnastik, ggf. Volleyball-Trainer.
6. **Liga 2026/27:** Staffel der Herren (Aufstieg nach Platz 1?), Liga der Volleyballer.
7. **Mitgliedsbeiträge** und **Aufnahmeantrag** (PDF).
8. **Sponsoren:** Logos + Links (Trikotsponsor aus dem alten Bekleidungs-Beitrag?).
9. **Fotos:** Mannschaften, Sportzentrum, Vereinsleben, mit Einverständnis der Abgebildeten (bei Kindern der Eltern).
10. **Impressum:** Anschrift für „Verantwortlich nach § 18 MStV“ und weitere vertretungsberechtigte Vorstandsmitglieder laut Satzung.
11. **Hosting:** Anbieter für die Datenschutzerklärung (aktuell Vercel über Thatsite!).
12. **Termine:** Sportfest, Mitgliederversammlung, Heimspieltermine für die News.
13. **Weitere Angebote?** Alte Herren, Frauenfußball, Kinderturnen? Auf der alten Seite war nichts davon dokumentiert.

## Technische Hinweise

- Spielplan und Tabelle lassen sich über die **fussball.de-Widgets** live einbinden (Widget-ID im Vereins-Login bei fussball.de erzeugen). Vorher klären, ob dafür ein Einwilligungsbanner nötig ist (Drittanbieter-Einbindung).
- Die Seite hat `noindex` gesetzt, solange sie als Entwurf unter thatsite.de läuft. Beim Umzug auf die Vereinsdomain entfernen und Canonical, Sitemap und `og:image` mit absoluter URL ergänzen.
- Keine Cookies, kein Tracking, keine externen Schriften. Deshalb ist kein Cookie-Banner nötig.
