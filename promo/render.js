/*
  Exportiert reel.html als MP4 (1080×1920, 30 fps, H.264) für Instagram Reels / TikTok.

  Die Animation wird Bild für Bild mit einer virtuellen Uhr gerendert – dadurch ist das
  Video immer flüssig, egal wie schnell der Rechner ist.

  Voraussetzungen (einmalig):
    npm install playwright
    npx playwright install chromium
    ffmpeg installiert (https://ffmpeg.org) – oder Pfad per FFMPEG=/pfad/zu/ffmpeg angeben

  Aufruf (im Ordner promo/):
    node render.js                  -> thatsite-reel.mp4
    node render.js speed=1.2        -> schnellere Version
    node render.js fps=60           -> 60 Bilder pro Sekunde
    node render.js out=mein.mp4     -> anderer Dateiname
*/
const path = require('path'), fs = require('fs'), os = require('os');
const { execFileSync } = require('child_process');
let pw; try { pw = require('playwright'); } catch { pw = require(path.join(execFileSync('npm', ['root', '-g']).toString().trim(), 'playwright')); }

const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const args = Object.fromEntries(process.argv.slice(2).map(a => a.split('=')));
const speed = args.speed || '1';
const fps = parseInt(args.fps || '30', 10);
const out = path.resolve(process.cwd(), args.out || path.join(__dirname, 'thatsite-reel.mp4'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-'));

(async () => {
  const browser = await pw.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });

  // Virtuelle Uhr: Timer, requestAnimationFrame & Co. laufen nur, wenn wir sie vorspulen
  await page.clock.install({ time: 0 });
  await page.goto('file://' + path.resolve(__dirname, 'reel.html') + '?wait&speed=' + speed);
  await page.evaluate(() => document.fonts.ready);
  await page.clock.pauseAt(1000);                    // Uhr anhalten – ab jetzt läuft sie nur per runFor()

  // CSS-Animationen/Übergänge an die virtuelle Uhr koppeln
  await page.evaluate(() => {
    window.__births = new Map();
    window.__sync = vt => {
      for (const a of document.getAnimations()) {
        if (!__births.has(a)) __births.set(a, vt);
        a.pause();
        a.currentTime = vt - __births.get(a);
      }
    };
    startReel();
  });

  const step = 1000 / fps;
  let vt = 40;
  await page.clock.runFor(vt);                       // startet den Ablauf (requestAnimationFrame)
  const duration = await page.evaluate(() => window.reelDuration);
  const frames = Math.ceil(duration / step);

  for (let i = 0; i < frames; i++) {
    await page.evaluate(t => __sync(t), vt);
    await page.screenshot({ path: path.join(tmp, `f${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 95 });
    await page.clock.runFor(step);
    vt += step;
    if (i % fps === 0) process.stdout.write(`\rRendere … ${Math.round(i / frames * 100)} %`);
  }
  await browser.close();
  process.stdout.write('\rRendere … 100 %\n');

  // MP4 mit stummer Tonspur (manche Apps erwarten eine Audiospur)
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error',
    '-framerate', String(fps), '-i', path.join(tmp, 'f%05d.jpg'),
    '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
    '-vf', 'format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-profile:v', 'high',
    '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', out], { stdio: 'inherit' });

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`Fertig: ${out}  (${frames} Bilder, ${(frames / fps).toFixed(1)} s)`);
})();
