(function () {
  var header = document.querySelector('.site-header');
  var quickbar = document.querySelector('.quickbar');
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('nav');

  // Header-Schatten und mobile Schnellkontakt-Leiste beim Scrollen
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (quickbar) quickbar.classList.toggle('is-visible', y > 480);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile Navigation
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  // Sanftes Einblenden der Abschnitte
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }

  // Anfrageformular: fertige E-Mail im Mailprogramm vorbereiten
  var form = document.getElementById('anfrage');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var v = function (id) { return (document.getElementById(id).value || '').trim(); };
      var thema = v('f-thema');
      var body = [
        'Guten Tag Herr Lehmann-Hauck,', '',
        v('f-msg'), '',
        'Anliegen: ' + thema,
        v('f-ort') ? 'Ort des Objekts: ' + v('f-ort') : '',
        v('f-tel') ? 'Telefon für Rückfragen: ' + v('f-tel') : '', '',
        'Viele Grüße', v('f-name')
      ].filter(function (line, i, arr) { return line !== '' || arr[i - 1] !== ''; }).join('\n');
      window.location.href = 'mailto:sven.lehmann@dachdeckermeister-dresden.de'
        + '?subject=' + encodeURIComponent('Anfrage über die Website: ' + thema)
        + '&body=' + encodeURIComponent(body);
    });
  }

  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
