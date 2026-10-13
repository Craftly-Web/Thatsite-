// Lokaler Entwicklungsserver (ohne Abhängigkeiten).
//
//   npm start      → baut einmal und liefert dist/ unter http://localhost:4173 aus
//   npm run dev    → zusätzlich automatischer Neuaufbau bei Änderungen in src/, data/
//
// Verhält sich wie das Vercel-Hosting: saubere URLs (Verzeichnis-index.html),
// 404.html bei unbekannten Pfaden und /api/contact über die echte Funktion.
// Das Kontaktformular wird hier NICHT simuliert: ohne Umgebungsvariablen
// antwortet die Funktion mit "not_configured".

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { watch } from 'node:fs';
import { spawn } from 'node:child_process';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const PORT = Number(process.env.PORT) || 4173;
const WATCH = process.argv.includes('--watch');

// Sicherheits-Header wie in vercel.json (u. a. CSP), damit Verstöße lokal auffallen
const vercel = JSON.parse(await readFile(join(ROOT, 'vercel.json'), 'utf8'));
const GLOBAL_HEADERS = Object.fromEntries((vercel.headers.find(h => h.source === '/(.*)')?.headers || []).map(h => [h.key, h.value]));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

function runBuild() {
  return new Promise(resolve => {
    const p = spawn(process.execPath, [join(ROOT, 'build.js')], { stdio: 'inherit', cwd: ROOT });
    p.on('exit', code => resolve(code === 0));
  });
}

async function tryFile(path) {
  try {
    const s = await stat(path);
    if (s.isDirectory()) return tryFile(join(path, 'index.html'));
    return path;
  } catch {
    return null;
  }
}

async function handleApi(req, res) {
  const mod = await import(join(ROOT, 'api/contact.js') + '?t=' + Date.now());
  return mod.default(req, res);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/api/contact') return await handleApi(req, res);

    const pathname = decodeURIComponent(url.pathname);
    // Wie Vercel mit trailingSlash: Verzeichnis-URLs ohne Schrägstrich umleiten
    if (!pathname.endsWith('/') && !extname(pathname)) {
      const dir = await tryFile(join(DIST, normalize(pathname)));
      if (dir && dir.endsWith('index.html')) {
        res.writeHead(308, { Location: pathname + '/' + url.search });
        return res.end();
      }
    }
    const safe = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
    let file = await tryFile(join(DIST, safe));
    let status = 200;
    if (!file || !file.startsWith(DIST)) {
      file = join(DIST, '404.html');
      status = 404;
    }
    const body = await readFile(file);
    res.writeHead(status, { ...GLOBAL_HEADERS, 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Serverfehler');
  }
});

if (!(await runBuild())) process.exit(1);
server.listen(PORT, () => console.log(`\n→ http://localhost:${PORT}${WATCH ? '  (Neuaufbau bei Änderungen aktiv)' : ''}\n`));

if (WATCH) {
  let timer;
  let building = false;
  const trigger = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (building) return trigger();
      building = true;
      await runBuild();
      building = false;
    }, 150);
  };
  for (const dir of ['src', 'data']) watch(join(ROOT, dir), { recursive: true }, trigger);
  watch(join(ROOT, 'site.config.js'), trigger);
}
