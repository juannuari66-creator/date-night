/* ==========================================================
   Date Night — halaman "All About My Love"
   3D tilt (jari / mouse / gyro) · kilau cahaya · tap = hujan hati
   ========================================================== */
(() => {
  'use strict';

  const stage = document.getElementById('lvStage');
  if (!stage) return;

  const tilt   = document.getElementById('lvTilt');
  const fx     = document.getElementById('lvFx');
  const chip   = document.getElementById('lvChip');
  const countEl = document.getElementById('lvCount');
  const msgEl  = document.getElementById('lvMsg');
  const beatEl = document.getElementById('lvBeat');
  const amb    = document.getElementById('lvAmb');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const NS = 'http://www.w3.org/2000/svg';
  const COLORS = ['#a8152b', '#c42a40', '#d9707d', '#e9a8b0', '#6e1325', '#f2c9cc'];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ------------------------------------------------------
     0. Hati melayang di belakang collage
     ------------------------------------------------------ */
  if (amb && !reduce) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 9; i++) {
      const el = document.createElement('i');
      el.style.cssText = [
        `left:${6 + Math.random() * 88}%`,
        `--s:${(9 + Math.random() * 13).toFixed(1)}px`,
        `--c:${['#d9707d', '#e9a8b0', '#f2c9cc', '#c42a40'][i % 4]}`,
        `--t:${(8 + Math.random() * 6).toFixed(1)}s`,
        `--dl:${(Math.random() * 9).toFixed(1)}s`,
        `--dx:${((Math.random() - .5) * 70).toFixed(0)}px`,
        `--r:${((Math.random() - .5) * 50).toFixed(0)}deg`,
      ].join(';');
      el.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#heart"/></svg>';
      frag.appendChild(el);
    }
    amb.appendChild(frag);
  }

  /* ------------------------------------------------------
     1. 3D tilt + kilau
     ------------------------------------------------------ */
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, pointerOn = false;

  function loop() {
    raf = 0;
    cx += (tx - cx) * 0.14;
    cy += (ty - cy) * 0.14;
    tilt.style.transform = `rotateX(${(-cy * 9).toFixed(2)}deg) rotateY(${(cx * 12).toFixed(2)}deg)`;
    tilt.style.setProperty('--gx', (50 + cx * 42).toFixed(1) + '%');
    tilt.style.setProperty('--gy', (38 + cy * 42).toFixed(1) + '%');
    if (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) raf = requestAnimationFrame(loop);
  }
  function setTilt(nx, ny) {
    if (reduce) return;
    tx = clamp(nx, -1, 1); ty = clamp(ny, -1, 1);
    if (!raf) raf = requestAnimationFrame(loop);
  }

  stage.addEventListener('pointermove', e => {
    const r = stage.getBoundingClientRect();
    pointerOn = true;
    setTilt(((e.clientX - r.left) / r.width - .5) * 2, ((e.clientY - r.top) / r.height - .5) * 2);
  });
  const release = () => { pointerOn = false; setTilt(0, 0); };
  stage.addEventListener('pointerleave', release);
  stage.addEventListener('pointerup', () => setTimeout(release, 450));
  stage.addEventListener('pointercancel', release);

  // Gyro (HP): ikut miring saat HP digerakkan
  let gyroOn = false;
  function onOrient(e) {
    if (pointerOn || e.gamma == null) return;
    setTilt(clamp(e.gamma / 22, -1, 1), clamp((e.beta - 55) / 26, -1, 1));
  }
  function enableGyro() {
    if (gyroOn || reduce || !('DeviceOrientationEvent' in window)) return;
    const DOE = window.DeviceOrientationEvent;
    if (typeof DOE.requestPermission === 'function') {      // iOS: harus dari sentuhan
      DOE.requestPermission().then(s => {
        if (s === 'granted') { gyroOn = true; addEventListener('deviceorientation', onOrient); }
      }).catch(() => {});
    } else {
      gyroOn = true;
      addEventListener('deviceorientation', onOrient);
    }
  }
  if (typeof (window.DeviceOrientationEvent || {}).requestPermission !== 'function') enableGyro();

  /* ------------------------------------------------------
     2. Tap = hujan hati
     ------------------------------------------------------ */
  function particle(x, y, kind, big) {
    const el = document.createElement('i');
    const size = kind === 'h' ? rnd(big ? 16 : 12, big ? 32 : 26) : rnd(14, 24);
    el.className = 'lv-p ' + kind;
    el.style.setProperty('--s', size.toFixed(1) + 'px');
    el.style.setProperty('--c', COLORS[(Math.random() * COLORS.length) | 0]);
    el.innerHTML = kind === 'h'
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#heart"/></svg>'
      : '<svg viewBox="0 0 44 44" aria-hidden="true"><use href="#sparkle"/></svg>';
    fx.appendChild(el);

    const ang = rnd(-Math.PI * (big ? 1 : .92), -Math.PI * (big ? 0 : .08));
    const dist = rnd(big ? 90 : 50, big ? 230 : 150);
    const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist;
    const rot = rnd(-50, 50);
    const base = `translate(${x - size / 2}px, ${y - size / 2}px)`;
    const dur = rnd(1100, 1900);
    if (!el.animate) { setTimeout(() => el.remove(), dur); return; }
    el.animate([
      { transform: `${base} translate(0,0) scale(.2) rotate(0)`, opacity: 0 },
      { transform: `${base} translate(${dx * .55}px,${dy * .55}px) scale(1.1) rotate(${rot * .5}deg)`, opacity: 1, offset: .35 },
      { transform: `${base} translate(${dx}px,${dy + 40}px) scale(.8) rotate(${rot}deg)`, opacity: 0 },
    ], { duration: dur, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' }).onfinish = () => el.remove();
  }

  function burst(x, y, big) {
    const n = big ? 26 : 8;
    for (let i = 0; i < n; i++) particle(x + rnd(-8, 8), y + rnd(-8, 8), Math.random() < .22 ? 's' : 'h', big);
  }

  /* detak jantung di garis EKG */
  function beat() {
    if (!beatEl) return;
    beatEl.classList.add('fill');
    if (beatEl.animate) beatEl.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.55)' }, { transform: 'scale(1)' }],
      { duration: 420, easing: 'ease-out' });
    setTimeout(() => beatEl.classList.remove('fill'), 520);
  }

  const MSG = [
    [0,  'tap the photos'],
    [1,  'you found my heart ♡'],
    [5,  'keep going… ♡'],
    [10, 'okay okay, I love you too'],
    [20, 'stop, you’re making me blush'],
    [35, 'every tap = one more reason'],
    [50, 'you win, forever yours ♛'],
  ];
  const BIG_AT = new Set([10, 25, 50, 100]);
  let count = 0, lastMsg = MSG[0][1];

  function setMsg(t) {
    if (!msgEl || t === lastMsg) return;
    lastMsg = t;
    msgEl.classList.add('swap');
    setTimeout(() => { msgEl.textContent = t; msgEl.classList.remove('swap'); }, 220);
  }

  function love(x, y) {
    count++;
    if (countEl) countEl.textContent = count;
    const big = BIG_AT.has(count);
    burst(x, y, big);
    beat();
    if (navigator.vibrate) { try { navigator.vibrate(big ? [20, 40, 30] : 12); } catch (_) {} }
    for (let i = MSG.length - 1; i >= 0; i--) if (count >= MSG[i][0]) { setMsg(MSG[i][1]); break; }
  }

  stage.addEventListener('click', e => {
    enableGyro();
    const r = fx.getBoundingClientRect();
    love(e.clientX - r.left, e.clientY - r.top);
  });
  stage.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    love(fx.clientWidth / 2, fx.clientHeight / 2);
  });
  if (chip) chip.addEventListener('click', () => {
    enableGyro();
    const r = fx.getBoundingClientRect(), c = chip.getBoundingClientRect();
    love(clamp(c.left + c.width / 2 - r.left, 0, r.width), clamp(c.top - r.top, 0, r.height + 400));
  });
})();
