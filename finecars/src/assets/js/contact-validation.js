// Gemeinsame Prüfregeln für das Kontaktformular.
// Wird im Browser (contact-form.js) und serverseitig (api/contact.js) genutzt,
// damit beide Seiten exakt dieselben Regeln anwenden.

export const SUBJECTS = [
  'Fahrzeuganfrage',
  'Besichtigung oder Probefahrt vereinbaren',
  'Allgemeine Anfrage'
];

export const LIMITS = {
  name: 120,
  email: 200,
  phone: 40,
  subject: 80,
  vehicle: 160,
  message: 5000,
  messageMin: 10
};

// Mindestzeit zwischen Laden und Absenden (Spamschutz), in Millisekunden.
export const MIN_FILL_MS = 3000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[0-9+()\/\-.\s]{5,40}$/;

/** Bereinigt die Eingaben (Strings, getrimmt, gekürzt). */
export function cleanInput(input = {}) {
  const s = (k, max) => String(input[k] ?? '').replace(/\r\n/g, '\n').trim().slice(0, max);
  return {
    name: s('name', LIMITS.name),
    email: s('email', LIMITS.email),
    phone: s('phone', LIMITS.phone),
    subject: s('subject', LIMITS.subject),
    vehicle: s('vehicle', LIMITS.vehicle),
    message: s('message', LIMITS.message)
  };
}

/**
 * Prüft die Eingaben. Gibt ein Objekt { feld: Fehlermeldung } zurück –
 * leer, wenn alles gültig ist.
 */
export function validateContact(d) {
  const e = {};
  if (!d.name || d.name.length < 2) e.name = 'Bitte geben Sie Ihren Namen an.';
  if (!d.email) e.email = 'Bitte geben Sie Ihre E-Mail-Adresse an.';
  else if (!EMAIL_RE.test(d.email)) e.email = 'Bitte prüfen Sie die E-Mail-Adresse (z. B. name@beispiel.de).';
  if (d.phone && !PHONE_RE.test(d.phone)) e.phone = 'Bitte geben Sie eine gültige Telefonnummer an oder lassen Sie das Feld leer.';
  if (!d.subject) e.subject = 'Bitte wählen Sie einen Betreff.';
  else if (!SUBJECTS.includes(d.subject)) e.subject = 'Bitte wählen Sie einen Betreff aus der Liste.';
  if (d.vehicle && !/^[a-z0-9-]{1,160}$/.test(d.vehicle)) e.vehicle = 'Der Fahrzeugbezug ist ungültig.';
  if (!d.message) e.message = 'Bitte schreiben Sie uns eine Nachricht.';
  else if (d.message.length < LIMITS.messageMin) e.message = `Bitte schreiben Sie mindestens ${LIMITS.messageMin} Zeichen.`;
  return e;
}
