// Erzeugt neutrale SVG-Fahrzeugillustrationen für Beispieldaten.
//
// Es gibt keine echten Fahrzeugfotos von FineCars. Damit Demo-Datensätze
// trotzdem realistisch dargestellt werden, ohne fremde Fotos oder erfundene
// Standortbilder zu verwenden, zeichnen wir markenlose Seitenansichten.
// Sobald echte Fotos vorliegen, werden diese über `images` im Datensatz
// hinterlegt – die Illustrationen werden dann nicht mehr verwendet.

const W = 1600;
const H = 1000;
const GROUND = 780;

// Karosserieformen in einem 1200 × 480 großen Zeichenraum (Front rechts).
const BODIES = {
  kompakt: {
    xr: 150, xf: 1040, rc: 322, fc: 872, r: 74, sill: 388,
    deck: 226, hood: 266, belt: 240, roof: 140,
    rearTop: 286, roofRear: 340, roofFront: 650, shield: 790,
    trunk: false, pillarB: 0.5
  },
  limousine: {
    xr: 90, xf: 1110, rc: 292, fc: 912, r: 76, sill: 390,
    deck: 236, hood: 272, belt: 246, roof: 150,
    rearTop: 212, roofRear: 430, roofFront: 690, shield: 820,
    trunk: true, pillarB: 0.5
  },
  kombi: {
    xr: 90, xf: 1110, rc: 292, fc: 912, r: 76, sill: 390,
    deck: 230, hood: 272, belt: 244, roof: 148,
    rearTop: 150, roofRear: 210, roofFront: 690, shield: 822,
    trunk: false, pillarB: 0.56
  },
  suv: {
    xr: 105, xf: 1095, rc: 302, fc: 892, r: 86, sill: 372,
    deck: 206, hood: 238, belt: 218, roof: 106,
    rearTop: 166, roofRear: 228, roofFront: 672, shield: 806,
    trunk: false, pillarB: 0.56
  }
};

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(hex, target, t) {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}
const lighten = (hex, t) => mix(hex, '#ffffff', t);
const darken = (hex, t) => mix(hex, '#000000', t);
const n = v => Math.round(v * 10) / 10;

function bodyPath(b) {
  const { xr, xf, rc, fc, r, sill, deck, hood, belt, roof, rearTop, roofRear, roofFront, shield } = b;
  const ar = r + 11;
  const wy = 480 - 60 - r; // Radmittelpunkt (Boden bei y = 420)
  const dx = Math.sqrt(Math.max(ar * ar - (sill - wy) ** 2, 0));
  const p = [];
  p.push(`M${n(xr + 18)} ${sill}`);
  // Heck
  p.push(`C${n(xr + 4)} ${sill - 6} ${xr} ${sill - 30} ${xr} ${sill - 56}`);
  if (b.trunk) {
    p.push(`L${xr + 2} ${deck + 36}`);
    p.push(`C${xr + 3} ${deck + 12} ${xr + 14} ${deck + 2} ${xr + 40} ${deck}`);
    p.push(`L${rearTop - 30} ${deck - 8}`);
    p.push(`C${rearTop} ${deck - 11} ${rearTop + 30} ${deck - 18} ${rearTop + 52} ${deck - 30}`);
    // Heckscheibe
    p.push(`C${rearTop + 110} ${roof + 40} ${roofRear - 70} ${roof + 4} ${roofRear} ${roof}`);
  } else {
    p.push(`L${xr + 6} ${deck + 30}`);
    p.push(`C${xr + 10} ${deck - 20} ${rearTop - 40} ${roof + 70} ${rearTop} ${roof + 22}`);
    p.push(`C${rearTop + 14} ${roof + 6} ${roofRear - 40} ${roof} ${roofRear} ${roof}`);
  }
  // Dach
  p.push(`L${roofFront - 40} ${roof}`);
  p.push(`C${roofFront - 10} ${roof} ${roofFront + 10} ${roof + 4} ${roofFront + 30} ${roof + 14}`);
  // Frontscheibe
  p.push(`C${roofFront + 70} ${roof + 40} ${shield - 50} ${belt - 18} ${shield} ${belt - 2}`);
  // Motorhaube
  p.push(`C${shield + 90} ${hood - 18} ${xf - 120} ${hood - 6} ${xf - 40} ${hood + 4}`);
  // Front
  p.push(`C${xf - 12} ${hood + 8} ${xf + 2} ${hood + 30} ${xf + 2} ${hood + 58}`);
  p.push(`L${xf} ${sill - 40}`);
  p.push(`C${xf} ${sill - 16} ${xf - 10} ${sill - 4} ${xf - 30} ${sill}`);
  // Unterkante mit Radläufen
  p.push(`L${n(fc + dx)} ${sill}`);
  p.push(`A${ar} ${ar} 0 1 0 ${n(fc - dx)} ${sill}`);
  p.push(`L${n(rc + dx)} ${sill}`);
  p.push(`A${ar} ${ar} 0 1 0 ${n(rc - dx)} ${sill}`);
  p.push('Z');
  return { d: p.join(' '), wy, ar };
}

