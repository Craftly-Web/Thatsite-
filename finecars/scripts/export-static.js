// Exportiert die Website als eigenständige HTML-Dateien mit relativen Pfaden.
//
//   npm run export   → export/finecars-website/ und export/finecars-website.zip
//
// Das Ergebnis funktioniert ohne Build-Werkzeuge und ohne Server:
//   • index.html per Doppelklick im Browser öffnen (file://), oder
//   • den Ordnerinhalt bei einem beliebigen Webhoster hochladen.
// Unterschiede zur Vercel-Version: Links zeigen direkt auf …/index.html,
// Skripte sind ohne ES-Module gebündelt, das Kontaktformular hat keinen
// Server-Endpunkt (im Vorschaumodus wird ohnehin nichts gesendet).

import { readFile, writeFile, readdir, rm, cp, mkdir } from 'node:fs/promises';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const OUT_BASE = join(ROOT, 'export');
const OUT = join(OUT_BASE, 'finecars-website');

const build = spawnSync(process.execPath, [join(ROOT, 'build.js')], { stdio: 'inherit', cwd: ROOT });
if (build.status !== 0) process.exit(1);

await rm(OUT_BASE, { recursive: true, force: true });
await mkdir(OUT_BASE, { recursive: true });
await cp(DIST, OUT, { recursive: true });
// Für die lokale Datei-Version nicht relevant
await rm(join(OUT, 'robots.txt'), { force: true });
await rm(join(OUT, 'sitemap.xml'), { force: true });

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else out.push(p);
  }
  return out;
}

// Seitenpfade mit Verzeichnis-URLs (/fahrzeuge/ → fahrzeuge/index.html)
const ROOTS = '(?:assets|fahrzeuge|kontakt|ueber-uns|impressum|datenschutz|media|404\\.html)';

function relativize(text, prefix) {
  const target = path => {
    let [p, query = ''] = path.split('?');
    if (p === '' || p.endsWith('/')) p += 'index.html';
    return prefix + p + (query ? '?' + query : '');
  };
  return text
    // Startseite: href="/" bzw. JSON "url":"/"
    .replace(/(="|":")\/(?=")/g, (m, lead) => lead + target(''))
    // Übrige interne URLs in Attributen, srcset-Listen und JSON-Strings
    .replace(new RegExp(`(["' ,])\\/(${ROOTS}[^"' ,)]*)`, 'g'), (m, lead, path) => lead + target(path));
}

// Browser-Skripte zu klassischen Skripten bündeln (file:// erlaubt keine ES-Module)
const jsDir = join(OUT, 'assets/js');
const stripExports = src => src.replace(/^export\s+(?=(const|function|let|class)\b)/gm, '');
async function bundle(name) {
  let src = await readFile(join(DIST, 'assets/js', name), 'utf8');
  const deps = [];
  src = src.replace(/^import\s+\{[^}]*\}\s+from\s+'\.\/([\w-]+\.js)';\s*$/gm, (m, dep) => { deps.push(dep); return ''; });
  const parts = [];
  for (const d of deps) parts.push(stripExports(await readFile(join(DIST, 'assets/js', d), 'utf8')));
  parts.push(src);
  return `(function () {\n'use strict';\n${parts.join('\n')}\n})();\n`;
}
for (const f of ['main.js', 'inventory.js', 'gallery.js', 'contact-form.js']) {
  await writeFile(join(jsDir, f), await bundle(f));
}
for (const f of ['inventory-core.js', 'contact-validation.js']) await rm(join(jsDir, f));

// CSS: Schriften einbetten – Browser blockieren Schriftdateien unter file://
const cssPath = join(OUT, 'assets/css/site.css');
let css = await readFile(cssPath, 'utf8');
for (const m of [...new Set(css.match(/url\('\/assets\/fonts\/[^']+'\)/g))]) {
  const file = m.slice(6, -2);
  const data = (await readFile(join(DIST, file))).toString('base64');
  css = css.split(m).join(`url('data:font/woff2;base64,${data}')`);
}
await writeFile(cssPath, css);
await rm(join(OUT, 'assets/fonts'), { recursive: true });
await cp(join(ROOT, 'src/assets/fonts/LICENSE.txt'), join(OUT, 'assets/css/FONT-LICENSE.txt'));

// HTML-Seiten anpassen
const pages = (await walk(OUT)).filter(f => f.endsWith('.html'));
for (const file of pages) {
  const depth = relative(OUT, dirname(file)).split(sep).filter(Boolean).length;
  const prefix = depth ? '../'.repeat(depth) : './';
  let html = await readFile(file, 'utf8');
  html = html.replace(/<script type="module" src="([^"?]+)\?v=[^"]*"><\/script>/g, '<script defer src="$1"></script>');
  html = html.replace(/(href|src)="(\/[^"]*)\?v=[^"]*"/g, '$1="$2"');
  html = html.replace(/<link rel="preload" href="\/assets\/fonts\/[^"]+"[^>]*>\n?/g, '');
  html = relativize(html, prefix);
  html = html.replace(/ action="\/fahrzeuge\/"/g, ` action="${prefix}fahrzeuge/index.html"`);
  await writeFile(file, html);
}

// ZIP-Archiv (über Python, falls vorhanden – sonst nur der Ordner)
const zip = spawnSync('python3', ['-c', `
import os, sys, zipfile
base, out = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk(base):
        for f in sorted(files):
            p = os.path.join(root, f)
            z.write(p, os.path.relpath(p, os.path.dirname(base)))
`, OUT, join(OUT_BASE, 'finecars-website.zip')], { stdio: 'inherit' });

console.log(`\n✔ Export: ${relative(ROOT, OUT)}/ (${pages.length} HTML-Seiten)${zip.status === 0 ? ' + export/finecars-website.zip' : ''}`);
console.log('  Start: export/finecars-website/index.html im Browser öffnen.');
