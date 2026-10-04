/*
  Baut das E-Book „Leichter. Ohne Diät.“ als PDF.

  Aufruf (im Ordner ebook/):   node build.js
  Ergebnis:                    dist/Leichter-ohne-Diaet.pdf  (+ dist/cover.png)

  Voraussetzungen: Node.js, Playwright mit Chromium, pdftotext (poppler-utils).
  Schriften werden von Google Fonts geladen (Internetverbindung nötig).

  Ablauf:
   1. src/index.html zusammensetzen (<!-- @include datei -->), Platzhalter aus config.json einsetzen
   2. Quellen [[schluessel]] in der Reihenfolge des ersten Auftretens nummerieren (src/quellen.js)
   3. Durchlauf 1 rendern, Seitenzahlen der Kapitel per pdftotext ermitteln
   4. Inhaltsverzeichnis füllen, Durchlauf 2 als finales PDF rendern (mit Lesezeichen)
*/
const fs = require('fs'), path = require('path'), os = require('os');
const { execFileSync } = require('child_process');
let pw; try { pw = require('playwright'); } catch { pw = require(path.join(execFileSync('npm', ['root', '-g']).toString().trim(), 'playwright')); }

const SRC = path.join(__dirname, 'src');
const DIST = path.join(__dirname, 'dist');
const OUT = path.join(DIST, 'Leichter-ohne-Diaet.pdf');
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const QUELLEN = require('./src/quellen.js');

const include = f => fs.readFileSync(path.join(SRC, f), 'utf8')
  .replace(/<!--\s*@include\s+(\S+)\s*-->/g, (m, g) => include(g));

let html = include('index.html');

// --- Quellen nummerieren ---
const order = [];
html = html.replace(/\[\[([\w,\s-]+)\]\]/g, (m, keys) => {
  const nums = keys.split(',').map(k => k.trim()).map(k => {
    if (!QUELLEN[k]) throw new Error('Unbekannte Quelle: ' + k);
    if (!order.includes(k)) order.push(k);
    return order.indexOf(k) + 1;
  });
  return `<sup class="ref">${nums.join(',')}</sup>`;
});
const refsHtml = order.map(k => `<li>${QUELLEN[k]}</li>`).join('\n');
html = html.replace('<!--QUELLEN-->', refsHtml);
// Siegel „Mit über X Studien“: nur Studien zählen, keine Leitlinien/Gesetze
const studien = order.filter(k => !/^(who|dge|eu)\d/.test(k)).length;
cfg.STUDIEN = String(Math.floor((studien - 1) / 10) * 10);
cfg.ANZAHL_QUELLEN = String(order.length);

// --- Zeichen, die in den Schriften fehlen, als Vektor-Glyphen (nur im Text, nicht in Tags) ---
const ARROW = '<svg class="arr" viewBox="0 0 18 10"><path d="M1 5h14M11 1.2 15 5l-4 3.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const STAR = '<svg class="arr star" viewBox="-11 -11 22 22"><use href="#star5" fill="currentColor"/></svg>';
const glyphs = s => s.split(/(<[^>]+>)/).map(part => part.startsWith('<') ? part : part.replace(/→/g, ARROW).replace(/★/g, STAR)).join('');

// --- Platzhalter ---
html = html.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in cfg ? cfg[k] : m));
html = html.replace(/<span class="author">\s*<\/span>/, '');
html = glyphs(html);
// Kurze Tabellen in einen Block packen, damit Chromium sie sauber komplett umbricht
html = html.replace(/<table class="swap">[\s\S]*?<\/table>/g, t => `<div class="tw">${t}</div>`);

// --- Inhaltsverzeichnis vorbereiten ---
const tocEntries = [];
html = html.replace(/<(section|div|h2)([^>]*?)data-toc="([^"]+)"([^>]*)>/g, (m, tag, a, title, b) => {
  const id = 'T' + (tocEntries.length + 1);
  const attrs = a + b;
  const sub = (attrs.match(/data-toc-sub="([^"]*)"/) || [])[1] || '';
  const num = (attrs.match(/data-num="([^"]*)"/) || [])[1] || '';
  const kind = (attrs.match(/data-kind="([^"]*)"/) || [])[1] || '';
  tocEntries.push({ id, title, sub, num, kind });
  return `<${tag}${a}data-toc="${title}"${b}><span class="pm">@@${id}@@</span>`;
});
const tocList = pages => tocEntries.map(e => `
  <li class="${e.kind}"><span class="n">${glyphs(e.num)}</span>
    <span class="t">${e.title}${e.sub ? `<small>${e.sub}</small>` : ''}</span>
    <span class="p">${pages[e.id] || '00'}</span></li>`).join('');

async function render(doc, file, opts = {}) {
  const tmpHtml = path.join(SRC, '.render.html');
  fs.writeFileSync(tmpHtml, doc);
  const browser = await pw.chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + tmpHtml, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: file, preferCSSPageSize: true, printBackground: true, outline: !!opts.outline, tagged: !!opts.outline });
  if (opts.cover) {
    await page.setViewportSize({ width: 643, height: 908 });
    await page.emulateMedia({ media: 'print' });
    const el = await page.$('.cover');
    const p2 = await browser.newPage({ deviceScaleFactor: 3, viewport: { width: 643, height: 908 } });
    await p2.goto('file://' + tmpHtml, { waitUntil: 'networkidle' });
    await p2.evaluate(() => document.fonts.ready);
    await (await p2.$('.cover')).screenshot({ path: opts.cover });
  }
  await browser.close();
  fs.unlinkSync(tmpHtml);
}

(async () => {
  fs.mkdirSync(DIST, { recursive: true });
  const tmpPdf = path.join(os.tmpdir(), 'ebook-pass1.pdf');

  // Durchlauf 1: Seitenzahlen ermitteln (Inhaltsverzeichnis hat Platzhalter gleicher Länge)
  await render(html.replace('<!--TOC-->', tocList({})), tmpPdf);
  const text = execFileSync('pdftotext', ['-layout', tmpPdf, '-']).toString();
  const pages = {};
  text.split('\f').forEach((t, i) => {
    for (const m of t.matchAll(/@@(T\d+)@@/g)) if (!pages[m[1]]) pages[m[1]] = i + 1;
  });
  const missing = tocEntries.filter(e => !pages[e.id]).map(e => e.title);
  if (missing.length) console.warn('Keine Seitenzahl gefunden für:', missing);

  // Durchlauf 2: final
  const final = html.replace('<!--TOC-->', tocList(pages)).replace(/<span class="pm">@@T\d+@@<\/span>/g, '');
  await render(final, OUT, { outline: true, cover: path.join(DIST, 'cover.png') });

  const info = execFileSync('pdfinfo', [OUT]).toString().match(/Pages:\s+(\d+)/);
  console.log(`Fertig: ${path.relative(process.cwd(), OUT)} – ${info ? info[1] : '?'} Seiten, ${order.length} Quellen`);
})();
