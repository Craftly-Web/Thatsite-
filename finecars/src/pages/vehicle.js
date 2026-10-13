import { html, raw } from '../lib/html.js';
import { page, absUrl } from '../templates/layout.js';
import { icon } from '../templates/icons.js';
import { breadcrumbs, breadcrumbJsonLd, priceBlock, badges, vehicleCard, imagePlaceholder, vehicleImage } from '../templates/components.js';
import { formatMileage, formatMonth, formatPower, formatInt, formatPrice } from '../lib/format.js';
import { similarVehicles } from '../lib/vehicles.js';

/** Alle technischen Daten; fehlende Werte erscheinen als "Keine Angabe". */
function techData(v) {
  const na = 'Keine Angabe';
  return [
    ['Marke', v.make],
    ['Modell', v.model],
    ['Variante', v.variant],
    ['Fahrzeugtyp', v.bodyType],
    ['Erstzulassung', formatMonth(v.firstRegistration)],
    ['Kilometerstand', formatMileage(v.mileage)],
    ['Kraftstoff', v.fuel],
    ['Leistung', formatPower(v.powerKw)],
    ['Getriebe', v.transmission],
    ['Farbe', v.color],
    ['Türen', formatInt(v.doors)],
    ['Sitzplätze', formatInt(v.seats)],
    ['Vorbesitzer', formatInt(v.previousOwners)],
    ['HU/AU bis', formatMonth(v.huAu)],
    ['Schadstoffklasse', v.emissionClass]
  ].map(([label, value]) => ({ label, value: value ?? na, missing: value === null || value === undefined }));
}

function gallery(v, ctx) {
  if (!v.images.length) {
    return html`<div class="gallery gallery-empty">${imagePlaceholder('Für dieses Fahrzeug liegen noch keine Bilder vor')}</div>`;
  }
  const many = v.images.length > 1;
  return html`<div class="gallery" data-gallery>
<div class="gallery-stage">
<button type="button" class="gallery-main" data-gallery-open aria-label="Bild ${1} von ${v.images.length} vergrößern">
${v.images.map((img, i) => html`<div class="gallery-slide${i === 0 ? ' is-active' : ''}" data-slide="${i}"${i === 0 ? '' : raw(' hidden')}>${vehicleImage(img, { lazy: i > 0, priority: i === 0, sizes: '(min-width: 1100px) 760px, 100vw' })}</div>`)}
<span class="gallery-zoom" aria-hidden="true">${icon('expand', { size: 18 })}</span>
</button>
${many ? html`<button type="button" class="gallery-nav gallery-prev" data-gallery-prev aria-label="Vorheriges Bild">${icon('chevronLeft', { size: 22 })}</button>
<button type="button" class="gallery-nav gallery-next" data-gallery-next aria-label="Nächstes Bild">${icon('chevronRight', { size: 22 })}</button>
<p class="gallery-counter" aria-live="polite"><span data-gallery-index>1</span> / ${v.images.length}</p>` : ''}
${badges(v, ctx)}
</div>
${many ? html`<ul class="gallery-thumbs" aria-label="Bildauswahl">
${v.images.map((img, i) => html`<li><button type="button" class="gallery-thumb${i === 0 ? ' is-active' : ''}" data-thumb="${i}" aria-label="Bild ${i + 1} anzeigen"${i === 0 ? raw(' aria-current="true"') : ''}><img src="${img.src}" width="${img.width}" height="${img.height}" alt="" loading="lazy" decoding="async"></button></li>`)}
</ul>` : ''}
${v.images.some(i => i.isIllustration) ? html`<p class="gallery-caption">${icon('info', { size: 14 })} Illustration – kein Foto des tatsächlichen Fahrzeugs.</p>` : ''}
</div>
<dialog class="lightbox" data-lightbox aria-label="Bildansicht ${v.fullTitle}">
<div class="lightbox-inner">
<button type="button" class="lightbox-close icon-btn" data-lightbox-close aria-label="Bildansicht schließen">${icon('close', { size: 26 })}</button>
<figure class="lightbox-figure"><img data-lightbox-img src="${v.images[0].src}" width="${v.images[0].width}" height="${v.images[0].height}" alt="${v.images[0].alt}"><figcaption data-lightbox-caption>${v.images[0].alt}</figcaption></figure>
${many ? html`<button type="button" class="lightbox-nav lightbox-prev icon-btn" data-lightbox-prev aria-label="Vorheriges Bild">${icon('chevronLeft', { size: 30 })}</button>
<button type="button" class="lightbox-nav lightbox-next icon-btn" data-lightbox-next aria-label="Nächstes Bild">${icon('chevronRight', { size: 30 })}</button>` : ''}
</div>
</dialog>
<script type="application/json" data-gallery-images>${raw(JSON.stringify(v.images.map(i => ({ src: i.src, srcset: i.srcset, alt: i.alt, width: i.width, height: i.height }))).replace(/</g, '\\u003c'))}</script>`;
}

