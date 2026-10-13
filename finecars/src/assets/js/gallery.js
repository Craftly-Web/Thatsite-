// Bildergalerie der Fahrzeugdetailseite mit Vorschaubildern, Lightbox,
// Tastaturbedienung (Pfeiltasten, Esc) und Wischgesten.

const root = document.querySelector('[data-gallery]');
const dataEl = document.querySelector('[data-gallery-images]');

if (root && dataEl) {
  const images = JSON.parse(dataEl.textContent);
  const slides = [...root.querySelectorAll('[data-slide]')];
  const thumbs = [...root.querySelectorAll('[data-thumb]')];
  const main = root.querySelector('[data-gallery-open]');
  const indexEl = root.querySelector('[data-gallery-index]');
  const box = document.querySelector('[data-lightbox]');
  const boxImg = box?.querySelector('[data-lightbox-img]');
  const boxCaption = box?.querySelector('[data-lightbox-caption]');
  const total = images.length;
  let idx = 0;

  function show(i) {
    idx = (i + total) % total;
    slides.forEach((s, n) => {
      const active = n === idx;
      s.hidden = !active;
      s.classList.toggle('is-active', active);
      // Bild beim ersten Anzeigen sofort laden
      if (active) s.querySelector('img')?.removeAttribute('loading');
    });
    thumbs.forEach((t, n) => {
      t.classList.toggle('is-active', n === idx);
      if (n === idx) t.setAttribute('aria-current', 'true');
      else t.removeAttribute('aria-current');
    });
    if (indexEl) indexEl.textContent = String(idx + 1);
    main.setAttribute('aria-label', `Bild ${idx + 1} von ${total} vergrößern`);
    if (box?.open) renderBox();
  }

  function renderBox() {
    const img = images[idx];
    boxImg.src = img.src;
    if (img.srcset) boxImg.srcset = img.srcset; else boxImg.removeAttribute('srcset');
    boxImg.width = img.width;
    boxImg.height = img.height;
    boxImg.alt = img.alt;
    boxCaption.textContent = `${img.alt} (${idx + 1}/${total})`;
  }

  root.querySelector('[data-gallery-prev]')?.addEventListener('click', () => show(idx - 1));
  root.querySelector('[data-gallery-next]')?.addEventListener('click', () => show(idx + 1));
  thumbs.forEach((t, n) => t.addEventListener('click', () => show(n)));

  root.addEventListener('keydown', e => {
    if (total < 2) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1); }
  });

  // Wischgesten: horizontale Bewegung > 40 px wechselt das Bild
  function swipe(target, onClick) {
    let x0 = null;
    let y0 = null;
    let swiped = false;
    target.addEventListener('pointerdown', e => { x0 = e.clientX; y0 = e.clientY; swiped = false; });
    target.addEventListener('pointercancel', () => { x0 = null; });
    // Natives Ziehen von Bildern würde die Geste abbrechen
    target.addEventListener('dragstart', e => e.preventDefault());
    target.addEventListener('pointerup', e => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      const dy = e.clientY - y0;
      if (total > 1 && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        swiped = true;
        show(dx < 0 ? idx + 1 : idx - 1);
      }
      x0 = null;
    });
    target.addEventListener('click', e => {
      if (swiped) { e.preventDefault(); swiped = false; return; }
      onClick?.(e);
    });
  }

  if (box && typeof box.showModal === 'function') {
    swipe(main, () => { renderBox(); box.showModal(); });
    swipe(box.querySelector('.lightbox-inner'), e => {
      // Klick neben das Bild schließt die Ansicht
      if (e.target.classList.contains('lightbox-inner')) box.close();
    });
    box.querySelector('[data-lightbox-close]').addEventListener('click', () => box.close());
    box.querySelector('[data-lightbox-prev]')?.addEventListener('click', () => show(idx - 1));
    box.querySelector('[data-lightbox-next]')?.addEventListener('click', () => show(idx + 1));
    box.addEventListener('keydown', e => {
      if (total < 2) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1); }
    });
    box.addEventListener('close', () => main.focus());
  } else {
    // Fallback ohne <dialog>-Unterstützung: Bild in neuem Tab öffnen
    swipe(main, () => window.open(images[idx].src, '_blank', 'noopener'));
  }
}
