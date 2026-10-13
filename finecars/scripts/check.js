// Prüft den fertigen Build in dist/ (läuft nach `node build.js`):
//   • interne Links und eingebundene Dateien existieren
//   • jede Seite hat <title>, Meta-Description und genau eine <h1>
//   • alle <img> haben ein alt-Attribut, IDs sind eindeutig
//   • keine Inline-Styles/-Skripte (verträglich mit der Content-Security-Policy)
// Externe Links werden aufgelistet, aber nicht abgerufen.

import { readFile, readdir, stat } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const errors = [];
const external = new Set();

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else out.push(p);
  }
  return out;
}

async function exists(urlPath) {
  const clean = decodeURIComponent(urlPath.split(/[?#]/)[0]);
  const target = join(DIST, clean);
  try {
    const s = await stat(target);
    if (s.isDirectory()) { await stat(join(target, 'index.html')); }
    return true;
  } catch {
    return false;
  }
}

const files = (await walk(DIST)).filter(f => f.endsWith('.html'));
for (const file of files) {
  const rel = '/' + relative(DIST, file);
  const html = await readFile(file, 'utf8');
  const err = msg => errors.push(`${rel}: ${msg}`);

  if (!/<title>[^<]{10,}<\/title>/.test(html)) err('fehlender oder zu kurzer <title>');
  if (!/<meta name="description" content="[^"]{50,}"/.test(html)) err('fehlende oder zu kurze Meta-Description');
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) err(`${h1} <h1>-Überschriften (erwartet: 1)`);
  for (const img of html.match(/<img\b[^>]*>/g) || []) {
    if (!/\salt="/.test(img)) err(`<img> ohne alt: ${img.slice(0, 80)}`);
    if (!/\swidth="\d+"/.test(img) || !/\sheight="\d+"/.test(img)) err(`<img> ohne width/height: ${img.slice(0, 80)}`);
  }
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dup.length) err(`doppelte IDs: ${[...new Set(dup)].join(', ')}`);
  if (/\sstyle="/.test(html)) err('Inline-Style gefunden (CSP)');
  if (/<script(?![^>]*\b(src=|type="application\/(ld\+)?json"))[^>]*>/.test(html)) err('Inline-Skript gefunden (CSP)');
  for (const m of html.matchAll(/aria-(?:labelledby|describedby|controls)="([^"]+)"/g)) {
    for (const id of m[1].split(/\s+/)) if (!ids.includes(id)) err(`ARIA-Verweis auf fehlende ID "${id}"`);
  }

  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const url = m[1];
    if (/^(mailto:|tel:|#|data:)/.test(url)) continue;
    if (/^https?:\/\//.test(url)) { external.add(url.split('?')[0]); continue; }
    if (url.startsWith('/') && !(await exists(url))) err(`toter interner Link: ${url}`);
  }
  for (const m of html.matchAll(/\ssrcset="([^"]+)"/g)) {
    for (const part of m[1].split(',')) {
      const url = part.trim().split(/\s+/)[0];
      if (url.startsWith('/') && !(await exists(url))) err(`fehlende srcset-Datei: ${url}`);
    }
  }
}

// CSS-Verweise (Schriften)
const css = await readFile(join(DIST, 'assets/css/site.css'), 'utf8');
for (const m of css.matchAll(/url\('([^']+)'\)/g)) {
  if (m[1].startsWith('/') && !(await exists(m[1]))) errors.push(`site.css: fehlende Datei ${m[1]}`);
}

console.log(`Geprüft: ${files.length} HTML-Seiten`);
console.log(`Externe Links (nicht abgerufen): ${[...external].sort().join(', ') || '–'}`);
if (errors.length) {
  console.error(`\n✖ ${errors.length} Problem(e):`);
  for (const e of errors) console.error('  • ' + e);
  process.exit(1);
}
console.log('✔ Keine Probleme gefunden.');
