import { html, jsonScript } from '../lib/html.js';
import { page } from '../templates/layout.js';
import { icon } from '../templates/icons.js';
import { vehicleCard, pageIntro, ctaBand, breadcrumbJsonLd } from '../templates/components.js';
import { toClientRecord } from '../lib/vehicles.js';
import { SORTS, facetOptions, DEFAULT_FILTERS } from '../assets/js/inventory-core.js';

const PRICE_STEPS = [5000, 7500, 10000, 12500, 15000, 20000, 25000, 30000, 35000, 40000, 50000, 75000];
const KM_STEPS = [10000, 25000, 50000, 75000, 100000, 125000, 150000, 200000];
const PS_STEPS = [75, 100, 125, 150, 200, 250, 300];
const de = n => n.toLocaleString('de-DE');

const select = (id, name, label, options, placeholder) => html`<div class="field">
<label for="${id}">${label}</label>
<div class="select-wrap"><select id="${id}" name="${name}">
<option value="">${placeholder}</option>
${options.map(o => html`<option value="${o.value}">${o.label}</option>`)}
</select>${icon('chevronDown', { size: 18, cls: 'select-icon' })}</div>
</div>`;

export default function inventory(ctx) {
  const { vehicles, config } = ctx;
  const records = vehicles.map(toClientRecord);
  const facets = facetOptions(records, DEFAULT_FILTERS);
  const years = [...new Set(records.map(r => r.year).filter(Boolean))].sort((a, b) => b - a);
  const crumbs = [{ label: 'Startseite', href: '/' }, { label: 'Fahrzeuge', href: '/fahrzeuge/' }];
  const count = vehicles.length;
  const c = config.company;

  const body = html`${pageIntro({
    eyebrow: 'Fahrzeugbestand',
    title: 'Gebrauchtwagen in Görlitz',
    lead: 'Finden Sie Ihr passendes Fahrzeug: Filtern Sie nach Marke, Preis, Erstzulassung, Kilometerstand und weiteren Merkmalen.',
    crumbs
  })}
<section class="inventory section-tight" aria-label="Fahrzeugsuche">
<div class="container">
${ctx.meta.isDemo ? html`<p class="demo-note">${icon('info', { size: 16 })} Diese Übersicht enthält Beispieldaten zur Vorschau. Die Fahrzeuge, Preise und Angaben sind keine realen Angebote.</p>` : ''}
<form id="filter-form" class="inventory-layout" action="/fahrzeuge/" method="get" data-filter-form novalidate>
<aside class="filters" id="filters" aria-labelledby="filters-title" data-filters>
<div class="filters-head">
<h2 id="filters-title" class="filters-title">${icon('filter', { size: 20 })} Filter</h2>
<button type="button" class="icon-btn filters-close" data-filters-close aria-label="Filter schließen">${icon('close', { size: 22 })}</button>
</div>
<div class="filters-body">
${select('f-make', 'make', 'Marke', facets.makes.map(m => ({ value: m, label: m })), 'Alle Marken')}
${select('f-model', 'model', 'Modell', facets.models.map(m => ({ value: m, label: m })), 'Alle Modelle')}
<fieldset class="field-pair">
<legend>Preis</legend>
${select('f-price-min', 'priceMin', 'Preis von', PRICE_STEPS.map(p => ({ value: p, label: `ab ${de(p)} €` })), 'Preis ab')}
${select('f-price-max', 'priceMax', 'Preis bis', PRICE_STEPS.map(p => ({ value: p, label: `bis ${de(p)} €` })), 'Preis bis')}
</fieldset>
${select('f-year', 'yearMin', 'Erstzulassung ab', years.map(y => ({ value: y, label: `ab ${y}` })), 'Beliebig')}
${select('f-km', 'kmMax', 'Kilometerstand bis', KM_STEPS.map(k => ({ value: k, label: `bis ${de(k)} km` })), 'Beliebig')}
${select('f-fuel', 'fuel', 'Kraftstoff', facets.fuels.map(f => ({ value: f, label: f })), 'Alle')}
${select('f-gear', 'gear', 'Getriebe', facets.gears.map(g => ({ value: g, label: g })), 'Alle')}
${select('f-ps', 'psMin', 'Leistung ab', PS_STEPS.map(p => ({ value: p, label: `ab ${p} PS (${Math.round(p / 1.35962)} kW)` })), 'Beliebig')}
</div>
<div class="filters-foot">
<button type="reset" class="btn btn-outline btn-block" data-reset>Filter zurücksetzen</button>
<button type="button" class="btn btn-dark btn-block filters-apply" data-filters-close><span data-apply-label>${count} Fahrzeuge anzeigen</span></button>
</div>
</aside>
<div class="filters-backdrop" data-filters-close hidden></div>

<div class="results">
<div class="results-toolbar">
<div class="search-field">
<label for="f-q" class="visually-hidden">Fahrzeuge durchsuchen</label>
${icon('search', { size: 18, cls: 'search-icon' })}
<input id="f-q" name="q" type="search" placeholder="Suche, z. B. Kombi, Automatik, Navi …" autocomplete="off" enterkeyhint="search">
</div>
<div class="toolbar-row">
<button type="button" class="btn btn-outline filters-open" data-filters-open aria-controls="filters" aria-expanded="false">${icon('filter', { size: 18 })} Filter<span class="filter-count" data-filter-count hidden></span></button>
<div class="field field-inline">
<label for="f-sort">Sortieren</label>
<div class="select-wrap"><select id="f-sort" name="sort">
${Object.entries(SORTS).map(([value, label]) => html`<option value="${value}">${label}</option>`)}
</select>${icon('chevronDown', { size: 18, cls: 'select-icon' })}</div>
</div>
</div>
</div>
<div class="results-meta">
<p class="result-count" data-count aria-live="polite" aria-atomic="true"><strong>${count}</strong> ${count === 1 ? 'Fahrzeug' : 'Fahrzeuge'}</p>
<ul class="active-filters" data-active-filters aria-label="Aktive Filter"></ul>
</div>
<noscript><p class="notice">Für Suche, Filter und Sortierung wird JavaScript benötigt. Alle Fahrzeuge werden unten angezeigt.</p></noscript>
<ul class="vehicle-grid vehicle-grid-results" data-list>
${vehicles.map((v, i) => html`<li data-id="${v.id}">${vehicleCard(v, ctx, { level: 3, lazy: i > 2 })}</li>`)}
</ul>
<div class="empty-state" data-empty hidden>
${icon('search', { size: 32 })}
<h3>Keine passenden Fahrzeuge gefunden</h3>
<p>Passen Sie Ihre Filter an oder setzen Sie sie zurück. Gern helfen wir Ihnen auch telefonisch weiter.</p>
<div class="empty-actions">
<button type="button" class="btn btn-dark" data-reset-all>Alle Filter zurücksetzen</button>
<a class="btn btn-outline" href="${c.phoneHref}">${icon('phone', { size: 18 })} ${c.phone}</a>
</div>
</div>
<aside class="mobile-de-hint">
<div>
<h2 class="mobile-de-title">Weitere Angebote auf mobile.de</h2>
<p>Unser Bestand ist auch in unserem Händlerprofil auf mobile.de zu finden.</p>
</div>
<a class="btn btn-outline" href="${c.mobileDeUrl}" target="_blank" rel="noopener noreferrer">Zum Händlerprofil ${icon('external', { size: 16 })}<span class="visually-hidden"> (öffnet in neuem Tab)</span></a>
</aside>
</div>
</form>
</div>
</section>
<script type="application/json" id="inventory-data">${jsonScript(records)}</script>
${ctaBand(ctx, { title: 'Ihr Wunschfahrzeug ist nicht dabei?', text: 'Rufen Sie uns an – wir sprechen gern über Ihre Vorstellungen.' })}`;

  return page(ctx, {
    path: '/fahrzeuge/',
    title: 'Gebrauchtwagen kaufen in Görlitz – Fahrzeugbestand',
    description: 'Gebrauchtwagen in Görlitz: Durchsuchen Sie den Fahrzeugbestand von FineCars nach Marke, Modell, Preis, Erstzulassung, Kilometerstand, Kraftstoff und Getriebe.',
    bodyClass: 'page-inventory',
    jsonLd: [breadcrumbJsonLd(ctx, crumbs)].filter(Boolean),
    scripts: ['/assets/js/inventory.js'],
    body
  });
}
