// Kontaktseite: Fahrzeugbezug aus der URL übernehmen, Formular prüfen und senden.
//
// Erfolg wird ausschließlich angezeigt, wenn der Server den Versand mit
// HTTP 2xx und { ok: true } bestätigt. Im Vorschaumodus wird nichts gesendet.
import { cleanInput, validateContact } from './contact-validation.js';

const indexEl = document.getElementById('vehicle-index');
const vehicles = indexEl ? JSON.parse(indexEl.textContent) : {};
const card = document.querySelector('[data-inquiry-vehicle]');
const form = document.querySelector('[data-contact-form]');
const phoneLink = document.querySelector('.contact-phone');
const phoneHref = phoneLink?.getAttribute('href') || '';
const phoneText = phoneLink?.textContent.trim() || '';

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderCard(slug) {
  const v = vehicles[slug];
  if (!card) return;
  if (!v) {
    card.hidden = true;
    card.replaceChildren();
    return;
  }
  const media = v.img
    ? `<img src="${esc(v.img)}" alt="" width="160" height="100">`
    : '<div class="img-placeholder" aria-hidden="true"></div>';
  card.innerHTML = `${media}<div>
<p class="inquiry-label">Ihre Anfrage bezieht sich auf</p>
<p class="inquiry-title">${esc(v.title)}</p>
<p class="inquiry-meta">Fahrzeugnummer ${esc(v.id)} · ${esc(v.price)}${v.demo ? ' · Beispieldaten' : ''}</p>
${form ? '' : '<p class="inquiry-meta">Bitte nennen Sie bei Ihrem Anruf die Fahrzeugnummer.</p>'}
<div class="inquiry-actions"><a href="${esc(v.url)}">Zum Fahrzeug</a>${form ? '<button type="button" data-clear-vehicle>Fahrzeugbezug entfernen</button>' : ''}</div>
</div>`;
  card.hidden = false;
  card.querySelector('[data-clear-vehicle]')?.addEventListener('click', () => {
    form.elements.vehicle.value = '';
    renderCard('');
    form.elements.vehicle.focus();
  });
}

const preselected = new URLSearchParams(location.search).get('fahrzeug');
if (preselected && vehicles[preselected]) renderCard(preselected);

