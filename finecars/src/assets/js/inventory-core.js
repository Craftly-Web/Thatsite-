// Filter- und Sortierlogik der Fahrzeugübersicht.
// Reine Funktionen ohne DOM-Zugriff – werden im Browser (inventory.js) und in
// den Node-Tests (tests/inventory-core.test.js) verwendet.
//
// Datensatzformat (siehe toClientRecord in src/lib/vehicles.js):
//   { id, make, model, price, reg (JJJJMM), year, km, fuel, gear, ps, q }
// Fehlende Werte sind `null`. Ein Fahrzeug ohne Wert erfüllt einen gesetzten
// Bereichsfilter nicht (z. B. "Preis bis" bei Preis auf Anfrage), da die
// Übereinstimmung nicht belegt ist.

export const SORTS = {
  relevance: 'Empfehlung',
  'price-asc': 'Preis aufsteigend',
  'price-desc': 'Preis absteigend',
  'reg-desc': 'Erstzulassung: neueste zuerst',
  'reg-asc': 'Erstzulassung: älteste zuerst',
  'km-asc': 'Kilometerstand aufsteigend'
};

export const DEFAULT_FILTERS = Object.freeze({
  q: '',
  make: '',
  model: '',
  priceMin: null,
  priceMax: null,
  yearMin: null,
  kmMax: null,
  fuel: '',
  gear: '',
  psMin: null,
  sort: 'relevance'
});

const NUMERIC = ['priceMin', 'priceMax', 'yearMin', 'kmMax', 'psMin'];
const TEXT = ['q', 'make', 'model', 'fuel', 'gear'];

const toNum = v => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

/** URLSearchParams → Filterobjekt (unbekannte/ungültige Werte werden verworfen). */
export function parseFilters(params) {
  const f = { ...DEFAULT_FILTERS };
  for (const k of TEXT) f[k] = (params.get(k) || '').trim().slice(0, 80);
  for (const k of NUMERIC) f[k] = toNum(params.get(k));
  const sort = params.get('sort');
  f.sort = sort && Object.hasOwn(SORTS, sort) ? sort : 'relevance';
  return f;
}

/** Filterobjekt → URLSearchParams (nur gesetzte Werte). */
export function serializeFilters(f) {
  const p = new URLSearchParams();
  for (const k of [...TEXT, ...NUMERIC]) {
    const v = f[k];
    if (v !== null && v !== undefined && v !== '') p.set(k, String(v));
  }
  if (f.sort && f.sort !== 'relevance') p.set('sort', f.sort);
  return p;
}

export const normalizeText = s => String(s || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/ß/g, 'ss');

export function countActiveFilters(f) {
  let n = 0;
  for (const k of [...TEXT, ...NUMERIC]) if (f[k] !== null && f[k] !== '') n++;
  return n;
}

export function matches(v, f) {
  if (f.make && v.make !== f.make) return false;
  if (f.model && v.model !== f.model) return false;
  if (f.fuel && v.fuel !== f.fuel) return false;
  if (f.gear && v.gear !== f.gear) return false;
  if (f.priceMin !== null && !(v.price !== null && v.price >= f.priceMin)) return false;
  if (f.priceMax !== null && !(v.price !== null && v.price <= f.priceMax)) return false;
  if (f.yearMin !== null && !(v.year !== null && v.year >= f.yearMin)) return false;
  if (f.kmMax !== null && !(v.km !== null && v.km <= f.kmMax)) return false;
  if (f.psMin !== null && !(v.ps !== null && v.ps >= f.psMin)) return false;
  if (f.q) {
    const hay = normalizeText(v.q);
    const terms = normalizeText(f.q).split(/\s+/).filter(Boolean);
    if (!terms.every(t => hay.includes(t))) return false;
  }
  return true;
}

// Fehlende Werte landen beim Sortieren immer am Ende.
const by = (key, dir) => (a, b) => {
  const x = a[key];
  const y = b[key];
  if (x === null && y === null) return 0;
  if (x === null) return 1;
  if (y === null) return -1;
  return dir * (x - y);
};

const SORTERS = {
  'price-asc': by('price', 1),
  'price-desc': by('price', -1),
  'reg-desc': by('reg', -1),
  'reg-asc': by('reg', 1),
  'km-asc': by('km', 1)
};

/** Gefilterte und sortierte Liste; die Ausgangsreihenfolge gilt als "Empfehlung". */
export function applyFilters(list, f) {
  const result = list.filter(v => matches(v, f));
  const sorter = SORTERS[f.sort];
  if (sorter) {
    // stabile Sortierung: bei Gleichstand bleibt die Ausgangsreihenfolge
    const idx = new Map(list.map((v, i) => [v.id, i]));
    result.sort((a, b) => sorter(a, b) || idx.get(a.id) - idx.get(b.id));
  }
  return result;
}

const uniqSorted = arr => [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'de'));

/** Auswahlwerte für die Filterfelder (Modelle abhängig von der Marke). */
export function facetOptions(list, f) {
  return {
    makes: uniqSorted(list.map(v => v.make)),
    models: uniqSorted(list.filter(v => !f.make || v.make === f.make).map(v => v.model)),
    fuels: uniqSorted(list.map(v => v.fuel)),
    gears: uniqSorted(list.map(v => v.gear))
  };
}
