import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFilters, serializeFilters, applyFilters, facetOptions, countActiveFilters, DEFAULT_FILTERS } from '../src/assets/js/inventory-core.js';

const rec = (id, o) => ({ id, make: 'VW', model: 'Golf', price: null, reg: null, year: null, km: null, fuel: null, gear: null, ps: null, q: '', ...o });
const list = [
  rec('a', { make: 'VW', model: 'Golf', price: 20000, reg: 202104, year: 2021, km: 40000, fuel: 'Benzin', gear: 'Schaltgetriebe', ps: 131, q: 'VW Golf Navi' }),
  rec('b', { make: 'BMW', model: '3er', price: 28000, reg: 202009, year: 2020, km: 74000, fuel: 'Diesel', gear: 'Automatik', ps: 190, q: 'BMW 3er Touring Anhängerkupplung' }),
  rec('c', { make: 'Škoda', model: 'Kodiaq', price: 32000, reg: 202202, year: 2022, km: 51000, fuel: 'Diesel', gear: 'Automatik', ps: 200, q: 'Škoda Kodiaq' }),
  rec('d', { make: 'VW', model: 'Passat', price: null, reg: 201910, year: 2019, km: 112000, fuel: 'Diesel' })
];
const f = o => ({ ...DEFAULT_FILTERS, ...o });
const ids = r => r.map(v => v.id).join(',');

test('ohne Filter alle Fahrzeuge in Ausgangsreihenfolge', () => {
  assert.equal(ids(applyFilters(list, f())), 'a,b,c,d');
});

test('Marke, Modell, Kraftstoff, Getriebe', () => {
  assert.equal(ids(applyFilters(list, f({ make: 'VW' }))), 'a,d');
  assert.equal(ids(applyFilters(list, f({ make: 'VW', model: 'Passat' }))), 'd');
  assert.equal(ids(applyFilters(list, f({ fuel: 'Diesel', gear: 'Automatik' }))), 'b,c');
});

test('Bereichsfilter schließen fehlende Werte aus', () => {
  assert.equal(ids(applyFilters(list, f({ priceMax: 30000 }))), 'a,b');
  assert.equal(ids(applyFilters(list, f({ priceMin: 25000 }))), 'b,c');
  assert.equal(ids(applyFilters(list, f({ yearMin: 2021 }))), 'a,c');
  assert.equal(ids(applyFilters(list, f({ kmMax: 60000 }))), 'a,c');
  assert.equal(ids(applyFilters(list, f({ psMin: 190 }))), 'b,c');
});

test('Freitextsuche: mehrere Begriffe, ohne Akzente und Groß-/Kleinschreibung', () => {
  assert.equal(ids(applyFilters(list, f({ q: 'skoda' }))), 'c');
  assert.equal(ids(applyFilters(list, f({ q: 'bmw ANHÄNGER' }))), 'b');
  assert.equal(ids(applyFilters(list, f({ q: 'gibtsnicht' }))), '');
});

test('Sortierung – fehlende Werte immer am Ende', () => {
  assert.equal(ids(applyFilters(list, f({ sort: 'price-asc' }))), 'a,b,c,d');
  assert.equal(ids(applyFilters(list, f({ sort: 'price-desc' }))), 'c,b,a,d');
  assert.equal(ids(applyFilters(list, f({ sort: 'reg-desc' }))), 'c,a,b,d');
  assert.equal(ids(applyFilters(list, f({ sort: 'reg-asc' }))), 'd,b,a,c');
  assert.equal(ids(applyFilters(list, f({ sort: 'km-asc' }))), 'a,c,b,d');
});

test('URL-Parameter werden geprüft und zurückgeschrieben', () => {
  const p = parseFilters(new URLSearchParams('make=BMW&priceMax=abc&kmMax=-5&psMin=150&sort=evil'));
  assert.equal(p.make, 'BMW');
  assert.equal(p.priceMax, null);
  assert.equal(p.kmMax, null);
  assert.equal(p.psMin, 150);
  assert.equal(p.sort, 'relevance');
  assert.equal(serializeFilters(p).toString(), 'make=BMW&psMin=150');
  assert.equal(countActiveFilters(p), 2);
});

test('Modelloptionen hängen von der Marke ab', () => {
  const o = facetOptions(list, f({ make: 'VW' }));
  assert.deepEqual(o.models, ['Golf', 'Passat']);
  assert.deepEqual(o.makes, ['BMW', 'Škoda', 'VW']);
});
