/* Royal crown — tap for a burst of gold sparkles */
(() => {
  const crown = document.getElementById('crown');
  if (!crown) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const glyphs = ['✦', '✧', '♛', '✦'];
  function burst() {
    crown.classList.remove('pop'); void crown.offsetWidth; crown.classList.add('pop');
    if (navigator.vibrate) navigator.vibrate(18);
    if (reduce) return;
    const r = crown.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (let i = 0; i < 16; i++) {
      const el = document.createElement('span');
      el.className = 'gold-spark';
      el.textContent = glyphs[i % glyphs.length];
      el.style.left = cx + 'px'; el.style.top = cy + 'px';
      el.style.fontSize = (10 + Math.random() * 14) + 'px';
      document.body.appendChild(el);
      const a = (Math.PI * 2 * i) / 16 + Math.random() * .4;
      const d = 60 + Math.random() * 70;
      el.animate([
        { transform: 'translate(-50%,-50%) scale(.4)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d - 20}px)) scale(1.1) rotate(${Math.random() * 180}deg)`, opacity: 1, offset: .6 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * d * 1.15}px), calc(-50% + ${Math.sin(a) * d + 30}px)) scale(.6)`, opacity: 0 }
      ], { duration: 1100 + Math.random() * 400, easing: 'cubic-bezier(.22,.8,.24,1)' }).onfinish = () => el.remove();
    }
  }
  crown.addEventListener('click', burst);
  // a little royal fanfare when the ribbon is untied
  const open = document.getElementById('openBtn');
  if (open) open.addEventListener('click', () => setTimeout(burst, 80));
})();
