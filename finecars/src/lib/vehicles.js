// Datenschicht für den Fahrzeugbestand.
//
// ┌──────────────┐   roh    ┌───────────────────┐   normalisiert   ┌──────────┐
// │ Datenquelle  │ ───────▶ │ loadInventory()   │ ───────────────▶ │ Templates│
// │ (JSON, Import)│         │ prüft + vereinheitl.│                 │ / Client │
// └──────────────┘          └───────────────────┘                  └──────────┘
//
// Eine Datenquelle ist eine asynchrone Funktion, die
//   { meta: { isDemo, source, updatedAt }, vehicles: RawVehicle[] }
// zurückgibt. Standard ist `jsonFileSource('data/vehicles.json')`. Für einen
// späteren Import (z. B. Export aus einer Händlersoftware oder einer
// zulässigen Schnittstelle) wird eine weitere Quelle geschrieben, die dieselbe
// Struktur liefert – Templates und Client-Code bleiben unverändert.
// Die Felder eines RawVehicle sind in README.md (Abschnitt "Fahrzeugdaten")
// beschrieben.

import { readFile } from 'node:fs/promises';
import { kwToPs } from './format.js';

export const STATUSES = ['available', 'reserved', 'sold'];
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Standard-Datenquelle: lokale JSON-Datei. */
export function jsonFileSource(path) {
  return async () => JSON.parse(await readFile(path, 'utf8'));
}

const str = v => (typeof v === 'string' && v.trim() ? v.trim() : null);
const num = v => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null);
const bool = v => (typeof v === 'boolean' ? v : null);

function isMobileDeUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && (u.hostname === 'mobile.de' || u.hostname.endsWith('.mobile.de'));
  } catch {
    return false;
  }
}

const DEMO_VIEWS = ['Seitenansicht', 'Detail Front', 'Detail Heck', 'Seitenansicht gegenüberliegend'];

/**
 * Vereinheitlicht einen Rohdatensatz. Unbekannte oder ungültige Werte werden
 * zu `null` (und als Warnung gemeldet), damit nie falsche Werte angezeigt werden.
 * Fehlende Pflichtfelder (id, slug, make, model) führen zu einem Fehler.
 */
export function normalizeVehicle(raw, warn = () => {}) {
  const id = str(raw.id);
  const slug = str(raw.slug);
  const make = str(raw.make);
  const model = str(raw.model);
  if (!id || !slug || !make || !model) {
    throw new Error(`Fahrzeugdatensatz unvollständig (id, slug, make und model sind Pflicht): ${JSON.stringify(raw).slice(0, 120)}`);
  }
  if (!SLUG_RE.test(slug)) throw new Error(`Ungültiger Slug "${slug}" – erlaubt sind a–z, 0–9 und Bindestriche.`);

  const checkMonth = (key) => {
    const v = str(raw[key]);
    if (v && !MONTH_RE.test(v)) { warn(`${id}: ${key} "${v}" ist kein Monat im Format JJJJ-MM und wird ignoriert.`); return null; }
    return v;
  };

  let status = str(raw.status) || 'available';
  if (!STATUSES.includes(status)) { warn(`${id}: unbekannter Status "${status}" – als "available" behandelt.`); status = 'available'; }

  let mobileDeUrl = str(raw.mobileDeUrl);
  if (mobileDeUrl && !isMobileDeUrl(mobileDeUrl)) { warn(`${id}: mobileDeUrl ist keine https-Adresse auf mobile.de und wird ignoriert.`); mobileDeUrl = null; }

  const variant = str(raw.variant);
  const title = `${make} ${model}`;
  const fullTitle = variant ? `${title} ${variant}` : title;
  const firstRegistration = checkMonth('firstRegistration');
  const powerKw = num(raw.powerKw);
  const isDemo = raw.isDemo === true;

  let images = Array.isArray(raw.images)
    ? raw.images
      .filter(img => img && str(img.src))
      .map((img, i) => ({
        src: img.src,
        srcset: str(img.srcset),
        width: num(img.width) || 1600,
        height: num(img.height) || 1000,
        alt: str(img.alt) || `${fullTitle} – Bild ${i + 1}`,
        isIllustration: false
      }))
    : [];

  const demoArt = raw.demoArt && typeof raw.demoArt === 'object' ? { body: str(raw.demoArt.body) || 'limousine', paint: str(raw.demoArt.paint) || '#5a6066' } : null;
  if (!images.length && demoArt) {
    images = DEMO_VIEWS.map((label, i) => ({
      src: `/assets/demo/${slug}-${i + 1}.svg`,
      srcset: null,
      width: 1360,
      height: 850,
      alt: `${fullTitle} – ${label} (Illustration, Beispieldaten)`,
      isIllustration: true
    }));
  }

  return {
    id,
    slug,
    url: `/fahrzeuge/${slug}/`,
    isDemo,
    status,
    featured: raw.featured === true,
    make,
    model,
    variant,
    title,
    fullTitle,
    bodyType: str(raw.bodyType),
    price: num(raw.price),
    vatDeductible: bool(raw.vatDeductible),
    firstRegistration,
    regYear: firstRegistration ? Number(firstRegistration.slice(0, 4)) : null,
    mileage: num(raw.mileage),
    fuel: str(raw.fuel),
    powerKw,
    powerPs: kwToPs(powerKw),
    transmission: str(raw.transmission),
    color: str(raw.color),
    doors: num(raw.doors),
    seats: num(raw.seats),
    previousOwners: num(raw.previousOwners),
    huAu: checkMonth('huAu'),
    emissionClass: str(raw.emissionClass),
    features: Array.isArray(raw.features) ? raw.features.map(str).filter(Boolean) : [],
    description: str(raw.description),
    images,
    demoArt: images.some(i => i.isIllustration) ? demoArt : null,
    mobileDeUrl
  };
}

