// Kleine Helfer für sichere HTML-Ausgabe in den Templates.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Maskiert Text für HTML-Inhalte und Attribute. */
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ESC[c]);

/**
 * Tagged Template: Interpolierte Werte werden maskiert, außer sie sind mit
 * `raw()` als bereits sicheres HTML markiert. Arrays werden zusammengefügt.
 */
export function html(strings, ...values) {
  let out = '';
  strings.forEach((s, i) => {
    out += s;
    if (i < values.length) out += render(values[i]);
  });
  return new SafeHtml(out);
}

class SafeHtml {
  constructor(value) { this.value = value; }
  toString() { return this.value; }
}

export const raw = value => new SafeHtml(String(value ?? ''));

function render(v) {
  if (v === null || v === undefined || v === false) return '';
  if (v instanceof SafeHtml) return v.value;
  if (Array.isArray(v)) return v.map(render).join('');
  return esc(v);
}

/** JSON sicher in ein <script>-Element einbetten. */
export const jsonScript = data => raw(JSON.stringify(data).replace(/</g, '\\u003c'));

// Platzhalter-Register: Jeder im Build ausgegebene Platzhalter wird erfasst,
// damit `npm run build` am Ende eine Liste offener Angaben ausgeben kann.
const placeholders = new Set();

/** Deutlich markierter Platzhalter für fehlende Pflichtangaben. */
export function placeholder(label) {
  placeholders.add(label);
  return html`<mark class="placeholder" data-placeholder>[Bitte ergänzen: ${label}]</mark>`;
}

/** Gibt den Wert aus oder – falls leer – einen Platzhalter. */
export const valueOr = (value, label) => (value ? html`${value}` : placeholder(label));

export const usedPlaceholders = () => [...placeholders];
export const resetPlaceholders = () => placeholders.clear();
