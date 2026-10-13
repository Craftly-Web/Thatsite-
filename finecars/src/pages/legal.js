// Impressum und Datenschutzerklärung.
// ENTWÜRFE – nicht anwaltlich geprüft. Fehlende Pflichtangaben erscheinen als
// markierte Platzhalter und werden beim Build aufgelistet (siehe CHECKLISTE.md).
import { html } from '../lib/html.js';
import { placeholder, valueOr } from '../lib/html.js';
import { page } from '../templates/layout.js';
import { pageIntro, breadcrumbJsonLd } from '../templates/components.js';
import { icon } from '../templates/icons.js';

function draftNotice(ctx) {
  if (!ctx.config.demoMode) return '';
  return html`<div class="dev-notice legal-draft" role="note">${icon('info', { size: 18 })}<div><strong>Entwurf – nicht anwaltlich geprüft.</strong> Dieser Text ist eine Vorlage. Markierte Platzhalter müssen vor der Veröffentlichung ergänzt und der gesamte Text rechtlich geprüft werden.</div></div>`;
}

export function impressum(ctx) {
  const { company: c, legal } = ctx.config;
  const crumbs = [{ label: 'Startseite', href: '/' }, { label: 'Impressum', href: '/impressum/' }];
  const directors = legal.managingDirectors && legal.managingDirectors.length ? legal.managingDirectors.join(', ') : null;

  const body = html`${pageIntro({ title: 'Impressum', crumbs })}
<section class="section-tight legal">
<div class="container legal-container prose">
${draftNotice(ctx)}
<h2>Angaben gemäß § 5 DDG</h2>
<p>${c.legalName}<br>${c.street}<br>${c.zip} ${c.city}<br>Deutschland</p>

<h2>Vertreten durch</h2>
<p>Geschäftsführung: ${valueOr(directors, 'Name der Geschäftsführerin / des Geschäftsführers')}</p>

<h2>Kontakt</h2>
<p>Telefon: <a href="${c.phoneHref}">${c.phone}</a><br>
E-Mail: ${c.email ? html`<a href="mailto:${c.email}">${c.email}</a>` : placeholder('E-Mail-Adresse (Pflichtangabe)')}</p>

<h2>Registereintrag</h2>
<p>Registergericht: ${valueOr(legal.registerCourt, 'Registergericht, z. B. Amtsgericht …')}<br>
Registernummer: ${valueOr(legal.registerNumber, 'HRB-Nummer')}</p>

<h2>Umsatzsteuer-ID</h2>
<p>Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz: ${valueOr(legal.vatId, 'USt-IdNr. (falls vorhanden)')}</p>

<h2>Verbraucherstreitbeilegung</h2>
<p>${valueOr(legal.disputeResolutionStatement, 'Aussage zur Teilnahme an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle (§ 36 VSBG)')}</p>

<h2>Haftung für Links</h2>
<p>Diese Website enthält Links zu externen Websites Dritter (z. B. mobile.de, Google Maps), auf deren Inhalte wir keinen Einfluss haben. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber verantwortlich.</p>

<h2>Bildnachweis</h2>
<p>${ctx.meta.isDemo ? 'Die Fahrzeugabbildungen auf dieser Vorschau sind eigens erstellte, markenneutrale Illustrationen und zeigen keine realen Fahrzeuge.' : placeholder('Bildnachweise für verwendete Fotos')}</p>
</div>
</section>`;

  return page(ctx, {
    path: '/impressum/',
    title: 'Impressum',
    description: 'Impressum der M.V. FineCars – Matthias Volprich GmbH, Rothenburger Straße 27f, 02828 Görlitz.',
    bodyClass: 'page-legal',
    jsonLd: [breadcrumbJsonLd(ctx, crumbs)].filter(Boolean),
    body
  });
}

