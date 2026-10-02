/*
  Baut das E-Book aus den Markdown-Dateien in inhalt/ und den Angaben in buch.json:

    ausgabe/Das-Herz-heilt-leiser.pdf    gestaltetes PDF (A5) mit klickbarem Inhaltsverzeichnis und Lesezeichen
    ausgabe/Das-Herz-heilt-leiser.epub   EPUB 3 für E-Reader (Tolino, Kindle/KDP, Apple Books, Google Play Books)
    ausgabe/cover.jpg                    Cover in 1600 × 2263 px (für Shops und das EPUB)
    ausgabe/instagram/*.png              Zitatkarten 1080 × 1350 px (4:5, Instagram-Hochformat)
    ausgabe/instagram/zitate.md          alle Zitate als Text zum Kopieren

  Aufruf (im Ordner ebook/):
    npm install
    npm run build

  Benötigt Playwright mit Chromium (npm install playwright && npx playwright install chromium)
  und python3 (nur zum Packen und Prüfen des EPUB).

  Eigene Zitate im Text:  :::zitat  …Text…  [— Quelle]  :::
  Kästen:                 :::spiegel / :::studie / :::uebung Titel / :::journal / :::merke / :::plan Titel
*/
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
let pw; try { pw = require('playwright'); } catch { pw = require(path.join(execFileSync('npm', ['root', '-g']).toString().trim(), 'playwright')); }
const { marked } = require('marked');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'ausgabe');
const TMP = path.join(ROOT, '.tmp');
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, 'buch.json'), 'utf8'));
const NAME = 'Das-Herz-heilt-leiser';
marked.setOptions({ gfm: true });

