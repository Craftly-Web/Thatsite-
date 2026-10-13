import { html, jsonScript } from '../lib/html.js';
import { page } from '../templates/layout.js';
import { icon } from '../templates/icons.js';
import { pageIntro, breadcrumbJsonLd, dealerJsonLd } from '../templates/components.js';
import { formatPrice } from '../lib/format.js';
import { SUBJECTS, LIMITS } from '../assets/js/contact-validation.js';

function field({ id, name, label, type = 'text', required = false, autocomplete, hint, attrs = '' }) {
  return html`<div class="field">
<label for="${id}">${label}${required ? html` <span class="req" aria-hidden="true">*</span>` : html` <span class="optional">(optional)</span>`}</label>
<input id="${id}" name="${name}" type="${type}"${required ? html` required aria-required="true"` : ''}${autocomplete ? html` autocomplete="${autocomplete}"` : ''} maxlength="${LIMITS[name]}" aria-describedby="${id}-error${hint ? ' ' + id + '-hint' : ''}" ${attrs}>
${hint ? html`<p class="field-hint" id="${id}-hint">${hint}</p>` : ''}
<p class="field-error" id="${id}-error" data-error-for="${name}" hidden></p>
</div>`;
}

function contactForm(ctx, mode) {
  const vehicles = ctx.vehicles;
  return html`<form class="contact-form" data-contact-form data-mode="${mode}" data-endpoint="${ctx.config.contactForm.endpoint}" novalidate>
${mode === 'preview' ? html`<div class="dev-notice" role="note">${icon('info', { size: 18 })}<div><strong>Vorschau – Formular nicht angeschlossen.</strong> Nachrichten werden in dieser Version nicht versendet. Die Eingabeprüfung kann getestet werden. Für Anfragen nutzen Sie bitte das Telefon.</div></div>` : ''}
<div class="form-summary" data-form-summary tabindex="-1" hidden></div>
<div class="form-grid">
${field({ id: 'c-name', name: 'name', label: 'Name', required: true, autocomplete: 'name' })}
${field({ id: 'c-email', name: 'email', label: 'E-Mail-Adresse', type: 'email', required: true, autocomplete: 'email', attrs: 'inputmode="email" spellcheck="false"' })}
${field({ id: 'c-phone', name: 'phone', label: 'Telefonnummer', type: 'tel', autocomplete: 'tel', hint: 'Für einen Rückruf, wenn Sie das bevorzugen.' })}
<div class="field">
<label for="c-subject">Betreff <span class="req" aria-hidden="true">*</span></label>
<div class="select-wrap"><select id="c-subject" name="subject" required aria-required="true" aria-describedby="c-subject-error">
<option value="">Bitte wählen</option>
${SUBJECTS.map(s => html`<option value="${s}">${s}</option>`)}
</select>${icon('chevronDown', { size: 18, cls: 'select-icon' })}</div>
<p class="field-error" id="c-subject-error" data-error-for="subject" hidden></p>
</div>
<div class="field field-full">
<label for="c-vehicle">Fahrzeugbezug <span class="optional">(optional)</span></label>
<div class="select-wrap"><select id="c-vehicle" name="vehicle" aria-describedby="c-vehicle-error">
<option value="">Kein bestimmtes Fahrzeug</option>
${vehicles.map(v => html`<option value="${v.slug}">${v.fullTitle} – Nr. ${v.id}</option>`)}
</select>${icon('chevronDown', { size: 18, cls: 'select-icon' })}</div>
<p class="field-error" id="c-vehicle-error" data-error-for="vehicle" hidden></p>
</div>
<div class="field field-full">
<label for="c-message">Nachricht <span class="req" aria-hidden="true">*</span></label>
<textarea id="c-message" name="message" rows="6" required aria-required="true" minlength="${LIMITS.messageMin}" maxlength="${LIMITS.message}" aria-describedby="c-message-error"></textarea>
<p class="field-error" id="c-message-error" data-error-for="message" hidden></p>
</div>
</div>
<div class="hp-field" aria-hidden="true">
<label for="c-website">Website (bitte leer lassen)</label>
<input id="c-website" name="website" type="text" tabindex="-1" autocomplete="off">
</div>
<input type="hidden" name="startedAt" data-started-at>
<p class="form-privacy">Mit dem Absenden werden Ihre Angaben zur Bearbeitung Ihrer Anfrage verwendet. Details finden Sie in der <a href="/datenschutz/">Datenschutzerklärung</a>. Pflichtfelder sind mit <span aria-hidden="true">*</span><span class="visually-hidden">Stern</span> gekennzeichnet.</p>
<div class="form-actions">
<button class="btn btn-dark btn-lg" type="submit" data-submit><span data-submit-label>Anfrage senden</span></button>
</div>
<div class="form-status" data-form-status role="status" aria-live="polite"></div>
</form>`;
}

