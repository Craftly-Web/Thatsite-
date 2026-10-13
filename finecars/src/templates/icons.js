// Schlanke Inline-Icons (24 × 24, Strichstärke 1.6, currentColor).
import { raw } from '../lib/html.js';

const P = {
  phone: '<path d="M5 4h3.2l1.6 4-2 1.2a11 11 0 0 0 5 5l1.2-2 4 1.6V17a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.4"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  chevronLeft: '<path d="m15 5-7 7 7 7"/>',
  chevronRight: '<path d="m9 5 7 7-7 7"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  gauge: '<path d="M4.5 17a8.5 8.5 0 1 1 15 0"/><path d="m12 13 4-4"/><circle cx="12" cy="13" r="1.2"/>',
  fuel: '<path d="M5 20V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v15M4 20h11M5 10h9"/><path d="M14 8h2.5l2 2v7a1.5 1.5 0 0 1-3 0v-3H14"/>',
  bolt: '<path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z"/>',
  gear: '<circle cx="6" cy="6" r="1.6"/><circle cx="12" cy="6" r="1.6"/><circle cx="18" cy="6" r="1.6"/><circle cx="6" cy="18" r="1.6"/><circle cx="12" cy="18" r="1.6"/><path d="M6 7.6v8.8M12 7.6v8.8M18 7.6V12H6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  car: '<path d="M3 16v-3.5l2-4.5a2 2 0 0 1 1.8-1.2h10.4A2 2 0 0 1 19 8l2 4.5V16a1 1 0 0 1-1 1h-1.5M5.5 17H4a1 1 0 0 1-1-1M8.5 17h7"/><circle cx="7" cy="17" r="1.8"/><circle cx="17" cy="17" r="1.8"/><path d="M3.5 12.5h17"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
  chat: '<path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8 9.5h8M8 12.5h5"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
  route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h7.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H16"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>',
  palette: '<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.8-.9 1.4-2l-.3-.8c-.4-1.1.4-2.2 1.6-2.2H17a3.5 3.5 0 0 0 3.5-3.5c0-4.7-3.8-8.5-8.5-8.5Z"/><circle cx="8" cy="11" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16" cy="10" r="1"/>'
};

/**
 * @param {keyof P} name
 * @param {{ size?: number, label?: string, cls?: string }} [o]
 */
export function icon(name, o = {}) {
  const size = o.size || 20;
  const a11y = o.label ? `role="img" aria-label="${o.label}"` : 'aria-hidden="true" focusable="false"';
  return raw(`<svg class="icon${o.cls ? ' ' + o.cls : ''}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" ${a11y}>${P[name]}</svg>`);
}