export function datenschutz(ctx) {
  const { company: c, contactForm, hosting } = ctx.config;
  const crumbs = [{ label: 'Startseite', href: '/' }, { label: 'Datenschutz', href: '/datenschutz/' }];
  const showForm = contactForm.enabled || ctx.config.demoMode;
  const now = new Date();
  const stand = now.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

  const body = html`${pageIntro({ title: 'Datenschutzerklärung', crumbs })}
<section class="section-tight legal">
<div class="container legal-container prose">
${draftNotice(ctx)}
<h2>1. Verantwortlicher</h2>
<p>Verantwortlich für die Datenverarbeitung auf dieser Website ist:</p>
<p>${c.legalName}<br>${c.street}<br>${c.zip} ${c.city}<br>
Telefon: <a href="${c.phoneHref}">${c.phone}</a><br>
E-Mail: ${c.email ? html`<a href="mailto:${c.email}">${c.email}</a>` : placeholder('E-Mail-Adresse für Datenschutzanfragen')}</p>
<p>Gesetzlich vertreten durch die Geschäftsführung (siehe <a href="/impressum/">Impressum</a>).</p>

<h2>2. Überblick</h2>
<p>Wir verarbeiten personenbezogene Daten nur, soweit dies für den Betrieb dieser Website und die Bearbeitung Ihrer Anfragen erforderlich ist. Diese Website</p>
<ul>
<li>setzt <strong>keine Cookies</strong> und speichert keine Daten in Ihrem Browser (kein Local Storage),</li>
<li>verwendet <strong>keine Analyse-, Tracking- oder Marketingdienste</strong>,</li>
<li>lädt Schriftarten <strong>vom eigenen Server</strong> und bindet keine externen Karten oder Videos ein.</li>
</ul>

<h2>3. Hosting und Server-Logfiles</h2>
<p>Diese Website wird bei ${hosting.name}, ${hosting.address}, gehostet. Beim Aufruf der Website verarbeitet der Hosting-Anbieter automatisch Informationen, die Ihr Browser übermittelt (Server-Logfiles):</p>
<ul>
<li>IP-Adresse des anfragenden Geräts</li>
<li>Datum und Uhrzeit des Zugriffs</li>
<li>aufgerufene Seite bzw. Datei</li>
<li>Referrer-URL (zuvor besuchte Seite), sofern übermittelt</li>
<li>verwendeter Browser und Betriebssystem</li>
</ul>
<p>Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse liegt in der sicheren und stabilen Bereitstellung der Website. Die Logdaten werden vom Hosting-Anbieter nur für einen begrenzten Zeitraum gespeichert: ${placeholder('Speicherdauer der Server-Logfiles laut Hosting-Vertrag')}.</p>
<p>Mit dem Hosting-Anbieter besteht ein Vertrag zur Auftragsverarbeitung (Art. 28 DSGVO): ${placeholder('Bestätigung des Auftragsverarbeitungsvertrags')}. Eine Übermittlung in die USA kann nicht ausgeschlossen werden; sie erfolgt auf Grundlage ${placeholder('Rechtsgrundlage der Drittlandübermittlung prüfen, z. B. EU-US Data Privacy Framework / Standardvertragsklauseln')}. Weitere Informationen: <a href="${hosting.privacyUrl}" target="_blank" rel="noopener noreferrer">Datenschutzerklärung des Hosting-Anbieters</a>.</p>

<h2>4. Kontaktaufnahme per Telefon oder E-Mail</h2>
<p>Wenn Sie uns telefonisch oder per E-Mail kontaktieren, verarbeiten wir Ihre Angaben (z. B. Name, Telefonnummer, E-Mail-Adresse, Inhalt Ihrer Anfrage), um Ihr Anliegen zu bearbeiten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, soweit Ihre Anfrage mit einem Vertrag oder vorvertraglichen Maßnahmen (z. B. Fahrzeugkauf, Probefahrt) zusammenhängt, im Übrigen Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Beantwortung von Anfragen).</p>
<p>Wir löschen die Daten, sobald sie für die Bearbeitung nicht mehr erforderlich sind und keine gesetzlichen Aufbewahrungspflichten (z. B. handels- und steuerrechtliche Fristen) entgegenstehen.</p>

${showForm ? html`<h2>5. Kontaktformular</h2>
${!contactForm.enabled ? html`<p><em>Hinweis: Das Kontaktformular ist in dieser Vorschauversion noch nicht aktiv; eingegebene Daten werden nicht übertragen. Der folgende Abschnitt gilt ab der Freischaltung.</em></p>` : ''}
<p>Wenn Sie unser Kontaktformular nutzen, verarbeiten wir die von Ihnen eingegebenen Daten: Name, E-Mail-Adresse, optional Telefonnummer, Betreff, optional den Bezug zu einem Fahrzeug sowie Ihre Nachricht. Die Daten werden verschlüsselt an unseren Server übertragen und per E-Mail an uns weitergeleitet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b bzw. lit. f DSGVO (siehe Abschnitt 4).</p>
<p>Für den Versand der E-Mail setzen wir den Dienstleister Resend (Resend, Inc., USA) als Auftragsverarbeiter ein. ${placeholder('Abschluss des Auftragsverarbeitungsvertrags mit dem E-Mail-Dienstleister und Rechtsgrundlage der Drittlandübermittlung bestätigen')}. Weitere Informationen: <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Datenschutzerklärung von Resend</a>.</p>
<p>Zum Schutz vor automatisierten Spam-Nachrichten verwenden wir ein unsichtbares Prüffeld und eine Mindestbearbeitungszeit. Es werden dafür keine Cookies gesetzt und keine externen Dienste (z. B. CAPTCHA-Anbieter) eingebunden.</p>
<p>Die Angaben im Formular sind freiwillig. Ohne Name, E-Mail-Adresse und Nachricht können wir eine Anfrage über das Formular jedoch nicht bearbeiten; alternativ erreichen Sie uns telefonisch.</p>` : ''}

<h2>${showForm ? '6' : '5'}. Externe Links (Google Maps, mobile.de)</h2>
<p>Unsere Website enthält Links zu Google Maps (Routenplanung) und zu unserem Händlerprofil auf mobile.de. Diese Inhalte sind nicht eingebettet: Erst wenn Sie einen solchen Link anklicken, werden Sie auf die Seite des jeweiligen Anbieters weitergeleitet und es gelten dessen Datenschutzbestimmungen. Vorher werden keine Daten an diese Anbieter übertragen.</p>

<h2>${showForm ? '7' : '6'}. Schriftarten</h2>
<p>Die verwendeten Schriftarten (Inter, Manrope) werden lokal von unserem Server geladen. Es findet keine Verbindung zu Servern von Google oder anderen Schriftanbietern statt.</p>

<h2>${showForm ? '8' : '7'}. Ihre Rechte</h2>
<p>Sie haben im Rahmen der gesetzlichen Bestimmungen jederzeit das Recht auf</p>
<ul>
<li>Auskunft über Ihre gespeicherten Daten (Art. 15 DSGVO),</li>
<li>Berichtigung unrichtiger Daten (Art. 16 DSGVO),</li>
<li>Löschung (Art. 17 DSGVO) und Einschränkung der Verarbeitung (Art. 18 DSGVO),</li>
<li>Datenübertragbarkeit (Art. 20 DSGVO),</li>
<li>Widerspruch gegen Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (Art. 21 DSGVO).</li>
</ul>
<p>Außerdem haben Sie das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren (Art. 77 DSGVO). Für uns zuständig ist in der Regel die Sächsische Datenschutz- und Transparenzbeauftragte.</p>

<h2>${showForm ? '9' : '8'}. Verschlüsselung</h2>
<p>Diese Website nutzt aus Sicherheitsgründen eine TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie an „https://“ in der Adresszeile Ihres Browsers.</p>

<p class="muted">Stand: ${stand}${ctx.config.demoMode ? ' (Entwurf)' : ''}</p>
</div>
</section>`;

  return page(ctx, {
    path: '/datenschutz/',
    title: 'Datenschutzerklärung',
    description: 'Datenschutzerklärung von FineCars Görlitz: Informationen zur Verarbeitung personenbezogener Daten auf dieser Website.',
    bodyClass: 'page-legal',
    jsonLd: [breadcrumbJsonLd(ctx, crumbs)].filter(Boolean),
    body
  });
}
