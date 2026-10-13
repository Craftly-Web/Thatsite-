import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeVehicle, loadInventory, similarVehicles, jsonFileSource } from '../src/lib/vehicles.js';
import { formatPrice, formatMileage, formatMonth, formatPower } from '../src/lib/format.js';

test('fehlende und ungültige Werte werden zu null statt zu falschen Angaben', () => {
  const warnings = [];
  const v = normalizeVehicle({ id: 'x1', slug: 'test-x1', make: 'Opel', model: 'Astra', price: -1, mileage: 'viel', firstRegistration: '2020-13', huAu: '2027-02', mobileDeUrl: 'https://evil.example/x' }, w => warnings.push(w));
  assert.equal(v.price, null);
  assert.equal(v.mileage, null);
  assert.equal(v.firstRegistration, null);
  assert.equal(v.huAu, '2027-02');
  assert.equal(v.mobileDeUrl, null);
  assert.equal(v.powerPs, null);
  assert.deepEqual(v.images, []);
  assert.equal(warnings.length, 2);
});

test('Pflichtfelder und Slug werden geprüft', () => {
  assert.throws(() => normalizeVehicle({ id: 'a', slug: 'b', make: 'VW' }), /unvollständig/);
  assert.throws(() => normalizeVehicle({ id: 'a', slug: 'Ungültig Slug', make: 'VW', model: 'Golf' }), /Slug/);
});

test('Demo-Illustrationen nur ohne echte Bilder', () => {
  const demo = normalizeVehicle({ id: 'd', slug: 'demo-d', make: 'VW', model: 'Golf', demoArt: { body: 'kompakt', paint: '#123456' } });
  assert.equal(demo.images.length, 4);
  assert.ok(demo.images.every(i => i.isIllustration && i.alt.includes('Illustration')));
  const real = normalizeVehicle({ id: 'r', slug: 'real-r', make: 'VW', model: 'Golf', images: [{ src: '/media/r1.jpg', alt: 'Front' }], demoArt: { body: 'kompakt' } });
  assert.equal(real.images.length, 1);
  assert.equal(real.demoArt, null);
});

test('loadInventory: verkaufte Fahrzeuge ausgeblendet, Duplikate abgelehnt', async () => {
  const base = { make: 'VW', model: 'Golf' };
  const inv = await loadInventory(async () => ({ vehicles: [{ ...base, id: '1', slug: 'a' }, { ...base, id: '2', slug: 'b', status: 'sold' }] }));
  assert.deepEqual(inv.vehicles.map(v => v.id), ['1']);
  await assert.rejects(loadInventory(async () => ({ vehicles: [{ ...base, id: '1', slug: 'a' }, { ...base, id: '1', slug: 'c' }] })), /Doppelte/);
  await assert.rejects(loadInventory(async () => ({ vehicles: [{ ...base, id: '1', slug: 'a' }, { ...base, id: '2', slug: 'a' }] })), /Doppelter Slug/);
});

test('Beispieldaten im Repository sind gültig und als Demo markiert', async () => {
  const inv = await loadInventory(jsonFileSource(new URL('../data/vehicles.json', import.meta.url)));
  assert.ok(inv.vehicles.length > 0);
  assert.equal(inv.meta.isDemo, true);
  assert.ok(inv.vehicles.every(v => v.isDemo));
  assert.deepEqual(inv.warnings, []);
  const sim = similarVehicles(inv.vehicles[0], inv.vehicles);
  assert.equal(sim.length, 3);
  assert.ok(!sim.includes(inv.vehicles[0]));
});

test('Formatierung', () => {
  assert.equal(formatPrice(21490), '21.490 €');
  assert.equal(formatPrice(null), null);
  assert.equal(formatMileage(38900), '38.900 km');
  assert.equal(formatMonth('2021-04'), '04/2021');
  assert.equal(formatMonth('2021-4'), null);
  assert.equal(formatPower(110), '110 kW (150 PS)');
});
