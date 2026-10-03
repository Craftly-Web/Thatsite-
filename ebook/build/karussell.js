/*
  Rendert einen Instagram-Karussell-Post (1080 × 1350 px pro Slide) im Design des Buchs.

  Aufruf (im Ordner ebook/):
    node build/karussell.js posts/kontaktpause.json
  Ergebnis: ausgabe/instagram/posts/<name>-1.png, -2.png, … und <name>-caption.txt

  Slide-Arten in der JSON-Datei:
    { "art": "zitat",    "thema": "nacht", "text": "…", "von": "optional" }
    { "art": "text",     "thema": "sand",  "label": "…", "titel": "…", "absaetze": ["…"], "quellen": "…" }
    { "art": "schritte", "thema": "salbei","label": "…", "titel": "…", "schritte": [["Titel","Text"]], "schluss": "…", "quellen": "…" }
  Themen: nacht, salbei, sand, morgen, petrol. Im Text sind <b> und <i> erlaubt.
*/
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
let pw; try { pw = require('playwright'); } catch { pw = require(path.join(execFileSync('npm', ['root', '-g']).toString().trim(), 'playwright')); }

const ROOT = path.resolve(__dirname, '..');
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, 'buch.json'), 'utf8'));
const POST = JSON.parse(fs.readFileSync(path.resolve(process.argv[2] || 'posts/kontaktpause.json'), 'utf8'));
const OUT = path.join(ROOT, 'ausgabe', 'instagram', 'posts');
const TMP = path.join(ROOT, '.tmp');

const THEMEN = {
  nacht: { bg: 'linear-gradient(165deg,#1B2A31 0%,#24373F 55%,#2F4B54 100%)', text: '#F6EFE4', titel: '#FBF4EA', akzent: '#D9B36C', fein: '#B9C2BE', karte: 'rgba(255,255,255,.06)', huegel: '#2F4B54', sonne: '#E8B48E' },
  salbei: { bg: 'linear-gradient(180deg,#E6EEE8 0%,#D5E1D8 100%)', text: '#24383C', titel: '#20393E', akzent: '#B9735A', fein: '#5E7A70', karte: 'rgba(255,255,255,.55)', huegel: '#7E9A8C', sonne: '#B9735A' },
  sand: { bg: 'linear-gradient(180deg,#F7F1E8 0%,#EFE5D7 100%)', text: '#33363A', titel: '#2F4B54', akzent: '#B9735A', fein: '#8F7D68', karte: 'rgba(255,255,255,.6)', huegel: '#C9B8A0', sonne: '#B9735A' },
  morgen: { bg: 'linear-gradient(180deg,#F6DCC4 0%,#EEBC98 100%)', text: '#22343A', titel: '#22343A', akzent: '#8E5440', fein: '#7A5644', karte: 'rgba(255,255,255,.35)', huegel: '#C98E6E', sonne: '#FBEBD5' },
  petrol: { bg: 'linear-gradient(170deg,#2F4B54 0%,#3E6466 100%)', text: '#F6EFE4', titel: '#FBF4EA', akzent: '#E8B48E', fein: '#B8C7C3', karte: 'rgba(255,255,255,.07)', huegel: '#24373F', sonne: '#E8B48E' },
};

const emblem = th => `<svg class="emblem" viewBox="0 0 60 30"><circle cx="30" cy="19" r="10" fill="${th.sonne}"/><path d="M21.5 16.5 L26 18 L28 15.6 L31.6 19.4 L34.4 18.6 L38.6 21.6" fill="none" stroke="${th.akzent}" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round"/><path d="M0 23 C 12 18, 20 19, 30 22.5 S 48 18, 60 21 V30 H0Z" fill="${th.huegel}"/></svg>`;
const orn = th => `<svg class="orn" viewBox="0 0 120 16"><path d="M4 8 H46 M74 8 H116" stroke="${th.akzent}" stroke-width="1.2" stroke-linecap="round"/><circle cx="60" cy="8" r="5.2" fill="none" stroke="${th.akzent}" stroke-width="1.2"/><circle cx="60" cy="8" r="1.8" fill="${th.akzent}"/></svg>`;

function inhalt(s, th) {
  if (s.art === 'zitat') {
    const len = s.text.length, gr = len < 60 ? 76 : len < 95 ? 68 : len < 135 ? 60 : 52;
    return `<div class="mitte zentriert">${orn(th)}<p class="zitat" style="font-size:${gr}px">„${s.text}“</p>${s.von ? `<p class="von">${s.von}</p>` : ''}</div>`;
  }
  const kopf = `<p class="label">${s.label}</p><h1>${s.titel}</h1>`;
  if (s.art === 'text') {
    return `<div class="mitte">${kopf}${s.absaetze.map(a => `<p class="abs">${a}</p>`).join('')}</div>`;
  }
  return `<div class="mitte">${kopf}${s.schritte.map(([t, x], i) => `<div class="schritt"><span class="num">${i + 1}</span><div><p class="s-t">${t}</p><p class="s-x">${x}</p></div></div>`).join('')}${s.schluss ? `<p class="schluss">${s.schluss}</p>` : ''}</div>`;
}

