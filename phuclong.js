/* Off-canvas (giữ nguyên) */
(() => {
  const body = document.body;
  const toggle = document.getElementById('menu-toggle');
  const drawer = document.getElementById('offcanvas');
  if (!toggle || !drawer) return;

  const panel = drawer.querySelector('.offcanvas__panel');
  const focusableSelector = [
    'a[href]','button:not([disabled])','input:not([disabled])','select:not([disabled])',
    'textarea:not([disabled])','[tabindex]:not([tabindex="-1"])'
  ].join(',');

  let lastFocused = null;

  function setHamburger(open) {
    const bars = toggle.querySelectorAll('.hamburger__bar');
    if (bars.length !== 3) return;
    if (open) { bars[0].style.transform='translateY(6px) rotate(45deg)'; bars[1].style.opacity='0'; bars[2].style.transform='translateY(-6px) rotate(-45deg)'; }
    else { bars[0].style.transform=''; bars[1].style.opacity=''; bars[2].style.transform=''; }
  }

  function trapFocus(e){
    if (drawer.getAttribute('aria-hidden')==='true' || e.key!=='Tab') return;
    const nodes = panel.querySelectorAll(focusableSelector);
    if (!nodes.length) return;
    const first = nodes[0], last = nodes[nodes.length-1];
    if (e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
  }

  function onKeydown(e){
    if (e.key==='Escape' && drawer.getAttribute('aria-hidden')==='false'){ e.preventDefault(); closeMenu(); }
    else if (e.key==='Tab'){ trapFocus(e); }
  }

  function openMenu(){
    lastFocused = document.activeElement;
    drawer.setAttribute('aria-hidden','false');
    toggle.setAttribute('aria-expanded','true');
    body.classList.add('body--lock');
    (panel.querySelector(focusableSelector) || panel).focus({preventScroll:true});
    setHamburger(true);
    document.addEventListener('keydown', onKeydown);
  }

  function closeMenu(){
    drawer.setAttribute('aria-hidden','true');
    toggle.setAttribute('aria-expanded','false');
    body.classList.remove('body--lock');
    setHamburger(false);
    document.removeEventListener('keydown', onKeydown);
    if (lastFocused && lastFocused.focus){ lastFocused.focus({preventScroll:true}); lastFocused=null; }
  }

  toggle.addEventListener('click', () => (drawer.getAttribute('aria-hidden')==='false' ? closeMenu() : openMenu()));
  drawer.addEventListener('click', (e) => {
    if (e.target.matches('[data-close]') || e.target.closest('[data-close]') || e.target.closest('.menu-item')) closeMenu();
  });
  window.matchMedia('(min-width: 901px)').addEventListener('change', (mq)=>{ if (mq.matches) closeMenu(); });
})();

/* Board intro fade/scale */
(() => {
  const board = document.querySelector('.board');
  if (!board) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce){ board.classList.add('is-in'); return; }
  requestAnimationFrame(() => board.classList.add('is-in'));
})();

/* ===== Step-by-step slider (10 ảnh, no-gap, full khung 5:4) ===== */
(() => {
  const track = document.getElementById('sliderTrack');
  if (!track) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 10 ảnh + 1 clone
  const slides = track.querySelectorAll('.slide');
  const total = slides.length - 1; // bỏ clone
  let index = 0;
  let timer = null;

  function setTransform(i, instant = false) {
    const t = `translate3d(-${i * 100}%, 0, 0)`; // GPU-safe
    if (instant) {
      const prev = track.style.transition;
      track.style.transition = 'none';
      track.style.transform = t;
      void track.offsetHeight;         // force reflow
      track.style.transition = prev || '';
    } else {
      track.style.transform = t;
    }
  }

  function next() {
    index += 1;
    setTransform(index);

    // tới slide clone => snap về 0 (không transition) để loop mượt
    if (index === total) {
      const onEnd = () => {
        track.removeEventListener('transitionend', onEnd);
        index = 0;
        setTransform(index, true);
      };
      track.addEventListener('transitionend', onEnd, { once: true });
    }
  }

  function start() {
    if (reduce) return;
    stop();
    timer = setInterval(next, 1800); // mỗi ảnh ~1.8s
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  setTransform(index, true);
  start();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
  });

  // (optional) pause khi hover:
  // const viewport = document.querySelector('.slider-viewport');
  // if (viewport) {
  //   viewport.addEventListener('mouseenter', stop);
  //   viewport.addEventListener('mouseleave', start);
  // }
})();