function glassPath(b) {
  const { xr, roof, belt, rearTop, roofRear, roofFront, shield, trunk } = b;
  const top = roof + 14;
  const base = belt - 6;
  if (trunk) {
    return `M${rearTop + 76} ${base} C${rearTop + 130} ${top + 40} ${roofRear - 60} ${top + 2} ${roofRear + 6} ${top} L${roofFront - 40} ${top} C${roofFront - 4} ${top} ${roofFront + 20} ${top + 10} ${roofFront + 46} ${top + 30} C${roofFront + 80} ${top + 56} ${shield - 80} ${base - 10} ${shield - 34} ${base} Z`;
  }
  return `M${rearTop + 6} ${base} C${rearTop + 10} ${top + 50} ${rearTop + 16} ${top + 14} ${rearTop + 40} ${top + 4} C${rearTop + 60} ${top} ${roofRear - 20} ${top} ${roofRear} ${top} L${roofFront - 40} ${top} C${roofFront - 4} ${top} ${roofFront + 20} ${top + 10} ${roofFront + 46} ${top + 30} C${roofFront + 80} ${top + 56} ${shield - 80} ${base - 10} ${shield - 34} ${base} Z`.replace(/^M\S+/, `M${Math.max(xr + 60, rearTop + 6)}`);
}

function wheel(cx, cy, r, id) {
  const spokes = [];
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 - 90) * Math.PI / 180;
    const a1 = a - 0.2;
    const a2 = a + 0.2;
    const ri = r * 0.17;
    const ro = r * 0.6;
    spokes.push(`M${n(cx + Math.cos(a1) * ri)} ${n(cy + Math.sin(a1) * ri)} L${n(cx + Math.cos(a - 0.11) * ro)} ${n(cy + Math.sin(a - 0.11) * ro)} A${n(ro)} ${n(ro)} 0 0 1 ${n(cx + Math.cos(a + 0.11) * ro)} ${n(cy + Math.sin(a + 0.11) * ro)} L${n(cx + Math.cos(a2) * ri)} ${n(cy + Math.sin(a2) * ri)} Z`);
  }
  return `<g>
<circle cx="${cx}" cy="${cy}" r="${r}" fill="#0d0e10"/>
<circle cx="${cx}" cy="${cy}" r="${n(r * 0.93)}" fill="none" stroke="#1f2225" stroke-width="2"/>
<circle cx="${cx}" cy="${cy}" r="${n(r * 0.66)}" fill="url(#${id}-rim)"/>
<circle cx="${cx}" cy="${cy}" r="${n(r * 0.6)}" fill="#25292d"/>
<circle cx="${cx}" cy="${cy}" r="${n(r * 0.42)}" fill="#3b4147" opacity=".55"/>
<path d="${spokes.join(' ')}" fill="url(#${id}-rim)"/>
<circle cx="${cx}" cy="${cy}" r="${n(r * 0.14)}" fill="url(#${id}-rim)" stroke="#2a2e32" stroke-width="1.5"/>
<circle cx="${cx}" cy="${cy}" r="${n(r * 0.05)}" fill="#2a2e32"/>
</g>`;
}

