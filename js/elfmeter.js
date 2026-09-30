/* Elfmeter-Duell — Canvas-Spiel ohne Abhängigkeiten.
   Welt in Metern: x quer zum Tor, y nach oben, z vom Elfmeterpunkt (0) zur Torlinie (11). */
(() => {
  'use strict';

  // @@core-start
  const GOAL_W = 7.32, HALF_W = GOAL_W / 2, GOAL_H = 2.44;
  const POST_R = 0.06, BALL_R = 0.11, LINE_Z = 11, NET_D = 2, NET_TOP = 2.0;
  const AIM_MAX = HALF_W + 0.6;   // Ausschlag des Richtungsbalkens
  const SWEET = 0.75;             // ideale Schusshärte
  const REACH = 3.1;              // Reichweite der Handschuhe beim Hechtsprung

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  // Treffhöhe an der Torlinie: 75 % landet knapp unter der Latte, darüber steigt er schnell.
  function heightFor(p) {
    const top = GOAL_H - POST_R - BALL_R - 0.05;
    if (p <= SWEET) return BALL_R + (top - BALL_R) * Math.pow(p / SWEET, 1.6);
    return top + (p - SWEET) * 9;
  }
  const flightTimeFor = (p) => 1.3 - 0.85 * p;

  const IDLE = { F: { x: 0, y: 0 }, S: { x: 0, y: 1.45 }, H1: { x: -0.5, y: 1.15 }, H2: { x: 0.5, y: 1.15 } };

  function swayPose(t) {
    const dx = Math.sin(t * 1.7) * 0.14, bob = Math.abs(Math.sin(t * 3.4)) * 0.05;
    return {
      F: { x: dx * 0.6, y: 0 }, S: { x: dx, y: 1.45 - bob },
      H1: { x: -0.5 + dx, y: 1.15 - bob }, H2: { x: 0.5 + dx, y: 1.15 - bob },
    };
  }

  // Endpose eines Sprungs zu Zielpunkt (tx, ty) auf der Torlinie.
  function divePose(tx, ty) {
    ty = clamp(ty, 0.15, 2.75);
    if (Math.abs(tx) < 0.75) {
      const jump = Math.max(0, ty - 1.95), crouch = ty < 1 ? (1 - ty) * 0.55 : 0;
      const S = { x: tx * 0.75, y: 1.45 + jump - crouch };
      const hy = Math.min(ty, S.y + 0.75);
      return { F: { x: tx * 0.5, y: jump }, S, H1: { x: tx - 0.14, y: hy }, H2: { x: tx + 0.14, y: hy } };
    }
    const d = Math.sign(tx), O = { x: d * 0.15, y: 0.25 };
    const vx = tx - O.x, vy = ty - O.y, len = Math.hypot(vx, vy);
    const ux = vx / len, uy = vy / len, r = Math.min(len, REACH);
    const H = { x: O.x + ux * r, y: O.y + uy * r };
    const S = { x: H.x - ux * 0.62, y: H.y - uy * 0.62 };
    const F = { x: S.x - ux * 1.45, y: Math.max(0.12, S.y - uy * 1.45) };
    const px = -uy * 0.11, py = ux * 0.11;
    return { F, S, H1: { x: H.x + px, y: H.y + py }, H2: { x: H.x - px, y: H.y - py } };
  }

  function poseAt(target, since, dur, base) {
    if (!target || since < 0) return base;
    const s = clamp(since / dur, 0, 1), e = easeOut(s);
    const D = divePose(target.x, target.y);
    const lateral = Math.abs(target.x) >= 0.75;
    const lift = lateral ? Math.sin(Math.PI * s) * 0.22 : 0;
    const fall = lateral && since > dur + 0.25 ? easeOut(clamp((since - dur - 0.25) / 0.35, 0, 1)) : 0;
    const mix = (a, b) => {
      let y = lerp(a.y, b.y, e) + lift;
      if (fall) y = Math.max(0.12, y - (y - 0.15) * 0.8 * fall);
      return { x: lerp(a.x, b.x, e), y };
    };
    return { F: mix(base.F, D.F), S: mix(base.S, D.S), H1: mix(base.H1, D.H1), H2: mix(base.H2, D.H2) };
  }

  function segDist(px, py, a, b) {
    const vx = b.x - a.x, vy = b.y - a.y, L = vx * vx + vy * vy;
    const t = L ? clamp(((px - a.x) * vx + (py - a.y) * vy) / L, 0, 1) : 0;
    return Math.hypot(px - (a.x + vx * t), py - (a.y + vy * t));
  }

  // Berührt der Ball (Mittelpunkt bx, by an der Torlinie) den Torwart?
  function keeperTouch(pose, bx, by) {
    const { F, S, H1, H2 } = pose;
    const L = Math.hypot(S.x - F.x, S.y - F.y) || 1;
    const head = { x: S.x + (S.x - F.x) / L * 0.27, y: S.y + (S.y - F.y) / L * 0.27 };
    const parts = [
      ['body', segDist(bx, by, F, S) - 0.3],
      ['arm', segDist(bx, by, S, H1) - 0.1],
      ['arm', segDist(bx, by, S, H2) - 0.1],
      ['hand', Math.hypot(bx - H1.x, by - H1.y) - 0.23],
      ['hand', Math.hypot(bx - H2.x, by - H2.y) - 0.23],
      ['head', Math.hypot(bx - head.x, by - head.y) - 0.14],
    ];
    let best = null;
    for (const [part, gap] of parts) if (gap < BALL_R && (!best || gap < best.gap)) best = { part, gap };
    return best;
  }

  function frameCheck(X, Y) {
    const ax = Math.abs(X), R = POST_R + BALL_R;
    if (Math.abs(ax - HALF_W) < R && Y < GOAL_H + POST_R) return { kind: 'post', inside: ax < HALF_W - 0.02 };
    if (Math.abs(Y - GOAL_H) < R && ax < HALF_W + POST_R) return { kind: 'bar', inside: Y < GOAL_H - 0.03 };
    if (Y > GOAL_H) return { kind: 'over' };
    if (ax > HALF_W) return { kind: 'wide' };
    return { kind: 'in' };
  }

  // Torwart-KI (Rolle Schütze): rät eine Ecke, bei langsamen Bällen korrigiert er nach.
  function aiKeeperGuess(X, Y, T, rnd) {
    const r = rnd();
    let side = r < 0.42 ? -1 : r < 0.84 ? 1 : 0;
    if (rnd() < 0.2) side = Math.abs(X) < 0.9 ? 0 : Math.sign(X);
    const gx = side === 0 ? (rnd() - 0.5) * 0.8 : side * (1.8 + rnd() * 1.6);
    const gy = 0.25 + rnd() * 1.9;
    const k = clamp((T - 0.55) / 0.45, 0, 1);
    return { x: lerp(gx, X, k), y: lerp(gy, Y, k) };
  }

  const aiDiveDelay = (T) => Math.max(0.08, T - 0.55);

  // Schützen-KI (Rolle Torwart). commit = Sprungziel, wenn der Torwart zu früh losgesprungen ist.
  function aiShot(rnd, commit) {
    let X, Y;
    if (rnd() < 0.07) {
      if (rnd() < 0.5) { X = (rnd() < 0.5 ? -1 : 1) * (HALF_W + 0.25 + rnd() * 0.8); Y = 0.2 + rnd() * 1.5; }
      else { X = (rnd() - 0.5) * 6; Y = GOAL_H + 0.25 + rnd() * 0.8; }
    } else {
      const side = rnd() < 0.5 ? -1 : 1;
      X = rnd() < 0.7 ? side * (2.3 + rnd() * 1.15) : (rnd() * 2 - 1) * 2;
      Y = 0.15 + 2.05 * Math.pow(rnd(), 1.4);
    }
    if (commit && rnd() < 0.75) {
      const s = Math.abs(commit.x) < 0.75 ? (rnd() < 0.5 ? -1 : 1) : -Math.sign(commit.x);
      X = s * (2.4 + rnd()); Y = 0.2 + rnd() * 1.6;
    }
    return { X, Y, T: 0.5 + rnd() * 0.22 };
  }
  // @@core-end

  const $ = (id) => document.getElementById(id);
  const canvas = $('pitch');
  const appEl = canvas.parentElement;
  const ctx = canvas.getContext('2d');
  const reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const SHOTS = 5, NEAR = 0.3, KEEPER_Z = LINE_Z - 0.15;

  const C = {
    home: '#E2701F', homeHi: '#FF9448', away: '#2EC4B6', awayDark: '#157A70',
    night: '#0A0E16', grassA: '#1B5431', grassB: '#20613A',
    line: 'rgba(240,244,250,0.86)', boot: '#0B0D12', skin: '#C68B5E', hair: '#241A13', glove: '#F3F5F8',
  };
  const KITS = {
    home: { shirt: C.home, shorts: '#141922', socks: C.home },
    away: { shirt: C.away, shorts: '#F1F3F6', socks: C.awayDark },
  };

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ohne Speicher weiterspielen */ } },
  };

  /* ---------- Ton (Web Audio, startet erst nach der ersten Eingabe) ---------- */
  const Sound = (() => {
    let ac = null, master = null, noise = null, on = store.get('elfmeter.sound') !== 'off';
    function init() {
      if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
      if (!on) return;
      const A = window.AudioContext || window.webkitAudioContext;
      if (!A) return;
      try { ac = new A(); } catch (e) { return; }
      master = ac.createGain(); master.gain.value = 0.55; master.connect(ac.destination);
      noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const s = src(true), f = ac.createBiquadFilter(), g = ac.createGain();
      f.type = 'bandpass'; f.frequency.value = 500; f.Q.value = 0.5; g.gain.value = 0.03;
      s.connect(f).connect(g).connect(master); s.start();
    }
    const live = () => on && ac;
    function src(loop) { const s = ac.createBufferSource(); s.buffer = noise; s.loop = !!loop; return s; }
    function env(g, t, a, peak, dec) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
    }
    function tone(type, freq, t, a, peak, dec, to) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (to) o.frequency.exponentialRampToValueAtTime(to, t + a + dec);
      env(g, t, a, peak, dec); o.connect(g).connect(master); o.start(t); o.stop(t + a + dec + 0.05);
      return o;
    }
    function burst(type, freq, q, t, a, peak, dec) {
      const s = src(true), f = ac.createBiquadFilter(), g = ac.createGain();
      f.type = type; f.frequency.value = freq; f.Q.value = q;
      env(g, t, a, peak, dec); s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + a + dec + 0.05);
    }
    return {
      init,
      get on() { return on; },
      set(v) {
        on = v; store.set('elfmeter.sound', v ? 'on' : 'off');
        if (v) init();
        if (master) master.gain.value = v ? 0.55 : 0;
      },
      tick() { if (live()) tone('sine', 880, ac.currentTime, 0.003, 0.15, 0.05); },
      kick(p) {
        if (!live()) return;
        const t = ac.currentTime;
        tone('sine', 170, t, 0.004, 0.45 + 0.5 * p, 0.17, 45);
        burst('highpass', 1800, 0.7, t, 0.002, 0.22, 0.05);
      },
      whistle() {
        if (!live()) return;
        const t = ac.currentTime;
        [[0, 0.16], [0.26, 0.42]].forEach(([o, len]) => {
          const osc = tone('sine', 2850, t + o, 0.02, 0.16, len);
          const lfo = ac.createOscillator(), lg = ac.createGain();
          lfo.frequency.value = 34; lg.gain.value = 140; lfo.connect(lg).connect(osc.frequency);
          lfo.start(t + o); lfo.stop(t + o + len + 0.1);
        });
      },
      cheer() { if (live()) burst('bandpass', 1100, 0.7, ac.currentTime, 0.12, 0.5, 2.2); },
      groan() { if (live()) burst('bandpass', 420, 1.1, ac.currentTime, 0.25, 0.32, 1.2); },
      ping() {
        if (!live()) return;
        const t = ac.currentTime;
        tone('sine', 1250, t, 0.002, 0.3, 0.9); tone('sine', 1830, t, 0.002, 0.14, 0.6);
      },
      thud() { if (live()) burst('lowpass', 320, 0.8, ac.currentTime, 0.004, 0.6, 0.12); },
    };
  })();

  /* ---------- Zustand ---------- */
  let W = 0, H = 0, DPR = 1, cam = null, crowd = [];
  const G = {
    role: 'shooter', phase: 'menu', pt: 0, now: 0, shot: 0, results: [],
    aimU: 0, aimPhase: 0, aimLocked: 0, power: 0,
    sh: null, kickAt: 0, outcome: null, early: false, tap: null,
    ball: { x: 0, y: BALL_R, z: 0, vx: 0, vy: 0, vz: 0, spin: 0, attached: false },
    kp: { target: null, start: 0, dur: 0.45 },
    runner: { x: -1.35, z: -2.7, ph: 0 },
    readyDur: 1, bulge: { x: 0, y: 0, amp: 0, t: -9 }, push: 0, celebrate: -9, celebrateTeam: 'home',
    promptNext: false,
  };

  /* ---------- Kamera und Projektion ---------- */
  function buildCam(view) {
    if (view === 'shooter') {
      const f = Math.min(W * 1.75, H * 1.9);
      const c = { view, x: 0, y: 1.45, z: -5 + G.push, dir: 1, f, cx: W / 2 };
      const top = H * (H > W * 1.1 ? 0.36 : 0.24);
      c.hy = top + f * (GOAL_H + 0.1 - c.y) / (LINE_Z - c.z);
      return c;
    }
    const f = Math.min(W * 1.05, H * 1.3);
    const dg = Math.max(4.5, (GOAL_W + 0.7) * f / (W * 0.96));
    const c = { view, x: 0, y: 1.55, z: LINE_Z + dg, dir: -1, f, cx: W / 2 };
    c.hy = H * (H > W * 1.1 ? 0.66 : 0.84) - f * c.y / dg;
    return c;
  }
  const depth = (p) => (p.z - cam.z) * cam.dir;
  function proj(x, y, z) {
    const d = (z - cam.z) * cam.dir;
    return { x: cam.cx + cam.f * (x - cam.x) * cam.dir / d, y: cam.hy - cam.f * (y - cam.y) / d, d, s: cam.f / d };
  }
  function clipNear(pts) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const da = depth(a) - NEAR, db = depth(b) - NEAR;
      if (da >= 0) out.push(a);
      if ((da >= 0) !== (db >= 0)) {
        const t = da / (da - db);
        out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });
      }
    }
    return out;
  }
  function fillPoly(pts, style) {
    const c = clipNear(pts);
    if (c.length < 3) return;
    ctx.beginPath();
    c.forEach((p, i) => { const q = proj(p.x, p.y, p.z); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); });
    ctx.closePath(); ctx.fillStyle = style; ctx.fill();
  }
  function groundLine(ax, az, bx, bz, w = 0.12) {
    const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz), nx = -dz / L * w / 2, nz = dx / L * w / 2;
    fillPoly([{ x: ax + nx, y: 0, z: az + nz }, { x: bx + nx, y: 0, z: bz + nz },
      { x: bx - nx, y: 0, z: bz - nz }, { x: ax - nx, y: 0, z: az - nz }], C.line);
  }
  function unprojectGoal(sx, sy) {
    const d = (LINE_Z - cam.z) * cam.dir;
    return {
      x: clamp(cam.x + (sx - cam.cx) * d / (cam.f * cam.dir), -4.6, 4.6),
      y: clamp(cam.y - (sy - cam.hy) * d / cam.f, 0.15, 2.75),
    };
  }

  /* ---------- Stadion ---------- */
  function seedCrowd() {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const n = Math.round(clamp(W * H / 420, 500, 2600));
    const palette = ['#232A3A', '#2E3649', '#1A1F2B', '#3A4356', '#262C3B'];
    crowd = [];
    for (let i = 0; i < n; i++) {
      const r = rnd();
      const team = r < 0.2 ? 'home' : r < 0.31 ? 'away' : null;
      const c = team === 'home' ? (rnd() < 0.5 ? C.home : '#B85A18') : team === 'away' ? (rnd() < 0.5 ? C.away : '#1E9186')
        : r < 0.36 ? '#C9CFDA' : palette[Math.floor(rnd() * palette.length)];
      crowd.push({ u: rnd(), v: Math.pow(rnd(), 0.8), c, team, ph: rnd() * 6.28 });
    }
    crowd.sort((a, b) => (a.c < b.c ? -1 : 1));
  }

  function drawStands(bTop) {
    const roof = Math.max(10, bTop * 0.14);
    const g = ctx.createLinearGradient(0, 0, 0, bTop);
    g.addColorStop(0, '#05070C'); g.addColorStop(1, '#141A26');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, bTop + 1);
    const band = bTop - roof - 3;
    if (band > 6) {
      const cheer = clamp(1 - (G.now - G.celebrate) / 2.4, 0, 1);
      let last = null;
      for (const p of crowd) {
        if (p.c !== last) { ctx.fillStyle = p.c; last = p.c; }
        const s = 1.4 + p.v * 2.4;
        let y = roof + 2 + p.v * band;
        if (cheer && p.team === G.celebrateTeam) y -= Math.abs(Math.sin(G.now * 13 + p.ph)) * 4 * cheer;
        ctx.fillRect(p.u * W, y, s, s * 1.2);
      }
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      const flashes = cheer > 0.2 ? 10 : 1;
      for (let i = 0; i < flashes; i++) if (Math.random() < 0.35) ctx.fillRect(Math.random() * W, roof + Math.random() * band, 2, 2);
    }
    // Dachkante mit Flutlicht
    ctx.fillStyle = '#04060A'; ctx.fillRect(0, 0, W, roof);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const n = Math.max(6, Math.round(W / 90));
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) * W / n, y = roof * 0.62;
      const r = Math.max(40, W * 0.09);
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
      glow.addColorStop(0, 'rgba(255,248,230,0.34)'); glow.addColorStop(1, 'rgba(255,248,230,0)');
      ctx.fillStyle = glow; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.fillStyle = 'rgba(255,252,240,0.95)'; ctx.fillRect(x - 7, y - 1.5, 14, 3);
    }
    ctx.restore();
  }

  function drawBoards(z) {
    const a = proj(-60, 0.95, z), b = proj(60, 0, z);
    const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), y0 = a.y, h = b.y - a.y;
    ctx.fillStyle = '#0C1018'; ctx.fillRect(x0, y0, x1 - x0, h);
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, h); ctx.clip();
    const fs = Math.max(6, h * 0.62);
    ctx.font = `600 ${fs}px ui-monospace, Menlo, Consolas, monospace`;
    ctx.textBaseline = 'middle';
    const text = 'ELFMETER-DUELL  ·  11 M  ·  7,32 × 2,44  ·  ';
    const tw = ctx.measureText(text).width || 200;
    const off = -((G.now * fs * 1.6) % tw);
    for (let x = off; x < W; x += tw) {
      ctx.fillStyle = 'rgba(226,112,31,0.6)'; ctx.fillText(text, x, y0 + h / 2 + 0.5);
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x0, y0, x1 - x0, 1);
  }

  function drawPitch(boardZ) {
    const bBot = proj(0, 0, boardZ).y;
    ctx.fillStyle = C.grassA; ctx.fillRect(0, bBot - 1, W, H - bBot + 1);
    const lo = cam.view === 'shooter' ? -12 : boardZ, hi = cam.view === 'shooter' ? boardZ : LINE_Z + 12;
    for (let z = Math.floor(lo / 2.75) * 2.75, i = 0; z < hi; z += 2.75, i++) {
      if (Math.round(z / 2.75) % 2) continue;
      const z0 = Math.max(z, lo), z1 = Math.min(z + 2.75, hi);
      fillPoly([{ x: -45, y: 0, z: z0 }, { x: 45, y: 0, z: z0 }, { x: 45, y: 0, z: z1 }, { x: -45, y: 0, z: z1 }], C.grassB);
    }
    // Linien
    groundLine(-34, LINE_Z, 34, LINE_Z);
    for (const s of [-1, 1]) {
      groundLine(s * 9.16, LINE_Z, s * 9.16, LINE_Z - 5.5);
      groundLine(s * 20.16, LINE_Z, s * 20.16, LINE_Z - 16.5);
    }
    groundLine(-9.16, LINE_Z - 5.5, 9.16, LINE_Z - 5.5);
    groundLine(-20.16, LINE_Z - 16.5, 20.16, LINE_Z - 16.5);
    const lim = Math.acos(5.5 / 9.15), steps = 18;
    for (let i = 0; i < steps; i++) {
      const a0 = -lim + (2 * lim) * i / steps, a1 = -lim + (2 * lim) * (i + 1) / steps;
      groundLine(9.15 * Math.sin(a0), -9.15 * Math.cos(a0), 9.15 * Math.sin(a1), -9.15 * Math.cos(a1));
    }
    const spot = [];
    for (let i = 0; i < 10; i++) spot.push({ x: Math.cos(i / 10 * 6.283) * 0.13, y: 0, z: Math.sin(i / 10 * 6.283) * 0.13 });
    fillPoly(spot, C.line);
  }

  function drawNet(alpha) {
    const b = G.bulge, age = G.now - b.t;
    const amp = age >= 0 ? b.amp * Math.exp(-age * 3.5) : 0;
    const back = (x, y) => ({ x, y, z: LINE_Z + NET_D + amp * Math.exp(-((x - b.x) ** 2 + (y - b.y) ** 2) / 0.7) });
    const topAt = (z) => lerp(GOAL_H, NET_TOP, (z - LINE_Z) / NET_D);
    ctx.beginPath();
    const line = (pts) => pts.forEach((p, i) => { const q = proj(p.x, p.y, p.z); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); });
    const step = 0.3;
    for (let x = -HALF_W; x <= HALF_W + 0.01; x += step) {
      const pts = []; for (let k = 0; k <= 8; k++) pts.push(back(x, NET_TOP * k / 8)); line(pts);
      line([{ x, y: GOAL_H, z: LINE_Z }, { x, y: NET_TOP, z: LINE_Z + NET_D }]);
    }
    for (let y = 0; y <= NET_TOP + 0.01; y += step) {
      const pts = []; for (let k = 0; k <= 16; k++) pts.push(back(-HALF_W + GOAL_W * k / 16, y)); line(pts);
    }
    for (let z = LINE_Z + step; z < LINE_Z + NET_D; z += step) {
      line([{ x: -HALF_W, y: topAt(z), z }, { x: HALF_W, y: topAt(z), z }]);
      for (const s of [-HALF_W, HALF_W]) line([{ x: s, y: 0, z }, { x: s, y: topAt(z), z }]);
    }
    for (const s of [-HALF_W, HALF_W]) {
      for (let y = step; y < GOAL_H; y += step) line([{ x: s, y, z: LINE_Z }, { x: s, y: Math.min(y, NET_TOP), z: LINE_Z + NET_D }]);
    }
    ctx.strokeStyle = `rgba(232,236,244,${alpha})`; ctx.lineWidth = 1; ctx.stroke();
  }

  function drawFrame() {
    const p = proj(0, 0, LINE_Z), w = Math.max(2, p.s * POST_R * 2);
    ctx.lineCap = 'butt';
    for (const s of [-HALF_W, HALF_W]) {
      const a = proj(s, 0, LINE_Z), b = proj(s, GOAL_H, LINE_Z);
      ctx.strokeStyle = '#F4F6FA'; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y - w / 2); ctx.stroke();
    }
    const a = proj(-HALF_W - POST_R, GOAL_H, LINE_Z), b = proj(HALF_W + POST_R, GOAL_H, LINE_Z);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = Math.max(1, w * 0.35);
    ctx.beginPath(); ctx.moveTo(a.x, a.y + w * 0.3); ctx.lineTo(b.x, b.y + w * 0.3); ctx.stroke();
  }

  /* ---------- Figuren ---------- */
  function stroke(a, b, w, color) {
    ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, w);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  function disc(p, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1, r), 0, 6.2832); ctx.fill(); }

  function drawKeeper(pose, kit, fromBehind) {
    const z = KEEPER_Z, P = (p) => proj(p.x, p.y, z), sc = proj(0, 0, z).s;
    const { F, S, H1, H2 } = pose;
    let ux = S.x - F.x, uy = S.y - F.y; const L = Math.hypot(ux, uy) || 1; ux /= L; uy /= L;
    const nx = -uy, ny = ux;
    const at = (p, a, b) => ({ x: p.x + nx * a + ux * b, y: p.y + ny * a + uy * b });
    const hip = at(F, 0, L * 0.55);
    const spread = 0.14 + 0.1 * Math.max(0, uy);
    const sh = P({ x: (F.x + S.x) / 2, y: 0 });
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath(); ctx.ellipse(sh.x, sh.y, sc * (0.45 + Math.abs(ux) * 1.1), sc * 0.1, 0, 0, 6.2832); ctx.fill();
    ctx.lineCap = 'round';
    for (const s of [1, -1]) {
      const foot = at(F, s * spread, 0);
      stroke(P(at(hip, s * 0.1, 0)), P(foot), sc * 0.17, kit.socks);
      disc(P(foot), sc * 0.08, C.boot);
    }
    stroke(P(hip), P(at(hip, 0, 0.2)), sc * 0.42, kit.shorts);
    const chest = at(hip, 0, 0.2);
    stroke(P(chest), P(S), sc * 0.46, kit.shirt);
    const arms = [[at(S, 0.19, 0), H1], [at(S, -0.19, 0), H2]];
    for (const [shoulder, hand] of arms) {
      stroke(P(shoulder), P(hand), sc * 0.13, kit.shirt);
      disc(P(hand), sc * 0.1, C.glove);
    }
    if (fromBehind) {
      const a = P(chest), b = P(S);
      ctx.save(); ctx.translate((a.x + b.x) / 2, (a.y + b.y) / 2);
      ctx.rotate(Math.atan2(b.y - a.y, b.x - a.x) + Math.PI / 2);
      ctx.fillStyle = 'rgba(20,16,12,0.85)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.max(6, sc * 0.3)}px system-ui, Arial, sans-serif`;
      ctx.fillText('1', 0, 0); ctx.restore();
    }
    const head = P(at(S, 0, 0.27));
    disc(head, sc * 0.13, fromBehind ? C.hair : C.skin);
    if (!fromBehind) {
      ctx.fillStyle = C.hair; ctx.beginPath();
      ctx.arc(head.x, head.y, sc * 0.13, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
    }
  }

  // Gegnerischer Schütze, von vorn gesehen (nur in der Torwart-Perspektive).
  function drawRunner() {
    const r = G.runner, z = r.z, P = (x, y) => proj(r.x + x, y, z), sc = proj(r.x, 0, z).s, kit = KITS.away;
    const running = G.phase === 'runup' ? 1 : 0;
    const kick = G.phase === 'flight' || G.phase === 'after' ? clamp((G.now - G.kickAt + 0.12) / 0.4, 0, 1) : 0;
    const lift = (ph) => running * Math.max(0, Math.sin(ph)) * 0.3;
    const sh = P(0, 0);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(sh.x, sh.y, sc * 0.4, sc * 0.08, 0, 0, 6.2832); ctx.fill();
    ctx.lineCap = 'round';
    const footL = { x: -0.14, y: lift(r.ph) };
    const footR = kick ? { x: 0.28, y: 0.08 + Math.sin(kick * Math.PI) * 0.5 } : { x: 0.14, y: lift(r.ph + Math.PI) };
    for (const [hx, f] of [[-0.09, footL], [0.09, footR]]) {
      stroke(P(hx, 0.92), P(f.x, f.y + 0.05), sc * 0.16, kit.socks);
      disc(P(f.x, f.y + 0.04), sc * 0.08, C.boot);
    }
    stroke(P(0, 0.95), P(0, 1.1), sc * 0.4, kit.shorts);
    stroke(P(0, 1.1), P(0, 1.48), sc * 0.44, kit.shirt);
    const sw = running ? Math.sin(r.ph) * 0.18 : 0;
    stroke(P(-0.2, 1.45), P(-0.34, 1.02 + sw), sc * 0.12, kit.shirt);
    stroke(P(0.2, 1.45), P(0.34 + kick * 0.2, 1.02 - sw + kick * 0.35), sc * 0.12, kit.shirt);
    const head = P(0, 1.72);
    disc(head, sc * 0.13, C.skin);
    ctx.fillStyle = C.hair; ctx.beginPath(); ctx.arc(head.x, head.y, sc * 0.13, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
  }

  function drawBall() {
    const b = G.ball, d = (b.z - cam.z) * cam.dir;
    if (d < NEAR + 0.2) return;
    const p = proj(b.x, b.y, b.z), r = Math.max(1.5, cam.f * BALL_R / d);
    const g0 = proj(b.x, 0, b.z), hgt = Math.max(0, b.y - BALL_R);
    ctx.fillStyle = `rgba(0,0,0,${clamp(0.45 - hgt * 0.12, 0.08, 0.45)})`;
    ctx.beginPath(); ctx.ellipse(g0.x, g0.y, r * (1 + hgt * 0.12), r * 0.3, 0, 0, 6.2832); ctx.fill();
    const g = ctx.createRadialGradient(p.x - r * 0.35, p.y - r * 0.4, r * 0.1, p.x, p.y, r);
    g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.7, '#E2E6ED'); g.addColorStop(1, '#8E97A6');
    ctx.save();
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.2832); ctx.fillStyle = g; ctx.fill(); ctx.clip();
    ctx.translate(p.x, p.y); ctx.rotate(b.spin);
    ctx.fillStyle = 'rgba(24,29,40,0.85)';
    const pent = (cx, cy, pr) => {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) { const a = i * 1.2566 - 1.5708; ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * pr, cy + Math.sin(a) * pr); }
      ctx.fill();
    };
    const roll = Math.sin(b.spin * 0.7) * r * 0.25;
    pent(roll, 0, r * 0.3);
    for (let i = 0; i < 5; i++) { const a = i * 1.2566 + 0.63; pent(roll + Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85, r * 0.26); }
    ctx.restore();
  }

  /* ---------- Anzeigen im Spielfeld ---------- */
  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  const aimBarY = () => proj(0, 0, LINE_Z).y + Math.max(20, H * 0.04);

  function drawAimBar() {
    const y = aimBarY(), xl = proj(-AIM_MAX, 0, LINE_Z).x, xr = proj(AIM_MAX, 0, LINE_Z).x, h = 12;
    roundRect(xl - 8, y - h / 2, xr - xl + 16, h, 6);
    ctx.fillStyle = 'rgba(8,11,18,0.78)'; ctx.fill();
    ctx.strokeStyle = 'rgba(238,241,246,0.2)'; ctx.lineWidth = 1; ctx.stroke();
    const inL = proj(-(HALF_W - POST_R - BALL_R), 0, LINE_Z).x, inR = proj(HALF_W - POST_R - BALL_R, 0, LINE_Z).x;
    ctx.fillStyle = 'rgba(238,241,246,0.14)'; ctx.fillRect(inL, y - h / 2 + 3, inR - inL, h - 6);
    ctx.fillStyle = '#F4F6FA';
    for (const s of [-HALF_W, HALF_W]) { const x = proj(s, 0, LINE_Z).x; ctx.fillRect(x - 1, y - h / 2 - 4, 2, h + 8); }
    const u = G.phase === 'aim' ? G.aimU : G.aimLocked, X = u * AIM_MAX, mx = proj(X, 0, LINE_Z).x;
    const top = proj(X, GOAL_H, LINE_Z), bottom = proj(X, 0, LINE_Z);
    ctx.save(); ctx.setLineDash([4, 6]); ctx.strokeStyle = G.phase === 'aim' ? 'rgba(255,148,72,0.55)' : 'rgba(255,148,72,0.9)';
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bottom.x, bottom.y); ctx.lineTo(top.x, top.y); ctx.stroke(); ctx.restore();
    ctx.fillStyle = C.homeHi;
    ctx.beginPath(); ctx.moveTo(mx, y - h / 2 - 2); ctx.lineTo(mx - 9, y + h / 2 + 9); ctx.lineTo(mx + 9, y + h / 2 + 9); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = C.night; ctx.lineWidth = 1.5; ctx.stroke();
  }

  function drawPowerBar() {
    const bp = proj(0, BALL_R, 0), w = 18;
    const x = clamp(Math.max(bp.x + 70, proj(AIM_MAX, 0, LINE_Z).x + 26), 0, W - 16 - w - 52);
    const bottom = Math.min(H - 90, bp.y + Math.max(40, H * 0.2));
    const top = Math.max(aimBarY() + 34, bottom - clamp(H * 0.36, 130, 260));
    const h = bottom - top;
    if (h < 60) return;
    const yAt = (p) => bottom - p * h;
    roundRect(x, top, w, h, 6); ctx.fillStyle = 'rgba(8,11,18,0.8)'; ctx.fill();
    ctx.strokeStyle = 'rgba(238,241,246,0.22)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = 'rgba(229,72,77,0.22)'; ctx.fillRect(x + 1, top + 1, w - 2, yAt(0.785) - top);
    ctx.fillStyle = 'rgba(238,241,246,0.16)'; ctx.fillRect(x + 1, yAt(0.76), w - 2, yAt(0.72) - yAt(0.76));
    const p = G.phase === 'power' ? G.power : G.sh ? G.sh.p : 0;
    if (p > 0) {
      const g = ctx.createLinearGradient(0, bottom, 0, top);
      g.addColorStop(0, '#F7C99E'); g.addColorStop(0.6, C.home); g.addColorStop(0.75, C.homeHi); g.addColorStop(0.8, '#E5484D'); g.addColorStop(1, '#B3202A');
      ctx.save(); roundRect(x + 3, yAt(p), w - 6, bottom - 3 - yAt(p), 4); ctx.clip();
      ctx.fillStyle = g; ctx.fillRect(x, top, w, h); ctx.restore();
    }
    ctx.font = "600 11px ui-monospace, Menlo, Consolas, monospace"; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillStyle = '#F4F6FA'; ctx.fillRect(x - 5, yAt(0.75) - 1, w + 10, 2);
    ctx.fillText('75 %', x + w + 9, yAt(0.75));
    ctx.fillStyle = 'rgba(255,140,140,0.95)'; ctx.fillText('drüber', x + w + 9, top + 10);
    ctx.fillStyle = 'rgba(238,241,246,0.7)'; ctx.fillText('schwach', x + w + 9, bottom - 8);
    ctx.textAlign = 'center'; ctx.fillStyle = '#F4F6FA';
    ctx.font = "600 13px ui-monospace, Menlo, Consolas, monospace";
    ctx.fillText(`${Math.round(p * 100)} %`, x + w / 2, top - 14);
  }

  function drawTapMarker() {
    if (!G.tap) return;
    const age = G.now - G.tap.time, a = clamp(1 - age / 1.6, 0, 1);
    if (!a) return;
    const p = proj(G.tap.target.x, G.tap.target.y, LINE_Z), r = 10 + age * 18;
    ctx.strokeStyle = `rgba(255,148,72,${a})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.2832); ctx.stroke();
  }

  function drawLights() {
    const gp = proj(0, 1.2, LINE_Z);
    const g = ctx.createRadialGradient(gp.x, gp.y, 0, gp.x, gp.y, Math.max(W, H) * 0.7);
    g.addColorStop(0, 'rgba(255,250,235,0.07)'); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  function keeperPose() {
    const k = G.kp;
    if (!k.target) {
      const idle = G.phase === 'flight' || G.phase === 'after';
      return idle ? swayPose(0) : swayPose(G.now);
    }
    return poseAt(k.target, G.now - k.start, k.dur, swayPose(k.start));
  }

  function render() {
    const view = G.role === 'keeper' && G.phase !== 'menu' ? 'keeper' : 'shooter';
    cam = buildCam(view);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = C.night; ctx.fillRect(0, 0, W, H);
    const boardZ = view === 'shooter' ? LINE_Z + 7 : -24;
    if (appEl.dataset.view !== view) appEl.dataset.view = view;
    drawStands(proj(0, 0.95, boardZ).y);
    drawPitch(boardZ);
    drawBoards(boardZ);
    const pose = keeperPose(), b = G.ball;
    if (view === 'shooter') {
      drawNet(0.3);
      if (b.z > LINE_Z) drawBall();
      drawFrame();
      drawKeeper(pose, KITS.away, false);
      if (b.z <= LINE_Z) drawBall();
    } else {
      drawRunner();
      if (b.z < KEEPER_Z) drawBall();
      drawKeeper(pose, KITS.home, true);
      drawFrame();
      if (b.z >= KEEPER_Z) drawBall();
      drawNet(0.13);
    }
    drawLights();
    if (view === 'shooter' && ['aim', 'power'].includes(G.phase)) drawAimBar();
    if (view === 'shooter' && G.phase === 'power') drawPowerBar();
    if (view === 'shooter' && G.phase === 'flight') { drawAimBar(); drawPowerBar(); }
    if (view === 'keeper') drawTapMarker();
  }

  /* ---------- Ablauf ---------- */
  const el = {
    hud: $('hud'), role: $('hudRole'), shots: $('hudShots'), score: $('hudScore'), prompt: $('prompt'),
    banner: $('banner'), bTitle: $('bannerTitle'), bSub: $('bannerSub'), menu: $('menu'), result: $('result'),
    rScore: $('resultScore'), rTitle: $('resultTitle'), rText: $('resultText'), rShots: $('resultShots'), rBest: $('resultBest'),
    best: $('best'), sound: $('btnSound'),
  };
  const setPrompt = (html) => { el.prompt.innerHTML = html; };

  function updateHud() {
    el.role.textContent = G.role === 'shooter' ? 'Schütze' : 'Torwart';
    el.shots.innerHTML = '';
    for (let i = 0; i < SHOTS; i++) {
      const li = document.createElement('li'), r = G.results[i];
      li.className = r === undefined ? (i === G.results.length ? 'now' : '') : r ? 'good' : 'bad';
      el.shots.appendChild(li);
    }
    const n = G.results.filter(Boolean).length;
    el.score.textContent = G.role === 'shooter' ? `Tore ${n}` : `Paraden ${n}`;
  }

  function showBanner(title, sub, good) {
    el.bTitle.textContent = title; el.bSub.textContent = sub;
    el.banner.className = 'banner' + (good ? ' good' : '');
    el.banner.hidden = false;
    void el.banner.offsetWidth; el.banner.classList.add('show');
  }

  function bestLine(role) {
    const v = store.get('elfmeter.best.' + role);
    return v === null ? '' : `${role === 'shooter' ? 'Bestwert Schütze' : 'Bestwert Torwart'}: ${v} von ${SHOTS}`;
  }
  function refreshMenuBest() {
    el.best.textContent = [bestLine('shooter'), bestLine('keeper')].filter(Boolean).join('  ·  ');
  }

  function startSeries(role) {
    Sound.init();
    G.role = role; G.shot = 0; G.results = [];
    el.menu.hidden = true; el.result.hidden = true; el.hud.hidden = false;
    updateHud(); startShot();
  }

  function startShot() {
    Object.assign(G.ball, { x: 0, y: BALL_R, z: 0, vx: 0, vy: 0, vz: 0, spin: 0, attached: false });
    G.kp = { target: null, start: 0, dur: 0.45 };
    G.tap = null; G.early = false; G.outcome = null; G.sh = null; G.bulge.amp = 0; G.promptNext = false;
    el.banner.hidden = true;
    G.pt = 0;
    if (G.role === 'shooter') {
      G.phase = 'aim'; G.aimPhase = Math.random(); G.power = 0;
      setPrompt('<kbd>Tippen</kbd> oder <kbd>Leertaste</kbd>: Richtung festlegen');
    } else {
      G.phase = 'ready'; G.readyDur = 0.8 + Math.random() * 0.9;
      G.runner = { x: -1.35, z: -2.7, ph: 0 };
      setPrompt('Tippe ins Tor, wohin du springst. Nicht zu früh!');
    }
    updateHud();
  }

  function kickShooter() {
    const p = G.power, X = G.aimLocked * AIM_MAX, Y = heightFor(p), T = flightTimeFor(p);
    G.sh = { X, Y, T, p, curve: (Math.random() - 0.5) * 0.3, arc: Y > 0.7 ? 0.18 : 0 };
    // Bei langsamen Bällen wartet der Torwart und springt erst so spät, dass er zur Ankunft gestreckt ist.
    G.kp = { target: aiKeeperGuess(X, Y, T, Math.random), start: G.now + aiDiveDelay(T), dur: 0.45 };
    launch(p);
  }

  function kickKeeperMode() {
    const early = G.tap && G.tap.time < G.now - 0.22;
    const s = aiShot(Math.random, early ? G.tap.target : null);
    G.early = !!early;
    G.sh = { X: s.X, Y: s.Y, T: s.T, p: 0.7, curve: (Math.random() - 0.5) * 0.5, arc: s.Y > 0.7 ? 0.15 : 0 };
    launch(0.7);
  }

  function launch(p) {
    G.phase = 'flight'; G.pt = 0; G.kickAt = G.now;
    setPrompt(G.role === 'keeper' && !G.tap ? 'Jetzt!' : '');
    Sound.kick(p);
  }

  function ballPath(sh, s) {
    return {
      x: lerp(0, sh.X, s) + sh.curve * Math.sin(Math.PI * s),
      y: lerp(BALL_R, sh.Y, s) + sh.arc * Math.sin(Math.PI * s),
      z: lerp(0, LINE_Z, s),
    };
  }

  function resolve() {
    const sh = G.sh, b = G.ball, X = b.x, Y = b.y, pose = keeperPose();
    const touch = keeperTouch(pose, X, Y);
    let vx = (sh.X - sh.curve * Math.PI) / sh.T, vy = (sh.Y - BALL_R - sh.arc * Math.PI) / sh.T, vz = LINE_Z / sh.T;
    let kind;
    if (touch) {
      kind = sh.T > 0.8 || (touch.part === 'body' && Y < 1.3 && Math.random() < 0.4) ? 'caught' : 'saved';
    } else {
      const fc = frameCheck(X, Y);
      kind = fc.kind === 'in' ? 'goal' : fc.kind === 'post' ? (fc.inside ? 'goal-post' : 'post')
        : fc.kind === 'bar' ? (fc.inside ? 'goal-bar' : 'bar') : fc.kind;
    }
    const sx = Math.sign(X) || 1;
    switch (kind) {
      case 'goal-post': vx = -sx * 3; vy *= 0.5; vz *= 0.6; break;
      case 'goal-bar': vx *= 0.5; vy = -5; vz *= 0.5; break;
      case 'post': vx = sx * (3 + Math.random() * 2); vy = Math.abs(vy) * 0.3 + 1; vz = -vz * 0.35; break;
      case 'bar': vx *= 0.6; vy = 4.5; vz = -vz * 0.4; break;
      case 'saved': {
        const hx = (pose.H1.x + pose.H2.x) / 2, side = Math.sign(X - hx) || sx;
        if (Y > 1.95 && Math.random() < 0.6) { vx *= 0.3; vy = 4.2; vz = 3.2; G.tipped = true; }
        else { vx = side * (3 + Math.random() * 2.5); vy = 1.5 + Math.random() * 2.5; vz = -vz * 0.3; G.tipped = false; }
        break;
      }
      case 'caught': b.attached = true; break;
    }
    Object.assign(b, { vx, vy, vz });
    G.outcome = kind;
    const goal = kind.startsWith('goal');
    const good = G.role === 'shooter' ? goal : !goal;
    G.results.push(good);
    updateHud();
    const t = describe(kind);
    showBanner(t.title, t.sub, good);
    if (kind === 'post' || kind === 'bar' || kind === 'goal-post' || kind === 'goal-bar') Sound.ping();
    if (kind === 'saved' || kind === 'caught') Sound.thud();
    if (goal) { Sound.cheer(); G.celebrate = G.now; G.celebrateTeam = G.role === 'shooter' ? 'home' : 'away'; }
    else if (G.role === 'keeper') { Sound.cheer(); G.celebrate = G.now; G.celebrateTeam = 'home'; }
    else Sound.groan();
    G.phase = 'after'; G.pt = 0;
  }

  function describe(kind) {
    const sh = G.sh;
    if (G.role === 'shooter') {
      switch (kind) {
        case 'goal': return { title: 'TOR!', sub: sh.Y > 1.9 ? 'Unhaltbar unter die Latte.' : sh.p < 0.45 ? 'Schwach geschossen, trotzdem drin.' : Math.abs(sh.X) > 2.6 ? 'Genau in die Ecke.' : 'Sicher verwandelt.' };
        case 'goal-post': return { title: 'TOR!', sub: 'Vom Innenpfosten ins Netz.' };
        case 'goal-bar': return { title: 'TOR!', sub: 'Von der Unterkante der Latte ins Tor.' };
        case 'saved': return { title: 'GEHALTEN', sub: sh.p < 0.5 ? 'Zu schwach – leichte Beute für den Torwart.' : 'Der Torwart ahnt die Ecke.' };
        case 'caught': return { title: 'GEFANGEN', sub: 'Viel zu schwach geschossen.' };
        case 'post': return { title: 'PFOSTEN', sub: 'Ganz knapp. Etwas weiter nach innen zielen.' };
        case 'bar': return { title: 'LATTE', sub: 'Ein paar Prozent zu viel Kraft.' };
        case 'over': return { title: 'DRÜBER', sub: sh.p > 0.9 ? 'Viel zu viel Kraft. Ideal sind 75 %.' : 'Zu hart geschossen. Ideal sind 75 %.' };
        default: return { title: 'VORBEI', sub: 'Zu weit nach außen gezielt.' };
      }
    }
    if (kind.startsWith('goal')) {
      let sub = 'Falsche Ecke.';
      if (G.early) sub = 'Zu früh gesprungen – der Schütze hat es gesehen.';
      else if (!G.tap) sub = 'Du bist stehen geblieben.';
      else if (G.now - G.tap.time < G.kp.dur * 0.7) sub = 'Zu spät reagiert.';
      else if (Math.hypot(G.tap.target.x - sh.X, G.tap.target.y - sh.Y) < 1.2) sub = 'Knapp dran, aber nicht dran genug.';
      return { title: 'TOR', sub };
    }
    switch (kind) {
      case 'saved': return { title: 'GEHALTEN!', sub: G.tipped ? 'Über die Latte gelenkt.' : 'Starke Parade.' };
      case 'caught': return { title: 'GEFANGEN!', sub: 'Sicher festgehalten.' };
      case 'post': return { title: 'PFOSTEN!', sub: 'Glück gehabt.' };
      case 'bar': return { title: 'LATTE!', sub: 'Glück gehabt.' };
      case 'over': return { title: 'DRÜBER!', sub: 'Der Schütze jagt ihn in den Himmel.' };
      default: return { title: 'VORBEI!', sub: 'Der Schütze verzieht.' };
    }
  }

  function afterPhysics(dt) {
    const b = G.ball;
    if (b.attached) {
      const p = keeperPose();
      b.x = (p.H1.x + p.H2.x) / 2; b.y = Math.max(BALL_R, (p.H1.y + p.H2.y) / 2); b.z = KEEPER_Z - 0.2;
      return;
    }
    const inGoal = G.outcome && G.outcome.startsWith('goal');
    const steps = 4, h = dt / steps;
    for (let i = 0; i < steps; i++) {
      b.vy -= 9.8 * h;
      b.x += b.vx * h; b.y += b.vy * h; b.z += b.vz * h;
      if (b.y < BALL_R) {
        b.y = BALL_R; b.vy = Math.abs(b.vy) < 0.8 ? 0 : -b.vy * 0.45; b.vx *= 0.82; b.vz *= 0.82;
      }
      if (inGoal && b.z > LINE_Z) {
        const backZ = LINE_Z + NET_D - 0.2;
        if (b.z > backZ) {
          if (b.vz > 1.5) { G.bulge = { x: b.x, y: b.y, amp: Math.min(0.55, b.vz * 0.04), t: G.now }; }
          b.z = backZ; b.vz = -b.vz * 0.12; b.vx *= 0.4; b.vy *= 0.4;
        }
        if (Math.abs(b.x) > HALF_W - 0.15) { b.x = Math.sign(b.x) * (HALF_W - 0.15); b.vx *= -0.2; }
        const top = lerp(GOAL_H, NET_TOP, clamp((b.z - LINE_Z) / NET_D, 0, 1)) - 0.12;
        if (b.y > top) { b.y = top; b.vy = -Math.abs(b.vy) * 0.2; }
      }
    }
    b.spin += Math.hypot(b.vx, b.vz) * dt * 0.8;
  }

  function next() {
    if (G.results.length >= SHOTS) return endSeries();
    G.shot++; startShot();
  }

  function endSeries() {
    G.phase = 'end';
    el.banner.hidden = true; setPrompt('');
    const n = G.results.filter(Boolean).length, role = G.role;
    const key = 'elfmeter.best.' + role, prev = parseInt(store.get(key), 10);
    const record = isNaN(prev) || n > prev;
    if (record) store.set(key, String(n));
    el.rScore.textContent = `${n} / ${SHOTS}`;
    if (role === 'shooter') {
      el.rTitle.textContent = n === 5 ? 'Eiskalt vom Punkt.' : n === 4 ? 'Starke Serie.' : n === 3 ? 'Solide.' : n === 2 ? 'Da geht mehr.' : 'Denk an die 75 %.';
      el.rText.textContent = `Du hast ${n} von ${SHOTS} Elfmetern verwandelt.`;
    } else {
      el.rTitle.textContent = n >= 3 ? 'Elfmeterkiller.' : n === 2 ? 'Starker Rückhalt.' : n === 1 ? 'Immerhin einer.' : 'Die Schützen hatten leichtes Spiel.';
      el.rText.textContent = `Du hast ${n} von ${SHOTS} Elfmetern verhindert.`;
    }
    el.rShots.innerHTML = G.results.map((r) => `<li class="${r ? 'good' : 'bad'}"></li>`).join('');
    el.rBest.textContent = record && !isNaN(prev) ? 'Neuer Bestwert!' : bestLine(role);
    el.result.hidden = false;
    $('btnAgain').focus({ preventScroll: true });
  }

  function openMenu() {
    G.phase = 'menu'; G.kp = { target: null, start: 0, dur: 0.45 };
    Object.assign(G.ball, { x: 0, y: BALL_R, z: 0, attached: false });
    el.banner.hidden = true; el.result.hidden = true; el.hud.hidden = true; el.menu.hidden = false;
    setPrompt(''); refreshMenuBest();
    $('pickShooter').focus({ preventScroll: true });
  }

  function update(dt) {
    G.now += dt; G.pt += dt;
    const pushTarget = !reduceMotion && G.role === 'shooter' && (G.phase === 'flight' || G.phase === 'after') ? 0.6 : 0;
    G.push += (pushTarget - G.push) * Math.min(1, dt * 5);
    switch (G.phase) {
      case 'aim': {
        const period = Math.max(1.15, 1.7 - G.shot * 0.1), x = G.pt / period + G.aimPhase;
        G.aimU = 1 - 4 * Math.abs((x % 1) - 0.5);
        break;
      }
      case 'power':
        G.power = Math.min(1, G.pt / 1.45);
        if (G.pt > 1.55) kickShooter();
        break;
      case 'ready':
        if (G.pt >= G.readyDur) { G.phase = 'runup'; G.pt = 0; Sound.whistle(); }
        break;
      case 'runup': {
        const s = clamp(G.pt / 1.15, 0, 1);
        G.runner.x = lerp(-1.35, -0.4, s); G.runner.z = lerp(-2.7, -0.35, s); G.runner.ph += dt * 11;
        if (s >= 1) kickKeeperMode();
        break;
      }
      case 'flight': {
        const s = Math.min(1, G.pt / G.sh.T);
        Object.assign(G.ball, ballPath(G.sh, s));
        G.ball.spin += dt * (10 + (G.sh.p || 0.5) * 12);
        if (s >= 1) resolve();
        break;
      }
      case 'after':
        afterPhysics(dt);
        if (!G.promptNext && G.pt > 0.9) {
          G.promptNext = true;
          setPrompt(G.results.length >= SHOTS ? '' : '<kbd>Tippen</kbd> für den nächsten Elfmeter');
        }
        if (G.pt > (G.results.length >= SHOTS ? 2.4 : 3.4)) next();
        break;
    }
  }

  /* ---------- Eingabe ---------- */
  function act(pt, keyTarget) {
    Sound.init();
    switch (G.phase) {
      case 'aim':
        G.aimLocked = G.aimU; G.phase = 'power'; G.pt = 0; G.power = 0; Sound.tick();
        setPrompt('Nochmal <kbd>tippen</kbd>: Schusshärte. <b>75 %</b> ist ideal.');
        break;
      case 'power':
        kickShooter();
        break;
      case 'ready': case 'runup': case 'flight': {
        if (G.role !== 'keeper' || G.tap) break;
        const T = keyTarget || (pt && unprojectGoal(pt.x, pt.y));
        if (!T) break;
        G.tap = { target: T, time: G.now };
        G.kp = { target: T, start: G.now, dur: 0.42 };
        setPrompt('');
        break;
      }
      case 'after':
        if (G.pt > 0.9) next();
        break;
    }
  }

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    act({ x: e.clientX - r.left, y: e.clientY - r.top });
  });

  const KEY_TARGETS = { q: [-1, 1.95], w: [0, 2.2], e: [1, 1.95], a: [-1, 0.35], s: [0, 0.6], d: [1, 0.35] };
  window.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('button') && (e.key === ' ' || e.key === 'Enter')) return;
    if (e.key === 'Escape' && G.phase !== 'menu') { openMenu(); return; }
    if (G.phase === 'menu' || G.phase === 'end') return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); act(null, G.role === 'keeper' ? { x: 0, y: 1.2 } : null); return; }
    const k = KEY_TARGETS[e.key.toLowerCase()];
    if (k && G.role === 'keeper') {
      e.preventDefault();
      // Tasten beziehen sich auf die Bildschirmseite; die Kamera schaut aus dem Tor, also gespiegelt.
      act(null, { x: k[0] * 2.9 * cam.dir, y: k[1] });
    }
  });

  $('pickShooter').addEventListener('click', () => startSeries('shooter'));
  $('pickKeeper').addEventListener('click', () => startSeries('keeper'));
  $('btnAgain').addEventListener('click', () => startSeries(G.role));
  $('btnSwitch').addEventListener('click', openMenu);
  $('btnMenu').addEventListener('click', openMenu);
  function paintSound() {
    el.sound.setAttribute('aria-pressed', String(Sound.on));
    el.sound.textContent = Sound.on ? 'Ton an' : 'Ton aus';
  }
  el.sound.addEventListener('click', () => { Sound.set(!Sound.on); paintSound(); });
  paintSound();

  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    seedCrowd();
  }
  window.addEventListener('resize', resize);
  resize();
  refreshMenuBest();

  let last = performance.now();
  function frame(t) {
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    update(dt); render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
