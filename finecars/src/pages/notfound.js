import { html } from '../lib/html.js';
import { page } from '../templates/layout.js';
import { icon } from '../templates/icons.js';

export default function notFound(ctx) {
  const c = ctx.config.company;
  const body = html`<section class="not-found">
<div class="container not-found-inner">
<p class="not-found-code" aria-hidden="true">404</p>
<h1 class="page-title">Diese Seite wurde nicht gefunden.</h1>
<p class="page-lead">Möglicherweise wurde das Fahrzeug bereits verkauft oder die Adresse hat sich geändert. Gern helfen wir Ihnen weiter.</p>
<div class="hero-actions">
<a class="btn btn-light btn-lg" href="/fahrzeuge/">Fahrzeuge entdecken ${icon('arrowRight', { size: 20 })}</a>
<a class="btn btn-ghost-light btn-lg" href="/">Zur Startseite</a>
</div>
<p class="not-found-phone">Oder rufen Sie uns an: <a href="${c.phoneHref}">${c.phone}</a></p>
</div>
</section>`;

  return page(ctx, {
    path: '/404.html',
    title: 'Seite nicht gefunden',
    description: 'Die angeforderte Seite wurde nicht gefunden. Entdecken Sie die aktuellen Fahrzeugangebote von FineCars Görlitz.',
    bodyClass: 'page-404',
    noindex: true,
    noCanonical: true,
    body
  });
}
