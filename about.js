(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    /* ================== Off-canvas menu ================== */
    const body   = document.body;
    const toggle = document.getElementById('menu-toggle');
    const drawer = document.getElementById('offcanvas');
    if (!toggle || !drawer) return;

    const panel  = drawer.querySelector('.offcanvas__panel');
    const focusableSelector = [
      'a[href]','button:not([disabled])','input:not([disabled])',
      'select:not([disabled])','textarea:not([disabled])','[tabindex]:not([tabindex="-1"])'
    ].join(',');

    let lastFocused = null;

    function openMenu(){
      lastFocused = document.activeElement;
      drawer.setAttribute('aria-hidden','false');
      toggle.setAttribute('aria-expanded','true');
      body.classList.add('body--lock');
      const first = panel && panel.querySelector(focusableSelector);
      if (first) first.focus();
    }
    function closeMenu(){
      drawer.setAttribute('aria-hidden','true');
      toggle.setAttribute('aria-expanded','false');
      body.classList.remove('body--lock');
      if (lastFocused && typeof lastFocused.focus === 'function'){ lastFocused.focus(); lastFocused=null; }
    }

    toggle.addEventListener('click', () => {
      const isOpen = drawer.getAttribute('aria-hidden') === 'false';
      isOpen ? closeMenu() : openMenu();
    });
    drawer.addEventListener('click', (e) => {
      if (e.target.matches('[data-close]') || e.target.closest('[data-close]') || e.target.closest('.menu-item')) closeMenu();
    });
    window.addEventListener('keydown', (e) => { if (e.key==='Escape' && drawer.getAttribute('aria-hidden')==='false') closeMenu(); });
    window.addEventListener('keydown', (e) => {
      if (drawer.getAttribute('aria-hidden')==='true' || e.key!=='Tab' || !panel) return;
      const nodes = panel.querySelectorAll(focusableSelector); if (!nodes.length) return;
      const first = nodes[0], last = nodes[nodes.length-1];
      if (e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
    });

    const mq = window.matchMedia('(min-width: 901px)');
    mq.addEventListener('change', ()=>{ if(mq.matches) closeMenu(); });

    /* hiệu ứng click nhẹ cho bảng */
    document.querySelectorAll('.sign').forEach((el)=>{
      el.addEventListener('click', ()=>{
        const current = getComputedStyle(el).transform;
        el.animate([{transform: current},{transform:'translateY(2px) scale(.985)'},{transform: current}],
          {duration: 200, easing: 'ease-out'});
      });
      el.addEventListener('keydown', (e)=>{
        if (e.key===' ' || e.key==='Enter'){ e.preventDefault(); el.click(); }
      });
    });
  });
})();
(() => {
  /* === Custom cursor only === */
  const cursor = document.getElementById('cursor');
  const labelEl = document.getElementById('cursor-label');
  if (!cursor) return;

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
    // không hiện label cho ảnh/canvas-card
    const isCard = e.target.closest('.canvas-card');
    const t = e.target.closest('[data-cursor]');
    if (isCard) {
      activeTarget = null;
      cursor.classList.remove('is-active');
      return;
    }
    if (t) {
      activeTarget = t;
      if (labelEl) labelEl.textContent = t.getAttribute('data-cursor') || '';
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
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const nx = Math.max(-1, Math.min(1, dx / (r.width / 2)));
    const ny = Math.max(-1, Math.min(1, dy / (r.height / 2)));
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
      cursor.style.transform =
        `translate3d(calc(var(--x)*1px + var(--mx,0px)), calc(var(--y)*1px + var(--my,0px)), 0)`;
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
  window.addEventListener('focus', () => { if (hasMoved) cursor.style.opacity = '1'; });

  requestAnimationFrame(rafCursor);

  // ẩn trên thiết bị touch
  const isTouch = matchMedia('(hover: none),(pointer: coarse)').matches;
  if (isTouch) {
    document.documentElement.style.cursor = 'auto';
    cursor.style.display = 'none';
  }
})();