// ---------------------------------------------------------------- Hilfsfunktionen
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const tohex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => tohex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t));
const lum = h => {
  const [r, g, b] = hex(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
  return .2126 * r + .7152 * g + .0722 * b;
};
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = s => marked.parseInline(s);
const nr2 = n => String(n).padStart(2, '0');
const xhtml = s => s.replace(/<(br|hr|img|meta|link|col)([^>]*?)\s*\/?>/g, '<$1$2/>');

function zufall(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

// ---------------------------------------------------------------- Szene: Nacht → Morgen
// t = 0 (tiefe Nacht) … 1 (Sonnenaufgang). Die Sonne steigt mit jedem Kapitel ein Stück höher.
function farben(t) {
  return {
    oben: mix('#0E1A20', '#8DAEB3', t), mitte: mix('#1B2B33', '#E6CDB6', t), horizont: mix('#34454D', '#F3BA8E', t),
    sonne: mix('#B87757', '#F8E0B9', t),
    hinten: mix('#1D2D34', '#7F978F', t), mittel: mix('#16242A', '#577570', t), vorn: mix('#101B20', '#2D484A', t),
  };
}
function szene(t, o = {}) {
  const id = o.id || 's', f = { ...farben(t), ...(o.farben || {}) };
  const r = o.r || 21, cx = o.cx || 104, cy = o.cy != null ? o.cy : 122 - 70 * t;
  const vb = o.viewBox || '0 0 148 210';
  let sterne = '';
  const sichtbar = o.sterne != null ? o.sterne : Math.max(0, 1 - t / .7);
  if (sichtbar > 0) {
    const rnd = zufall(o.seed || 7);
    for (let i = 0; i < 46; i++) {
      const x = rnd() * 148, y = rnd() * 92, rr = .18 + rnd() * .42, a = (.35 + rnd() * .65) * sichtbar * (1 - y / 130);
      sterne += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr.toFixed(2)}" fill="#FFF6E6" opacity="${a.toFixed(2)}"/>`;
    }
  }
  // Kintsugi: goldener Riss durch die Sonne
  const riss = o.riss ? `<g clip-path="url(#${id}c)" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M${cx - r * 1.05} ${cy - r * .28} L${cx - r * .55} ${cy - r * .08} L${cx - r * .32} ${cy - r * .34} L${cx + r * .08} ${cy + r * .06} L${cx + r * .38} ${cy - r * .02} L${cx + r * .62} ${cy + r * .3} L${cx + r * 1.05} ${cy + r * .38}" stroke="#B8893C" stroke-width="1.1"/>
      <path d="M${cx - r * .32} ${cy - r * .34} L${cx - r * .2} ${cy - r * .72} L${cx - r * .02} ${cy - r * 1.05}" stroke="#B8893C" stroke-width=".8"/>
      <path d="M${cx + r * .38} ${cy - r * .02} L${cx + r * .5} ${cy + r * .55} L${cx + r * .42} ${cy + r * 1.05}" stroke="#B8893C" stroke-width=".7"/>
      <path d="M${cx - r * 1.05} ${cy - r * .28} L${cx - r * .55} ${cy - r * .08} L${cx - r * .32} ${cy - r * .34} L${cx + r * .08} ${cy + r * .06} L${cx + r * .38} ${cy - r * .02} L${cx + r * .62} ${cy + r * .3} L${cx + r * 1.05} ${cy + r * .38}" stroke="#F3D88E" stroke-width=".35"/>
    </g>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${f.oben}"/><stop offset=".58" stop-color="${f.mitte}"/><stop offset="1" stop-color="${f.horizont}"/></linearGradient>
    <radialGradient id="${id}g"><stop offset="0" stop-color="${f.sonne}" stop-opacity=".6"/><stop offset=".45" stop-color="${f.sonne}" stop-opacity=".18"/><stop offset="1" stop-color="${f.sonne}" stop-opacity="0"/></radialGradient>
    <clipPath id="${id}c"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
  </defs>
  <rect x="-10" y="-10" width="168" height="150" fill="url(#${id}h)"/>
  ${sterne}
  <circle cx="${cx}" cy="${cy}" r="${r * 2.6}" fill="url(#${id}g)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${f.sonne}"/>
  ${riss}
  <path d="M-2 104 C 22 95, 40 97, 62 105 S 108 95, 150 100 V212 H-2Z" fill="${f.hinten}"/>
  <path d="M-2 118 C 30 107, 52 111, 80 118 S 126 109, 150 113 V212 H-2Z" fill="${f.mittel}"/>
  <path d="M-2 131 C 34 123, 70 126, 96 132 S 134 127, 150 129 V212 H-2Z" fill="${f.vorn}"/>
</svg>`;
}
// kleines Emblem (Sonne über Hügeln) für Titelseite, Abschnittsköpfe und Karten
function emblem(farbe = '#2F4B54', sonne = '#B9735A', gold = '#C9A35B') {
  return `<svg class="emblem" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" aria-hidden="true">
  <circle cx="30" cy="19" r="10" fill="${sonne}"/>
  <path d="M21.5 16.5 L26 18 L28 15.6 L31.6 19.4 L34.4 18.6 L38.6 21.6" fill="none" stroke="${gold}" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M0 23 C 12 18, 20 19, 30 22.5 S 48 18, 60 21 V30 H0Z" fill="${farbe}"/>
</svg>`;
}
const ORN = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 16"><path d="M4 8 H46 M74 8 H116" stroke="#C9A35B" stroke-width="1.2" stroke-linecap="round"/><circle cx="60" cy="8" r="5.2" fill="none" stroke="#C9A35B" stroke-width="1.2"/><circle cx="60" cy="8" r="1.8" fill="#C9A35B"/></svg>`);

// ---------------------------------------------------------------- Inhalt einlesen
function lies(datei) {
  const raw = fs.readFileSync(datei, 'utf8').replace(/\r\n/g, '\n');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error('Kein Kopfbereich in ' + datei);
  const meta = {};
  for (const z of m[1].split('\n')) { const i = z.indexOf(':'); if (i > 0) meta[z.slice(0, i).trim()] = z.slice(i + 1).trim(); }
  return { art: 'kapitel', ...meta, body: m[2], datei: path.basename(datei, '.md') };
}
const teile = fs.readdirSync(path.join(ROOT, 'inhalt')).filter(f => f.endsWith('.md')).sort().map(f => lies(path.join(ROOT, 'inhalt', f)));
const kapitelZahl = teile.filter(t => t.art === 'kapitel').length;
teile.forEach(t => {
  t.id = t.art === 'kapitel' ? 'k' + nr2(t.nummer) : t.datei.replace(/^\d+-/, '');
  t.t = t.art === 'kapitel' ? (t.nummer - 1) / (kapitelZahl - 1) * .92 : t.art === 'plan' ? 1 : 0;
});

const LABEL = { spiegel: 'Kennst du das?', studie: 'Was die Forschung zeigt', uebung: 'Probier es aus', journal: 'Für dein Tagebuch', merke: 'Zum Mitnehmen' };

function zitatHtml(text, von) {
  return `<figure class="zitat"><div class="orn" aria-hidden="true"></div><blockquote><p>„${inline(text)}“</p></blockquote>${von ? `<figcaption>— ${inline(von)}</figcaption>` : ''}</figure>`;
}
function block(typ, titel, zeilen, ctx, ziel) {
  if (typ === 'zitat') {
    const z = zeilen.map(s => s.trim()).filter(Boolean);
    const von = z.length > 1 && /^— /.test(z[z.length - 1]) ? z.pop().slice(2) : '';
    const text = z.join(' ');
    ctx.zitate.push({ text, von, wo: ctx.wo });
    return zitatHtml(text, von);
  }
  const punkte = zeilen.filter(s => /^- /.test(s)).map(s => s.slice(2));
  if (typ === 'plan') {
    return `<section class="plan"><h3 class="plan-titel">${esc(titel)}</h3><ul>${punkte.map(p => `<li><span class="box" aria-hidden="true"></span><span>${inline(p)}</span></li>`).join('')}</ul></section>`;
  }
  if (typ === 'journal') {
    return `<aside class="kasten journal"><p class="label">${LABEL.journal}</p><ul>${punkte.map(p => `<li><p>${inline(p)}</p>${ziel === 'pdf' ? '<div class="linien"></div>' : ''}</li>`).join('')}</ul></aside>`;
  }
  if (!LABEL[typ]) throw new Error('Unbekannter Block :::' + typ);
  const titelHtml = titel ? `<p class="kasten-titel">${esc(titel)}</p>` : '';
  return `<aside class="kasten ${typ}"><p class="label">${LABEL[typ]}</p>${titelHtml}${marked.parse(zeilen.join('\n'))}</aside>`;
}
function render(md, ctx, ziel) {
  const zeilen = md.split('\n'), html = []; let puffer = [];
  const flush = () => { if (puffer.join('').trim()) html.push(marked.parse(puffer.join('\n'))); puffer = []; };
  for (let i = 0; i < zeilen.length; i++) {
    const m = zeilen[i].match(/^:::(\w+)\s*(.*)$/);
    if (!m) { puffer.push(zeilen[i]); continue; }
    flush();
    const inhalt = [];
    for (i++; i < zeilen.length && zeilen[i].trim() !== ':::'; i++) inhalt.push(zeilen[i]);
    html.push(block(m[1], m[2].trim(), inhalt, ctx, ziel));
  }
  flush();
  return html.join('\n');
}

function labelFuer(t) {
  return { kapitel: 'Kapitel ' + t.nummer, plan: 'Begleiter', vorwort: 'Zu Beginn', nachwort: 'Zum Schluss', anhang: 'Anhang', zitate: 'Anhang' }[t.art];
}

// Zitate sammeln (Mottos + Zitatblöcke), einmal für das ganze Buch
function sammleZitate() {
  const ctx = { zitate: [] };
  for (const t of teile) {
    ctx.wo = t.titel;
    if (t.motto) ctx.zitate.push({ text: t.motto, von: t.motto_von || '', wo: t.titel });
    render(t.body, ctx, 'pdf');
  }
  const gesehen = new Set();
  return ctx.zitate.filter(z => !gesehen.has(z.text) && gesehen.add(z.text));
}
const ZITATE = sammleZitate();

// ---------------------------------------------------------------- PDF-HTML
function fontCss(prefix) {
  return fs.readFileSync(path.join(ROOT, 'fonts', 'fonts.css'), 'utf8').replace(/url\(([^)]+)\)/g, (_, f) => `url(${prefix}${f})`);
}
function opener(t) {
  const f = farben(t.t);
  const nummerFarbe = lum(f.oben) > .28 ? 'rgba(27,42,49,.5)' : 'rgba(246,239,228,.78)';
  const motto = t.motto ? `<p class="op-motto">„${esc(t.motto)}“</p>${t.motto_von ? `<p class="op-von">— ${esc(t.motto_von)}</p>` : ''}` : '';
  return `<section class="vollbild opener" id="${t.id}">
  ${szene(t.t, { id: 'o' + t.id, seed: 11 + (+t.nummer || 30) })}
  <div class="op-nummer" style="color:${nummerFarbe}">${t.nummer ? nr2(t.nummer) : ''}</div>
  <div class="op-text">
    <p class="op-label">${labelFuer(t)}</p>
    <h1>${esc(t.titel)}</h1>
    ${t.untertitel ? `<p class="op-unter">${esc(t.untertitel)}</p>` : ''}
    <div class="op-linie"></div>
    ${motto}
  </div>
</section>`;
}
function cover() {
  return `<section class="vollbild cover">
  ${szene(.6, { id: 'cv', r: 27, cx: 98, cy: 108, riss: true, sterne: .55, seed: 3,
    farben: { oben: '#18292F', mitte: '#4E6B70', horizont: '#EDB68E', sonne: '#F1CFA2', hinten: '#5F7A76', mittel: '#3D5856', vorn: '#1E3236' } })}
  <p class="cover-titel">${CFG.titel_umbruch || esc(CFG.titel)}</p>
  <div class="cover-linie"></div>
  ${CFG.autor ? `<p class="cover-autor">${esc(CFG.autor)}</p>` : ''}
  <p class="cover-unter">${esc(CFG.untertitel)}</p>
</section>`;
}
function abschnittKopf(t) {
  return `<header class="kopf">${emblem()}<p class="kopf-label">${labelFuer(t)}</p><h1>${esc(t.titel)}</h1>${t.untertitel ? `<p class="kopf-unter">${esc(t.untertitel)}</p>` : ''}</header>`;
}
function zitatSammlung(ziel) {
  const intro = `<p>Hier findest du alle Sätze aus diesem Buch noch einmal gesammelt. Schreib sie ab, häng sie an den Spiegel, schick sie einem Menschen, der sie gerade braucht. Und lies sie an den Tagen, an denen du vergessen hast, wie weit du schon gekommen bist.</p>`;
  return intro + ZITATE.map(z => `<div class="zs"><p>„${inline(z.text)}“</p><p class="zs-von">${z.von ? esc(z.von) : esc(z.wo)}</p></div>`).join('\n');
}
function buchHtml(seiten = {}) {
  const ctx = { zitate: [] };
  const s = [];
  s.push(cover());
  s.push(`<section class="titelei titelseite">${emblem()}<p class="t">${esc(CFG.titel)}</p><p class="u">${esc(CFG.untertitel)}</p>${CFG.autor ? `<p class="a">${esc(CFG.autor)}</p>` : ''}${CFG.verlag ? `<p class="v">${esc(CFG.verlag)}</p>` : ''}</section>`);
  s.push(`<section class="titelei impressum">
    <p><strong>${esc(CFG.titel)}</strong><br>${esc(CFG.untertitel)}</p>
    <p>© ${CFG.jahr}${CFG.autor ? ' ' + esc(CFG.autor) : ''}. Alle Rechte vorbehalten. Die Zitate ohne Namensangabe wurden für dieses Buch geschrieben.</p>
    ${CFG.verlag ? `<p>Verlag: ${esc(CFG.verlag)}</p>` : ''}
    <p><strong>Wichtiger Hinweis:</strong> Dieses Buch wurde mit großer Sorgfalt erstellt. Die beschriebenen Methoden stützen sich auf veröffentlichte wissenschaftliche Studien (Stand ${CFG.jahr}; Quellen im Anhang). Das Buch ersetzt jedoch keine ärztliche, psychotherapeutische oder psychologische Beratung oder Behandlung. Wenn es dir über längere Zeit schlecht geht oder du an Suizid denkst, hol dir bitte sofort Hilfe – zum Beispiel bei der Telefonseelsorge: Deutschland 0800 111 0 111, Österreich 142, Schweiz 143, rund um die Uhr und kostenlos. Im Notfall: 112.</p>
    <p>Schriften: Fraunces, Literata und DM Sans (SIL Open Font License).</p>
  </section>`);
  s.push(`<section class="titelei widmung"><p>${CFG.widmung}</p></section>`);
  s.push(`<nav class="toc"><p class="toc-kopf">Wegweiser</p><p class="toc-titel">Inhalt</p><ol>${
    teile.map(t => `<li class="${t.art === 'kapitel' ? 't-kap' : 't-abschnitt'}"><a href="#${t.id}"><span class="t-num">${t.art === 'kapitel' ? nr2(t.nummer) : ''}</span><span class="t-titel">${esc(t.titel)}</span><span class="t-seite">${seiten[t.id] || ''}</span></a></li>`).join('')
  }</ol></nav>`);
  for (const t of teile) {
    ctx.wo = t.titel;
    if (t.art === 'kapitel' || t.art === 'plan') {
      s.push(opener(t));
      s.push(`<section class="kapitel"><div class="text">${render(t.body, ctx, 'pdf')}</div></section>`);
    } else {
      const body = t.art === 'zitate' ? zitatSammlung('pdf') : render(t.body, ctx, 'pdf');
      s.push(`<section class="abschnitt ${t.art === 'anhang' ? 'quellen' : ''} ${t.art}" id="${t.id}">${abschnittKopf(t)}<div class="text ${t.art === 'anhang' || t.art === 'zitate' ? 'ohne-initiale' : ''}">${body}</div></section>`);
    }
  }
  const css = fs.readFileSync(path.join(__dirname, 'buch.css'), 'utf8');
  return `<!doctype html><html lang="${CFG.sprache}"><head><meta charset="utf-8"><title>${esc(CFG.titel)}</title>
<style>${fontCss('file://' + path.join(ROOT, 'fonts') + '/')}
${css}
:root { --orn: url("${ORN}"); }
.ohne-initiale > p:first-child::first-letter { font: inherit; float: none; padding: 0; color: inherit; }
</style></head><body>${s.join('\n')}</body></html>`;
}