/* ================== CUSTOM CURSOR ================== */
(() => {
  const cursor = document.getElementById('cursor');
  const labelEl = document.getElementById('cursor-label');
  if (!cursor || !labelEl) return;

  let x = innerWidth / 2, y = innerHeight / 2; // vị trí thực
  let cx = x, cy = y;                          // vị trí hiển thị (ease)
  const ease = 0.16;
  let hasMoved = false;
  let activeTarget = null;
  let mx = 0, my = 0;                          // magnet offset
  const maxMagnet = 5;

  // hiện cursor khi bắt đầu di chuyển
  function onMouseMove(e) {
    x = e.clientX; y = e.clientY;
    if (!hasMoved) { hasMoved = true; cursor.style.opacity = '1'; }
  }

  // Hover: chỉ bật khi có [data-cursor]; bỏ qua ảnh/slider
  function onPointerOver(e) {
    const t = e.target.closest('[data-cursor]');
    if (t) {
      activeTarget = t;
      labelEl.textContent = t.getAttribute('data-cursor') || '';
      cursor.classList.add('is-active');
    } else {
      // vào vùng không có label (vd: slider)
      activeTarget = null;
      cursor.classList.remove('is-active');
      mx = my = 0;
      cursor.removeAttribute('data-mx');
      cursor.removeAttribute('data-my');
    }
  }

  function onPointerOut(e) {
    const leavingLabeled = e.target.closest('[data-cursor]');
    if (leavingLabeled) {
      activeTarget = null;
      cursor.classList.remove('is-active');
      mx = my = 0;
      cursor.removeAttribute('data-mx');
      cursor.removeAttribute('data-my');
    }
  }

  // Magnet offset tương đối so với target đang active
  function onMouseMoveMagnet(e) {
    if (!activeTarget) return;
    const r = activeTarget.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const nx = Math.max(-1, Math.min(1, dx / (r.width / 2)));
    const ny = Math.max(-1, Math.min(1, dy / (r.height / 2)));
    mx = nx * maxMagnet;
    my = ny * maxMagnet;
    cursor.dataset.mx = '1';
    cursor.dataset.my = '1';
  }

  // animation loop
  function raf() {
    cx += (x - cx) * ease;
    cy += (y - cy) * ease;

    cursor.style.setProperty('--x', cx.toFixed(2));
    cursor.style.setProperty('--y', cy.toFixed(2));
    if (activeTarget) {
      cursor.style.setProperty('--mx', mx.toFixed(2) + 'px');
      cursor.style.setProperty('--my', my.toFixed(2) + 'px');
      cursor.style.transform = `translate3d(calc(var(--x)*1px + var(--mx,0px)), calc(var(--y)*1px + var(--my,0px)), 0)`;
    } else {
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
    }

    requestAnimationFrame(raf);
  }

  // Không áp cursor trên thiết bị touch
  const isTouch = matchMedia('(hover: none),(pointer: coarse)').matches;
  if (isTouch) {
    document.documentElement.style.cursor = 'auto';
    cursor.style.display = 'none';
    return;
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('mousemove', onMouseMoveMagnet, { passive: true });
  window.addEventListener('pointerover', onPointerOver, { passive: true });
  window.addEventListener('pointerout', onPointerOut, { passive: true });
  window.addEventListener('blur', () => (cursor.style.opacity = '0'));
  window.addEventListener('focus', () => { if (hasMoved) cursor.style.opacity = '1'; });

  requestAnimationFrame(raf);
})();
