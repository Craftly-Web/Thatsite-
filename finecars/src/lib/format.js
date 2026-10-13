// Formatierung von Fahrzeugdaten für die Anzeige (deutsches Format).
// Alle Funktionen geben `null` zurück, wenn kein Wert vorliegt – so kann die
// Oberfläche fehlende Angaben auslassen statt "0" oder Falsches anzuzeigen.

const nf = new Intl.NumberFormat('de-DE');
const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

const isNum = v => typeof v === 'number' && Number.isFinite(v);

export const formatPrice = v => (isNum(v) ? nf.format(Math.round(v)) + ' €' : null);

export const formatMileage = v => (isNum(v) ? nf.format(Math.round(v)) + ' km' : null);

export const kwToPs = kw => (isNum(kw) ? Math.round(kw * 1.35962) : null);

export const formatPower = kw => (isNum(kw) ? `${nf.format(kw)} kW (${nf.format(kwToPs(kw))} PS)` : null);

/** "2021-04" → "04/2021"; ungültige Werte → null */
export function formatMonth(value) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(value ?? ''));
  if (!m || !MONTHS.includes(m[2])) return null;
  return `${m[2]}/${m[1]}`;
}

export const formatInt = v => (isNum(v) ? nf.format(v) : null);