function contactBox(v, ctx) {
  const c = ctx.config.company;
  const inquiry = `/kontakt/?fahrzeug=${encodeURIComponent(v.slug)}`;
  return html`<aside class="contact-box" aria-labelledby="contact-box-title">
<h2 id="contact-box-title" class="contact-box-title">Interesse an diesem Fahrzeug?</h2>
<p>Rufen Sie uns an oder senden Sie eine Anfrage. Besichtigung und Probefahrt vereinbaren wir gern individuell mit Ihnen.</p>
<a class="btn btn-dark btn-block btn-lg" href="${c.phoneHref}">${icon('phone', { size: 20 })} ${c.phone}</a>
<a class="btn btn-outline btn-block" href="${inquiry}">${icon('chat', { size: 18 })} Fahrzeug anfragen</a>
${v.mobileDeUrl ? html`<a class="link-arrow contact-box-link" href="${v.mobileDeUrl}" target="_blank" rel="noopener noreferrer">Inserat auf mobile.de ansehen ${icon('external', { size: 16 })}<span class="visually-hidden"> (öffnet in neuem Tab)</span></a>` : ''}
<p class="contact-box-ref">Fahrzeugnummer: <strong>${v.id}</strong></p>
</aside>`;
}

function vehicleJsonLd(v, ctx) {
  // Strukturierte Angebotsdaten nur für echte Fahrzeuge mit Preis außerhalb
  // des Demomodus – Beispieldaten dürfen nicht als Angebot markiert werden.
  if (ctx.config.demoMode || v.isDemo || !v.price || !ctx.config.siteUrl) return null;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: v.fullTitle,
    brand: { '@type': 'Brand', name: v.make },
    model: v.model,
    url: absUrl(ctx, v.url),
    offers: {
      '@type': 'Offer',
      price: v.price,
      priceCurrency: 'EUR',
      itemCondition: 'https://schema.org/UsedCondition',
      availability: v.status === 'reserved' ? 'https://schema.org/LimitedAvailability' : 'https://schema.org/InStock',
      seller: { '@id': ctx.config.siteUrl + '/#haendler' }
    }
  };
  if (v.images.length && !v.images[0].isIllustration) data.image = v.images.map(i => absUrl(ctx, i.src));
  if (v.mileage !== null) data.mileageFromOdometer = { '@type': 'QuantitativeValue', value: v.mileage, unitCode: 'KMT' };
  if (v.firstRegistration) data.dateVehicleFirstRegistered = v.firstRegistration;
  if (v.fuel) data.fuelType = v.fuel;
  if (v.transmission) data.vehicleTransmission = v.transmission;
  if (v.color) data.color = v.color;
  if (v.bodyType) data.bodyType = v.bodyType;
  if (v.powerKw) data.vehicleEngine = { '@type': 'EngineSpecification', enginePower: { '@type': 'QuantitativeValue', value: v.powerKw, unitCode: 'KWT' } };
  return data;
}

