/* ==========================================================
   Date Night — musik latar
   1 lagu (assets/audio/1.mp3), mulai setelah loading selesai,
   diulang terus. Saat loading tidak ada suara.
   Browser memblokir autoplay sebelum ada sentuhan, jadi kalau
   diblokir, musik mulai di tap/klik/tombol pertama.
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

  let allowed = false;   // true setelah loading selesai
  let playing = false;

  const GESTURES = ['pointerdown', 'keydown', 'touchend'];
  const offGestures = () => GESTURES.forEach(g => removeEventListener(g, onGesture, true));
  const armGestures = () => GESTURES.forEach(g => addEventListener(g, onGesture, true));

  function onGesture() {
    if (!allowed) return;          // tap saat loading tidak memulai musik
    tryPlay();
  }

  function tryPlay() {
    if (!allowed || playing) return;
    const p = audio.play();
    if (!p || !p.then) return;
    p.then(() => { playing = true; offGestures(); })
     .catch(() => { /* diblokir → tunggu gesture berikutnya */ });
  }

  function allow() { allowed = true; tryPlay(); }

  armGestures();

  if (root.classList.contains('is-loading')) {
    addEventListener('loader:done', allow, { once: true });
    setTimeout(() => { if (!root.classList.contains('is-loading')) allow(); }, 9000); // jaga-jaga
  } else {
    allow();                       // tanpa loader (mis. setelah kirim form)
  }

  // hemat baterai: jeda saat tab disembunyikan, lanjut saat kembali
  document.addEventListener('visibilitychange', () => {
    if (!allowed) return;
    if (document.hidden) { if (playing) audio.pause(); }
    else if (playing) audio.play().catch(() => {});
  });
})();