// ---------------------------------------------------------------- PDF erzeugen (2 Durchgänge)
const ohneLeer = s => s.replace(/\s+/g, '');
// Chromium verliert in den PDF-Lesezeichen die Leerzeichen an Zeilenumbrüchen – hier werden sie repariert.
async function lesezeichenReparieren(datei, html) {
  const { PDFDocument, PDFName, PDFHexString, PDFString } = require('pdf-lib');
  const richtig = new Map();
  for (const m of html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/g)) {
    const text = m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
    richtig.set(ohneLeer(text), text);
  }
  const doc = await PDFDocument.load(fs.readFileSync(datei), { updateMetadata: false });
  doc.setTitle(CFG.titel); doc.setSubject(CFG.untertitel); doc.setLanguage(CFG.sprache);
  if (CFG.autor) doc.setAuthor(CFG.autor);
  if (CFG.verlag) doc.setCreator(CFG.verlag);
  const outlines = doc.catalog.lookup(PDFName.of('Outlines'));
  let repariert = 0;
  const walk = ref => {
    while (ref) {
      const item = doc.context.lookup(ref);
      const titel = item.lookup(PDFName.of('Title'));
      if (titel instanceof PDFHexString || titel instanceof PDFString) {
        const neu = richtig.get(ohneLeer(titel.decodeText()));
        if (neu && neu !== titel.decodeText()) { item.set(PDFName.of('Title'), PDFHexString.fromText(neu)); repariert++; }
      }
      walk(item.get(PDFName.of('First')));
      ref = item.get(PDFName.of('Next'));
    }
  };
  if (outlines) walk(outlines.get(PDFName.of('First')));
  fs.writeFileSync(datei, await doc.save({ useObjectStreams: true }));
  return repariert;
}
// Seitenzahlen fürs Inhaltsverzeichnis: Seite suchen, auf der „Label + Titel“ eines Abschnitts beginnt
async function pdfSeiten(datei) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(datei)), verbosity: 0 }).promise;
  const texte = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const tc = await (await doc.getPage(i)).getTextContent();
    texte.push(ohneLeer(tc.items.map(x => x.str).join('')).toLowerCase());
  }
  const seiten = {};
  for (const t of teile) {
    const such = ohneLeer(labelFuer(t) + t.titel).toLowerCase();
    const i = texte.findIndex(x => x.includes(such));
    if (i >= 0) seiten[t.id] = i + 1;
  }
  const n = doc.numPages; await doc.destroy();
  return { seiten, anzahl: n };
}
async function pdf(browser) {
  const page = await browser.newPage();
  const html = path.join(TMP, 'buch.html'), ziel = path.join(OUT, NAME + '.pdf');
  let seiten = {};
  for (let durchgang = 1; durchgang <= 2; durchgang++) {
    const inhalt = buchHtml(seiten);
    fs.writeFileSync(html, inhalt);
    await page.goto('file://' + html);
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: ziel, preferCSSPageSize: true, printBackground: true, outline: true, tagged: true });
    const r = await pdfSeiten(ziel);
    if (durchgang === 1) { seiten = r.seiten; continue; }
    const rep = await lesezeichenReparieren(ziel, inhalt);
    console.log(`PDF: ${r.anzahl} Seiten, Inhaltsverzeichnis: ${Object.keys(r.seiten).length}/${teile.length} Einträge, ${rep} Lesezeichen repariert`);
  }
  await page.close();
}