/** Zeichnet das Fahrzeug (ohne Hintergrund) als SVG-Gruppe. */
function carGroup({ body = 'limousine', paint = '#3a3f44', id = 'c', dark = false }) {
  const b = BODIES[body] || BODIES.limousine;
  const { d, wy, ar } = bodyPath(b);
  const glass = glassPath(b);
  const hi = lighten(paint, 0.38);
  const lo = darken(paint, 0.42);
  const mid = paint;
  const pillarX = b.trunk
    ? b.roofRear + (b.roofFront - b.roofRear) * b.pillarB
    : b.roofRear + (b.roofFront - b.roofRear) * (b.pillarB - 0.08);
  const doorFront = pillarX + 175;
  const doorRear = pillarX - 160;
  const shoulder = b.belt + 26;
  const lightFront = `M${b.xf - 70} ${b.hood + 10} C${b.xf - 40} ${b.hood + 8} ${b.xf - 14} ${b.hood + 14} ${b.xf - 4} ${b.hood + 30} L${b.xf - 6} ${b.hood + 38} C${b.xf - 30} ${b.hood + 36} ${b.xf - 60} ${b.hood + 30} ${b.xf - 76} ${b.hood + 22} Z`;
  const tailTop = b.trunk ? b.deck + 6 : b.deck + 12;
  const lightRear = `M${b.xr + 2} ${tailTop} C${b.xr + 30} ${tailTop - 4} ${b.xr + 60} ${tailTop - 2} ${b.xr + 74} ${tailTop + 4} L${b.xr + 72} ${tailTop + 20} C${b.xr + 50} ${tailTop + 22} ${b.xr + 24} ${tailTop + 22} ${b.xr + 3} ${tailTop + 20} Z`;
  const mirror = `M${b.shield - 54} ${b.belt - 4} C${b.shield - 62} ${b.belt - 30} ${b.shield - 30} ${b.belt - 36} ${b.shield - 10} ${b.belt - 26} C${b.shield} ${b.belt - 18} ${b.shield - 6} ${b.belt - 4} ${b.shield - 18} ${b.belt} Z`;

  return `<defs>
<linearGradient id="${id}-paint" x1="0" y1="${b.roof}" x2="0" y2="${b.sill}" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="${hi}"/><stop offset=".32" stop-color="${mid}"/><stop offset=".5" stop-color="${lighten(paint, 0.16)}"/><stop offset=".56" stop-color="${mid}"/><stop offset="1" stop-color="${lo}"/>
</linearGradient>
<linearGradient id="${id}-sheen" x1="${b.xr}" y1="0" x2="${b.xf}" y2="0" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".35" stop-color="#fff" stop-opacity=".22"/><stop offset=".55" stop-color="#fff" stop-opacity=".05"/><stop offset=".8" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
</linearGradient>
<linearGradient id="${id}-glass" x1="0" y1="${b.roof}" x2="0" y2="${b.belt}" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="#3a4249"/><stop offset=".55" stop-color="#15191c"/><stop offset="1" stop-color="#0b0d0f"/>
</linearGradient>
<linearGradient id="${id}-rim" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#e9ecef"/><stop offset=".5" stop-color="#9aa1a8"/><stop offset="1" stop-color="#5e656c"/>
</linearGradient>
<linearGradient id="${id}-head" x1="0" y1="0" x2="1" y2="0">
<stop offset="0" stop-color="#8f979e"/><stop offset="1" stop-color="#ffffff"/>
</linearGradient>
<clipPath id="${id}-clip"><path d="${d}"/></clipPath>
<clipPath id="${id}-well"><rect x="0" y="0" width="1200" height="${b.sill + 1}"/></clipPath>
<radialGradient id="${id}-shadow" cx=".5" cy=".5" r=".5">
<stop offset="0" stop-color="#000" stop-opacity="${dark ? 0.75 : 0.42}"/><stop offset=".6" stop-color="#000" stop-opacity="${dark ? 0.3 : 0.14}"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
</radialGradient>
</defs>
<ellipse cx="${(b.xr + b.xf) / 2}" cy="${420}" rx="${(b.xf - b.xr) / 2 + 60}" ry="26" fill="url(#${id}-shadow)"/>
<ellipse cx="${b.rc}" cy="${418}" rx="${b.r + 16}" ry="9" fill="#000" opacity="${dark ? 0.7 : 0.35}"/>
<ellipse cx="${b.fc}" cy="${418}" rx="${b.r + 16}" ry="9" fill="#000" opacity="${dark ? 0.7 : 0.35}"/>
<g clip-path="url(#${id}-well)"><circle cx="${b.rc}" cy="${wy}" r="${ar + 1}" fill="#08090a"/>
<circle cx="${b.fc}" cy="${wy}" r="${ar + 1}" fill="#08090a"/></g>
<path d="${d}" fill="url(#${id}-paint)"/>
<g clip-path="url(#${id}-clip)">
<rect x="${b.xr}" y="${b.roof}" width="${b.xf - b.xr}" height="${shoulder - b.roof + 8}" fill="url(#${id}-sheen)"/>
<path d="M${b.xr} ${shoulder} C${b.xr + 300} ${shoulder - 6} ${b.xf - 300} ${shoulder - 14} ${b.xf} ${shoulder - 18}" stroke="${lighten(paint, 0.55)}" stroke-opacity=".7" stroke-width="2.2" fill="none"/>
<path d="M${b.xr} ${shoulder + 3} C${b.xr + 300} ${shoulder - 3} ${b.xf - 300} ${shoulder - 11} ${b.xf} ${shoulder - 15}" stroke="${darken(paint, 0.35)}" stroke-opacity=".55" stroke-width="2" fill="none"/>
<rect x="${b.xr}" y="${b.sill - 34}" width="${b.xf - b.xr}" height="40" fill="${darken(paint, 0.55)}" opacity=".55"/>
<path d="M${doorRear} ${b.belt - 2} L${doorRear - 6} ${b.sill - 30} M${pillarX + 6} ${b.belt - 2} L${pillarX + 2} ${b.sill - 32} M${doorFront} ${b.belt} C${doorFront + 10} ${b.belt + 60} ${doorFront + 4} ${b.sill - 60} ${doorFront - 2} ${b.sill - 32}" stroke="${darken(paint, 0.5)}" stroke-width="2" fill="none" opacity=".75"/>
<rect x="${pillarX - 70}" y="${shoulder + 8}" width="34" height="7" rx="3.5" fill="${darken(paint, 0.45)}" opacity=".8"/>
<rect x="${doorFront - 74}" y="${shoulder + 6}" width="34" height="7" rx="3.5" fill="${darken(paint, 0.45)}" opacity=".8"/>
</g>
<path d="${glass}" fill="url(#${id}-glass)"/>
<path d="${glass}" fill="none" stroke="#0a0b0c" stroke-width="5"/>
<path d="M${pillarX - 6} ${b.roof + 12} L${pillarX + 14} ${b.roof + 12} L${pillarX + 10} ${b.belt - 4} L${pillarX - 12} ${b.belt - 4} Z" fill="#0c0e10"/>
<path d="M${b.roofRear + 60} ${b.roof + 22} L${b.roofRear + 160} ${b.roof + 22} L${b.roofRear + 90} ${b.belt - 10} L${b.roofRear + 20} ${b.belt - 10} Z" fill="#fff" opacity=".06"/>
<path d="${mirror}" fill="url(#${id}-paint)" stroke="${darken(paint, 0.4)}" stroke-width="1.5"/>
<path d="${lightFront}" fill="url(#${id}-head)"/>
<path d="${lightRear}" fill="#7a1418"/>
<path d="${lightRear}" fill="none" stroke="#b3262d" stroke-width="2" opacity=".8"/>
<rect x="${b.xf - 22}" y="${b.sill - 70}" width="16" height="24" rx="4" fill="#0f1113" opacity=".85"/>
${wheel(b.rc, wy, b.r, id)}
${wheel(b.fc, wy, b.r, id)}`;
}

