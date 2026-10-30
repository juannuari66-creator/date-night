/* ==========================================================
   Undangan Birthday — interaksi
   judul ditulis ulang · kue + lilin · hati/kelopak · parallax
   ========================================================== */
(() => {
  'use strict';

  const root = document.getElementById('s0');
  if (!root) return;

  const $ = (s, c = root) => c.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const fx    = $('#invFx');
  const title = $('.inv-title');
  const inkT  = $('.inv-ink-t');
  const pen   = $('.inv-pen');
  const cake  = $('#invCake');
  const bow   = $('#invBow');
  const hint  = $('#invHint');

  /* ------------------------------------------------------
     1. Judul "Birthday" muat selebar slide (menunggu font)
     ------------------------------------------------------ */
  const ink = $('.inv-ink');
  function fitTitle() {
    if (!ink) return;
    root.style.setProperty('--tfs', '100px');
    const w100 = ink.offsetWidth;
    if (!w100) return;
    const target = root.clientWidth * 0.9;
    const fs = Math.max(64, Math.min(150, 100 * target / w100));
    root.style.setProperty('--tfs', fs.toFixed(1) + 'px');
  }
  fitTitle();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitle);
  if ('ResizeObserver' in window) {
    let lastW = 0;
    new ResizeObserver(() => {
      if (root.clientWidth !== lastW) { lastW = root.clientWidth; fitTitle(); }
    }).observe(root);
  } else {
    addEventListener('resize', fitTitle);
  }

  /* ------------------------------------------------------
     2. Partikel: hati, kelopak, kilau
     ------------------------------------------------------ */
  const COLORS = ['#bd1a2e', '#d9707d', '#f2b5bc', '#e693a0', '#c9962b'];
  const rand = (a, b) => a + Math.random() * (b - a);

  function spawn(x, y, count, power = 1) {
    if (reduce || !fx || !fx.animate) return;
    if (fx.childElementCount > 140) return;
    const frag = document.createDocumentFragment();
    const list = [];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('i');
      const k = Math.random();
      if (k < .45)      { p.className = 'pt'; p.textContent = Math.random() < .5 ? '♥' : '♡'; }
      else if (k < .8)  { p.className = 'pt petal'; }
      else              { p.className = 'pt'; p.textContent = '✦'; }
      p.style.cssText = `left:${x}px;top:${y}px;--s:${rand(9, 20).toFixed(1)}px;--c:${COLORS[(Math.random() * COLORS.length) | 0]}`;
      frag.appendChild(p);
      list.push(p);
    }
    fx.appendChild(frag);

    list.forEach(p => {
      const ang  = (-90 + (Math.random() - .5) * 170) * Math.PI / 180;
      const v    = rand(60, 170) * power;
      const dx   = Math.cos(ang) * v;
      const dy   = Math.sin(ang) * v;
      const fall = rand(90, 230);
      const rot  = (Math.random() - .5) * 540;
      const base = 'translate(-50%,-50%) ';
      const a = p.animate([
        { transform: base + 'translate(0,0) rotate(0deg) scale(.3)', opacity: 0 },
        { transform: base + `translate(${dx * .7}px,${dy * .7}px) rotate(${rot * .4}deg) scale(1)`, opacity: 1, offset: .25 },
        { transform: base + `translate(${dx}px,${dy + fall}px) rotate(${rot}deg) scale(.8)`, opacity: 0 }
      ], { duration: rand(1300, 2400), easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'forwards' });
      a.onfinish = () => p.remove();
    });
  }

  const local = (cx, cy) => {
    const r = fx.getBoundingClientRect();
    return [cx - r.left, cy - r.top];
  };
  const pointOn = (el, fx_, fy_) => {
    const r = el.getBoundingClientRect();
    return local(r.left + r.width * fx_, r.top + r.height * fy_);
  };

  const restart = el => { el.style.animation = 'none'; };
  const resume  = el => { el.style.animation = ''; };

  /* tap di mana saja → kelopak kecil */
  root.addEventListener('pointerdown', e => {
    if (e.target.closest('button, a')) return;
    const [x, y] = local(e.clientX, e.clientY);
    spawn(x, y, 7, .5);
  });

  /* ------------------------------------------------------
     3. Tap judul → ditulis ulang
     ------------------------------------------------------ */
  if (title && inkT && pen) {
    title.addEventListener('click', () => {
      if (!root.classList.contains('in')) return;
      title.style.setProperty('--wd', '.05s');
      restart(inkT); restart(pen);
      void title.offsetWidth;
      resume(inkT); resume(pen);
      const [x, y] = pointOn(title, .5, .5);
      spawn(x, y, 8, .7);
    });
  }

  /* ------------------------------------------------------
     4. Kue: tap → lilin menyala · tap lagi → ditiup
     ------------------------------------------------------ */
  const say = text => {
    if (!hint) return;
    hint.classList.add('swap');
    setTimeout(() => { hint.textContent = text; hint.classList.remove('swap'); }, 230);
  };

  if (cake) {
    let lit = false;
    const svg = cake.querySelector('svg');

    cake.addEventListener('click', () => {
      lit = !lit;
      cake.classList.add('has-candle');
      cake.classList.toggle('is-lit', lit);
      cake.setAttribute('aria-pressed', String(lit));
      cake.setAttribute('aria-label', lit ? 'Tap to blow out the candle' : 'Tap to light the candle again');

      const [cx, cy] = pointOn(svg, 214 / 320, 26 / 210);
      if (lit) {
        say('make a wish… then tap to blow it out');
        spawn(cx, cy, 8, .6);
      } else {
        cake.classList.remove('puff'); void cake.offsetWidth; cake.classList.add('puff');
        say('wish sent, happy birthday ♡');
        spawn(cx, cy, 26, 1.25);
      }
    });
  }

  /* ------------------------------------------------------
     5. Pita di kartu → kilau
     ------------------------------------------------------ */
  if (bow) {
    bow.addEventListener('click', () => {
      bow.classList.remove('wig'); void bow.offsetWidth; bow.classList.add('wig');
      const [x, y] = pointOn(bow, .5, .5);
      spawn(x, y, 10, .7);
    });
  }

  /* ------------------------------------------------------
     6. Parallax halus (mouse saja)
     ------------------------------------------------------ */
  if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let raf = 0, tx = 0, ty = 0;
    root.addEventListener('pointermove', e => {
      const r = root.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - .5) * 2;
      ty = ((e.clientY - r.top) / r.height - .5) * 2;
      if (!raf) raf = requestAnimationFrame(() => {
        raf = 0;
        root.style.setProperty('--px', tx.toFixed(3));
        root.style.setProperty('--py', ty.toFixed(3));
      });
    });
    root.addEventListener('pointerleave', () => {
      root.style.setProperty('--px', 0);
      root.style.setProperty('--py', 0);
    });
  }
})();