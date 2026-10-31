/* ==========================================================
   Date Night — musik latar
   1 lagu (assets/audio/1.mp3), diulang terus.
   - Saat loading: tidak ada suara.
   - Begitu loading selesai: musik langsung diputar.
   Browser memblokir suara otomatis sebelum ada sentuhan di halaman.
   Jadi sentuhan pertama (bahkan saat loading) hanya "membuka kunci"
   audio secara diam-diam, supaya begitu loading selesai musik bisa
   langsung bunyi. Kalau tetap diblokir, musik mulai di sentuhan berikutnya.
   ========================================================== */
(() => {
  'use strict';

  const SRC    = 'assets/audio/1.mp3';
  const VOLUME = 0.6;
  const root   = document.documentElement;

  const audio = new Audio();
  audio.src = SRC;
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = VOLUME;

  let allowed  = false;   // true begitu loading selesai
  let playing  = false;
  let unlocking = false;

  const GESTURES = ['pointerdown', 'pointerup', 'mousedown', 'touchend', 'click', 'keydown'];
  const offGestures = () => GESTURES.forEach(g => removeEventListener(g, onGesture, true));
  const armGestures = () => GESTURES.forEach(g => addEventListener(g, onGesture, true));

  function onGesture() {
    if (playing) return;
    if (allowed) tryPlay(); else unlock();
  }

  // Saat loading: putar diam-diam (muted) lalu jeda, hanya untuk membuka kunci autoplay
  function unlock() {
    if (unlocking || allowed) return;
    unlocking = true;
    audio.muted = true;
    const p = audio.play();
    if (!p || !p.then) { unlocking = false; audio.muted = false; return; }
    p.then(() => {
      unlocking = false;
      if (allowed) { audio.muted = false; playing = true; offGestures(); }   // loading sudah selesai saat ini
      else { audio.pause(); audio.currentTime = 0; audio.muted = false; }
    }).catch(() => { unlocking = false; audio.muted = false; });
  }

  function tryPlay() {
    if (!allowed || playing) return;
    audio.muted = false;
    const p = audio.play();
    if (!p || !p.then) return;
    p.then(() => { playing = true; offGestures(); })
     .catch(() => { /* diblokir → tunggu sentuhan berikutnya */ });
  }

  function allow() { allowed = true; tryPlay(); }

  armGestures();

  if (root.classList.contains('is-loading')) {
    addEventListener('loader:done', allow, { once: true });
    setTimeout(() => { if (!allowed && !root.classList.contains('is-loading')) allow(); }, 9000); // jaga-jaga
  } else {
    allow();                       // tanpa loader (mis. setelah kirim form)
  }
  audio.addEventListener('canplay', tryPlay);

  // hemat baterai: jeda saat tab disembunyikan, lanjut saat kembali
  document.addEventListener('visibilitychange', () => {
    if (!allowed) return;
    if (document.hidden) { if (playing) audio.pause(); }
    else if (playing) audio.play().catch(() => {});
  });
})();
