// Seitengerüst: <head>, Kopfbereich, Fußbereich.
import { html, raw, jsonScript } from '../lib/html.js';
import { icon } from './icons.js';

const NAV = [
  { href: '/fahrzeuge/', label: 'Fahrzeuge' },
  { href: '/ueber-uns/', label: 'Über uns' },
  { href: '/kontakt/', label: 'Kontakt' }
];

/** Vorschau-Kennzeichnung: Demomodus aktiv oder Beispieldaten im Bestand. */
export const isPreview = ctx => ctx.config.demoMode || ctx.meta.isDemo;

export const absUrl = (ctx, path) => (ctx.config.siteUrl ? ctx.config.siteUrl + path : null);

function logo(ctx, cls = '') {
  return raw(ctx.logoSvg.replace('<svg ', `<svg class="logo-svg ${cls}" aria-hidden="true" focusable="false" `));
}

function head(ctx, p) {
  const { config } = ctx;
  const brand = config.company.brand;
  const fullTitle = p.title.includes(brand) ? p.title : `${p.title} | ${brand}`;
  const canonical = p.noCanonical ? null : absUrl(ctx, p.path);
  const ogImage = absUrl(ctx, '/assets/img/og-image.png');
  // Vorschau oder Beispieldaten: nie indexieren
  const noindex = isPreview(ctx) || p.noindex;
  const v = ctx.assetVersion;
  return html`<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${fullTitle}</title>
<meta name="description" content="${p.description}">
<meta name="robots" content="${noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}">
${canonical ? html`<link rel="canonical" href="${canonical}">` : ''}
<meta name="theme-color" content="#111315">
<meta name="format-detection" content="telephone=no">
<meta property="og:type" content="website">
<meta property="og:locale" content="de_DE">
<meta property="og:site_name" content="${brand}">
<meta property="og:title" content="${fullTitle}">
<meta property="og:description" content="${p.description}">
${canonical ? html`<meta property="og:url" content="${canonical}">` : ''}
${ogImage ? html`<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${brand} – Gebrauchtwagen in Görlitz">` : ''}
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/img/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/manrope-latin-wght.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/inter-latin-wght.woff2" as="font" type="font/woff2" crossorigin>
${p.preloadImage ? html`<link rel="preload" href="${p.preloadImage}" as="image" fetchpriority="high">` : ''}
<link rel="stylesheet" href="/assets/css/site.css?v=${v}">
${(p.jsonLd || []).map(d => html`<script type="application/ld+json">${jsonScript(d)}</script>`)}
<script type="module" src="/assets/js/main.js?v=${v}"></script>
${(p.scripts || []).map(s => html`<script type="module" src="${s}?v=${v}"></script>`)}
</head>`;
}

function header(ctx, p) {
  const { config } = ctx;
  const c = config.company;
  const navItems = NAV.map(n => {
    const current = p.path === n.href || (n.href !== '/' && p.path.startsWith(n.href));
    return html`<li><a href="${n.href}"${current ? raw(' aria-current="page"') : ''}>${n.label}</a></li>`;
  });
  return html`<a class="skip-link" href="#inhalt">Zum Inhalt springen</a>
<header class="site-header" data-header>
${isPreview(ctx) ? html`<div class="demo-bar" role="note">${icon('info', { size: 16 })}<span class="demo-long"><strong>Vorschau</strong> mit Beispieldaten – die gezeigten Fahrzeuge sind keine realen Angebote.</span><span class="demo-short"><strong>Vorschau</strong> · Beispieldaten, keine realen Angebote</span></div>` : ''}
<div class="header-inner container">
<a class="brand" href="/" aria-label="${c.brand} – zur Startseite">${logo(ctx)}<span class="brand-place" aria-hidden="true">Görlitz</span></a>
<nav class="main-nav" aria-label="Hauptnavigation"><ul>${navItems}</ul></nav>
<div class="header-actions">
<a class="header-phone" href="${c.phoneHref}">${icon('phone', { size: 18 })}<span>${c.phone}</span></a>
<a class="btn btn-light btn-sm header-cta" href="/fahrzeuge/">Fahrzeuge entdecken</a>
<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" data-menu-toggle>
<span class="menu-toggle-open">${icon('menu', { size: 24 })}</span><span class="menu-toggle-close">${icon('close', { size: 24 })}</span><span class="visually-hidden" data-menu-label>Menü öffnen</span>
</button>
</div>
</div>
<div class="mobile-nav" id="mobile-nav" hidden data-mobile-nav>
<nav aria-label="Mobile Navigation" class="container">
<ul>${NAV.map(n => html`<li><a href="${n.href}"${p.path.startsWith(n.href) ? raw(' aria-current="page"') : ''}>${n.label}${icon('arrowRight', { size: 22 })}</a></li>`)}</ul>
<div class="mobile-nav-actions">
<a class="btn btn-light btn-block" href="/fahrzeuge/">Fahrzeuge entdecken</a>
<a class="btn btn-ghost-light btn-block" href="${c.phoneHref}">${icon('phone', { size: 18 })} ${c.phone}</a>
</div>
<p class="mobile-nav-address">${c.street} · ${c.zip} ${c.city}</p>
</nav>
</div>
</header>`;
}

function footer(ctx) {
  const { config } = ctx;
  const c = config.company;
  const year = new Date().getFullYear();
  return html`<footer class="site-footer">
<div class="container footer-grid">
<div class="footer-brand">
<a class="brand brand-footer" href="/" aria-label="${c.brand} – zur Startseite">${logo(ctx)}</a>
<p>Gebrauchtwagen in Görlitz. Aktuelle Fahrzeugangebote, persönliche Beratung und direkter Kontakt.</p>
</div>
<div>
<h2 class="footer-title">Navigation</h2>
<ul class="footer-links">
<li><a href="/">Startseite</a></li>
${NAV.map(n => html`<li><a href="${n.href}">${n.label}</a></li>`)}
</ul>
</div>
<div>
<h2 class="footer-title">Kontakt</h2>
<address class="footer-address">
<strong>${c.brand}</strong><br>
${c.street}<br>
${c.zip} ${c.city}
</address>
<ul class="footer-links">
<li><a href="${c.phoneHref}">${icon('phone', { size: 16 })} ${c.phone}</a></li>
<li><a href="${c.mapsUrl}" target="_blank" rel="noopener noreferrer">${icon('route', { size: 16 })} Route planen<span class="visually-hidden"> (öffnet Google Maps in neuem Tab)</span></a></li>
</ul>
</div>
<div>
<h2 class="footer-title">Mehr</h2>
<ul class="footer-links">
<li><a href="${c.mobileDeUrl}" target="_blank" rel="noopener noreferrer">FineCars auf mobile.de ${icon('external', { size: 14 })}<span class="visually-hidden"> (öffnet in neuem Tab)</span></a></li>
<li><a href="/impressum/">Impressum</a></li>
<li><a href="/datenschutz/">Datenschutz</a></li>
</ul>
</div>
</div>
<div class="container footer-bottom">
<p>© ${year} ${c.legalName}</p>
${isPreview(ctx) ? html`<p class="footer-demo">Vorschauversion · Fahrzeugdaten und -abbildungen sind Beispiele</p>` : ''}
</div>
</footer>`;
}

/**
 * Vollständige HTML-Seite.
 * @param {object} ctx  Build-Kontext (config, assetVersion, logoSvg, …)
 * @param {object} p    { title, description, path, body, bodyClass?, jsonLd?, scripts?, noindex?, afterMain? }
 */
export function page(ctx, p) {
  return '<!doctype html>\n' + html`<html lang="de">
${head(ctx, p)}
<body class="${p.bodyClass || ''}${isPreview(ctx) ? ' is-demo' : ''}">
${header(ctx, p)}
<main id="inhalt" tabindex="-1">
${p.body}
</main>
${footer(ctx)}
${p.afterMain || ''}
</body>
</html>
`.toString();
}
