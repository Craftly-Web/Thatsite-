/* Gaststätte Spreetal — zeigt an, ob gerade geöffnet ist, und markiert den heutigen Tag.
   Die Zeiten hier müssen zur Tabelle in index.html und zu den Angaben für Google passen. */

(function () {
  'use strict';

  // Schlüssel: 0 = Sonntag … 6 = Samstag. Jeder Eintrag: [von, bis] in Minuten ab Mitternacht.
  var OEFFNUNGSZEITEN = {
    0: [[11 * 60, 14 * 60], [17 * 60, 20 * 60]],
    1: [],
    2: [],
    3: [[17 * 60, 20 * 60]],
    4: [[17 * 60, 20 * 60]],
    5: [[11 * 60, 14 * 60], [17 * 60, 20 * 60]],
    6: [[11 * 60, 14 * 60], [17 * 60, 20 * 60]]
  };

  var TAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  var KURZ = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  // Uhrzeit immer in deutscher Zeit, auch wenn jemand aus dem Urlaub nachschaut.
  function jetztInSachsen() {
    var teile = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Berlin',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(new Date());
    var werte = {};
    teile.forEach(function (teil) { werte[teil.type] = teil.value; });
    return {
      tag: KURZ[werte.weekday],
      minuten: parseInt(werte.hour, 10) * 60 + parseInt(werte.minute, 10)
    };
  }

  function uhrzeit(minuten) {
    var stunde = Math.floor(minuten / 60);
    var minute = minuten % 60;
    return minute ? stunde + ':' + String(minute).padStart(2, '0') + ' Uhr' : stunde + ' Uhr';
  }

  function naechsteOeffnung(tag) {
    for (var abstand = 1; abstand <= 7; abstand++) {
      var naechsterTag = (tag + abstand) % 7;
      var zeiten = OEFFNUNGSZEITEN[naechsterTag];
      if (zeiten.length) {
        var wann = abstand === 1 ? 'morgen' : 'am ' + TAGE[naechsterTag];
        return wann + ' ab ' + uhrzeit(zeiten[0][0]);
      }
    }
    return '';
  }

  function status() {
    var jetzt = jetztInSachsen();
    var heute = OEFFNUNGSZEITEN[jetzt.tag];

    if (!heute.length) {
      return { offen: false, text: 'Heute Ruhetag · wieder geöffnet ' + naechsteOeffnung(jetzt.tag) };
    }

    for (var i = 0; i < heute.length; i++) {
      var von = heute[i][0];
      var bis = heute[i][1];
      if (jetzt.minuten >= von && jetzt.minuten < bis) {
        return { offen: true, text: 'Jetzt geöffnet · bis ' + uhrzeit(bis) };
      }
      if (jetzt.minuten < von) {
        var text = i === 0
          ? 'Heute ab ' + uhrzeit(von) + ' geöffnet'
          : 'Mittagspause · ab ' + uhrzeit(von) + ' wieder geöffnet';
        return { offen: false, text: text };
      }
    }

    return { offen: false, text: 'Für heute geschlossen · wieder geöffnet ' + naechsteOeffnung(jetzt.tag) };
  }

  function zeigeStatus() {
    var ergebnis;
    try {
      ergebnis = status();
    } catch (fehler) {
      return; // Ohne Zeitzonen-Unterstützung bleibt die Anzeige einfach verborgen.
    }

    document.querySelectorAll('[data-status]').forEach(function (element) {
      element.querySelector('[data-status-text]').textContent = ergebnis.text;
      element.classList.toggle('ist-offen', ergebnis.offen);
      element.classList.toggle('ist-zu', !ergebnis.offen);
      element.hidden = false;
    });

    var zeile = document.querySelector('.zeiten tr[data-tag="' + jetztInSachsen().tag + '"]');
    if (zeile) {
      zeile.classList.add('heute');
      zeile.setAttribute('aria-current', 'date');
    }
  }

  function setzeJahr() {
    var jahr = String(new Date().getFullYear());
    document.querySelectorAll('[data-jahr]').forEach(function (element) {
      element.textContent = jahr;
    });
  }

  zeigeStatus();
  setzeJahr();
  // Einmal pro Minute auffrischen, falls die Seite länger offen bleibt.
  setInterval(zeigeStatus, 60 * 1000);
})();
