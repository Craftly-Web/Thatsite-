// Zentrale Konfiguration der FineCars-Website.
//
// Grundregel: Hier stehen ausschließlich bestätigte Angaben. Unbekannte Werte
// bleiben `null` – die Website blendet die betreffenden Inhalte dann aus oder
// zeigt in den Rechtstexten einen deutlich markierten Platzhalter.
// Vor der Veröffentlichung: siehe CHECKLISTE.md.

const env = process.env;

function resolveSiteUrl() {
  if (env.SITE_URL) return env.SITE_URL.replace(/\/+$/, '');
  // Vercel stellt beim Build die Produktionsdomain bereit.
  if (env.VERCEL_PROJECT_PRODUCTION_URL) return 'https://' + env.VERCEL_PROJECT_PRODUCTION_URL;
  return '';
}

export default {
  // Vorschau-/Demomodus: setzt "noindex", zeigt einen Hinweisbalken und
  // kennzeichnet Beispieldaten. Für den Livegang FINECARS_DEMO=off setzen
  // (erst wenn echte Fahrzeugdaten und Pflichtangaben vorliegen).
  demoMode: env.FINECARS_DEMO !== 'off',

  // Absolute Basis-URL ohne abschließenden Schrägstrich, z. B.
  // "https://www.example.de". Wird für Canonical-URLs, Sitemap und
  // Open Graph benötigt. Ohne Angabe werden diese Elemente weggelassen.
  siteUrl: resolveSiteUrl(),

  company: {
    legalName: 'M.V. FineCars – Matthias Volprich GmbH',
    brand: 'FineCars Görlitz',
    shortName: 'FineCars',
    street: 'Rothenburger Straße 27f',
    zip: '02828',
    city: 'Görlitz',
    region: 'Sachsen',
    country: 'DE',
    phone: '03581 311715',
    phoneHref: 'tel:+493581311715',
    phoneIntl: '+49 3581 311715',
    // Nicht bestätigt – bewusst leer lassen, bis die Adresse vorliegt.
    email: null,
    // Nicht bestätigt – Öffnungszeiten werden nirgends angezeigt, solange null.
    // Format, sobald bekannt: [{ days: 'Mo–Fr', hours: '09:00–18:00' }, …]
    openingHours: null,
    mobileDeUrl: 'https://home.mobile.de/VOLPRICH',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent('Rothenburger Straße 27f, 02828 Görlitz')
  },

  // Pflichtangaben für das Impressum. Alle Werte sind noch zu bestätigen.
  legal: {
    managingDirectors: null, // z. B. ['Vorname Nachname']
    registerCourt: null, // z. B. 'Amtsgericht …'
    registerNumber: null, // z. B. 'HRB …'
    vatId: null, // z. B. 'DE…'
    // Teilnahme an Streitbeilegungsverfahren (§ 36 VSBG) – Aussage bestätigen lassen.
    disputeResolutionStatement: null
  },

  // Bewertungen dürfen nur angezeigt werden, wenn sie vor Veröffentlichung
  // geprüft wurden. Ohne `verifiedAt` bleibt der Block ausgeblendet.
  reviews: {
    show: false,
    rating: 4.9,
    count: 500,
    source: 'mobile.de',
    sourceUrl: 'https://home.mobile.de/VOLPRICH',
    verifiedAt: null // z. B. '2026-11-01' – Datum der manuellen Prüfung
  },

  // Langjährige Präsenz auf mobile.de (laut Händlerprofil). Vor dem Livegang prüfen.
  showMobileDePresence: true,

  // Kontaktformular: Erst aktivieren, wenn Empfängeradresse und E-Mail-Versand
  // eingerichtet sind (siehe README → Kontaktformular). Ohne Freischaltung
  // zeigt die Kontaktseite die telefonische Kontaktaufnahme.
  contactForm: {
    enabled: env.FINECARS_CONTACT_FORM === 'on',
    endpoint: '/api/contact'
  },

  // Hosting-Anbieter für die Datenschutzerklärung. Bei anderem Hosting anpassen.
  hosting: {
    name: 'Vercel Inc.',
    address: '440 N Barranca Ave #4133, Covina, CA 91723, USA',
    privacyUrl: 'https://vercel.com/legal/privacy-policy'
  }
};