// ---------------------------------------------------------------- Cover & Szenenbilder als Bild
async function bilder(browser) {
  const css = `<style>${fontCss('file://' + path.join(ROOT, 'fonts') + '/')}${fs.readFileSync(path.join(__dirname, 'buch.css'), 'utf8')}
    html,body{margin:0;background:#1B2A31} .vollbild{break-before:auto}</style>`;
  const page = await browser.newPage({ viewport: { width: 560, height: 794 }, deviceScaleFactor: 1600 / 560 });
  fs.writeFileSync(path.join(TMP, 'cover.html'), `<!doctype html><html><head><meta charset="utf-8">${css}</head><body>${cover()}</body></html>`);
  await page.goto('file://' + path.join(TMP, 'cover.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(OUT, 'cover.jpg'), type: 'jpeg', quality: 92, clip: { x: 0, y: 0, width: 560, height: 792 } });
  await page.close();

  // Banner (ohne Text) für die Kapitelanfänge im EPUB
  const b = await browser.newPage({ viewport: { width: 600, height: 380 }, deviceScaleFactor: 2 });
  const banner = {};
  for (const t of teile.filter(t => t.art === 'kapitel' || t.art === 'plan')) {
    const svg = szene(t.t, { id: 'b', seed: 11 + (+t.nummer || 30), viewBox: '0 22 148 93.7' });
    await b.setContent(`<html><body style="margin:0">${svg.replace('<svg ', '<svg style="width:600px;height:380px;display:block" ')}</body></html>`);
    const datei = path.join(TMP, 'epub', 'OEBPS', 'images', `szene-${t.id}.jpg`);
    await b.screenshot({ path: datei, type: 'jpeg', quality: 86 });
    banner[t.id] = `szene-${t.id}.jpg`;
  }
  await b.close();
  return banner;
}

// ---------------------------------------------------------------- EPUB 3
function epubSeite(titel, body, klasse = '') {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${CFG.sprache}" lang="${CFG.sprache}">
<head><meta charset="UTF-8"/><title>${esc(titel)}</title><link rel="stylesheet" type="text/css" href="../styles/epub.css"/></head>
<body${klasse ? ` class="${klasse}"` : ''}>
${xhtml(body)}
</body>
</html>`;
}
async function epub(banner) {
  const base = path.join(TMP, 'epub'), O = path.join(base, 'OEBPS');
  for (const d of ['META-INF', 'OEBPS/text', 'OEBPS/styles', 'OEBPS/fonts', 'OEBPS/images']) fs.mkdirSync(path.join(base, d), { recursive: true });
  fs.writeFileSync(path.join(base, 'mimetype'), 'application/epub+zip');
  fs.writeFileSync(path.join(base, 'META-INF', 'container.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`);
  const fonts = fs.readdirSync(path.join(ROOT, 'fonts')).filter(f => f.endsWith('.woff2'));
  fonts.forEach(f => fs.copyFileSync(path.join(ROOT, 'fonts', f), path.join(O, 'fonts', f)));
  fs.writeFileSync(path.join(O, 'styles', 'epub.css'), fontCss('../fonts/') + fs.readFileSync(path.join(__dirname, 'epub.css'), 'utf8').replace('ORNAMENT', ORN));
  fs.copyFileSync(path.join(OUT, 'cover.jpg'), path.join(O, 'images', 'cover.jpg'));

  const dateien = []; const ctx = { zitate: [] };
  const add = (id, titel, body, klasse, props) => { fs.writeFileSync(path.join(O, 'text', id + '.xhtml'), epubSeite(titel, body, klasse)); dateien.push({ id, titel, props }); };
  add('cover', CFG.titel, `<section epub:type="cover" class="cover-seite"><img src="../images/cover.jpg" alt="${esc(CFG.titel)} – Cover"/></section>`, 'cover');
  add('titel', CFG.titel, `<section epub:type="titlepage" class="titelseite">${emblem()}<h1 class="t">${esc(CFG.titel)}</h1><p class="u">${esc(CFG.untertitel)}</p>${CFG.autor ? `<p class="a">${esc(CFG.autor)}</p>` : ''}${CFG.verlag ? `<p class="v">${esc(CFG.verlag)}</p>` : ''}
    <p class="widmung">${CFG.widmung}</p></section>`);
  add('impressum', 'Impressum', `<section epub:type="copyright-page" class="impressum">
    <p><strong>${esc(CFG.titel)}</strong><br/>${esc(CFG.untertitel)}</p>
    <p>© ${CFG.jahr}${CFG.autor ? ' ' + esc(CFG.autor) : ''}. Alle Rechte vorbehalten. Die Zitate ohne Namensangabe wurden für dieses Buch geschrieben.</p>
    ${CFG.verlag ? `<p>Verlag: ${esc(CFG.verlag)}</p>` : ''}
    <p><strong>Wichtiger Hinweis:</strong> Die beschriebenen Methoden stützen sich auf veröffentlichte wissenschaftliche Studien (Stand ${CFG.jahr}; Quellen im Anhang). Das Buch ersetzt keine ärztliche, psychotherapeutische oder psychologische Beratung oder Behandlung. Wenn es dir über längere Zeit schlecht geht oder du an Suizid denkst, hol dir bitte sofort Hilfe – zum Beispiel bei der Telefonseelsorge: Deutschland 0800 111 0 111, Österreich 142, Schweiz 143. Im Notfall: 112.</p>
  </section>`);
  for (const t of teile) {
    ctx.wo = t.titel;
    const label = `<p class="kopf-label">${labelFuer(t)}</p>`;
    let kopf;
    if (banner[t.id]) {
      kopf = `<div class="banner"><img src="../images/${banner[t.id]}" alt=""/></div>${label}${t.nummer ? `<p class="kap-nummer">${nr2(t.nummer)}</p>` : ''}<h1>${esc(t.titel)}</h1>${t.untertitel ? `<p class="kopf-unter">${esc(t.untertitel)}</p>` : ''}${t.motto ? `<div class="motto"><p>„${esc(t.motto)}“</p>${t.motto_von ? `<p class="motto-von">— ${esc(t.motto_von)}</p>` : ''}</div>` : ''}`;
    } else {
      kopf = `${emblem()}${label}<h1>${esc(t.titel)}</h1>${t.untertitel ? `<p class="kopf-unter">${esc(t.untertitel)}</p>` : ''}`;
    }
    const body = t.art === 'zitate' ? zitatSammlung('epub') : render(t.body, ctx, 'epub');
    const typ = { kapitel: 'chapter', plan: 'chapter', vorwort: 'preface', nachwort: 'afterword', zitate: 'appendix', anhang: 'bibliography' }[t.art];
    add(t.id, t.titel, `<section epub:type="${typ}" class="${t.art}"><header class="kopf">${kopf}</header><div class="text">${body}</div></section>`);
  }

  const navLi = teile.map(t => `<li><a href="text/${t.id}.xhtml">${t.art === 'kapitel' ? nr2(t.nummer) + ' · ' : ''}${esc(t.titel)}</a></li>`).join('\n');
  fs.writeFileSync(path.join(O, 'nav.xhtml'), `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${CFG.sprache}" lang="${CFG.sprache}">
<head><meta charset="UTF-8"/><title>Inhalt</title><link rel="stylesheet" type="text/css" href="styles/epub.css"/></head>
<body><nav epub:type="toc" id="toc" class="toc"><h1>Inhalt</h1><ol>
<li><a href="text/impressum.xhtml">Impressum</a></li>
${navLi}
</ol></nav>
<nav epub:type="landmarks" hidden="hidden"><ol>
<li><a epub:type="cover" href="text/cover.xhtml">Cover</a></li>
<li><a epub:type="bodymatter" href="text/${teile.find(t => t.art === 'kapitel').id}.xhtml">Los geht’s</a></li>
</ol></nav></body></html>`);
  fs.writeFileSync(path.join(O, 'toc.ncx'), `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="${CFG.kennung}"/></head>
<docTitle><text>${esc(CFG.titel)}</text></docTitle><navMap>
${dateien.filter(d => !['cover', 'titel'].includes(d.id)).map((d, i) => `<navPoint id="n${i + 1}" playOrder="${i + 1}"><navLabel><text>${esc(d.titel)}</text></navLabel><content src="text/${d.id}.xhtml"/></navPoint>`).join('\n')}
</navMap></ncx>`);

  const bilderListe = fs.readdirSync(path.join(O, 'images'));
  const jetzt = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  fs.writeFileSync(path.join(O, 'content.opf'), `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="${CFG.sprache}">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
  <dc:identifier id="bookid">${CFG.kennung}</dc:identifier>
  <dc:title>${esc(CFG.titel)}</dc:title>
  <dc:language>${CFG.sprache}</dc:language>
  ${CFG.autor ? `<dc:creator>${esc(CFG.autor)}</dc:creator>` : ''}
  ${CFG.verlag ? `<dc:publisher>${esc(CFG.verlag)}</dc:publisher>` : ''}
  <dc:description>${esc(CFG.untertitel)}</dc:description>
  <dc:rights>© ${CFG.jahr}${CFG.autor ? ' ' + esc(CFG.autor) : ''}. Alle Rechte vorbehalten.</dc:rights>
  <dc:subject>Trennung</dc:subject><dc:subject>Liebeskummer</dc:subject><dc:subject>Selbsthilfe</dc:subject>
  <meta property="dcterms:modified">${jetzt}</meta>
  <meta name="cover" content="img-cover-jpg"/>
</metadata>
<manifest>
  <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
  <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
  <item id="css" href="styles/epub.css" media-type="text/css"/>
${fonts.map(f => `  <item id="font-${f.replace(/\W/g, '-')}" href="fonts/${f}" media-type="font/woff2"/>`).join('\n')}
${bilderListe.map(f => `  <item id="img-${f.replace(/\W/g, '-')}" href="images/${f}" media-type="image/jpeg"${f === 'cover.jpg' ? ' properties="cover-image"' : ''}/>`).join('\n')}
${dateien.map(d => `  <item id="x-${d.id}" href="text/${d.id}.xhtml" media-type="application/xhtml+xml"${d.id === 'titel' ? ' properties="svg"' : ''}/>`).join('\n')}
</manifest>
<spine toc="ncx">
${dateien.map(d => `  <itemref idref="x-${d.id}"${d.id === 'cover' ? ' linear="yes"' : ''}/>`).join('\n')}
</spine>
<guide><reference type="cover" title="Cover" href="text/cover.xhtml"/></guide>
</package>`);
  // Seiten mit eingebettetem SVG (Embleme) kennzeichnen
  let opf = fs.readFileSync(path.join(O, 'content.opf'), 'utf8');
  for (const d of dateien) {
    const enthaeltSvg = fs.readFileSync(path.join(O, 'text', d.id + '.xhtml'), 'utf8').includes('<svg');
    const re = new RegExp(`(<item id="x-${d.id}"[^>]*?)( properties="svg")?/>`);
    opf = opf.replace(re, (_, a) => `${a}${enthaeltSvg ? ' properties="svg"' : ''}/>`);
  }
  fs.writeFileSync(path.join(O, 'content.opf'), opf);

  const ziel = path.join(OUT, NAME + '.epub');
  execFileSync('python3', [path.join(__dirname, 'epub_packen.py'), base, ziel], { stdio: 'inherit' });
}

// ---------------------------------------------------------------- Instagram-Zitatkarten
const THEMEN = [
  { name: 'nacht', bg: 'linear-gradient(165deg,#1B2A31 0%,#24373F 55%,#2F4B54 100%)', text: '#F6EFE4', akzent: '#D9B36C', fuss: '#B9C2BE', huegel: '#2F4B54', sonne: '#E8B48E' },
  { name: 'salbei', bg: 'linear-gradient(180deg,#E6EEE8 0%,#D5E1D8 100%)', text: '#20393E', akzent: '#B9735A', fuss: '#5E7A70', huegel: '#7E9A8C', sonne: '#B9735A' },
  { name: 'sand', bg: 'linear-gradient(180deg,#F7F1E8 0%,#EFE5D7 100%)', text: '#7A4636', akzent: '#C9A35B', fuss: '#9A8670', huegel: '#C9B8A0', sonne: '#B9735A' },
  { name: 'morgen', bg: 'linear-gradient(180deg,#F6DCC4 0%,#EEBC98 100%)', text: '#22343A', akzent: '#8E5440', fuss: '#7A5644', huegel: '#C98E6E', sonne: '#FBEBD5' },
  { name: 'petrol', bg: 'linear-gradient(170deg,#2F4B54 0%,#3E6466 100%)', text: '#F6EFE4', akzent: '#E8B48E', fuss: '#B8C7C3', huegel: '#24373F', sonne: '#E8B48E' },
];
function karteHtml(z, th) {
  const len = z.text.length;
  const gr = len < 60 ? 76 : len < 95 ? 66 : len < 135 ? 58 : len < 180 ? 51 : 45;
  const fussText = [CFG.instagram_name, CFG.titel].filter(Boolean).join('  ·  ');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss('file://' + path.join(ROOT, 'fonts') + '/')}
  html,body{margin:0;font-variation-settings:'WONK' 0,'SOFT' 50}
  .k{width:1080px;height:1350px;box-sizing:border-box;padding:120px 112px 96px;background:${th.bg};display:flex;flex-direction:column;align-items:center;justify-content:space-between;text-align:center;color:${th.text}}
  .k svg.emblem{width:210px;height:105px}
  .mitte{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center}
  .orn{width:150px;height:20px;margin-bottom:46px}
  .z{font-family:'Fraunces';font-style:italic;font-weight:400;font-size:${gr}px;line-height:1.3;letter-spacing:-.003em;margin:0;text-wrap:balance}
  .v{font-family:'DM Sans';font-weight:600;font-size:22px;letter-spacing:.18em;text-transform:uppercase;margin-top:44px;color:${th.akzent}}
  .f{font-family:'DM Sans';font-weight:600;font-size:19px;letter-spacing:.2em;text-transform:uppercase;color:${th.fuss}}
  </style></head><body><div class="k">
  ${emblem(th.huegel, th.sonne, th.akzent)}
  <div class="mitte">
    <svg class="orn" viewBox="0 0 120 16"><path d="M4 8 H46 M74 8 H116" stroke="${th.akzent}" stroke-width="1.2" stroke-linecap="round"/><circle cx="60" cy="8" r="5.2" fill="none" stroke="${th.akzent}" stroke-width="1.2"/><circle cx="60" cy="8" r="1.8" fill="${th.akzent}"/></svg>
    <p class="z">„${inline(z.text)}“</p>
    ${z.von ? `<div class="v">${esc(z.von.replace(/\s*\(.*\)$/, ''))}</div>` : ''}
  </div>
  <div class="f">${esc(fussText)}</div>
  </div></body></html>`;
}
async function karten(browser) {
  const dir = path.join(OUT, 'instagram');
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const erlaubt = ZITATE.filter(z => !CFG.instagram_nicht_posten.some(n => z.von.includes(n)));
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  const zeilen = [`# Zitate aus „${CFG.titel}“`, '', 'Alle Sätze ohne Namensangabe wurden für dieses Buch geschrieben und dürfen frei für eigene Beiträge verwendet werden.',
    'Zitate von Hesse, Camus und Cohen stehen nur im Buch (Zitatrecht) und wurden bewusst nicht als Bildkarte erstellt, weil ihre Werke noch urheberrechtlich geschützt sind.', '',
    '**Hashtag-Vorschlag:** #liebeskummer #trennung #selbstliebe #heilung #herzschmerz #loslassen #selbstfürsorge #mentalegesundheit #neuanfang #zitate', ''];
  let i = 0;
  for (const z of erlaubt) {
    i++;
    const th = THEMEN[(i - 1) % THEMEN.length];
    const datei = `zitat-${nr2(i)}-${th.name}.png`;
    fs.writeFileSync(path.join(TMP, 'karte.html'), karteHtml(z, th));
    await page.goto('file://' + path.join(TMP, 'karte.html'));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(dir, datei) });
    zeilen.push(`${i}. „${z.text}“${z.von ? ' — ' + z.von : ''}  `, `   Bild: \`${datei}\` · aus: ${z.wo}`, '');
  }
  const nur = ZITATE.filter(z => !erlaubt.includes(z));
  if (nur.length) { zeilen.push('## Nur im Buch', ''); nur.forEach(z => zeilen.push(`- „${z.text}“ — ${z.von}`)); }
  fs.writeFileSync(path.join(dir, 'zitate.md'), zeilen.join('\n') + '\n');
  await page.close();
  console.log(`Instagram: ${erlaubt.length} Zitatkarten`);
}

