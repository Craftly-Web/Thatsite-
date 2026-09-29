/* Elektro Ronneberger — kleine Helfer, ohne Bibliotheken. */
(function () {
  'use strict';

  var GRUENDUNGSJAHR = 1991;
  var jahr = new Date().getFullYear();

  // Jahreszahlen aktuell halten: © und „35+ Jahre“ zählen von selbst weiter.
  document.querySelectorAll('[data-jahr]').forEach(function (el) { el.textContent = jahr; });
  document.querySelectorAll('[data-seit]').forEach(function (el) {
    var jahre = jahr - GRUENDUNGSJAHR;
    if (jahre >= 35) el.textContent = jahre;
  });

  // Spannungsanzeige: Leiste unter dem Kopf zeigt, wie weit gescrollt wurde
  var wurzel = document.documentElement;
  var geplant = false;
  function fortschritt() {
    geplant = false;
    var max = wurzel.scrollHeight - window.innerHeight;
    wurzel.style.setProperty('--fortschritt', max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : 0);
  }
  window.addEventListener('scroll', function () {
    if (!geplant) { geplant = true; requestAnimationFrame(fortschritt); }
  }, { passive: true });
  fortschritt();

  // Menü auf kleinen Bildschirmen
  var body = document.body;
  var menueKnopf = document.querySelector('.menue-knopf');
  var kopf = document.querySelector('.kopf');
  function menue(offen) {
    // Menü direkt unter der Kopfleiste öffnen, auch wenn der Entwurfshinweis darüber sichtbar ist
    if (offen && kopf) {
      document.documentElement.style.setProperty('--menue-oben', kopf.getBoundingClientRect().bottom + 'px');
    }
    body.classList.toggle('menue-offen', offen);
    if (menueKnopf) {
      menueKnopf.setAttribute('aria-expanded', offen ? 'true' : 'false');
      menueKnopf.setAttribute('aria-label', offen ? 'Menü schließen' : 'Menü öffnen');
    }
  }
  if (menueKnopf) {
    menueKnopf.addEventListener('click', function () {
      menue(!body.classList.contains('menue-offen'));
    });
    document.querySelectorAll('.hauptnav a').forEach(function (a) {
      a.addEventListener('click', function () { menue(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && body.classList.contains('menue-offen')) {
        menue(false);
        menueKnopf.focus();
      }
    });
    window.matchMedia('(min-width: 1001px)').addEventListener('change', function (m) {
      if (m.matches) menue(false);
    });
  }

  // Sanftes Einblenden beim Scrollen
  var einblenden = document.querySelectorAll('.einblenden');
  if ('IntersectionObserver' in window && einblenden.length) {
    var beobachter = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('sichtbar');
          beobachter.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    einblenden.forEach(function (el) { beobachter.observe(el); });
  } else {
    einblenden.forEach(function (el) { el.classList.add('sichtbar'); });
  }

  // Leistungen: aktiven Eintrag in der Sprungleiste markieren
  var sprunglinks = document.querySelectorAll('.sprungleiste a');
  if ('IntersectionObserver' in window && sprunglinks.length) {
    var nachId = {};
    sprunglinks.forEach(function (a) { nachId[a.getAttribute('href').slice(1)] = a; });
    var leiste = document.querySelector('.sprungleiste ul');
    var abschnitte = document.querySelectorAll('.leistung[id]');
    var abschnittBeobachter = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        sprunglinks.forEach(function (a) { a.classList.remove('aktiv'); a.removeAttribute('aria-current'); });
        var link = nachId[e.target.id];
        if (!link) return;
        link.classList.add('aktiv');
        link.setAttribute('aria-current', 'true');
        // Aktiven Eintrag in der waagerecht scrollenden Leiste sichtbar halten
        var l = link.offsetLeft - leiste.offsetLeft;
        if (l < leiste.scrollLeft || l + link.offsetWidth > leiste.scrollLeft + leiste.clientWidth) {
          leiste.scrollTo({ left: l - 16, behavior: 'smooth' });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    abschnitte.forEach(function (s) { abschnittBeobachter.observe(s); });
  }

  // Kontaktformular
  var formular = document.querySelector('#anfrage');
  if (!formular) return;

  // Thema aus dem Link übernehmen, z. B. kontakt.html?thema=Ausbildung
  var thema = new URLSearchParams(location.search).get('thema');
  var auswahl = formular.querySelector('#f-thema');
  if (thema && auswahl) {
    Array.prototype.forEach.call(auswahl.options, function (o) {
      if (o.value.toLowerCase() === thema.toLowerCase()) auswahl.value = o.value;
    });
  }

  // Ausgewählte Dateien anzeigen
  var dateiFeld = formular.querySelector('#f-dateien');
  var dateiListe = formular.querySelector('.dateiliste');
  var upload = formular.querySelector('.upload');
  if (dateiFeld && dateiListe) {
    dateiFeld.addEventListener('change', function () {
      dateiListe.innerHTML = '';
      Array.prototype.forEach.call(dateiFeld.files, function (f) {
        var li = document.createElement('li');
        li.textContent = f.name + ' (' + Math.max(1, Math.round(f.size / 1024)) + ' KB)';
        dateiListe.appendChild(li);
      });
    });
    ['dragenter', 'dragover'].forEach(function (t) {
      dateiFeld.addEventListener(t, function () { upload.classList.add('ziehen'); });
    });
    ['dragleave', 'drop'].forEach(function (t) {
      dateiFeld.addEventListener(t, function () { upload.classList.remove('ziehen'); });
    });
  }

  // ENTWURF: Das Formular ist noch nicht an einen Versanddienst angebunden.
  // Bis dahin wird eine vorbereitete E-Mail angeboten. Siehe LIESMICH.md.
  var meldung = formular.querySelector('.formular-meldung');
  formular.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!formular.reportValidity()) return;
    var daten = new FormData(formular);
    var text = [
      'Name: ' + daten.get('name'),
      'E-Mail: ' + daten.get('email'),
      'Telefon: ' + (daten.get('telefon') || '–'),
      'Thema: ' + daten.get('thema'),
      '',
      daten.get('nachricht')
    ].join('\n');
    var mailto = 'mailto:info@elektro-ronneberger.de'
      + '?subject=' + encodeURIComponent('Anfrage: ' + daten.get('thema'))
      + '&body=' + encodeURIComponent(text);
    meldung.innerHTML = '';
    var p = document.createElement('p');
    p.textContent = 'Hinweis zum Entwurf: Das Formular wird erst beim Livegang angebunden. '
      + 'Ihre Angaben wurden nicht versendet.';
    var a = document.createElement('a');
    a.href = mailto;
    a.textContent = 'Anfrage stattdessen per E-Mail senden';
    var p2 = document.createElement('p');
    p2.appendChild(a);
    if (dateiFeld && dateiFeld.files.length) {
      p2.appendChild(document.createTextNode(' – Dateien bitte in der E-Mail anhängen.'));
    }
    meldung.appendChild(p);
    meldung.appendChild(p2);
    meldung.hidden = false;
    meldung.focus();
  });
})();