export default function contact(ctx) {
  const { config } = ctx;
  const c = config.company;
  const mode = config.contactForm.enabled ? 'live' : config.demoMode ? 'preview' : 'off';
  const crumbs = [{ label: 'Startseite', href: '/' }, { label: 'Kontakt', href: '/kontakt/' }];
  const vehicleIndex = Object.fromEntries(ctx.vehicles.map(v => [v.slug, {
    id: v.id,
    title: v.fullTitle,
    url: v.url,
    price: formatPrice(v.price) || 'Preis auf Anfrage',
    img: v.images[0] ? v.images[0].src : null,
    demo: v.isDemo
  }]));

  const body = html`${pageIntro({
    eyebrow: 'Kontakt & Anfahrt',
    title: 'Sprechen Sie mit uns',
    lead: 'Sie interessieren sich für ein Fahrzeug oder haben eine Frage? Am schnellsten erreichen Sie uns telefonisch.',
    crumbs
  })}
<section class="section-tight contact" aria-label="Kontaktmöglichkeiten">
<div class="container contact-grid">
<div class="contact-info">
<div class="contact-card contact-card-phone">
<p class="contact-label">Telefon</p>
<a class="contact-phone" href="${c.phoneHref}">${icon('phone', { size: 26 })} ${c.phone}</a>
<p class="muted">Rufen Sie uns an – wir besprechen Ihr Anliegen direkt.</p>
</div>
<div class="contact-card">
<p class="contact-label">Adresse</p>
<address><strong>${c.legalName}</strong><br>${c.street}<br>${c.zip} ${c.city}</address>
<a class="btn btn-outline btn-sm" href="${c.mapsUrl}" target="_blank" rel="noopener noreferrer">${icon('route', { size: 16 })} Route planen<span class="visually-hidden"> (öffnet Google Maps in neuem Tab)</span></a>
</div>
<div class="contact-card">
<p class="contact-label">So läuft Ihre Anfrage ab</p>
<ol class="contact-steps">
<li>Sie nennen uns Ihr Wunschfahrzeug oder Ihr Anliegen.</li>
<li>Wir klären Ihre Fragen persönlich mit Ihnen.</li>
<li>Besichtigung oder Probefahrt vereinbaren wir individuell und vorab.</li>
</ol>
</div>
</div>
<div class="contact-main">
<div class="inquiry-vehicle" data-inquiry-vehicle hidden></div>
${mode === 'off'
    ? html`<div class="contact-card contact-phone-only">
<h2 class="contact-form-title">Anfrage per Telefon</h2>
<p>Für Fahrzeuganfragen, Besichtigungen und Probefahrten erreichen Sie uns telefonisch. Nennen Sie uns gern die Fahrzeugnummer aus dem Angebot.</p>
<a class="btn btn-dark btn-lg" href="${c.phoneHref}">${icon('phone', { size: 20 })} ${c.phone} anrufen</a>
</div>`
    : html`<h2 class="contact-form-title">Anfrage senden</h2>${contactForm(ctx, mode)}`}
</div>
</div>
</section>
<script type="application/json" id="vehicle-index">${jsonScript(vehicleIndex)}</script>`;

  return page(ctx, {
    path: '/kontakt/',
    title: 'Kontakt & Anfahrt – FineCars Görlitz',
    description: 'Kontakt zu FineCars Görlitz: Rothenburger Straße 27f, 02828 Görlitz. Telefon 03581 311715. Fahrzeuganfragen, Besichtigung und Probefahrt nach Absprache.',
    bodyClass: 'page-contact',
    jsonLd: [dealerJsonLd(ctx), breadcrumbJsonLd(ctx, crumbs)].filter(Boolean),
    scripts: ['/assets/js/contact-form.js'],
    body
  });
}
