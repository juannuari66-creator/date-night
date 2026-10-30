/* ==========================================================
   Date Night — interactions
   ribbon frames · cover · reveal · countdown · dropdowns · ticket · confetti
   ========================================================== */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------
     1. Ribbon frame (wavy ribbon + bows), redrawn on resize
     ------------------------------------------------------ */
  function basePoints(x, y, w, h, r, step) {
    const p = [];
    const seg = (x0, y0, x1, y1, nx, ny) => {
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
      for (let i = 0; i < n; i++) {
        const t = i / n;
        p.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, nx, ny]);
      }
    };
    const arc = (cx, cy, a0, a1) => {
      const n = Math.max(4, Math.round(Math.abs(a1 - a0) * r / step));
      for (let i = 0; i < n; i++) {
        const a = a0 + (a1 - a0) * i / n;
        p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, Math.cos(a), Math.sin(a)]);
      }
    };
    seg(x + r, y, x + w - r, y, 0, -1);
    arc(x + w - r, y + r, -Math.PI / 2, 0);
    seg(x + w, y + r, x + w, y + h - r, 1, 0);
    arc(x + w - r, y + h - r, 0, Math.PI / 2);
    seg(x + w - r, y + h, x + r, y + h, 0, 1);
    arc(x + r, y + h - r, Math.PI / 2, Math.PI);
    seg(x, y + h - r, x, y + r, -1, 0);
    arc(x + r, y + r, Math.PI, Math.PI * 1.5);
    return p;
  }

  function buildFrame(host) {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;

    let svg = host.querySelector(':scope > .frame');
    if (!svg) {
      svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'frame');
      svg.setAttribute('aria-hidden', 'true');
      host.appendChild(svg);
    }

    const isCover = host.classList.contains('cover');
    const m = isCover ? 18 : 24;           // inset from the edge
    const r = 40;                          // corner radius
    const A = 3.4;                         // wave amplitude
    const pts = basePoints(m, m, w - m * 2, h - m * 2, r, 4);

    // total length -> whole number of waves so the loop closes smoothly
    let total = 0;
    for (let i = 1; i <= pts.length; i++) {
      const a = pts[i - 1], b = pts[i % pts.length];
      total += Math.hypot(b[0] - a[0], b[1] - a[1]);
    }
    const waves = Math.max(6, Math.round(total / 120));
    let s = 0, d = '';
    pts.forEach((q, i) => {
      if (i) s += Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]);
      const off = A * Math.sin((s / total) * waves * Math.PI * 2);
      const x = q[0] + q[2] * off, y = q[1] + q[3] * off;
      d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    });
    d += 'Z';

    const bow = (cx, cy, bw, rot = 0) => {
      const bh = bw * 50 / 120;
      const t = rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : '';
      return `<use href="#bow" x="${(cx - bw / 2).toFixed(1)}" y="${(cy - bh / 2).toFixed(1)}" width="${bw}" height="${bh.toFixed(1)}"${t}/>`;
    };

    const big = isCover ? 120 : 112, mid = isCover ? 88 : 80, small = 42;
    const bows = [
      bow(w / 2, m - 1, big),                 // top centre
      bow(w / 2, h - m + 1, big),             // bottom centre
      bow(w * 0.17, m + 7, mid),              // top left / right
      bow(w * 0.83, m + 7, mid),
      bow(w * 0.17, h - m - 7, mid),          // bottom left / right
      bow(w * 0.83, h - m - 7, mid),
      bow(m + 1, h * 0.36, small, 90),        // side knots
      bow(m + 1, h * 0.68, small, 90),
      bow(w - m - 1, h * 0.36, small, 90),
      bow(w - m - 1, h * 0.68, small, 90),
    ].join('');

    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.innerHTML =
      `<path class="frame-line" pathLength="1" d="${d}" fill="none" stroke="currentColor" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<g class="frame-bows">${bows}</g>`;
  }

  const frameHosts = $$('[data-frame]');
  const ro = 'ResizeObserver' in window
    ? new ResizeObserver(entries => entries.forEach(e => buildFrame(e.target)))
    : null;
  frameHosts.forEach(h => { buildFrame(h); ro && ro.observe(h); });
  if (!ro) addEventListener('resize', () => frameHosts.forEach(buildFrame));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => frameHosts.forEach(buildFrame));

  /* ------------------------------------------------------
     2. Reveal on scroll + side dots
     ------------------------------------------------------ */
  const slides = $$('.slide');
  const dots = $$('.dots a');
  let revealStarted = false;

  function startReveal() {
    if (revealStarted) return;
    revealStarted = true;

    const all = [...$$('.slide'), ...$$('[data-reveal]')];
    if (reduce || !('IntersectionObserver' in window)) {
      all.forEach(el => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); obs.unobserve(en.target); }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
    all.forEach(el => io.observe(el));

    const io2 = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const i = slides.indexOf(en.target);
        dots.forEach((d, k) => d.classList.toggle('active', k === i));
      });
    }, { threshold: 0.5 });
    slides.forEach(s => io2.observe(s));
  }

  /* ------------------------------------------------------
     3. Cover (untie the ribbon)
     ------------------------------------------------------ */
  const cover = $('#cover');
  const stage = $('#stage');
  const hasParams = /[?&]err=/.test(location.search);

  function openCover(instant) {
    if (!cover || cover.classList.contains('open')) { startReveal(); return; }
    cover.classList.add('open');
    cover.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('locked');
    if (stage) stage.inert = false;
    setTimeout(startReveal, instant ? 0 : 500);
    setTimeout(() => { cover.hidden = true; }, instant ? 0 : 1300);
    if (instant) cover.style.transition = 'none';
  }

  if (cover && document.documentElement.classList.contains('js')) {
    if (stage) stage.inert = true;
    const showCover = () => requestAnimationFrame(() => cover.classList.add('in'));
    const rootEl = document.documentElement;
    if (rootEl.classList.contains('is-letter')) {
      // loading -> surat -> cover
      addEventListener('letter:done', () => { rootEl.classList.remove('is-letter'); showCover(); }, { once: true });
      setTimeout(() => { // jaga-jaga kalau letter.js gagal jalan
        if (!window.__letterReady) { rootEl.classList.remove('is-letter'); showCover(); }
      }, 8000);
    } else if (rootEl.classList.contains('is-loading')) {
      addEventListener('loader:done', showCover, { once: true });
      setTimeout(showCover, 8000); // jaga-jaga kalau loader gagal jalan
    } else {
      showCover();
    }
    $('#openBtn').addEventListener('click', () => openCover(false));
    if (hasParams) {
      openCover(true);
      const t = $(location.hash || '#menu');
      if (t) setTimeout(() => t.scrollIntoView({ block: 'start' }), 60);
    }
  } else {
    startReveal();
  }

  /* ------------------------------------------------------
     4. Countdown
     ------------------------------------------------------ */
  const cd = $('[data-countdown]');
  if (cd) {
    const target = new Date(cd.dataset.target).getTime();
    const el = u => cd.querySelector(`[data-u="${u}"]`);
    const pad = n => String(n).padStart(2, '0');
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        cd.innerHTML = '<p class="count-done">it\'s date night ♡</p>';
        return false;
      }
      const s = Math.floor(diff / 1000);
      el('d').textContent = pad(Math.floor(s / 86400));
      el('h').textContent = pad(Math.floor(s % 86400 / 3600));
      el('m').textContent = pad(Math.floor(s % 3600 / 60));
      el('s').textContent = pad(s % 60);
      return true;
    };
    if (tick()) { const iv = setInterval(() => { if (!tick()) clearInterval(iv); }, 1000); }
  }

  /* ------------------------------------------------------
     5. Custom dropdowns (progressive enhancement of <select>)
     ------------------------------------------------------ */
  const CHEVRON = '<svg class="chev" viewBox="0 0 16 10" aria-hidden="true"><path d="M2 2l6 6 6-6" fill="none" stroke="#a8152b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const dropdowns = [];

  function enhance(select) {
    const wrap = document.createElement('div');
    wrap.className = 'dd';
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);

    select.classList.add('dd-native');
    select.removeAttribute('required');           // validated manually below
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');

    const ph = select.dataset.placeholder || 'Choose';
    const opts = [...select.options].filter(o => o.value !== '');
    const id = 'dd-' + select.name;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dd-btn';
    btn.id = id + '-btn';
    btn.setAttribute('role', 'combobox');
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', id + '-list');
    const lab = select.id && $(`label[for="${select.id}"]`);
    if (lab) { lab.id = lab.id || id + '-label'; btn.setAttribute('aria-labelledby', lab.id + ' ' + btn.id); lab.addEventListener('click', e => { e.preventDefault(); btn.focus(); }); }

    const list = document.createElement('ul');
    list.className = 'dd-list';
    list.id = id + '-list';
    list.setAttribute('role', 'listbox');
    list.tabIndex = -1;

    const items = opts.map((o, i) => {
      const li = document.createElement('li');
      li.className = 'dd-opt';
      li.id = `${id}-o${i}`;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      li.dataset.value = o.value;
      li.textContent = o.textContent;
      list.appendChild(li);
      return li;
    });

    wrap.append(btn, list);

    let active = -1, typed = '', typedTimer;

    const label = () => {
      const o = select.value && opts.find(x => x.value === select.value);
      btn.innerHTML = (o ? `<span>${o.textContent}</span>` : `<span class="ph">${ph}</span>`) + CHEVRON;
      wrap.classList.toggle('picked', !!o);
    };
    const setActive = i => {
      active = i;
      items.forEach((li, k) => li.classList.toggle('is-active', k === i));
      if (i >= 0) {
        btn.setAttribute('aria-activedescendant', items[i].id);
        items[i].scrollIntoView({ block: 'nearest' });
      } else btn.removeAttribute('aria-activedescendant');
    };
    const open = () => {
      dropdowns.forEach(d => d !== api && d.close());
      // flip upwards if there is no room below
      wrap.classList.remove('up');
      const r = btn.getBoundingClientRect();
      const need = Math.min(300, innerHeight * .46) + 16;
      if (innerHeight - r.bottom < need && r.top > innerHeight - r.bottom) wrap.classList.add('up');
      wrap.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      const cur = items.findIndex(li => li.dataset.value === select.value);
      setActive(cur >= 0 ? cur : 0);
    };
    const close = () => {
      wrap.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      setActive(-1);
    };
    const choose = i => {
      const li = items[i];
      select.value = li.dataset.value;
      items.forEach((x, k) => x.setAttribute('aria-selected', String(k === i)));
      wrap.classList.remove('invalid');
      label();
      close();
      select.dispatchEvent(new Event('change', { bubbles: true }));
      btn.focus({ preventScroll: true });
    };
    const isOpen = () => wrap.classList.contains('open');

    btn.addEventListener('click', () => (isOpen() ? close() : open()));
    list.addEventListener('mousedown', e => e.preventDefault());
    list.addEventListener('click', e => {
      const li = e.target.closest('.dd-opt');
      if (li) choose(items.indexOf(li));
    });
    list.addEventListener('mousemove', e => {
      const li = e.target.closest('.dd-opt');
      if (li) setActive(items.indexOf(li));
    });

    btn.addEventListener('keydown', e => {
      const k = e.key;
      if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' ', 'Escape', 'Tab'].includes(k) || k.length === 1) {
        if (k === 'Tab') { close(); return; }
        if (!isOpen()) {
          if (k === 'Escape') return;
          if (k.length === 1 && k !== ' ') { /* fall through to type-ahead */ }
          else { e.preventDefault(); open(); return; }
        }
        e.preventDefault();
        if (k === 'ArrowDown') setActive(Math.min(items.length - 1, active + 1));
        else if (k === 'ArrowUp') setActive(Math.max(0, active - 1));
        else if (k === 'Home') setActive(0);
        else if (k === 'End') setActive(items.length - 1);
        else if (k === 'Enter' || k === ' ') { if (active >= 0) choose(active); }
        else if (k === 'Escape') close();
        else if (k.length === 1) {                         // type-ahead
          typed += k.toLowerCase();
          clearTimeout(typedTimer);
          typedTimer = setTimeout(() => (typed = ''), 700);
          const hit = items.findIndex(li => li.textContent.toLowerCase().startsWith(typed));
          if (hit >= 0) { if (!isOpen()) open(); setActive(hit); }
        }
      }
    });

    select.addEventListener('change', () => { // keep UI in sync if value is set programmatically
      const i = items.findIndex(li => li.dataset.value === select.value);
      items.forEach((x, k) => x.setAttribute('aria-selected', String(k === i)));
      label();
    });

    label();
    const api = { wrap, btn, select, close };
    dropdowns.push(api);
  }

  if (document.documentElement.classList.contains('js')) {
    $$('select[data-placeholder]').forEach(enhance);
    document.addEventListener('click', e => dropdowns.forEach(d => { if (!d.wrap.contains(e.target)) d.close(); }));
  }

  /* ------------------------------------------------------
     6. Live ticket preview
     ------------------------------------------------------ */
  $$('select[data-placeholder]').forEach(sel => {
    const out = $(`[data-preview="${sel.name}"]`);
    if (!out) return;
    sel.addEventListener('change', () => {
      const m = $('#formMsg'); if (m) m.classList.remove('show');
      const empty = !sel.value;
      out.textContent = empty ? 'not picked yet' : sel.value;
      out.classList.toggle('is-empty', empty);
      out.classList.remove('pop'); void out.offsetWidth; out.classList.add('pop');
    });
  });

  /* ------------------------------------------------------
     7. Submit: validate -> confetti -> redirect to WhatsApp
     ------------------------------------------------------ */
  const form = $('#orderForm');
  const msg = $('#formMsg');
  const sendBtn = $('#sendBtn');
  let sending = false;

  function confetti() {
    const layer = $('#confetti');
    if (!layer || reduce) return;
    const colors = ['#a8152b', '#6e1325', '#d9707d', '#f2c9cc', '#fff4ea', '#c42a40'];
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 64; i++) {
      const p = document.createElement('i');
      const big = Math.random() > .65;
      p.style.cssText = [
        `left:${Math.random() * 100}%`,
        `--c:${colors[i % colors.length]}`,
        `--w:${big ? 6 + Math.random() * 6 : 5 + Math.random() * 5}px`,
        `--h:${big ? 14 + Math.random() * 10 : 5 + Math.random() * 5}px`,
        `--r:${Math.random() > .5 ? '50%' : '2px'}`,
        `--x:${(Math.random() - .5) * 240}px`,
        `--rot:${(Math.random() - .5) * 1080}deg`,
        `--t:${1.6 + Math.random() * 1.4}s`,
        `--dl:${Math.random() * .35}s`,
      ].join(';');
      frag.appendChild(p);
    }
    layer.appendChild(frag);
    setTimeout(() => (layer.innerHTML = ''), 3600);
  }

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (sending) return;

      const food = form.elements.food, drink = form.elements.drink;
      const missing = [food, drink].filter(s => !s.value);
      $$('.dd').forEach(d => d.classList.remove('invalid'));

      if (missing.length) {
        missing.forEach(s => { const w = s.closest('.dd'); if (w) { void w.offsetWidth; w.classList.add('invalid'); } });
        msg.textContent = missing.length === 2
          ? 'Please pick your food & drink first ♡'
          : `Please pick your ${missing[0].name} first ♡`;
        msg.classList.add('show');
        const first = missing[0].closest('.dd');
        if (first) { first.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }); first.querySelector('.dd-btn').focus({ preventScroll: true }); }
        return;
      }

      msg.classList.remove('show');
      sending = true;
      sendBtn.disabled = true;
      $('.btn-label', sendBtn).textContent = 'Opening WhatsApp…';
      confetti();
      setTimeout(() => {
        const D = window.DN || {};
        const L = ['👑 DATE NIGHT — THE PRINCE ACCEPTS! 👑', '📅 ' + D.date];
        if (D.venue) L.push('📍 ' + D.venue);
        const gn = (document.getElementById('guestName') || {}).textContent;
        if (gn && gn !== 'my prince') L.push('👤 ' + gn);
        L.push('', '🍽 Food  : ' + food.value, '🥤 Drink : ' + drink.value);
        const note = (form.elements.note.value || '').trim().slice(0, 140);
        if (note) L.push('📝 Note  : ' + note);
        location.href = 'https://wa.me/' + D.wa + '?text=' + encodeURIComponent(L.join('\n'));
      }, reduce ? 50 : 1100);
    });

    // restore state when coming back (bfcache)
    addEventListener('pageshow', e => {
      if (!e.persisted) return;
      sending = false;
      sendBtn.disabled = false;
      $('.btn-label', sendBtn).textContent = 'Send to WhatsApp';
    });
  }
})();