/**
 * Lädt, prüft und normalisiert den Bestand.
 * Verkaufte Fahrzeuge (status "sold") werden nicht ausgegeben.
 * @returns {Promise<{ meta: object, vehicles: object[], warnings: string[] }>}
 */
export async function loadInventory(source) {
  const data = await source();
  if (!data || !Array.isArray(data.vehicles)) throw new Error('Datenquelle liefert kein Feld "vehicles" (Array).');
  const warnings = [];
  const warn = msg => warnings.push(msg);
  const seenIds = new Set();
  const seenSlugs = new Set();
  const vehicles = [];
  for (const raw of data.vehicles) {
    const v = normalizeVehicle(raw, warn);
    if (seenIds.has(v.id)) throw new Error(`Doppelte Fahrzeug-ID: ${v.id}`);
    if (seenSlugs.has(v.slug)) throw new Error(`Doppelter Slug: ${v.slug}`);
    seenIds.add(v.id);
    seenSlugs.add(v.slug);
    if (v.status === 'sold') continue;
    vehicles.push(v);
  }
  const meta = {
    isDemo: data.meta?.isDemo === true || vehicles.some(v => v.isDemo),
    source: str(data.meta?.source),
    notice: str(data.meta?.notice),
    updatedAt: str(data.meta?.updatedAt)
  };
  return { meta, vehicles, warnings };
}

/** Schlanke Datensätze für Filter und Sortierung im Browser. */
export function toClientRecord(v) {
  return {
    id: v.id,
    make: v.make,
    model: v.model,
    price: v.price,
    reg: v.firstRegistration ? Number(v.firstRegistration.replace('-', '')) : null,
    year: v.regYear,
    km: v.mileage,
    fuel: v.fuel,
    gear: v.transmission,
    ps: v.powerPs,
    q: [v.make, v.model, v.variant, v.bodyType, v.fuel, v.transmission, v.color, ...v.features].filter(Boolean).join(' ')
  };
}

/** Ähnliche Fahrzeuge: gleiche Marke oder Klasse, dann Preisnähe. */
export function similarVehicles(vehicle, all, limit = 3) {
  const score = o => {
    let s = 0;
    if (o.make === vehicle.make) s += 3;
    if (o.bodyType && o.bodyType === vehicle.bodyType) s += 2;
    if (o.fuel && o.fuel === vehicle.fuel) s += 1;
    if (vehicle.price && o.price) s += Math.max(0, 2 - Math.abs(o.price - vehicle.price) / 5000);
    return s;
  };
  return all
    .filter(o => o.id !== vehicle.id)
    .map(o => ({ o, s: score(o) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(x => x.o);
}