function seite(s, i, n) {
  const th = THEMEN[s.thema] || THEMEN.sand;
  const fuss = [CFG.instagram_name, CFG.titel].filter(Boolean).join('  ·  ');
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>
  ${fs.readFileSync(path.join(ROOT, 'fonts', 'fonts.css'), 'utf8').replace(/url\(([^)]+)\)/g, (_, f) => `url(file://${path.join(ROOT, 'fonts', f)})`)}
  html,body{margin:0;font-variation-settings:'WONK' 0,'SOFT' 50}
  .k{width:1080px;height:1350px;box-sizing:border-box;padding:96px 100px 72px;background:${th.bg};color:${th.text};display:flex;flex-direction:column}
  .oben{display:flex;justify-content:space-between;align-items:center}
  .emblem{width:132px;height:66px}
  .seite{font-family:'DM Sans';font-weight:600;font-size:22px;letter-spacing:.18em;color:${th.fein}}
  .mitte{flex:1;display:flex;flex-direction:column;justify-content:center}
  .zentriert{align-items:center;text-align:center}
  .orn{width:150px;height:20px;margin-bottom:46px}
  .zitat{font-family:'Fraunces';font-style:italic;font-weight:400;line-height:1.3;margin:0;color:${th.titel};text-wrap:balance}
  .von{font-family:'DM Sans';font-weight:600;font-size:22px;letter-spacing:.18em;text-transform:uppercase;color:${th.akzent};margin-top:40px}
  .label{font-family:'DM Sans';font-weight:700;font-size:22px;letter-spacing:.24em;text-transform:uppercase;color:${th.akzent};margin:0 0 18px}
  h1{font-family:'Fraunces';font-weight:540;font-size:62px;line-height:1.1;color:${th.titel};margin:0 0 44px;text-wrap:balance}
  h1::after{content:'';display:block;width:80px;height:5px;border-radius:3px;background:${th.akzent};margin-top:30px}
  .abs{font-family:'Literata';font-size:33px;line-height:1.5;margin:0 0 30px}
  b{font-weight:650;color:${th.titel}}
  .schritt{display:flex;gap:30px;padding:26px 30px;margin-bottom:20px;border-radius:24px;background:${th.karte}}
  .num{flex:0 0 58px;height:58px;border-radius:50%;background:${th.akzent};color:#FFF8EE;font-family:'Fraunces';font-weight:560;font-size:32px;display:flex;align-items:center;justify-content:center;margin-top:4px}
  .s-t{font-family:'Fraunces';font-weight:600;font-size:36px;line-height:1.2;color:${th.titel};margin:0 0 8px}
  .s-x{font-family:'Literata';font-size:27px;line-height:1.42;margin:0}
  .k.voll h1{margin-bottom:34px;font-size:58px}
  .k.voll .schritt{padding:22px 28px;margin-bottom:16px}
  .schluss{font-family:'Fraunces';font-style:italic;font-size:31px;line-height:1.4;color:${th.akzent};margin:22px 0 0;text-align:center}
  .unten{display:flex;justify-content:space-between;align-items:center;font-family:'DM Sans';font-weight:600;font-size:19px;letter-spacing:.16em;text-transform:uppercase;color:${th.fein}}
  .weiter{font-size:34px;letter-spacing:0;color:${th.akzent}}
  </style></head><body><div class="k${s.art === 'schritte' ? ' voll' : ''}">
  <div class="oben">${emblem(th)}<span class="seite">${i + 1} / ${n}</span></div>
  ${inhalt(s, th)}
  <div class="unten"><span>${s.quellen ? 'Studien: ' + s.quellen : fuss}</span><span class="weiter">${i + 1 < n ? '→' : ''}</span></div>
  </div></body></html>`;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(TMP, { recursive: true });
  const browser = await pw.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  for (const [i, s] of POST.slides.entries()) {
    const html = path.join(TMP, `post-${i}.html`);
    fs.writeFileSync(html, seite(s, i, POST.slides.length));
    await page.goto('file://' + html);
    await page.evaluate(() => document.fonts.ready);
    const ueberlauf = await page.evaluate(() => { const m = document.querySelector('.mitte'); return m.scrollHeight > m.clientHeight + 1; });
    if (ueberlauf) console.warn(`Achtung: Slide ${i + 1} ist zu voll – Text kürzen.`);
    await page.screenshot({ path: path.join(OUT, `${POST.name}-${i + 1}.png`) });
  }
  await browser.close();
  if (POST.caption) fs.writeFileSync(path.join(OUT, `${POST.name}-caption.txt`), POST.caption + '\n');
  console.log(`${POST.slides.length} Slides → ${path.relative(ROOT, OUT)}`);
})().catch(e => { console.error(e); process.exit(1); });
