import { html } from '../lib/html.js';
import { page } from '../templates/layout.js';
import { icon } from '../templates/icons.js';
import { pageIntro, ctaBand, breadcrumbJsonLd, dealerJsonLd } from '../templates/components.js';
import { locationSection } from './home.js';

export default function about(ctx) {
  const c = ctx.config.company;
  const crumbs = [{ label: 'Startseite', href: '/' }, { label: 'Über uns', href: '/ueber-uns/' }];

  const body = html`${pageIntro({
    eyebrow: 'Über FineCars',
    title: 'Gebrauchtwagenhandel in Görlitz',
    lead: 'FineCars Görlitz ist ein Gebrauchtwagenhändler mit Sitz in der Rothenburger Straße in Görlitz – mit direktem Kontakt und klaren Fahrzeuginformationen.',
    crumbs
  })}
<section class="section" aria-labelledby="about-intro">
<div class="container editorial">
<div class="editorial-aside">
<p class="eyebrow">Das Unternehmen</p>
<h2 id="about-intro" class="section-title">FineCars Görlitz</h2>
</div>
<div class="editorial-body prose prose-lg">
<p>Hinter FineCars Görlitz steht die ${c.legalName}. Unser Schwerpunkt ist der Handel mit Gebrauchtwagen: Wir bieten Fahrzeuge verschiedener Marken und Klassen an – der Bestand verändert sich laufend.</p>
<p>Auf dieser Website finden Sie ausgewählte Fahrzeuge mit den wichtigsten Daten auf einen Blick. Zu jedem Angebot erreichen Sie uns direkt, um offene Fragen zu klären und die nächsten Schritte zu besprechen.</p>
</div>
</div>
</section>

<section class="section section-paper" aria-labelledby="about-pillars">
<div class="container">
<div class="section-head"><div><p class="eyebrow">Auf einen Blick</p><h2 id="about-pillars" class="section-title">Klar. Direkt. Vor Ort.</h2></div></div>
<ul class="pillars">
<li class="pillar">
<span class="pillar-icon">${icon('pin', { size: 24 })}</span>
<h3>Standort</h3>
<p>Sie finden uns in der ${c.street} in ${c.zip} ${c.city}. Besichtigungen vereinbaren wir gern nach vorheriger Absprache.</p>
</li>
<li class="pillar">
<span class="pillar-icon">${icon('car', { size: 24 })}</span>
<h3>Fahrzeugangebote</h3>
<p>Unser Bestand umfasst Gebrauchtwagen unterschiedlicher Marken. Aktuelle Angebote finden Sie in der Fahrzeugübersicht und in unserem Händlerprofil auf mobile.de.</p>
</li>
<li class="pillar">
<span class="pillar-icon">${icon('phone', { size: 24 })}</span>
<h3>Kontakt</h3>
<p>Telefonisch erreichen Sie uns unter <a href="${c.phoneHref}">${c.phone}</a>. So klären wir Ihre Fragen ohne Umwege.</p>
</li>
</ul>
<div class="section-foot section-foot-left">
<a class="btn btn-dark" href="/fahrzeuge/">Zur Fahrzeugübersicht ${icon('arrowRight', { size: 18 })}</a>
<a class="btn btn-outline" href="${c.mobileDeUrl}" target="_blank" rel="noopener noreferrer">Händlerprofil auf mobile.de ${icon('external', { size: 16 })}<span class="visually-hidden"> (öffnet in neuem Tab)</span></a>
</div>
</div>
</section>
${locationSection(ctx)}
${ctaBand(ctx)}`;

  return page(ctx, {
    path: '/ueber-uns/',
    title: 'Über uns – Autohaus für Gebrauchtwagen in Görlitz',
    description: 'Über FineCars Görlitz: Gebrauchtwagenhändler in der Rothenburger Straße 27f in Görlitz. Fahrzeugangebote, Standort und direkter Kontakt.',
    bodyClass: 'page-about',
    jsonLd: [dealerJsonLd(ctx), breadcrumbJsonLd(ctx, crumbs)].filter(Boolean),
    body
  });
}
