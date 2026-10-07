(function () {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const preview = new URLSearchParams(location.search).has('preview');
  const root = document.documentElement;
  if (preview) root.classList.add('preview');
  const pointer = { x: innerWidth / 2, y: innerHeight / 2, nx: 0, ny: 0 };
  if (preview) document.head.insertAdjacentHTML('beforeend', '<style>html.preview *{animation:none!important;transition:none!important}html.preview .hero-photo:before,html.preview .hero-image:after,html.preview .hero figure:after{display:none!important}</style>');
  let scroll = scrollY, targetScroll = scrollY, raf = 0;

  addEventListener('pointermove', (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.nx = event.clientX / innerWidth - .5;
    pointer.ny = event.clientY / innerHeight - .5;
    root.style.setProperty('--mx', `${event.clientX}px`);
    root.style.setProperty('--my', `${event.clientY}px`);
  }, { passive: true });
  addEventListener('scroll', () => { targetScroll = scrollY; }, { passive: true });

  const reveal = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add('is-in'); reveal.unobserve(entry.target); }
  }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('[data-reveal], .manifesto, .statement, .intro, .stay, .details, .room, .rates, .repere').forEach((el) => reveal.observe(el));

  document.querySelectorAll('[data-magnetic], .book, .cta').forEach((el) => {
    if (reduce) return;
    el.addEventListener('pointermove', (event) => {
      const box = el.getBoundingClientRect();
      el.style.transform = `translate(${(event.clientX - box.left - box.width / 2) * .14}px, ${(event.clientY - box.top - box.height / 2) * .18}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  const progress = document.querySelector('.scroll-progress');
  const parallax = [...document.querySelectorAll('[data-parallax]')];
  const tilt = [...document.querySelectorAll('[data-tilt]')];
  tilt.forEach((el) => {
    if (reduce) return;
    el.addEventListener('pointermove', (event) => {
      const b = el.getBoundingClientRect();
      const x = (event.clientX - b.left) / b.width - .5;
      const y = (event.clientY - b.top) / b.height - .5;
      el.style.transform = `perspective(900px) rotateX(${-y * 3}deg) rotateY(${x * 4}deg) scale(1.015)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  const canvas = document.querySelector('canvas[data-scene]');
  let drawScene = () => {};
  if (canvas) drawScene = setupCanvas(canvas, canvas.dataset.scene || 'contours');

  function frame(time) {
    scroll += (targetScroll - scroll) * .09;
    if (progress) progress.style.transform = `scaleX(${Math.min(1, targetScroll / Math.max(1, document.body.scrollHeight - innerHeight))})`;
    if (!reduce) parallax.forEach((el) => {
      const speed = +(el.dataset.parallax || .08);
      const box = el.parentElement.getBoundingClientRect();
      el.style.transform = `translate3d(0, ${(box.top + box.height / 2 - innerHeight / 2) * speed}px, 0) scale(1.08)`;
    });
    drawScene(time, pointer, scroll);
    raf = requestAnimationFrame(frame);
  }

  function setupCanvas(cv, mode) {
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, dpr = 1, nodes = [];
    const css = getComputedStyle(cv);
    const color = css.getPropertyValue('--scene-color').trim() || '#fff';
    function resize() {
      const box = cv.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 1.7);
      w = box.width; h = box.height; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes = Array.from({ length: Math.min(80, Math.floor(w / 16)) }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22, r: Math.random() * 1.8 + .5 }));
    }
    resize(); addEventListener('resize', resize, { passive: true });
    if (mode === 'drift') return function (time, p) {
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = color; ctx.strokeStyle = color;
      for (const n of nodes) {
        if (!reduce) { n.x += n.vx; n.y += n.vy; if (n.x < 0 || n.x > w) n.vx *= -1; if (n.y < 0 || n.y > h) n.vy *= -1; const dx = n.x - p.x, dy = n.y - p.y, dist = Math.hypot(dx, dy); if (dist < 120) { n.x += dx / Math.max(dist, 1) * 1.1; n.y += dy / Math.max(dist, 1) * 1.1; } }
        ctx.globalAlpha = .22 + n.r * .12; ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = .08; for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) { const a = nodes[i], b = nodes[j]; if (Math.hypot(a.x - b.x, a.y - b.y) < 85) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } }
      ctx.globalAlpha = 1;
    };
    if (mode === 'crystal') return function (time, p, sy) {
      ctx.clearRect(0, 0, w, h); ctx.strokeStyle = color; ctx.lineWidth = 1; const cols = 17, rows = 13; const angle = (time || 0) * .00008 + p.nx * .35; const ca = Math.cos(angle), sa = Math.sin(angle); const pts = [];
      for (let z = 0; z < rows; z++) { pts[z] = []; for (let x = 0; x < cols; x++) { let xx = (x / (cols - 1) - .5) * 2.6, zz = (z / (rows - 1) - .5) * 2.1; const yy = -.78 * Math.exp(-(xx * xx * 1.7 + zz * zz * 2.3)) + Math.sin(xx * 4 + zz * 3) * .05; const rx = xx * ca - zz * sa, rz = xx * sa + zz * ca + 4.1; pts[z][x] = { x: w / 2 + rx / rz * w * .72, y: h * .55 + (yy + zz * .22) / rz * h * .95 }; } }
      ctx.globalAlpha = .42; for (let z = 0; z < rows; z++) { ctx.beginPath(); pts[z].forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke(); } for (let x = 0; x < cols; x++) { ctx.beginPath(); pts.forEach((row, i) => i ? ctx.lineTo(row[x].x, row[x].y) : ctx.moveTo(row[x].x, row[x].y)); ctx.stroke(); } ctx.globalAlpha = 1;
    };
    return function (time, p, sy) {
      ctx.clearRect(0, 0, w, h); ctx.strokeStyle = color; ctx.lineWidth = 1;
      for (let ring = 0; ring < 16; ring++) { const radius = 38 + ring * Math.min(w, h) * .035; ctx.globalAlpha = .08 + ring * .009; ctx.beginPath(); for (let i = 0; i <= 160; i++) { const a = i / 160 * Math.PI * 2; const noise = Math.sin(a * 3 + ring * .7 + (time || 0) * .00015) * 7 + Math.sin(a * 7 - ring) * 3; const x = w * .68 + p.nx * 20 + Math.cos(a) * (radius + noise) * 1.3; const y = h * .48 + p.ny * 15 + Math.sin(a) * (radius + noise) * .72; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.stroke(); }
      ctx.globalAlpha = 1;
    };
  }

  addEventListener('load', () => {
    document.body.classList.add('is-ready');
    setTimeout(() => document.querySelector('.loader')?.remove(), preview ? 0 : 1100);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(frame); });
  raf = requestAnimationFrame(frame);
})();
