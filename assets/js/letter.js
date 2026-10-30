/* ==========================================================
   Date Night — surat ulang tahun (setelah loading, sebelum cover)
   Logika klik:
   - teks masih berjalan  -> klik 1x = langsung tampil sampai akhir
   - teks sudah selesai   -> klik 1x = lanjut ke halaman berikutnya
   (kalau teks selesai sendiri, cukup 1x klik untuk lanjut)
   ========================================================== */
(() => {
  'use strict';

  const root   = document.documentElement;
  const letter = document.getElementById('letter');
  if (!letter || !root.classList.contains('is-letter')) return;

  const body   = document.getElementById('ltBody');
  const src    = document.getElementById('ltSrc');
  const hint   = document.getElementById('ltHint');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.__letterReady = true;

  /* ---------- pecah teks jadi kata & huruf (layout stabil, tidak loncat) ---------- */
  const chars = [];   // { el, wait }
  const BASE = 27;    // ms per huruf

  const waitFor = (ch, next) => {
    if (ch === ' ')  return BASE * 1.4;
    if ('.!?'.includes(ch) && (!next || next === ' ')) return 380;
    if (',;:'.includes(ch)) return 170;
    if (ch === ')') return 120;
    return BASE + Math.random() * 16;
  };

  const blocks = [...src.querySelectorAll('[data-t]')];
  const plain  = [];

  blocks.forEach((blk, bi) => {
    const text = blk.textContent.trim();
    plain.push(text);
    blk.textContent = '';
    blk.setAttribute('aria-hidden', 'true');

    const words = text.split(/\s+/);
    words.forEach((w, wi) => {
      const ws = document.createElement('span');
      ws.className = 'w';
      [...w].forEach((ch, ci) => {
        const c = document.createElement('span');
        c.className = 'c';
        c.textContent = ch;
        ws.appendChild(c);
        const isLast = ci === w.length - 1 && wi === words.length - 1;
        const nextCh = ci < w.length - 1 ? w[ci + 1] : (wi < words.length - 1 ? ' ' : '');
        chars.push({ el: c, wait: waitFor(ch, nextCh) + (isLast && bi < blocks.length - 1 ? 520 : 0) });
      });
      blk.appendChild(ws);
      if (wi < words.length - 1) {
        blk.appendChild(document.createTextNode(' '));
        chars[chars.length - 1].wait += BASE * 0.6;   // jeda kecil antar kata
      }
    });
  });

  // salinan teks utuh untuk pembaca layar
  const sr = document.createElement('div');
  sr.className = 'sr';
  sr.textContent = plain.join(' ');
  body.appendChild(sr);

  /* ---------- state ---------- */
  let state = 'idle';           // idle -> typing -> done -> leaving
  let idx = 0, nextAt = 0, raf = 0, lastTop = -1, userScrolled = false;
  let armedAt = 0;              // klik diabaikan sebelum waktu ini
  let cur = null;

  const scrollToCur = (force) => {
    if (userScrolled && !force) return;
    if (!cur) return;
    const need = cur.offsetTop + cur.offsetHeight + 28 - body.clientHeight;
    if (need > body.scrollTop || force) {
      body.scrollTo({ top: force ? body.scrollHeight : need, behavior: reduce ? 'auto' : 'smooth' });
    }
  };

  function reveal(i) {
    const c = chars[i].el;
    if (cur) cur.classList.remove('cur');
    c.classList.add('on', 'cur');
    cur = c;
    const top = c.offsetTop;
    if (top !== lastTop) { lastTop = top; scrollToCur(false); }
  }

  function setHint(txt, ready) {
    hint.classList.add('swap');
    setTimeout(() => {
      hint.textContent = txt;
      hint.classList.remove('swap');
      hint.classList.toggle('ready', !!ready);
    }, 220);
  }

  function markDone() {
    state = 'done';
    cancelAnimationFrame(raf);
    if (cur) cur.classList.remove('cur');
    letter.classList.add('is-done');
    setHint('tap anywhere to continue ♡', true);
  }

  function loop(now) {
    if (state !== 'typing') return;
    while (idx < chars.length && now >= nextAt) {
      reveal(idx);
      nextAt += chars[idx].wait;
      idx++;
    }
    if (idx >= chars.length) { markDone(); return; }
    raf = requestAnimationFrame(loop);
  }

  function startTyping() {
    if (state !== 'idle') return;
    if (reduce) {
      chars.forEach(c => c.el.classList.add('on'));
      idx = chars.length;
      markDone();
      return;
    }
    state = 'typing';
    nextAt = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function skipToEnd() {
    // klik pertama saat teks masih jalan: langsung sampai akhir
    for (; idx < chars.length; idx++) chars[idx].el.classList.add('on');
    markDone();
    armedAt = performance.now() + 280;   // cegah double-tap langsung melewati surat
    setTimeout(() => scrollToCur(true), 40);
    body.scrollTo({ top: body.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
  }

  function leave() {
    if (state === 'leaving') return;
    state = 'leaving';
    letter.classList.add('is-leaving');
    navigator.vibrate && navigator.vibrate(10);
    dispatchEvent(new Event('letter:done'));
    setTimeout(() => { letter.hidden = true; }, 1000);
  }

  function advance() {
    if (performance.now() < armedAt) return;
    if (state === 'typing' || state === 'idle') skipToEnd();
    else if (state === 'done') leave();
  }

  /* ---------- input ---------- */
  letter.addEventListener('click', advance);
  letter.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); advance(); }
  });
  // scroll manual = jangan dilawan oleh auto-scroll
  const manual = () => { userScrolled = true; };
  body.addEventListener('wheel', manual, { passive: true });
  body.addEventListener('touchmove', manual, { passive: true });

  /* ---------- masuk (setelah loader selesai) ---------- */
  function enter() {
    letter.hidden = false;
    armedAt = performance.now() + 900;   // tap terakhir di loader jangan ikut kehitung
    requestAnimationFrame(() => requestAnimationFrame(() => {
      letter.classList.add('in');
      letter.focus({ preventScroll: true });
    }));
    setTimeout(startTyping, reduce ? 0 : 1500);   // tunggu pita & judul muncul dulu
  }
  addEventListener('loader:done', enter, { once: true });
})();
