import { html } from '../lib/html.js';
import { page } from '../templates/layout.js';
import { icon } from '../templates/icons.js';
import { vehicleCard, ctaBand, dealerJsonLd } from '../templates/components.js';

const PRICE_STEPS = [10000, 15000, 20000, 25000, 30000, 40000, 50000];

function hero(ctx) {
  const c = ctx.config.company;
  const makes = [...new Set(ctx.vehicles.map(v => v.make))].sort((a, b) => a.localeCompare(b, 'de'));
  return html`<section class="hero" aria-labelledby="hero-title">
<div class="hero-art" aria-hidden="true">
<img src="/assets/img/hero-car.svg" width="1140" height="480" alt="" fetchpriority="high" decoding="async">
</div>
<div class="container hero-inner">
<p class="hero-location">${icon('pin', { size: 16 })} Görlitz · Sachsen</p>
<h1 id="hero-title" class="hero-title">Fahrzeuge, die zu Ihnen&nbsp;passen.</h1>
<p class="hero-lead">Entdecken Sie unsere aktuellen Fahrzeugangebote und nehmen Sie direkt Kontakt mit FineCars in Görlitz auf.</p>
<div class="hero-actions">
<a class="btn btn-light btn-lg" href="/fahrzeuge/">Fahrzeuge entdecken ${icon('arrowRight', { size: 20 })}</a>
<a class="btn btn-ghost-light btn-lg" href="/kontakt/">Kontakt aufnehmen</a>
</div>
<form class="quick-search" action="/fahrzeuge/" method="get" role="search" aria-label="Schnellsuche">
<div class="quick-field">
<label for="qs-make">Marke</label>
<select id="qs-make" name="make">
<option value="">Alle Marken</option>
${makes.map(m => html`<option value="${m}">${m}</option>`)}
</select>
</div>
<div class="quick-field">
<label for="qs-price">Preis bis</label>
<select id="qs-price" name="priceMax">
<option value="">Beliebig</option>
${PRICE_STEPS.map(p => html`<option value="${p}">${p.toLocaleString('de-DE')}&nbsp;€</option>`)}
</select>
</div>
<button class="btn btn-dark quick-submit" type="submit">${icon('search', { size: 18 })} Fahrzeuge anzeigen</button>
</form>
</div>
</section>`;
}

function trustBar(ctx) {
  const { company: c, reviews, showMobileDePresence } = ctx.config;
  const items = [
    { icon: 'pin', title: 'Standort Görlitz', text: `${c.street}, ${c.zip} ${c.city}` },
    { icon: 'phone', title: 'Direkter Kontakt', text: html`Telefonisch unter <a href="${c.phoneHref}">${c.phone}</a>` },
    { icon: 'list', title: 'Bestand auf mobile.de', text: html`Aktuelle Angebote auch im <a href="${c.mobileDeUrl}" target="_blank" rel="noopener noreferrer">Händlerprofil<span class="visually-hidden"> (öffnet in neuem Tab)</span></a>` }
  ];
  if (reviews.show && reviews.verifiedAt) {
    const d = new Date(reviews.verifiedAt).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    items.push({ icon: 'chat', title: `${reviews.rating.toLocaleString('de-DE')} von 5 Sternen`, text: html`Rund ${reviews.count.toLocaleString('de-DE')} Bewertungen auf <a href="${reviews.sourceUrl}" target="_blank" rel="noopener noreferrer">${reviews.source}</a> (Stand: ${d})` });
  } else if (showMobileDePresence) {
    items.push({ icon: 'calendar', title: 'Langjährig auf mobile.de', text: 'Seit vielen Jahren mit eigenem Händlerprofil vertreten' });
  }
  return html`<section class="trust" aria-label="Auf einen Blick">
<ul class="container trust-list">
${items.map(i => html`<li class="trust-item">${icon(i.icon, { size: 22 })}<div><p class="trust-title">${i.title}</p><p class="trust-text">${i.text}</p></div></li>`)}
</ul>
</section>`;
}

function highlights(ctx) {
  let list = ctx.vehicles.filter(v => v.featured && v.status === 'available');
  if (list.length < 3) list = [...list, ...ctx.vehicles.filter(v => !list.includes(v) && v.status === 'available')];
  list = list.slice(0, 3);
  if (!list.length) return '';
  return html`<section class="section" aria-labelledby="highlights-title">
<div class="container">
<div class="section-head">
<div>
<p class="eyebrow">Ausgewählte Fahrzeuge</p>
<h2 id="highlights-title" class="section-title">Aktuelle Highlights</h2>
</div>
<a class="link-arrow" href="/fahrzeuge/">Alle Fahrzeuge ansehen ${icon('arrowRight', { size: 18 })}</a>
</div>
${ctx.meta.isDemo ? html`<p class="demo-note">${icon('info', { size: 16 })} Beispielfahrzeuge zur Vorschau – keine realen Angebote.</p>` : ''}
<div class="vehicle-grid">${list.map(v => vehicleCard(v, ctx))}</div>
<div class="section-foot"><a class="btn btn-dark" href="/fahrzeuge/">Alle Fahrzeuge ansehen ${icon('arrowRight', { size: 18 })}</a></div>
</div>
</section>`;
}

