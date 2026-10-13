// Vercel-Funktion: nimmt das Kontaktformular entgegen und versendet es per E-Mail (Resend).
//
// Benötigte Umgebungsvariablen (Vercel → Project → Settings → Environment Variables).
// Es gibt bewusst KEINE Standardwerte – fehlt eine Angabe, antwortet die
// Funktion mit 503 "not_configured" und das Formular meldet keinen Erfolg.
//   RESEND_API_KEY  API-Schlüssel aus dem Resend-Dashboard
//   CONTACT_TO      Empfängeradresse(n) von FineCars, mehrere mit Komma getrennt
//   CONTACT_FROM    Absender mit in Resend verifizierter Domain,
//                   z. B. "FineCars Website <formular@ihre-domain.de>"
// Optional:
//   SITE_URL        Basis-URL der Website; wird zusätzlich als erlaubte Herkunft geprüft

import { cleanInput, validateContact, MIN_FILL_MS } from '../src/assets/js/contact-validation.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const oneLine = s => String(s).replace(/[\r\n]+/g, ' ').trim();

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return null; }
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 64 * 1024) return null;
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { return null; }
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // manche Browser senden bei Same-Origin-POST keinen Origin-Header
  try {
    const o = new URL(origin);
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    if (o.host === host) return true;
    if (process.env.SITE_URL && o.origin === new URL(process.env.SITE_URL).origin) return true;
  } catch { /* ungültiger Origin */ }
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { ok: false, error: 'Nur POST ist erlaubt.' });
  }
  if (!sameOrigin(req)) return send(res, 403, { ok: false, error: 'Anfrage nicht erlaubt.' });

  const body = await readBody(req);
  if (!body || typeof body !== 'object') return send(res, 400, { ok: false, error: 'Ungültige Anfrage.' });

  // Spamschutz: verstecktes Feld und Mindestbearbeitungszeit.
  // Es wird KEIN Erfolg vorgetäuscht – die Anfrage wird abgelehnt.
  const startedAt = Number(body.startedAt);
  if (body.website || !Number.isFinite(startedAt) || Date.now() - startedAt < MIN_FILL_MS) {
    return send(res, 400, { ok: false, code: 'rejected', error: 'Die Anfrage konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut oder rufen Sie uns an.' });
  }

  const d = cleanInput(body);
  const errors = validateContact(d);
  if (Object.keys(errors).length) {
    return send(res, 400, { ok: false, error: 'Bitte prüfen Sie Ihre Eingaben.', errors });
  }

  const key = process.env.RESEND_API_KEY;
  const from = (process.env.CONTACT_FROM || '').trim();
  const to = (process.env.CONTACT_TO || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!key || !from || !to.length) {
    console.error('Kontaktformular: RESEND_API_KEY, CONTACT_FROM oder CONTACT_TO fehlt.');
    return send(res, 503, { ok: false, code: 'not_configured', error: 'Der E-Mail-Versand ist noch nicht eingerichtet.' });
  }

  const rows = [
    ['Name', d.name],
    ['E-Mail', d.email],
    ['Telefon', d.phone || '–'],
    ['Betreff', d.subject],
    ['Fahrzeug', d.vehicle || '–']
  ];
  const subject = oneLine(`Website-Anfrage: ${d.subject}${d.vehicle ? ' – ' + d.vehicle : ''} – ${d.name}`).slice(0, 200);
  const html =
    '<div style="font-family:Arial,sans-serif;font-size:15px;color:#111315">' +
    '<h2 style="margin:0 0 16px">Neue Anfrage über die FineCars-Website</h2>' +
    '<table style="border-collapse:collapse">' +
    rows.map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#5f666c">${k}</td><td style="padding:4px 0"><b>${esc(v)}</b></td></tr>`).join('') +
    '</table><h3 style="margin:24px 0 8px">Nachricht</h3>' +
    `<p style="white-space:pre-wrap;line-height:1.6">${esc(d.message)}</p></div>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + '\n\n' + d.message;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, reply_to: d.email, subject, html, text })
    });
    if (!r.ok) {
      console.error('Resend-Fehler', r.status, (await r.text()).slice(0, 500));
      return send(res, 502, { ok: false, code: 'send_failed', error: 'Die Nachricht konnte gerade nicht gesendet werden.' });
    }
    return send(res, 200, { ok: true });
  } catch (err) {
    console.error('Resend nicht erreichbar', err);
    return send(res, 502, { ok: false, code: 'send_failed', error: 'Die Nachricht konnte gerade nicht gesendet werden.' });
  }
}