// ---------------------------------------------------------------- Zitatliste als PDF (A4, zum Ausdrucken und Planen)
async function zitatListe(browser) {
  const erlaubt = ZITATE.filter(z => !CFG.instagram_nicht_posten.some(n => z.von.includes(n)));
  const gruppen = [];
  for (const z of ZITATE) {
    let g = gruppen.find(g => g.wo === z.wo);
    if (!g) gruppen.push(g = { wo: z.wo, zitate: [] });
    g.zitate.push(z);
  }
  const kapNr = wo => { const t = teile.find(t => t.titel === wo); return t && t.art === 'kapitel' ? 'Kapitel ' + t.nummer : labelFuer(t || {}); };
  let n = 0;
  const liste = gruppen.map(g => `<section class="gruppe"><p class="g-label">${esc(kapNr(g.wo))}</p><h2>${esc(g.wo)}</h2>${g.zitate.map(z => {
    n++;
    const k = erlaubt.indexOf(z);
    const status = k >= 0 ? `<span class="frei">Instagram-Karte ${nr2(k + 1)}</span>` : `<span class="nur">nur im Buch</span>`;
    return `<div class="z"><span class="nr">${nr2(n)}</span><div><p class="txt">„${inline(z.text)}“</p><p class="meta">${z.von ? esc(z.von) + ' · ' : ''}${status}</p></div></div>`;
  }).join('')}</section>`).join('');
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Alle Zitate – ${esc(CFG.titel)}</title><style>
  ${fontCss('file://' + path.join(ROOT, 'fonts') + '/')}
  @page { size: A4; margin: 18mm 20mm 20mm; background: #FBF7F1;
    @bottom-center { content: counter(page); font: 500 8pt 'DM Sans'; color: #8C9893; letter-spacing: .08em; } }
  html { background: #FBF7F1; }
  body { margin: 0; font-family: 'Literata', serif; color: #2A3236; font-variation-settings: 'WONK' 0, 'SOFT' 50; }
  .kopf { text-align: center; padding: 6mm 0 9mm; border-bottom: .3mm solid #E2D6C4; margin-bottom: 4mm; }
  .kopf .emblem { width: 26mm; display: block; margin: 0 auto 5mm; }
  .kopf .l { font-family: 'DM Sans'; font-weight: 700; font-size: 7.5pt; letter-spacing: .26em; text-transform: uppercase; color: #B9735A; margin: 0 0 2mm; }
  .kopf h1 { font-family: 'Fraunces'; font-weight: 500; font-size: 26pt; color: #2F4B54; margin: 0 0 2mm; }
  .kopf .u { font-style: italic; color: #6F7B78; font-size: 10pt; margin: 0; }
  .info { font-size: 8.6pt; line-height: 1.55; color: #5D6966; margin: 0 0 2mm; }
  .info .frei, .info .nur { margin-right: 1mm; }
  .gruppe { break-inside: auto; margin-top: 7mm; }
  .g-label { font-family: 'DM Sans'; font-weight: 700; font-size: 6.8pt; letter-spacing: .22em; text-transform: uppercase; color: #B9735A; margin: 0 0 1mm; break-after: avoid; }
  h2 { font-family: 'Fraunces'; font-weight: 560; font-size: 13pt; color: #2F4B54; margin: 0 0 2mm; break-after: avoid; }
  .z { display: flex; gap: 4mm; padding: 3mm 0; border-bottom: .2mm solid #E6DED2; break-inside: avoid; }
  .nr { flex: 0 0 8mm; font-family: 'Fraunces'; font-size: 10pt; color: #C9A35B; padding-top: .6mm; }
  .txt { font-family: 'Fraunces'; font-style: italic; font-size: 12pt; line-height: 1.4; color: #8E5440; margin: 0 0 1.2mm; }
  .meta { font-family: 'DM Sans'; font-size: 7pt; letter-spacing: .1em; text-transform: uppercase; color: #6F7B78; margin: 0; }
  .frei, .nur { display: inline-block; padding: .3mm 1.8mm; border-radius: 3mm; letter-spacing: .08em; }
  .frei { background: #E4ECE6; color: #3F6255; }
  .nur { background: #F1E4DB; color: #8E5440; }
  .fuss { margin: 3mm 0 0; font-family: 'DM Sans'; font-size: 7pt; letter-spacing: .18em; text-transform: uppercase; color: #8C9893; }
  </style></head><body>
  <header class="kopf">${emblem()}<p class="l">${esc(CFG.titel)}</p><h1>Alle Zitate</h1><p class="u">${ZITATE.length} Sätze zum Festhalten – sortiert nach Kapiteln</p>${CFG.autor || CFG.verlag ? `<p class="fuss">${[CFG.autor, CFG.verlag].filter(Boolean).map(esc).join(' · ')}</p>` : ''}</header>
  <p class="info"><span class="frei">Instagram-Karte</span> frei postbar: selbst geschrieben oder gemeinfrei, mit Nummer der fertigen Bildkarte im Ordner <i>instagram/</i>.<br>
  <span class="nur">nur im Buch</span> noch urheberrechtlich geschützt, im Buch per Zitatrecht verwendet – bitte nicht als eigenen Beitrag posten.</p>
  ${liste}
  </body></html>`;
  fs.writeFileSync(path.join(TMP, 'zitate.html'), html);
  const page = await browser.newPage();
  await page.goto('file://' + path.join(TMP, 'zitate.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: path.join(OUT, 'Zitate-' + NAME + '.pdf'), preferCSSPageSize: true, printBackground: true });
  await page.close();
  console.log(`Zitatliste: ${ZITATE.length} Zitate (${erlaubt.length} frei postbar)`);
}

// ---------------------------------------------------------------- Los
(async () => {
  fs.rmSync(TMP, { recursive: true, force: true });
  fs.mkdirSync(path.join(TMP, 'epub', 'OEBPS', 'images'), { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await pw.chromium.launch();
  try {
    await pdf(browser);
    const banner = await bilder(browser);
    await epub(banner);
    await karten(browser);
    await zitatListe(browser);
  } finally { await browser.close(); }
  console.log(`Zitate gesamt: ${ZITATE.length}. Fertig → ${path.relative(process.cwd(), OUT) || '.'}`);
})().catch(e => { console.error(e); process.exit(1); });
