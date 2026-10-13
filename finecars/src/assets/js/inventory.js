// Fahrzeugübersicht: Suche, Filter, Sortierung und mobiles Filterpanel.
// Die Karten werden serverseitig gerendert; dieses Skript blendet sie nur
// ein/aus und sortiert sie um. Der Filterzustand steht in der URL.
import { parseFilters, serializeFilters, applyFilters, facetOptions, countActiveFilters, SORTS } from './inventory-core.js';

const form = document.querySelector('[data-filter-form]');
const dataEl = document.getElementById('inventory-data');

if (form && dataEl) {
  const records = JSON.parse(dataEl.textContent);
  const list = form.querySelector('[data-list]');
  const items = new Map([...list.children].map(li => [li.dataset.id, li]));
  const countEl = form.querySelector('[data-count]');
  const emptyEl = form.querySelector('[data-empty]');
  const chipsEl = form.querySelector('[data-active-filters]');
  const badgeEl = form.querySelector('[data-filter-count]');
  const applyLabel = form.querySelector('[data-apply-label]');
  const panel = form.querySelector('[data-filters]');
  const backdrop = form.querySelector('.filters-backdrop');
  const openBtn = form.querySelector('[data-filters-open]');
  const el = name => form.elements.namedItem(name);
  const nf = new Intl.NumberFormat('de-DE');
  const plural = n => `${n} ${n === 1 ? 'Fahrzeug' : 'Fahrzeuge'}`;

  const readForm = () => parseFilters(new URLSearchParams(new FormData(form)));

  function setValue(name, value) {
    const field = el(name);
    if (!field) return;
    const v = value === null || value === undefined ? '' : String(value);
    if (field.tagName === 'SELECT' && v && ![...field.options].some(o => o.value === v)) {
      field.value = '';
      return;
    }
    field.value = v;
  }

  function syncModelOptions(make) {
    const select = el('model');
    const current = select.value;
    const { models } = facetOptions(records, { make });
    select.replaceChildren(new Option('Alle Modelle', ''), ...models.map(m => new Option(m, m)));
    select.value = models.includes(current) ? current : '';
  }

  const CHIP_LABELS = {
    q: v => `Suche: „${v}“`,
    make: v => v,
    model: v => v,
    priceMin: v => `ab ${nf.format(v)} €`,
    priceMax: v => `bis ${nf.format(v)} €`,
    yearMin: v => `EZ ab ${v}`,
    kmMax: v => `bis ${nf.format(v)} km`,
    fuel: v => v,
    gear: v => v,
    psMin: v => `ab ${v} PS`
  };

  function renderChips(f) {
    const chips = Object.keys(CHIP_LABELS)
      .filter(k => f[k] !== null && f[k] !== '')
      .map(k => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chip-remove';
        btn.dataset.clear = k;
        btn.setAttribute('aria-label', `Filter entfernen: ${CHIP_LABELS[k](f[k])}`);
        btn.innerHTML = '<span></span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
        btn.firstChild.textContent = CHIP_LABELS[k](f[k]);
        li.append(btn);
        return li;
      });
    chipsEl.replaceChildren(...chips);
  }

  function update({ pushUrl = true } = {}) {
    syncModelOptions(el('make').value);
    const f = readForm();
    const result = applyFilters(records, f);
    const visible = new Set(result.map(r => r.id));

    for (const r of result) list.append(items.get(r.id));
    for (const [id, li] of items) li.hidden = !visible.has(id);

    const n = result.length;
    countEl.innerHTML = `<strong>${n}</strong> ${n === 1 ? 'Fahrzeug' : 'Fahrzeuge'}${n !== records.length ? ` von ${records.length}` : ''}`;
    emptyEl.hidden = n > 0;
    list.hidden = n === 0;
    applyLabel.textContent = n === 0 ? 'Keine Treffer' : `${plural(n)} anzeigen`;

    const active = countActiveFilters(f);
    badgeEl.hidden = active === 0;
    badgeEl.textContent = String(active);
    renderChips(f);

    if (pushUrl) {
      const qs = serializeFilters(f).toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
    }
  }

  // Anfangszustand aus der URL übernehmen
  const initial = parseFilters(new URLSearchParams(location.search));
  setValue('make', initial.make);
  syncModelOptions(initial.make);
  for (const k of ['q', 'model', 'priceMin', 'priceMax', 'yearMin', 'kmMax', 'fuel', 'gear', 'psMin']) setValue(k, initial[k]);
  setValue('sort', SORTS[initial.sort] ? initial.sort : 'relevance');
  update({ pushUrl: location.search !== '' });

  let timer;
  form.addEventListener('input', e => {
    if (e.target.name === 'q') {
      clearTimeout(timer);
      timer = setTimeout(update, 160);
    }
  });
  form.addEventListener('change', e => {
    if (e.target.name && e.target.name !== 'q') update();
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    update();
    if (panel.classList.contains('is-open')) closePanel();
  });
  form.addEventListener('reset', () => {
    // Nach dem nativen Zurücksetzen der Felder neu filtern
    setTimeout(() => update(), 0);
  });
  form.querySelector('[data-reset-all]')?.addEventListener('click', () => {
    form.reset();
    el('q').focus();
  });
  chipsEl.addEventListener('click', e => {
    const btn = e.target.closest('[data-clear]');
    if (!btn) return;
    setValue(btn.dataset.clear, '');
    update();
    (chipsEl.querySelector('[data-clear]') || el('q')).focus();
  });

  // ----- Mobiles Filterpanel -----
  const mq = window.matchMedia('(max-width: 1000px)');

  function openPanel() {
    panel.classList.add('is-open');
    backdrop.hidden = false;
    openBtn.setAttribute('aria-expanded', 'true');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    document.body.classList.add('no-scroll');
    for (const node of document.querySelectorAll('.site-header, .site-footer, .page-intro, .results, .cta-band')) node.inert = true;
    panel.querySelector('select, input, button')?.focus();
  }

  function closePanel() {
    panel.classList.remove('is-open');
    backdrop.hidden = true;
    openBtn.setAttribute('aria-expanded', 'false');
    panel.removeAttribute('role');
    panel.removeAttribute('aria-modal');
    document.body.classList.remove('no-scroll');
    for (const node of document.querySelectorAll('[inert]')) node.inert = false;
    if (mq.matches) openBtn.focus();
  }

  openBtn.addEventListener('click', openPanel);
  for (const btn of form.querySelectorAll('[data-filters-close]')) btn.addEventListener('click', closePanel);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && panel.classList.contains('is-open')) closePanel();
  });
  mq.addEventListener('change', e => {
    if (!e.matches && panel.classList.contains('is-open')) closePanel();
  });
  backdrop.hidden = true;
}
