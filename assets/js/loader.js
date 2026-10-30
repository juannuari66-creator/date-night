/* ==========================================================
   Date Night — loader 5 detik
   motor lewat kanan → kiri · asap/titik-titik di belakang knalpot
   jejak titik di jalan · tap = gas pol (rev) · glow ikut pointer
   ========================================================== */
(() => {
  'use strict';

  const root   = document.documentElement;
  const loader = document.getElementById('loader');
  if (!loader) return;
  if (!root.classList.contains('is-loading')) { loader.hidden = true; return; }

  const bike  = document.getElementById('ldBike');
  const cv    = document.getElementById('ldFx');
  const ctx   = cv.getContext('2d');
  const pctEl = document.getElementById('ldPct');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const DUR = 5000;      // lama loading (ms)
  const K   = 0.55;      // 0 = kecepatan konstan; makin besar = makin pelan di tengah layar
  const TAU = Math.PI * 2;
  const RIBBON = '168,21,43', BLUSH = '236,201,203', CREAM = '255,250,246';
  const rnd = (a, b) => a + Math.random() * (b - a);

  let vw, vh, dpr, bw, bh, topY, groundY, startX, endX;

  function layout() {
    vw = innerWidth; vh = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bw = Math.round(Math.min(vw * 0.68, vw >= 900 ? 520 : 440, vh * 0.6 * 1100 / 857));
    bh = bw * 857 / 1100;
    topY = vh * 0.45 - bh / 2;
    groundY = topY + bh;
    startX = vw + bw * 0.02;     // mulai tepat di luar layar kanan
    endX   = -bw * 1.04;         // keluar sepenuhnya di kiri
    bike.style.width = bw + 'px';
  }
  layout();
  addEventListener('resize', layout);

  /* ---------- state ---------- */
  const P = [];        // partikel asap / titik / hati / teks
  const trail = [];    // titik jejak di jalan
  let t0 = 0, last = 0, raf = 0, finished = false, prevX = null;
  let emitAcc = 0, trailAcc = 0, revT = -1e9, textIdx = 0, lastPct = -1;
  const TEXT_AT = [0.2, 0.46, 0.7, 0.9];

  function setProgress(p) {
    loader.style.setProperty('--p', p.toFixed(4));
    const n = Math.round(p * 100);
    if (n !== lastPct) { lastPct = n; pctEl.textContent = n; }
  }

  /* ---------- spawn ---------- */
  function spawn(kind, ex, ey, boost = 1) {
    const u = bw / 420;
    if (kind === 0)      P.push({ k: 0, x: ex, y: ey, vx: rnd(30, 110) * boost, vy: rnd(-58, -8) * boost, r: rnd(1.8, 4.4) * u, life: rnd(.9, 1.6), age: 0 });
    else if (kind === 1) P.push({ k: 1, x: ex, y: ey, vx: rnd(18, 70) * boost,  vy: rnd(-32, -6),         r0: rnd(3, 6) * u, r1: rnd(15, 28) * u, life: rnd(1, 1.7), age: 0 });
    else if (kind === 2) P.push({ k: 2, x: ex, y: ey, vx: rnd(25, 70) * boost,  vy: rnd(-62, -26),        r: rnd(5, 9) * u, rot: rnd(-.5, .5), life: rnd(1.3, 1.9), age: 0 });
  }
  function word(txt, ex, ey) {
    P.push({ k: 3, x: ex + 6, y: ey - 10, vx: 26, vy: -26, life: 1.15, age: 0, txt, rot: rnd(-.2, -.06), r: bw / 420 });
  }

  /* ---------- gambar ---------- */
  function heart(x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s / 10, s / 10);
    ctx.beginPath();
    ctx.moveTo(0, 5); ctx.bezierCurveTo(-9, -1, -5, -8, 0, -3); ctx.bezierCurveTo(5, -8, 9, -1, 0, 5);
    ctx.fill(); ctx.restore();
  }

  function draw(x, lift) {
    ctx.clearRect(0, 0, vw, vh);
    const roadY = groundY + 4;

    // jalan putus-putus (statis, samar)
    ctx.fillStyle = `rgba(${RIBBON},.15)`;
    for (let rx = 6; rx < vw; rx += 14) { ctx.beginPath(); ctx.arc(rx, roadY, 1.5, 0, TAU); ctx.fill(); }

    // jejak titik di belakang roda (menyala lalu meredup)
    for (const d of trail) {
      const a = 1 - d.age / 1.7; if (a <= 0) continue;
      ctx.fillStyle = `rgba(${RIBBON},${(a * a * .85).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(d.x, roadY, 1.5 + 1.5 * a, 0, TAU); ctx.fill();
    }

    // bayangan
    ctx.fillStyle = `rgba(110,19,37,${(.15 - lift * .008).toFixed(3)})`;
    ctx.beginPath(); ctx.ellipse(x + bw * .5, roadY + 3, bw * (.46 - lift * .01), 6, 0, 0, TAU); ctx.fill();

    // asap (lapisan belakang)
    for (const p of P) if (p.k === 1) {
      const a = p.age / p.life, e = 1 - (1 - a) * (1 - a);
      const r = p.r0 + (p.r1 - p.r0) * e, al = Math.pow(1 - a, 1.6) * .75;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      g.addColorStop(0, `rgba(${CREAM},${al.toFixed(3)})`);
      g.addColorStop(.55, `rgba(${BLUSH},${(al * .85).toFixed(3)})`);
      g.addColorStop(1, `rgba(${BLUSH},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
    }
    // titik-titik, hati, teks
    for (const p of P) {
      const a = p.age / p.life;
      if (p.k === 0) {
        ctx.fillStyle = `rgba(${RIBBON},${((1 - a) * .9).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 - .35 * a), 0, TAU); ctx.fill();
      } else if (p.k === 2) {
        ctx.fillStyle = `rgba(${RIBBON},${(Math.pow(1 - a, 1.2) * .85).toFixed(3)})`;
        heart(p.x, p.y, p.r * (.8 + .5 * a), p.rot + a * .6);
      } else if (p.k === 3) {
        const al = Math.sin(Math.min(1, a) * Math.PI);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.font = `${Math.round(30 * p.r)}px "Great Vibes", cursive`;
        ctx.fillStyle = `rgba(${RIBBON},${(al * .85).toFixed(3)})`;
        ctx.fillText(p.txt, 0, 0); ctx.restore();
      }
    }
  }

  /* ---------- tap = gas pol ---------- */
  function rev() {
    const now = performance.now();
    if (finished || now - revT < 420) return;
    revT = now;
    const ex = (prevX ?? startX) + bw + 2, ey = groundY - bh * .2;
    if (!reduce) {
      for (let i = 0; i < 7; i++) spawn(1, ex, ey, 1.6);
      for (let i = 0; i < 12; i++) spawn(0, ex, ey, 1.8);
      for (let i = 0; i < 3; i++) spawn(2, ex, ey, 1.5);
      word(Math.random() < .5 ? 'vroom~' : 'brrm!', ex, ey);
    }
    navigator.vibrate && navigator.vibrate(12);
  }
  loader.addEventListener('pointerdown', rev);

  let gl = 0;
  addEventListener('pointermove', e => {
    if (gl) return;
    gl = requestAnimationFrame(() => {
      gl = 0;
      loader.style.setProperty('--mx', (e.clientX / vw * 100).toFixed(1) + '%');
      loader.style.setProperty('--my', (e.clientY / vh * 100).toFixed(1) + '%');
    });
  }, { passive: true });

  /* ---------- selesai ---------- */
  function finish() {
    if (finished) return;
    finished = true;
    setProgress(1);
    loader.classList.add('is-leaving');
    root.classList.remove('is-loading');
    dispatchEvent(new Event('loader:done'));
    setTimeout(() => { loader.hidden = true; cancelAnimationFrame(raf); cv.width = cv.height = 0; }, 1000);
  }

  /* ---------- loop ---------- */
  function frame(now) {
    const dt = Math.min(.05, Math.max(.001, (now - last) / 1000)); last = now;
    const t = Math.min(1, (now - t0) / DUR);
    const e = t + K * Math.sin(TAU * t) / TAU;          // lambat di tengah, ngebut di ujung
    const x = reduce ? (vw - bw) / 2 : startX + (endX - startX) * e;
    const speed = prevX === null ? 0 : Math.abs(x - prevX) / dt;
    const dx = prevX === null ? 0 : Math.abs(x - prevX);

    // lompatan kecil + miring saat gas
    const ph = Math.max(0, Math.min(1, (now - revT) / 420));
    const pop = Math.sin(ph * Math.PI) * (ph < 1 ? 1 : 0);
    const run = reduce ? 0 : Math.min(1, speed / 320);
    const lift = reduce ? 0 : Math.abs(Math.sin(now / 1000 * 34)) * (1.2 + run * 1.6);
    const y = topY - lift - pop * 8;
    const rot = -run * 1.3 - pop * 3.2;
    bike.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${rot.toFixed(2)}deg)`;

    if (!reduce && t < 1) {
      const ex = x + bw + 2, ey = groundY - bh * .2;     // knalpot (belakang = kanan)
      emitAcc += dt * 22 + dx * .06;
      while (emitAcc >= 1) {
        emitAcc -= 1;
        const r = Math.random();
        spawn(r < .42 ? 1 : r < .88 ? 0 : 2, ex, ey + rnd(-3, 3));
      }
      trailAcc += dx;
      while (trailAcc >= 17) { trailAcc -= 17; trail.push({ x: x + bw * .86 + trailAcc, age: 0 }); }
      while (textIdx < TEXT_AT.length && t >= TEXT_AT[textIdx]) { word(['brrm', 'brrmm~', 'vroom', 'brrm~'][textIdx], ex, ey); textIdx++; }
    }

    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.age += dt;
      if (p.age >= p.life) { P.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 1 - .9 * dt; p.vy -= 10 * dt;
    }
    for (let i = trail.length - 1; i >= 0; i--) { trail[i].age += dt; if (trail[i].age >= 1.7) trail.splice(i, 1); }

    if (!reduce) draw(x, lift);
    prevX = x;
    setProgress(t);
    if (t >= 1) finish();
    if (now - t0 < DUR + 1000) raf = requestAnimationFrame(frame);
  }

  function start() {
    bike.classList.add('is-on');
    t0 = last = performance.now();
    raf = requestAnimationFrame(frame);
    setTimeout(finish, DUR + 2200);     // jaga-jaga kalau tab di-background
  }

  // tunggu gambar + font siap (maks 700ms) supaya motor tidak "loncat" saat muncul
  const ready = [bike.decode ? bike.decode().catch(() => {}) : Promise.resolve()];
  if (document.fonts && document.fonts.load) ready.push(document.fonts.load('40px "Great Vibes"').catch(() => {}));
  Promise.race([Promise.all(ready), new Promise(r => setTimeout(r, 700))]).then(start);
})();