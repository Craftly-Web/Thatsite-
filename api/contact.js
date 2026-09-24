// Vercel-Funktion: nimmt das Kontaktformular entgegen und verschickt es über Resend.
// Benötigte Umgebungsvariablen (Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY  – API-Schlüssel aus dem Resend-Dashboard (Pflicht)
//   CONTACT_TO      – Empfänger, Standard: thatsite@mail.de
//   CONTACT_FROM    – Absender; muss eine in Resend verifizierte Domain nutzen,
//                     z. B. "Thatsite! Website <formular@thatsite.de>".
//                     Ohne verifizierte Domain: "Thatsite! <onboarding@resend.dev>"
//                     (Resend liefert dann nur an die E-Mail-Adresse deines Resend-Kontos).

const LIMITS = { name: 120, email: 200, paket: 80, code: 40, nachricht: 5000 };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Nur POST erlaubt.' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  // Spam-Falle: ein für Menschen unsichtbares Feld, das Bots ausfüllen
  if (body.website) return res.status(200).json({ ok: true });

  const d = {};
  for (const [k, max] of Object.entries(LIMITS)) d[k] = String(body[k] || '').trim().slice(0, max);

  if (!d.name || !d.nachricht || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) {
    return res.status(400).json({ ok: false, error: 'Bitte fülle Name, eine gültige E-Mail-Adresse und deine Nachricht aus.' });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(500).json({ ok: false, error: 'E-Mail-Versand ist noch nicht eingerichtet.' });

  const subject = 'Projektanfrage' + (d.paket ? ' – ' + d.paket : '') + ' – ' + d.name;
  const rows = [['Name', d.name], ['E-Mail', d.email], ['Paket / Thema', d.paket || '–'], ['Rabattcode', d.code || '–']];
  const html =
    '<div style="font-family:Arial,sans-serif;font-size:15px;color:#111">' +
    '<h2 style="margin:0 0 16px">Neue Anfrage über thatsite.de</h2>' +
    '<table style="border-collapse:collapse">' +
    rows.map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#666">${k}</td><td style="padding:4px 0"><b>${esc(v)}</b></td></tr>`).join('') +
    '</table><h3 style="margin:24px 0 8px">Nachricht</h3>' +
    `<p style="white-space:pre-wrap;line-height:1.6">${esc(d.nachricht)}</p></div>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + '\n\n' + d.nachricht;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM || 'Thatsite! Website <onboarding@resend.dev>',
        to: [process.env.CONTACT_TO || 'thatsite@mail.de'],
        reply_to: d.email,
        subject, html, text
      })
    });
    if (!r.ok) {
      console.error('Resend-Fehler', r.status, await r.text());
      return res.status(502).json({ ok: false, error: 'Die Nachricht konnte gerade nicht gesendet werden.' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Resend nicht erreichbar', err);
    return res.status(502).json({ ok: false, error: 'Die Nachricht konnte gerade nicht gesendet werden.' });
  }
};
