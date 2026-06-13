// ===================================================================
// Premium 3D Anniversary Flipbook
// Built on StPageFlip for realistic page-turn physics
// ===================================================================

(function () {
  const bookEl = document.getElementById('book');
  const loader = document.getElementById('loader');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const pageIndicator = document.getElementById('pageIndicator');
  const bookShadow = document.getElementById('bookShadow');
  const particlesWrap = document.getElementById('particles');

  // ---- Page images: images/1.png ... images/16.png ----
  const PAGE_IMAGES = Array.from({length: 16}, (_, i) => `images/${i + 1}.png`);

  // Decorative corner flourish (gold filigree corner)
  const FLOURISH_SVG = `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4 C 4 40, 20 60, 60 60" stroke="#e6c97a" stroke-width="1.5" fill="none"/>
    <path d="M4 4 C 40 4, 60 20, 60 60" stroke="#e6c97a" stroke-width="1.5" fill="none"/>
    <circle cx="60" cy="60" r="3" fill="#e6c97a"/>
    <path d="M4 4 C 4 22, 12 32, 30 34" stroke="#e6c97a" stroke-width="1" fill="none" opacity="0.7"/>
    <path d="M4 4 C 22 4, 32 12, 34 30" stroke="#e6c97a" stroke-width="1" fill="none" opacity="0.7"/>
  </svg>`;

  // ---------- Build page elements ----------
  // The source PDF already includes a fully-designed front cover (image 0)
  // and a designed closing page (last image). These become the book's hard
  // covers, framed with a leather-look border and gold corner flourishes.
  // All images in between become the book's inner leaves.

  const totalImages = PAGE_IMAGES.length; // 16
  const pages = [];

  // --- FRONT COVER (hard page) ---
  const frontCover = document.createElement('div');
  frontCover.className = 'page cover';
  frontCover.setAttribute('data-density', 'hard');
  frontCover.innerHTML = `
    <div class="cover-leather"></div>
    <div class="page-content"><img src="${PAGE_IMAGES[0]}" alt="Cover" loading="eager" decoding="sync"></div>
    <div class="corner-flourish corner-tl">${FLOURISH_SVG}</div>
    <div class="corner-flourish corner-tr">${FLOURISH_SVG}</div>
    <div class="corner-flourish corner-bl">${FLOURISH_SVG}</div>
    <div class="corner-flourish corner-br">${FLOURISH_SVG}</div>
  `;
  pages.push(frontCover);

  // --- INNER PAGES (images 2 through 15 => indices 1..14) ---
  for (let i = 1; i < totalImages - 1; i++) {
    const p = document.createElement('div');
    p.className = 'page';
    p.innerHTML = `
      <div class="page-content"><img src="${PAGE_IMAGES[i]}" alt="Page ${i + 1}" loading="lazy" decoding="async"></div>
    `;
    pages.push(p);
  }

  // --- BACK COVER (hard page, styled, using last image as accent) ---
  const backCover = document.createElement('div');
  backCover.className = 'page back-cover';
  backCover.setAttribute('data-density', 'hard');
  backCover.innerHTML = `
    <div class="cover-leather"></div>
    <div class="page-content"><img src="${PAGE_IMAGES[totalImages - 1]}" alt="Closing page" loading="lazy" decoding="async"></div>
    <div class="corner-flourish corner-tl">${FLOURISH_SVG}</div>
    <div class="corner-flourish corner-tr">${FLOURISH_SVG}</div>
    <div class="corner-flourish corner-bl">${FLOURISH_SVG}</div>
    <div class="corner-flourish corner-br">${FLOURISH_SVG}</div>
  `;
  pages.push(backCover);

  pages.forEach(p => bookEl.appendChild(p));

  // ---------- Responsive sizing ----------
  function getDimensions() {
    const stage = document.querySelector('.book-stage');
    const rect = stage.getBoundingClientRect();
    // A4-ish portrait ratio (1:1.414) for single page
    const maxW = rect.width;
    const maxH = rect.height;

    let singleW = maxW / 2;
    let singleH = singleW * 1.414;
    if (singleH > maxH) {
      singleH = maxH;
      singleW = singleH / 1.414;
    }
    return {
      width: Math.floor(singleW),
      height: Math.floor(singleH)
    };
  }

  const dims = getDimensions();

  // ---------- Initialize PageFlip ----------
  const pageFlip = new St.PageFlip(bookEl, {
    width: dims.width,
    height: dims.height,
    size: 'stretch',
    minWidth: 220,
    maxWidth: 760,
    minHeight: 311,
    maxHeight: 1075,
    maxShadowOpacity: 0.5,
    showCover: true,
    mobileScrollSupport: false,
    useMouseEvents: true,
    flippingTime: 700,
    drawShadow: true,
    autoSize: true,
    clickEventForward: true,
  });

  pageFlip.loadFromHTML(document.querySelectorAll('#book .page'));

  // ---------- Page indicator + button state ----------
  const pageCount = pageFlip.getPageCount();

  function updateUI() {
    const current = pageFlip.getCurrentPageIndex();
    let label;
    if (current === 0) {
      label = 'Cover';
    } else if (current >= pageCount - 1) {
      label = 'Back Cover';
    } else {
      label = `Page ${current} of ${pageCount - 2}`;
    }
    pageIndicator.textContent = label;

    prevBtn.classList.toggle('disabled', current === 0);
    nextBtn.classList.toggle('disabled', current >= pageCount - 1);

    // Shrink the table-shadow a touch when the book is "open" wide
    if (current === 0 || current >= pageCount - 1) {
      bookShadow.style.width = '70%';
      bookShadow.style.opacity = '0.9';
    } else {
      bookShadow.style.width = '90%';
      bookShadow.style.opacity = '1';
    }
  }

  pageFlip.on('flip', updateUI);
  pageFlip.on('changeState', () => {});
  updateUI();

  // ---------- Controls ----------
  prevBtn.addEventListener('click', () => pageFlip.flipPrev());
  nextBtn.addEventListener('click', () => pageFlip.flipNext());

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') pageFlip.flipNext();
    if (e.key === 'ArrowLeft') pageFlip.flipPrev();
  });

  // ---------- Hide loader once everything is laid out ----------
  function allImagesReady() {
    const cover = bookEl.querySelector('.cover img');
    if (!cover) return Promise.resolve();
    if (cover.complete) return Promise.resolve();
    return new Promise(res => {
      cover.addEventListener('load', res, { once: true });
      cover.addEventListener('error', res, { once: true });
    });
  }

  allImagesReady().then(() => {
    loader.classList.add('hidden');
  });

  // ---------- Resize handling ----------
  window.addEventListener('resize', () => {
    const d = getDimensions();
    pageFlip.update();
  });

  // ---------- Ambient floating particles ----------
  function spawnParticle() {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = 2 + Math.random() * 4;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.bottom = '-10px';
    const duration = 10 + Math.random() * 14;
    p.style.animationDuration = duration + 's';
    p.style.animationDelay = (Math.random() * 4) + 's';
    particlesWrap.appendChild(p);
    setTimeout(() => p.remove(), (duration + 4) * 1000);
  }

  for (let i = 0; i < 6; i++) spawnParticle();
  setInterval(spawnParticle, 4000);

})();