if (form) {
  const f = form.elements;
  const summary = form.querySelector('[data-form-summary]');
  const status = form.querySelector('[data-form-status]');
  const submit = form.querySelector('[data-submit]');
  const submitLabel = form.querySelector('[data-submit-label]');
  const mode = form.dataset.mode;
  const fieldIds = { name: 'c-name', email: 'c-email', phone: 'c-phone', subject: 'c-subject', vehicle: 'c-vehicle', message: 'c-message' };
  const labels = { name: 'Name', email: 'E-Mail-Adresse', phone: 'Telefonnummer', subject: 'Betreff', vehicle: 'Fahrzeugbezug', message: 'Nachricht' };

  form.querySelector('[data-started-at]').value = String(Date.now());

  if (preselected && vehicles[preselected]) {
    f.vehicle.value = preselected;
    f.subject.value = 'Fahrzeuganfrage';
    if (!f.message.value) f.message.value = `Guten Tag,\n\nich interessiere mich für den ${vehicles[preselected].title} (Fahrzeugnummer ${vehicles[preselected].id}). Bitte kontaktieren Sie mich.\n`;
  }
  f.vehicle.addEventListener('change', () => renderCard(f.vehicle.value));

  const data = () => cleanInput(Object.fromEntries(new FormData(form)));

  function showErrors(errors, { focus = true } = {}) {
    for (const name of Object.keys(fieldIds)) {
      const input = f[name];
      const errEl = form.querySelector(`[data-error-for="${name}"]`);
      const msg = errors[name];
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (errEl) {
        errEl.textContent = msg || '';
        errEl.hidden = !msg;
      }
    }
    const keys = Object.keys(errors);
    if (!keys.length) {
      summary.hidden = true;
      return;
    }
    summary.innerHTML = `<strong>Bitte prüfen Sie ${keys.length === 1 ? 'das markierte Feld' : `die ${keys.length} markierten Felder`}:</strong><ul>${keys.map(k => `<li><a href="#${fieldIds[k]}">${labels[k]}: ${esc(errors[k])}</a></li>`).join('')}</ul>`;
    summary.hidden = false;
    if (focus) summary.focus();
  }

  // Bereits markierte Felder während der Eingabe erneut prüfen. (Nicht beim
  // Verlassen des Feldes: das Ausblenden der Meldung würde den Absende-Button
  // verschieben, während er angeklickt wird.)
  function recheck(e) {
    const name = e.target.name;
    if (!fieldIds[name] || e.target.getAttribute('aria-invalid') !== 'true') return;
    const errors = validateContact(data());
    if (errors[name]) return;
    const errEl = form.querySelector(`[data-error-for="${name}"]`);
    e.target.setAttribute('aria-invalid', 'false');
    errEl.textContent = '';
    errEl.hidden = true;
  }
  form.addEventListener('input', recheck);
  form.addEventListener('change', recheck);

  summary.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    e.preventDefault();
    document.querySelector(a.getAttribute('href'))?.focus();
  });

  function setStatus(type, htmlText) {
    status.className = 'form-status' + (type ? ' is-' + type : '');
    status.innerHTML = htmlText;
  }

  const phoneHint = phoneHref ? ` Bitte rufen Sie uns an: <a href="${esc(phoneHref)}">${esc(phoneText)}</a>.` : '';

  form.addEventListener('submit', async e => {
    e.preventDefault();
    setStatus('', '');
    const d = data();
    const errors = validateContact(d);
    showErrors(errors);
    if (Object.keys(errors).length) return;

    if (mode !== 'live') {
      setStatus('info', `<strong>Nicht gesendet:</strong> Das Formular ist in dieser Vorschau noch nicht angeschlossen. Ihre Eingaben sind gültig, wurden aber nicht übertragen.${phoneHint}`);
      return;
    }

    submit.disabled = true;
    submitLabel.textContent = 'Wird gesendet …';
    try {
      const res = await fetch(form.dataset.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...d, website: f.website.value, startedAt: f.startedAt.value })
      });
      let body = null;
      try { body = await res.json(); } catch { body = null; }

      if (res.ok && body && body.ok === true) {
        const success = document.createElement('div');
        success.className = 'form-success';
        success.setAttribute('role', 'status');
        success.tabIndex = -1;
        success.innerHTML = `<h3><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>Vielen Dank, ${esc(d.name)}!</h3><p>Ihre Nachricht wurde erfolgreich an FineCars Görlitz gesendet. Wir melden uns bei Ihnen.</p><p>Haben Sie es eilig?${phoneHint.replace(' Bitte rufen Sie uns an:', ' Rufen Sie uns an:')}</p>`;
        form.replaceWith(success);
        success.focus();
        return;
      }
      if (res.status === 400 && body?.errors) {
        showErrors(body.errors);
        setStatus('error', esc(body.error || 'Bitte prüfen Sie Ihre Eingaben.'));
      } else if (body?.code === 'not_configured') {
        setStatus('error', `<strong>Die Nachricht wurde nicht gesendet.</strong> Der E-Mail-Versand ist noch nicht eingerichtet.${phoneHint}`);
      } else {
        setStatus('error', `<strong>Die Nachricht wurde nicht gesendet.</strong> ${esc(body?.error || 'Bitte versuchen Sie es später erneut.')}${phoneHint}`);
      }
    } catch {
      setStatus('error', `<strong>Die Nachricht wurde nicht gesendet.</strong> Es besteht keine Verbindung zum Server.${phoneHint}`);
    } finally {
      if (submit.isConnected) {
        submit.disabled = false;
        submitLabel.textContent = 'Anfrage senden';
      }
    }
  });
}