/**
 * Studio-Bild eines Fahrzeugs als vollständige SVG-Datei.
 * @param {object} o
 * @param {string} o.body   kompakt | limousine | kombi | suv
 * @param {string} o.paint  Lackfarbe als Hex-Wert
 * @param {number} o.view   0 = Seite, 1 = Front-Detail, 2 = Heck-Detail, 3 = Seite gespiegelt
 * @param {string} o.label  Kurzer Hinweistext unten links (z. B. "Illustration · Beispiel")
 */
export function vehicleSvg({ body, paint, view = 0, label = 'Illustration · Beispieldaten' }) {
  const id = 'v' + view;
  const views = [
    '120 190 1360 850',
    '880 450 720 450',
    '0 450 720 450',
    '120 190 1360 850'
  ];
  const mirror = view === 3 ? ` transform="translate(${W} 0) scale(-1 1)"` : '';
  const showLabel = view === 0 || view === 3;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${views[view] || views[0]}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#eceeef"/><stop offset=".72" stop-color="#dfe2e4"/><stop offset=".721" stop-color="#d6d9dc"/><stop offset="1" stop-color="#e7e9ea"/>
</linearGradient>
<radialGradient id="spot" cx=".5" cy=".42" r=".6">
<stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
</radialGradient>
</defs>
<rect x="-200" y="-200" width="${W + 400}" height="${H + 400}" fill="url(#bg)"/>
<rect x="-200" y="-200" width="${W + 400}" height="${H + 400}" fill="url(#spot)"/>
<g${mirror}><g transform="translate(100 ${GROUND - 480}) scale(1.15)">${carGroup({ body, paint, id })}</g></g>
${showLabel ? `<text x="150" y="${H - 50}" font-family="Inter, Arial, sans-serif" font-size="26" fill="#6f767c" letter-spacing="1">${label}</text>` : ''}
</svg>`;
}

/** Großes Hero-Motiv auf dunklem Studiohintergrund, Fahrzeug blickt nach links. */
export function heroSvg({ body = 'limousine', paint = '#9aa1a8' } = {}) {
  const w = 1600;
  const h = 900;
  const id = 'h';
  const car = carGroup({ body, paint, id, dark: true });
  const carR = carGroup({ body, paint, id: 'hr', dark: true });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="190 370 1140 480" width="1140" height="480">
<defs>
<radialGradient id="hs" cx=".55" cy=".58" r=".55">
<stop offset="0" stop-color="#3a3f45" stop-opacity=".9"/><stop offset=".55" stop-color="#1b1e21" stop-opacity=".6"/><stop offset="1" stop-color="#111315" stop-opacity="0"/>
</radialGradient>
<linearGradient id="hf" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
</linearGradient>
<mask id="hm"><rect x="0" y="${h - 210}" width="${w}" height="150" fill="url(#hf)"/></mask>
<linearGradient id="hl" x1="0" y1="0" x2="1" y2="0">
<stop offset="0" stop-color="#c3c8cc" stop-opacity="0"/><stop offset=".5" stop-color="#c3c8cc" stop-opacity=".35"/><stop offset="1" stop-color="#c3c8cc" stop-opacity="0"/>
</linearGradient>
</defs>
<rect x="160" y="${h - 211}" width="${w - 320}" height="1" fill="url(#hl)"/>
<g transform="translate(${w} 0) scale(-1 1)">
<g transform="translate(240 ${h - 210 - 420})">${car}</g>
<g mask="url(#hm)"><g transform="translate(240 ${h - 210}) scale(1 -1) translate(0 -420)" opacity=".5">${carR}</g></g>
</g>
</svg>`;
}

export const DEMO_BODIES = Object.keys(BODIES);
export const DEMO_VIEW_LABELS = ['Seitenansicht', 'Detail Front', 'Detail Heck', 'Seitenansicht gegenüberliegend'];