function why() {
  const points = [
    { t: 'Persönlicher Kontakt', d: 'Sie sprechen direkt mit uns – telefonisch oder vor Ort in Görlitz. Fragen zu einem Fahrzeug klären wir im persönlichen Gespräch.' },
    { t: 'Übersichtliche Fahrzeuginformationen', d: 'Die wichtigsten Daten auf einen Blick: Erstzulassung, Kilometerstand, Kraftstoff, Leistung, Ausstattung und Preis.' },
    { t: 'Direkte Kontaktwege', d: 'Ein Anruf genügt. Zu jedem Fahrzeug erreichen Sie uns ohne Umwege – Ihre Anfrage bezieht sich automatisch auf das gewählte Angebot.' },
    { t: 'Standort in Görlitz', d: 'Sie finden uns in der Rothenburger Straße 27f. Besichtigungen und Probefahrten stimmen wir gern individuell mit Ihnen ab.' }
  ];
  return html`<section class="section section-paper" aria-labelledby="why-title">
<div class="container why">
<div class="why-intro">
<p class="eyebrow">Warum FineCars</p>
<h2 id="why-title" class="section-title">Ein Gebrauchtwagenhändler, den Sie direkt erreichen.</h2>
<p class="section-lead">FineCars Görlitz ist Ihr Ansprechpartner für Gebrauchtwagen in Görlitz und der Region. Wir setzen auf klare Informationen und den direkten Draht.</p>
<a class="link-arrow" href="/ueber-uns/">Mehr über FineCars ${icon('arrowRight', { size: 18 })}</a>
</div>
<ol class="why-list">
${points.map((p, i) => html`<li><span class="why-num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><div><h3>${p.t}</h3><p>${p.d}</p></div></li>`)}
</ol>
</div>
</section>`;
}

function steps() {
  const s = [
    { i: 'search', t: 'Fahrzeug entdecken', d: 'Stöbern Sie in unserem Bestand und filtern Sie nach Marke, Preis, Kilometerstand und mehr.' },
    { i: 'eye', t: 'Details ansehen', d: 'Technische Daten, Ausstattung und Bilder finden Sie auf der jeweiligen Fahrzeugseite.' },
    { i: 'phone', t: 'Kontakt aufnehmen', d: 'Rufen Sie uns an oder senden Sie eine Anfrage – das Fahrzeug ist dabei bereits ausgewählt.' },
    { i: 'calendar', t: 'Termin vereinbaren', d: 'Besichtigung oder Probefahrt stimmen wir individuell und nach vorheriger Absprache mit Ihnen ab.' }
  ];
  return html`<section class="section" aria-labelledby="steps-title">
<div class="container">
<div class="section-head section-head-center">
<div>
<p class="eyebrow">So einfach geht’s</p>
<h2 id="steps-title" class="section-title">In vier Schritten zum Fahrzeug</h2>
</div>
</div>
<ol class="steps">
${s.map((x, i) => html`<li class="step"><div class="step-icon">${icon(x.i, { size: 22 })}</div><p class="step-num">Schritt ${i + 1}</p><h3>${x.t}</h3><p>${x.d}</p></li>`)}
</ol>
</div>
</section>`;
}

export function locationSection(ctx, { headingLevel = 2 } = {}) {
  const c = ctx.config.company;
  return html`<section class="section section-dark location" aria-labelledby="location-title">
<div class="container location-grid">
<div>
<p class="eyebrow eyebrow-light">Standort</p>
${headingLevel === 2 ? html`<h2 id="location-title" class="section-title">Besuchen Sie uns in Görlitz</h2>` : html`<h3 id="location-title" class="section-title">Besuchen Sie uns in Görlitz</h3>`}
<address class="location-address">
<strong>${c.brand}</strong>
<span>${c.street}</span>
<span>${c.zip} ${c.city}</span>
</address>
<p class="location-note">Bitte vereinbaren Sie Besichtigungen und Probefahrten vorab telefonisch – so ist Ihr Wunschfahrzeug für Sie vorbereitet.</p>
<div class="location-actions">
<a class="btn btn-light" href="${c.mapsUrl}" target="_blank" rel="noopener noreferrer">${icon('route', { size: 18 })} Route planen<span class="visually-hidden"> (öffnet Google Maps in neuem Tab)</span></a>
<a class="btn btn-ghost-light" href="${c.phoneHref}">${icon('phone', { size: 18 })} ${c.phone}</a>
</div>
<p class="location-hint">Der Routenlink öffnet Google Maps. Erst beim Klick werden Daten an Google übertragen.</p>
</div>
<div class="location-visual" aria-hidden="true">
<div class="location-card">
<span class="location-pin">${icon('pin', { size: 28 })}</span>
<span class="location-city">Görlitz</span>
<span class="location-street">${c.street}</span>
</div>
</div>
</div>
</section>`;
}

export default function home(ctx) {
  return page(ctx, {
    path: '/',
    title: 'FineCars Görlitz – Gebrauchtwagen in Görlitz',
    description: 'FineCars Görlitz: Gebrauchtwagen in Görlitz entdecken. Aktuelle Fahrzeugangebote, technische Daten auf einen Blick und direkter Kontakt unter 03581 311715.',
    bodyClass: 'page-home',
    preloadImage: '/assets/img/hero-car.svg',
    jsonLd: [dealerJsonLd(ctx)],
    body: html`${hero(ctx)}${trustBar(ctx)}${highlights(ctx)}${why()}${steps()}${locationSection(ctx)}${ctaBand(ctx)}`
  });
}
