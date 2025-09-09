(() => {
  /* ================== Off-canvas menu ================== */
  const body = document.body;
  const toggle = document.getElementById('menu-toggle');
  const drawer = document.getElementById('offcanvas');
  const panel = drawer.querySelector('.offcanvas__panel');
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
    const first = panel.querySelector(focusableSelector); if (first) first.focus();
    const bars = toggle.querySelectorAll('.hamburger__bar');
    if (bars.length===3){ bars[0].style.transform='translateY(6px) rotate(45deg)'; bars[1].style.opacity='0'; bars[2].style.transform='translateY(-6px) rotate(-45deg)'; }
  }
  function closeMenu(){
    drawer.setAttribute('aria-hidden','true');
    toggle.setAttribute('aria-expanded','false');
    body.classList.remove('body--lock');
    const bars = toggle.querySelectorAll('.hamburger__bar');
    if (bars.length===3){ bars[0].style.transform=''; bars[1].style.opacity=''; bars[2].style.transform=''; }
    if (lastFocused && lastFocused.focus) { lastFocused.focus(); lastFocused=null; }
  }
  toggle.addEventListener('click', () => drawer.getAttribute('aria-hidden')==='false' ? closeMenu() : openMenu());
  drawer.addEventListener('click', (e) => { if (e.target.matches('[data-close]') || e.target.closest('.menu-item')) closeMenu(); });
  window.addEventListener('keydown', (e) => { if (e.key==='Escape' && drawer.getAttribute('aria-hidden')==='false') closeMenu(); });
  window.addEventListener('keydown', (e) => {
    if (drawer.getAttribute('aria-hidden')==='true' || e.key!=='Tab') return;
    const nodes = panel.querySelectorAll(focusableSelector); if (!nodes.length) return;
    const first = nodes[0], last = nodes[nodes.length-1];
    if (e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
  });
  const mq = window.matchMedia('(min-width: 901px)'); mq.addEventListener('change', ()=>{ if(mq.matches) closeMenu(); });

  /* ================== Custom cursor (dùng data-cursor) ================== */
  const cursor  = document.getElementById('cursor');
  const labelEl = document.getElementById('cursor-label');

  let x = innerWidth/2, y = innerHeight/2, cx = x, cy = y;
  const cursorEase = 0.16;
  let hasMoved = false, activeTarget = null, mx = 0, my = 0;
  const maxMagnet = 8;

  function onMouseMove(e){ x=e.clientX; y=e.clientY; if(!hasMoved){ hasMoved=true; cursor.style.opacity='1'; } }
  function onPointerOver(e){
    const t = e.target.closest('[data-cursor]');
    if (t){ activeTarget=t; labelEl.textContent=t.getAttribute('data-cursor')||''; cursor.classList.add('is-active'); }
  }
  function onPointerOut(e){
    const leavingLabeled = e.target.closest('[data-cursor]');
    if (leavingLabeled){ activeTarget=null; cursor.classList.remove('is-active'); mx=my=0; cursor.removeAttribute('data-mx'); cursor.removeAttribute('data-my'); labelEl.textContent=''; }
  }
  function onMouseMoveMagnet(e){
    if(!activeTarget) return;
    const r = activeTarget.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width/2), dy = e.clientY - (r.top + r.height/2);
    const nx = Math.max(-1, Math.min(1, dx/(r.width/2))), ny = Math.max(-1, Math.min(1, dy/(r.height/2)));
    mx = nx*maxMagnet; my = ny*maxMagnet; cursor.dataset.mx='1'; cursor.dataset.my='1';
  }
  function rafCursor(){
    cx += (x - cx)*cursorEase; cy += (y - cy)*cursorEase;
    cursor.style.setProperty('--x', cx.toFixed(2)); cursor.style.setProperty('--y', cy.toFixed(2));
    if (activeTarget){
      cursor.style.setProperty('--mx', mx.toFixed(2)+'px'); cursor.style.setProperty('--my', my.toFixed(2)+'px');
      cursor.style.transform = `translate3d(calc(var(--x)*1px + var(--mx,0px)), calc(var(--y)*1px + var(--my,0px)), 0)`;
    } else {
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
    }
    requestAnimationFrame(rafCursor);
  }
  window.addEventListener('mousemove', onMouseMove, {passive:true});
  window.addEventListener('mousemove', onMouseMoveMagnet, {passive:true});
  window.addEventListener('pointerover', onPointerOver, {passive:true});
  window.addEventListener('pointerout', onPointerOut, {passive:true});
  window.addEventListener('blur', ()=>cursor.style.opacity='0');
  window.addEventListener('focus', ()=>{ if(hasMoved) cursor.style.opacity='1'; });
  requestAnimationFrame(rafCursor);
  const isTouch = matchMedia('(hover: none),(pointer: coarse)').matches;
  if (isTouch){ document.documentElement.style.cursor='auto'; cursor.style.display='none'; }

  /* ================== Gallery (Left / Next / Open) ================== */
  const heroEl    = document.getElementById('hero');
  const captionEl = document.getElementById('caption');
  const pageEl    = document.getElementById('page');
  const frameEl   = document.getElementById('frame');

  const placeholder = 'https://via.placeholder.com/1400x900/2e2e2e/555?text=';

  const projects = [
  {
    title: 'Phuc Long Rebranding',
    image: 'project.assets/phuc long.gif',
    link: 'phuclong.html',
    gif: 'project.assets/caption_PL.png'           // <— GIF cho caption
  },
  {
    title: '12 Chinese Zodiac',
    image: 'project.assets/12 zodiac.gif',
    link: '',
    gif: 'project.assets/caption_DMS2.png'
  },
  {
    title: 'Back then no Backache',
    image: 'project.assets/dms3.gif',
    link: '',
    gif: 'project.assets/caption_DMS3.png'
  }
];

  let prjIndex = 0;
function renderProject(i = prjIndex){
  const p = projects[i];
  if (!heroEl) return;
  heroEl.src = p.image || placeholder;
  heroEl.alt = p.title;

  // Chèn GIF như project title + caption 
  if (captionEl) {
    captionEl.innerHTML = p.gif
      ? `<img class="caption-gif" src="${p.gif}" alt="caption">`
      : ''; // nếu không có gif thì để trống
  }

  if (pageEl) pageEl.textContent = `${i+1} out of ${projects.length}`;
  prjIndex = i;
}
  renderProject();

  // Xác định vùng left / next / open xung quanh ảnh
  function getGalleryZone(e) {
    if (!frameEl || !heroEl) return null;
    if (e.target.closest('.header')) return null;
    if (drawer && drawer.getAttribute('aria-hidden') === 'false') return null;

    const fr  = frameEl.getBoundingClientRect();
    const img = heroEl.getBoundingClientRect();

    if (e.clientY < fr.top || e.clientY > fr.bottom) return null;

    const padding = 70;

    if (e.clientX < img.left - padding)  return 'left';
    if (e.clientX > img.right + padding) return 'next';
    if (
      e.clientY >= img.top - padding && e.clientY <= img.bottom + padding &&
      e.clientX >= img.left - padding && e.clientX <= img.right + padding
    ) return 'open';

    return null;
  }

  function updateGalleryCursor(e){
    if (!cursor || !labelEl) return;
    if (activeTarget) return;

    const zone = getGalleryZone(e);
    if (!zone){
      cursor.classList.remove('is-active');
      labelEl.textContent = '';
      return;
    }
    const map = { left: 'Prev', next: 'Next', open: 'Open' };
    labelEl.textContent = map[zone] || '';
    cursor.classList.add('is-active');
  }

  window.addEventListener('mousemove', updateGalleryCursor, { passive: true });
  window.addEventListener('mouseleave', () => {
    if (!cursor || !labelEl) return;
    cursor.classList.remove('is-active');
    labelEl.textContent = '';
  });

  // Click theo zone
  window.addEventListener('click', (e) => {
    const zone = getGalleryZone(e);
    if (!zone) return;
    if (zone === 'left') {
      renderProject((prjIndex - 1 + projects.length) % projects.length);
    } else if (zone === 'next') {
      renderProject((prjIndex + 1) % projects.length);
    } else if (zone === 'open') {
      const p = projects[prjIndex];
      window.addEventListener('click', (e) => {
  const zone = getGalleryZone(e);
  if (!zone) return;

  if (zone === 'left') {
    renderProject((prjIndex - 1 + projects.length) % projects.length);
  } else if (zone === 'next') {
    renderProject((prjIndex + 1) % projects.length);
  } else if (zone === 'open') {
    const p = projects[prjIndex];
    if (p?.link) {
      // mở trong cùng tab:
      window.location.assign(p.link);

      // nếu muốn KHÔNG lưu lịch sử (không quay lại được), dùng:
      // window.location.replace(p.link);

      // hoặc cách đơn giản tương đương:
      // window.location.href = p.link;
    }
  }
});

    }
  });
})();