export default function vehicle(v, ctx) {
  const crumbs = [
    { label: 'Startseite', href: '/' },
    { label: 'Fahrzeuge', href: '/fahrzeuge/' },
    { label: v.fullTitle, href: v.url }
  ];
  const data = techData(v);
  const similar = similarVehicles(v, ctx.vehicles);
  const c = ctx.config.company;
  const price = formatPrice(v.price);
  const facts = [formatMonth(v.firstRegistration) && `EZ ${formatMonth(v.firstRegistration)}`, formatMileage(v.mileage), v.fuel, v.powerPs && `${v.powerPs} PS`].filter(Boolean);
  const descParts = [v.fullTitle, ...facts, price ? `Preis ${price.replace('\u00a0', ' ')}` : 'Preis auf Anfrage'];

  const body = html`<div class="detail-top">
<div class="container">
${breadcrumbs(crumbs)}
</div>
</div>
<article class="detail" aria-labelledby="vehicle-title">
<div class="container">
${v.isDemo ? html`<p class="demo-note demo-note-strong">${icon('info', { size: 16 })} Dieses Fahrzeug ist ein Beispieldatensatz und kein reales Angebot.</p>` : ''}
<header class="detail-head">
<div>
<p class="eyebrow">${v.bodyType || 'Gebrauchtwagen'}</p>
<h1 id="vehicle-title" class="detail-title">${v.title}${v.variant ? html` <span class="detail-variant">${v.variant}</span>` : ''}</h1>
${facts.length ? html`<p class="detail-facts">${facts.join(' · ')}</p>` : ''}
</div>
<div class="detail-price">
${priceBlock(v, { large: true })}
${v.status === 'reserved' ? html`<p class="detail-status">${icon('info', { size: 16 })} Dieses Fahrzeug ist derzeit reserviert.</p>` : ''}
</div>
</header>
<div class="detail-grid">
<div class="detail-main">
${gallery(v, ctx)}
<section class="detail-section" aria-labelledby="tech-title">
<h2 id="tech-title" class="detail-section-title">Technische Daten</h2>
<dl class="data-grid">
${data.map(d => html`<div class="${d.missing ? 'is-missing' : ''}"><dt>${d.label}</dt><dd>${d.value}</dd></div>`)}
</dl>
</section>
<section class="detail-section" aria-labelledby="desc-title">
<h2 id="desc-title" class="detail-section-title">Beschreibung</h2>
${v.description ? html`<div class="prose">${v.description.split(/\n{2,}/).map(p => html`<p>${p}</p>`)}</div>` : html`<p class="muted">Für dieses Fahrzeug liegt noch keine Beschreibung vor. Wir beantworten Ihre Fragen gern telefonisch.</p>`}
</section>
<section class="detail-section" aria-labelledby="features-title">
<h2 id="features-title" class="detail-section-title">Ausstattung</h2>
${v.features.length ? html`<ul class="feature-list">${v.features.map(f => html`<li>${icon('check', { size: 18 })}${f}</li>`)}</ul>` : html`<p class="muted">Die Ausstattungsliste wird ergänzt. Fragen Sie uns gern nach Details.</p>`}
</section>
<p class="detail-disclaimer">Alle Angaben ohne Gewähr. Irrtümer, Zwischenverkauf und Änderungen vorbehalten. Maßgeblich sind die Angaben im Kaufvertrag.</p>
</div>
<div class="detail-side">
${contactBox(v, ctx)}
</div>
</div>
</div>
</article>
${similar.length ? html`<section class="section section-paper" aria-labelledby="similar-title">
<div class="container">
<div class="section-head">
<div><p class="eyebrow">Weitere Angebote</p><h2 id="similar-title" class="section-title">Ähnliche Fahrzeuge</h2></div>
<a class="link-arrow" href="/fahrzeuge/">${icon('arrowLeft', { size: 18 })} Zurück zur Fahrzeugübersicht</a>
</div>
<div class="vehicle-grid">${similar.map(s => vehicleCard(s, ctx))}</div>
</div>
</section>` : html`<div class="container section-tight"><a class="link-arrow" href="/fahrzeuge/">${icon('arrowLeft', { size: 18 })} Zurück zur Fahrzeugübersicht</a></div>`}`;

  const mobileBar = html`<div class="mobile-contact-bar" data-mobile-bar>
<a class="btn btn-light" href="${c.phoneHref}">${icon('phone', { size: 18 })} Anrufen</a>
<a class="btn btn-ghost-light" href="/kontakt/?fahrzeug=${encodeURIComponent(v.slug)}">${icon('chat', { size: 18 })} Anfragen</a>
</div>`;

  const firstImg = v.images[0];
  return page(ctx, {
    path: v.url,
    title: `${v.fullTitle}${v.regYear ? ' (' + v.regYear + ')' : ''} – Gebrauchtwagen in Görlitz`,
    description: `${descParts.join(', ')}. Jetzt bei FineCars in Görlitz anfragen: ${c.phone}.`,
    bodyClass: 'page-detail has-mobile-bar',
    preloadImage: firstImg ? firstImg.src : null,
    jsonLd: [breadcrumbJsonLd(ctx, crumbs), vehicleJsonLd(v, ctx)].filter(Boolean),
    scripts: ['/assets/js/gallery.js'],
    body,
    afterMain: mobileBar
  });
}
