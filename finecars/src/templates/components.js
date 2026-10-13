// Wiederverwendbare Bausteine.
import { html, raw } from '../lib/html.js';
import { formatPrice, formatMileage, formatMonth, formatInt } from '../lib/format.js';
import { icon } from './icons.js';
import { absUrl } from './layout.js';

/** Kurzdaten eines Fahrzeugs – fehlende Werte werden ausgelassen. */
export function keySpecs(v) {
  return [
    { icon: 'calendar', label: 'Erstzulassung', value: formatMonth(v.firstRegistration) ? 'EZ ' + formatMonth(v.firstRegistration) : null },
    { icon: 'gauge', label: 'Kilometerstand', value: formatMileage(v.mileage) },
    { icon: 'fuel', label: 'Kraftstoff', value: v.fuel },
    { icon: 'bolt', label: 'Leistung', value: v.powerKw ? `${formatInt(v.powerKw)} kW (${formatInt(v.powerPs)} PS)` : null },
    { icon: 'gear', label: 'Getriebe', value: v.transmission }
  ].filter(s => s.value);
}

export function priceBlock(v, { large = false } = {}) {
  const price = formatPrice(v.price);
  return html`<p class="price${large ? ' price-lg' : ''}">${price
    ? html`<span class="price-value">${price}</span>${v.vatDeductible === true ? html`<span class="price-note">MwSt. ausweisbar</span>` : ''}`
    : html`<span class="price-value price-request">Preis auf Anfrage</span>`}</p>`;
}

export function badges(v, ctx) {
  const out = [];
  if (v.status === 'reserved') out.push(html`<span class="badge badge-reserved">Reserviert</span>`);
  if (v.isDemo) out.push(html`<span class="badge badge-demo">Beispiel</span>`);
  return out.length ? html`<div class="badges">${out}</div>` : '';
}

export function imagePlaceholder(label = 'Fahrzeugbilder folgen') {
  return html`<div class="img-placeholder" role="img" aria-label="${label}">${icon('car', { size: 44 })}<span>${label}</span></div>`;
}

export function vehicleImage(img, { lazy = true, sizes = '(min-width: 1100px) 400px, (min-width: 700px) 50vw, 100vw', priority = false } = {}) {
  return html`<img src="${img.src}"${img.srcset ? html` srcset="${img.srcset}" sizes="${sizes}"` : ''} width="${img.width}" height="${img.height}" alt="${img.alt}" ${raw(lazy && !priority ? 'loading="lazy"' : '')} decoding="async"${priority ? raw(' fetchpriority="high"') : ''}>`;
}

/** Fahrzeugkarte für Übersicht, Highlights und ähnliche Fahrzeuge. */
export function vehicleCard(v, ctx, { level = 3, lazy = true } = {}) {
  const H = `h${level}`;
  const specs = keySpecs(v);
  return html`<article class="vehicle-card" data-vehicle-id="${v.id}">
<div class="vehicle-card-media">
${v.images[0] ? vehicleImage(v.images[0], { lazy }) : imagePlaceholder()}
${badges(v, ctx)}
</div>
<div class="vehicle-card-body">
${raw(`<${H} class="vehicle-card-title">`)}<a href="${v.url}" class="stretched-link">${v.title}</a>${raw(`</${H}>`)}
<p class="vehicle-card-variant">${v.variant || v.bodyType || ' '}</p>
${priceBlock(v)}
${specs.length ? html`<ul class="spec-chips" aria-label="Fahrzeugdaten">${specs.map(s => html`<li><span class="visually-hidden">${s.label}: </span>${icon(s.icon, { size: 16 })}${s.value}</li>`)}</ul>` : ''}
<span class="vehicle-card-cta" aria-hidden="true">Fahrzeug ansehen ${icon('arrowRight', { size: 18 })}</span>
</div>
</article>`;
}

/** Brotkrumen-Navigation + passende strukturierte Daten. */
export function breadcrumbs(items) {
  return html`<nav class="breadcrumbs" aria-label="Brotkrumen"><ol>${items.map((it, i) => {
    const last = i === items.length - 1;
    return html`<li>${last ? html`<span aria-current="page">${it.label}</span>` : html`<a href="${it.href}">${it.label}</a>`}</li>`;
  })}</ol></nav>`;
}

export function breadcrumbJsonLd(ctx, items) {
  if (!ctx.config.siteUrl) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.label,
      item: absUrl(ctx, it.href)
    }))
  };
}

/** Dunkler Seitenkopf für Unterseiten. */
export function pageIntro({ eyebrow, title, lead, crumbs, aside }) {
  return html`<section class="page-intro">
<div class="container page-intro-inner">
${crumbs ? breadcrumbs(crumbs) : ''}
<div class="page-intro-grid">
<div>
${eyebrow ? html`<p class="eyebrow eyebrow-light">${eyebrow}</p>` : ''}
<h1 class="page-title">${title}</h1>
${lead ? html`<p class="page-lead">${lead}</p>` : ''}
</div>
${aside || ''}
</div>
</div>
</section>`;
}

/** Abschluss-Band mit Handlungsaufforderung. */
export function ctaBand(ctx, { title = 'Sie haben Ihr nächstes Fahrzeug gefunden?', text = 'Kontaktieren Sie FineCars in Görlitz und besprechen Sie die nächsten Schritte direkt.' } = {}) {
  const c = ctx.config.company;
  return html`<section class="cta-band" aria-labelledby="cta-title">
<div class="container cta-band-inner">
<div>
<h2 id="cta-title" class="cta-title">${title}</h2>
<p class="cta-text">${text}</p>
</div>
<div class="cta-actions">
<a class="btn btn-light" href="${c.phoneHref}">${icon('phone', { size: 18 })} Jetzt anrufen</a>
<a class="btn btn-ghost-light" href="/fahrzeuge/">Fahrzeuge entdecken ${icon('arrowRight', { size: 18 })}</a>
</div>
</div>
</section>`;
}

/** Organisation als strukturierte Daten – nur belegte Angaben. */
export function dealerJsonLd(ctx) {
  const { company: c, siteUrl } = ctx.config;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: c.brand,
    legalName: c.legalName,
    telephone: c.phoneIntl,
    address: {
      '@type': 'PostalAddress',
      streetAddress: c.street,
      postalCode: c.zip,
      addressLocality: c.city,
      addressRegion: c.region,
      addressCountry: c.country
    },
    sameAs: [c.mobileDeUrl]
  };
  if (siteUrl) {
    data['@id'] = siteUrl + '/#haendler';
    data.url = siteUrl + '/';
    data.image = siteUrl + '/assets/img/og-image.png';
    data.logo = siteUrl + '/assets/img/logo-finecars.png';
  }
  if (c.email) data.email = c.email;
  return data;
}
