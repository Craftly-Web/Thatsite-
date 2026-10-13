import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const out = join(tmpdir(), 'finecars-build-test-' + process.pid);
process.env.FINECARS_OUT = out;
delete process.env.FINECARS_DEMO;
delete process.env.FINECARS_CONTACT_FORM;
process.env.SITE_URL = 'https://www.example.test';

test('Build erzeugt alle Seiten, kennzeichnet Demo und markiert keine Angebote', async () => {
  const { build } = await import('../build.js');
  const result = await build({ quiet: true });
  const data = JSON.parse(await readFile(new URL('../data/vehicles.json', import.meta.url), 'utf8'));
  for (const v of data.vehicles) await access(join(out, 'fahrzeuge', v.slug, 'index.html'));
  for (const p of ['index.html', 'fahrzeuge/index.html', 'ueber-uns/index.html', 'kontakt/index.html', 'impressum/index.html', 'datenschutz/index.html', '404.html', 'sitemap.xml', 'robots.txt']) await access(join(out, p));

  const home = await readFile(join(out, 'index.html'), 'utf8');
  assert.match(home, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(home, /<link rel="canonical" href="https:\/\/www\.example\.test\/">/);
  assert.match(home, /"@type":"AutoDealer"/);
  assert.doesNotMatch(home, /aggregateRating|openingHours/);

  const detail = await readFile(join(out, 'fahrzeuge', data.vehicles[0].slug, 'index.html'), 'utf8');
  assert.doesNotMatch(detail, /"@type":"(Car|Offer)"/, 'Beispieldaten dürfen nicht als Angebot markiert sein');
  assert.match(detail, /Beispieldatensatz/);

  const contact = await readFile(join(out, 'kontakt', 'index.html'), 'utf8');
  assert.match(contact, /data-mode="preview"/);
  assert.match(contact, /Formular nicht angeschlossen/);

  assert.ok(result.placeholders.length > 0, 'offene Pflichtangaben werden gemeldet');
  const sitemap = await readFile(join(out, 'sitemap.xml'), 'utf8');
  assert.match(sitemap, /https:\/\/www\.example\.test\/fahrzeuge\//);
  await rm(out, { recursive: true, force: true });
});
