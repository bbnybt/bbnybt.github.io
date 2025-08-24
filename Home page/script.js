(() => {
  /* Off-canvas menu */
  const body = document.body;
  const toggle = document.getElementById('menu-toggle');
  const drawer = document.getElementById('offcanvas');
  const panel = drawer.querySelector('.offcanvas__panel');
  const focusableSelector = ['a[href]', 'button:not([disabled])', 'input:not([disabled])', 'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])'].join(',');
  let lastFocused = null;

  function openMenu() {
    lastFocused = document.activeElement;
    drawer.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    body.classList.add('body--lock');
    const first = panel.querySelector(focusableSelector);
    if (first) first.focus();
    const bars = toggle.querySelectorAll('.hamburger__bar');
    if (bars.length === 3) {
      bars[0].style.transform = 'translateY(6px) rotate(45deg)';
      bars[1].style.opacity = '0';
      bars[2].style.transform = 'translateY(-6px) rotate(-45deg)';
    }
  }

  function closeMenu() {
    drawer.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    body.classList.remove('body--lock');
    const bars = toggle.querySelectorAll('.hamburger__bar');
    if (bars.length === 3) {
      bars[0].style.transform = '';
      bars[1].style.opacity = '';
      bars[2].style.transform = '';
    }
    if (lastFocused && lastFocused.focus) {
      lastFocused.focus();
      lastFocused = null;
    }
  }

  toggle.addEventListener('click', () => (drawer.getAttribute('aria-hidden') === 'false' ? closeMenu() : openMenu()));
  drawer.addEventListener('click', (e) => {
    if (e.target.matches('[data-close]') || e.target.closest('.menu-item')) closeMenu();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.getAttribute('aria-hidden') === 'false') closeMenu();
  });
  window.addEventListener('keydown', (e) => {
    if (drawer.getAttribute('aria-hidden') === 'true' || e.key !== 'Tab') return;
    const nodes = panel.querySelectorAll(focusableSelector);
    if (!nodes.length) return;
    const first = nodes[0],
      last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
  const mq = window.matchMedia('(min-width: 901px)');
  mq.addEventListener('change', () => {
    if (mq.matches) closeMenu();
  });

  /* Custom cursor (no label on images) */
  const cursor = document.getElementById('cursor');
  const labelEl = document.getElementById('cursor-label');

  let x = innerWidth / 2,
    y = innerHeight / 2,
    cx = x,
    cy = y;
  const cursorEase = 0.16;
  let hasMoved = false,
    activeTarget = null,
    mx = 0,
    my = 0;
  const maxMagnet = 5;

  function onMouseMove(e) {
    x = e.clientX;
    y = e.clientY;
    if (!hasMoved) {
      hasMoved = true;
      cursor.style.opacity = '1';
    }
  }

  function onPointerOver(e) {
    // Không hiện label cho ảnh
    const isCard = e.target.closest('.canvas-card');
    const t = e.target.closest('[data-cursor]');
    if (isCard) {
      activeTarget = null;
      cursor.classList.remove('is-active');
      return;
    }
    if (t) {
      activeTarget = t;
      labelEl.textContent = t.getAttribute('data-cursor') || '';
      cursor.classList.add('is-active');
    }
  }

  function onPointerOut(e) {
    const leavingCard = e.target.closest('.canvas-card');
    const leavingLabeled = e.target.closest('[data-cursor]');
    if (leavingCard || leavingLabeled) {
      activeTarget = null;
      cursor.classList.remove('is-active');
      mx = my = 0;
      cursor.removeAttribute('data-mx');
      cursor.removeAttribute('data-my');
    }
  }

  function onMouseMoveMagnet(e) {
    if (!activeTarget) return;
    const r = activeTarget.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2),
      dy = e.clientY - (r.top + r.height / 2);
    const nx = Math.max(-1, Math.min(1, dx / (r.width / 2))),
      ny = Math.max(-1, Math.min(1, dy / (r.height / 2)));
    mx = nx * maxMagnet;
    my = ny * maxMagnet;
    cursor.dataset.mx = '1';
    cursor.dataset.my = '1';
  }

  function rafCursor() {
    cx += (x - cx) * cursorEase;
    cy += (y - cy) * cursorEase;
    cursor.style.setProperty('--x', cx.toFixed(2));
    cursor.style.setProperty('--y', cy.toFixed(2));
    if (activeTarget) {
      cursor.style.setProperty('--mx', mx.toFixed(2) + 'px');
      cursor.style.setProperty('--my', my.toFixed(2) + 'px');
      cursor.style.transform = `translate3d(calc(var(--x)*1px + var(--mx,0px)), calc(var(--y)*1px + var(--my,0px)), 0)`;
    } else {
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
    }
    requestAnimationFrame(rafCursor);
  }
  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('mousemove', onMouseMoveMagnet, { passive: true });
  window.addEventListener('pointerover', onPointerOver, { passive: true });
  window.addEventListener('pointerout', onPointerOut, { passive: true });
  window.addEventListener('blur', () => (cursor.style.opacity = '0'));
  window.addEventListener('focus', () => {
    if (hasMoved) cursor.style.opacity = '1';
  });
  requestAnimationFrame(rafCursor);
  const isTouch = matchMedia('(hover: none),(pointer: coarse)').matches;
  if (isTouch) {
    document.documentElement.style.cursor = 'auto';
    cursor.style.display = 'none';
  }

  /* Hero: mouse float (NO SCROLL) — đi THEO con trỏ */
  const canvas = document.getElementById('hero-canvas');
  if (canvas) {
    let fx = 0,
      fy = 0,
      tx = 0,
      ty = 0;
    const floatEase = 0.03; /* tốc độ của con trỏ theo hướng di chuyển */
    const floatMax = 550; /*biên độ di chuyển của không gian (con trỏ) */

    function onMouse(e) {
      const nx = (e.clientX / innerWidth) * 2 - 1;
      const ny = (e.clientY / innerHeight) * 2 - 1;
      // đi theo hướng con trỏ
      tx = -nx * floatMax;
      ty = -ny * floatMax;
    }
    window.addEventListener('mousemove', onMouse, { passive: true });

    function raf() {
      fx += (tx - fx) * floatEase;
      fy += (ty - fy) * floatEase;
      canvas.style.transform = `translate3d(${fx}px, ${fy}px, 0)`;
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Fade-in + scale-in khi tải trang (stagger nhẹ)
    const cards = Array.from(document.querySelectorAll('.canvas-card'));
    cards.forEach((c, i) => setTimeout(() => c.classList.add('in-view'), i * 60));
  }
  // Disable click/select on hero cards but keep hover scale
  const cards = Array.from(document.querySelectorAll('.canvas-card'));

  cards.forEach((card, i) => {
    // (giữ nguyên fade-in nếu bạn đang dùng)
    // setTimeout(()=> card.classList.add('in-view'), i*60);

    // chặn click (không mở link, không “chọn”)
    card.addEventListener(
      'click',
      (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
      { passive: false }
    );

    // không cho focus bằng bàn phím (tránh viền focus)
    card.setAttribute('tabindex', '-1');
    card.setAttribute('aria-disabled', 'true');

    // không cho kéo ảnh
    const img = card.querySelector('img');
    if (img) {
      img.setAttribute('draggable', 'false');
      img.addEventListener('dragstart', (e) => e.preventDefault());
    }
  });
})();
