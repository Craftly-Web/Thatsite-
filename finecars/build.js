// Statischer Build der FineCars-Website (ohne externe Abhängigkeiten).
//
//   node build.js                    → erzeugt dist/
//   FINECARS_RELEASE=1 node build.js → bricht ab, solange Beispieldaten,
//                                       Demomodus oder Platzhalter aktiv sind
//
// Ablauf: Konfiguration + Fahrzeugdaten laden → Assets kopieren → Seiten
// rendern → Sitemap/robots.txt schreiben → Bericht über offene Punkte.

import { mkdir, rm, writeFile, readFile, cp, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import config from './site.config.js';
import { loadInventory, jsonFileSource } from './src/lib/vehicles.js';
import { usedPlaceholders, resetPlaceholders } from './src/lib/html.js';
import { vehicleSvg, heroSvg } from './src/demo/car-art.js';
import home from './src/pages/home.js';
import inventory from './src/pages/inventory.js';
import vehiclePage from './src/pages/vehicle.js';
import about from './src/pages/about.js';
import contact from './src/pages/contact.js';
import { impressum, datenschutz } from './src/pages/legal.js';
import notFound from './src/pages/notfound.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');
const OUT = resolve(ROOT, process.env.FINECARS_OUT || 'dist');
const DATA = resolve(ROOT, process.env.FINECARS_DATA || 'data/vehicles.json');

// Reihenfolge der Stylesheets (werden zu einer Datei zusammengefasst).
const CSS_FILES = ['tokens.css', 'base.css', 'layout.css', 'components.css', 'pages.css'];

async function write(path, content) {
  const full = join(OUT, path);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, content);
}

export async function build({ quiet = false } = {}) {
  const log = (...a) => { if (!quiet) console.log(...a); };
  const started = Date.now();
  resetPlaceholders();

  const { meta, vehicles, warnings } = await loadInventory(jsonFileSource(DATA));

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  // Assets
  for (const dir of ['fonts', 'js', 'img']) {
    await cp(join(SRC, 'assets', dir), join(OUT, 'assets', dir), { recursive: true });
  }
  // Fahrzeugfotos (optional): src/media/ → /media/
  if (existsSync(join(SRC, 'media'))) await cp(join(SRC, 'media'), join(OUT, 'media'), { recursive: true });
  const css = (await Promise.all(CSS_FILES.map(f => readFile(join(SRC, 'assets/css', f), 'utf8'))))
    .map((c, i) => `/* ${CSS_FILES[i]} */\n${c}`)
    .join('\n');
  await write('assets/css/site.css', css);

  const hash = createHash('sha256').update(css);
  for (const f of (await readdir(join(SRC, 'assets/js'))).sort()) hash.update(await readFile(join(SRC, 'assets/js', f)));
  const assetVersion = hash.digest('hex').slice(0, 10);

  // Illustrationen
  await write('assets/img/hero-car.svg', heroSvg({ body: 'limousine', paint: '#a7aeb5' }));
  for (const v of vehicles) {
    if (!v.demoArt) continue;
    for (let i = 0; i < 4; i++) {
      await write(`assets/demo/${v.slug}-${i + 1}.svg`, vehicleSvg({ ...v.demoArt, view: i }));
    }
  }

  const ctx = {
    config,
    meta,
    vehicles,
    assetVersion,
    logoSvg: (await readFile(join(SRC, 'assets/img/logo.svg'), 'utf8')).trim()
  };

  // Seiten
  const pages = [
    ['index.html', home(ctx)],
    ['fahrzeuge/index.html', inventory(ctx)],
    ['ueber-uns/index.html', about(ctx)],
    ['kontakt/index.html', contact(ctx)],
    ['impressum/index.html', impressum(ctx)],
    ['datenschutz/index.html', datenschutz(ctx)],
    ['404.html', notFound(ctx)],
    ...vehicles.map(v => [`fahrzeuge/${v.slug}/index.html`, vehiclePage(v, ctx)])
  ];
  for (const [path, htmlStr] of pages) await write(path, htmlStr);

  // Sitemap und robots.txt
  const sitemapPaths = ['/', '/fahrzeuge/', ...vehicles.map(v => v.url), '/ueber-uns/', '/kontakt/', '/impressum/', '/datenschutz/'];
  if (config.siteUrl) {
    const today = new Date().toISOString().slice(0, 10);
    await write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapPaths.map(p => `  <url><loc>${config.siteUrl}${p}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);
  }
  await write('robots.txt', `User-agent: *\n${config.demoMode ? '# Vorschau: Seiten tragen "noindex".\n' : ''}Allow: /\nDisallow: /api/\n${config.siteUrl ? `\nSitemap: ${config.siteUrl}/sitemap.xml\n` : ''}`);

  // Bericht
  const placeholders = usedPlaceholders();
  const issues = [];
  if (config.demoMode) issues.push('Demomodus ist aktiv (FINECARS_DEMO=off für den Livegang).');
  if (meta.isDemo) issues.push(`Fahrzeugdaten sind Beispieldaten (${vehicles.filter(v => v.isDemo).length} Datensätze mit isDemo: true).`);
  if (!config.siteUrl) issues.push('SITE_URL ist nicht gesetzt – keine Canonical-URLs, keine sitemap.xml.');
  if (!config.contactForm.enabled) issues.push('Kontaktformular ist nicht freigeschaltet (FINECARS_CONTACT_FORM=on nach Einrichtung).');
  for (const p of placeholders) issues.push(`Platzhalter: ${p}`);

  log(`✔ ${pages.length} Seiten in ${Date.now() - started} ms erzeugt → ${OUT}`);
  for (const w of warnings) log(`  ⚠ Daten: ${w}`);
  if (issues.length) {
    log(`\nOffene Punkte vor der Veröffentlichung (${issues.length}):`);
    for (const i of issues) log('  • ' + i);
  }

  if (process.env.FINECARS_RELEASE === '1') {
    const blocking = issues.filter(i => !i.startsWith('Kontaktformular'));
    if (blocking.length) {
      console.error(`\n✖ Release-Build abgebrochen: ${blocking.length} offene Punkte (siehe oben).`);
      process.exit(1);
    }
  }
  return { pages: pages.map(p => p[0]), issues, placeholders, warnings };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  build().catch(err => {
    console.error('✖ Build fehlgeschlagen:', err.message);
    process.exit(1);
  });
}
