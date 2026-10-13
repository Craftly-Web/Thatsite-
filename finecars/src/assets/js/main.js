// Seitenweite Interaktionen: Kopfzeile beim Scrollen, mobiles Menü.

const header = document.querySelector('[data-header]');
const toggle = document.querySelector('[data-menu-toggle]');
const panel = document.querySelector('[data-mobile-nav]');
const label = document.querySelector('[data-menu-label]');

function onScroll() {
  header?.classList.toggle('is-scrolled', window.scrollY > 24);
}
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

function setMenu(open) {
  if (!toggle || !panel) return;
  toggle.setAttribute('aria-expanded', String(open));
  if (label) label.textContent = open ? 'Menü schließen' : 'Menü öffnen';
  panel.hidden = !open;
  header.classList.toggle('is-open', open);
  document.body.classList.toggle('no-scroll', open);
  // Inhalte hinter dem Menü für Tastatur und Screenreader sperren
  for (const el of document.querySelectorAll('main, .site-footer, [data-mobile-bar]')) el.inert = open;
  if (open) panel.querySelector('a')?.focus();
}

toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    toggle.focus();
  }
});

// Menü schließen, wenn auf Desktop-Breite gewechselt wird
window.matchMedia('(min-width: 901px)').addEventListener('change', e => {
  if (e.matches) setMenu(false);
});

// Mobile Kontaktleiste ausblenden, solange der Fußbereich sichtbar ist
const bar = document.querySelector('[data-mobile-bar]');
const footer = document.querySelector('.site-footer');
if (bar && footer && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => {
    bar.classList.toggle('is-hidden', entry.isIntersecting);
  }, { rootMargin: '0px 0px -40% 0px' }).observe(footer);
}
