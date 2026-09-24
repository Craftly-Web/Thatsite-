/* Konditorei & Café Weber — kleine Helfer für den Entwurf.
   Ohne JavaScript bleibt die Seite vollständig lesbar; hier kommen nur
   Komfortfunktionen dazu. */
(function () {
  "use strict";

  /* ---------- Fehlende Fotos durch Zeichnungen ersetzen ---------- */
  var fotos = document.querySelectorAll(".foto img");

  function pruefen(img) {
    var figur = img.closest(".foto");
    if (img.complete && img.naturalWidth === 0) {
      figur.classList.add("fehlt");
    } else if (img.complete) {
      figur.classList.add("geladen");
      zoombarMachen(figur);
    }
  }

  fotos.forEach(function (img) {
    img.addEventListener("error", function () {
      img.closest(".foto").classList.add("fehlt");
    });
    img.addEventListener("load", function () {
      var figur = img.closest(".foto");
      figur.classList.remove("fehlt");
      figur.classList.add("geladen");
      zoombarMachen(figur);
    });
    pruefen(img);
  });

  /* ---------- Menü auf dem Handy ---------- */
  var schalter = document.getElementById("navSchalter");
  var nav = document.getElementById("nav");

  function menue(offen) {
    nav.classList.toggle("offen", offen);
    schalter.setAttribute("aria-expanded", String(offen));
    schalter.setAttribute("aria-label", offen ? "Menü schließen" : "Menü öffnen");
  }

  schalter.addEventListener("click", function () {
    menue(schalter.getAttribute("aria-expanded") !== "true");
  });
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) menue(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("offen")) {
      menue(false);
      schalter.focus();
    }
  });

  /* ---------- Kopfzeile bekommt beim Scrollen eine Linie ---------- */
  var kopf = document.getElementById("kopf");
  function kopfLinie() {
    kopf.classList.toggle("gescrollt", window.scrollY > 8);
  }
  window.addEventListener("scroll", kopfLinie, { passive: true });
  kopfLinie();

  /* ---------- Galerie filtern ---------- */
  var filterKnoepfe = document.querySelectorAll("[data-filter]");
  var eintraege = document.querySelectorAll("#galerie > li");

  filterKnoepfe.forEach(function (knopf) {
    knopf.addEventListener("click", function () {
      var wahl = knopf.getAttribute("data-filter");
      filterKnoepfe.forEach(function (k) {
        k.setAttribute("aria-pressed", String(k === knopf));
      });
      eintraege.forEach(function (li) {
        var passt = wahl === "alle" || li.getAttribute("data-kategorie") === wahl;
        li.hidden = !passt;
        li.classList.remove("eingeblendet");
        if (passt) {
          void li.offsetWidth; // Animation neu starten
          li.classList.add("eingeblendet");
        }
      });
    });
  });

  /* ---------- Bildansicht (nur für vorhandene Fotos) ---------- */
  var lupe = document.getElementById("lupe");
  var lupeBild = document.getElementById("lupeBild");
  var lupeText = document.getElementById("lupeText");
  var aktuell = null;

  function zoombarMachen(figur) {
    if (!figur.closest("#galerie") || figur.classList.contains("zoombar")) return;
    figur.classList.add("zoombar");
    figur.setAttribute("tabindex", "0");
    figur.setAttribute("role", "button");
    var text = figur.querySelector("figcaption");
    figur.setAttribute("aria-label", (text ? text.textContent : "Foto") + " vergrößern");
  }

  function sichtbareFotos() {
    return Array.prototype.slice.call(
      document.querySelectorAll("#galerie > li:not([hidden]) .foto.geladen")
    );
  }

  function zeigen(figur) {
    var img = figur.querySelector("img");
    var text = figur.querySelector("figcaption");
    aktuell = figur;
    lupeBild.src = img.currentSrc || img.src;
    lupeBild.alt = img.alt;
    lupeText.textContent = text ? text.textContent : "";
    if (!lupe.open) {
      if (typeof lupe.showModal === "function") lupe.showModal();
      else lupe.setAttribute("open", "");
    }
  }

  function blaettern(schritt) {
    var liste = sichtbareFotos();
    if (!liste.length) return;
    var i = liste.indexOf(aktuell);
    zeigen(liste[(i + schritt + liste.length) % liste.length]);
  }

  function schliessen() {
    if (typeof lupe.close === "function") lupe.close();
    else lupe.removeAttribute("open");
  }

  document.getElementById("galerie").addEventListener("click", function (e) {
    var figur = e.target.closest(".foto.zoombar");
    if (figur) zeigen(figur);
  });
  document.getElementById("galerie").addEventListener("keydown", function (e) {
    var figur = e.target.closest(".foto.zoombar");
    if (figur && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      zeigen(figur);
    }
  });

  lupe.addEventListener("click", function (e) {
    var knopf = e.target.closest("[data-lupe]");
    if (knopf) {
      var was = knopf.getAttribute("data-lupe");
      if (was === "zu") schliessen();
      if (was === "weiter") blaettern(1);
      if (was === "zurueck") blaettern(-1);
    } else if (e.target === lupe) {
      schliessen(); // Klick neben das Bild
    }
  });
  lupe.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") blaettern(1);
    if (e.key === "ArrowLeft") blaettern(-1);
  });
  lupe.addEventListener("close", function () {
    if (aktuell) aktuell.focus();
  });

  /* ---------- Heute geöffnet? ---------- */
  // Die Zeiten stehen nur einmal im HTML (Tabelle #zeiten) und werden hier gelesen.
  var zeilen = document.querySelectorAll("#zeiten tr[data-tag]");
  var statusFelder = document.querySelectorAll("[data-status]");

  function jetztInZittau() {
    var teile = new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date());
    var werte = {};
    teile.forEach(function (t) { werte[t.type] = t.value; });
    var tage = { "So": 0, "Mo": 1, "Di": 2, "Mi": 3, "Do": 4, "Fr": 5, "Sa": 6 };
    return {
      tag: tage[werte.weekday.replace(".", "")],
      minuten: parseInt(werte.hour, 10) * 60 + parseInt(werte.minute, 10)
    };
  }

  function inMinuten(uhrzeit) {
    var t = uhrzeit.split(":");
    return parseInt(t[0], 10) * 60 + parseInt(t[1], 10);
  }

  function naechsteOeffnung(heute) {
    var namen = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
    for (var i = 1; i <= 7; i++) {
      var tag = (heute + i) % 7;
      var tr = document.querySelector('#zeiten tr[data-tag="' + tag + '"][data-von]');
      if (tr) {
        return " · wieder " + (i === 1 ? "morgen" : "am " + namen[tag]) +
          " ab " + tr.getAttribute("data-von") + " Uhr";
      }
    }
    return "";
  }

  function status() {
    if (!zeilen.length) return;
    var jetzt = jetztInZittau();
    var heute = null;
    zeilen.forEach(function (tr) {
      var istHeute = parseInt(tr.getAttribute("data-tag"), 10) === jetzt.tag;
      tr.classList.toggle("heute", istHeute);
      if (istHeute) heute = tr;
    });

    var text;
    var offen = false;
    var von = heute && heute.getAttribute("data-von");
    var bis = heute && heute.getAttribute("data-bis");

    if (von && jetzt.minuten < inMinuten(von)) {
      text = "Öffnet heute um " + von + " Uhr";
    } else if (von && jetzt.minuten < inMinuten(bis)) {
      text = "Jetzt geöffnet · bis " + bis + " Uhr";
      offen = true;
    } else {
      text = (von ? "Geschlossen" : "Heute Ruhetag") + naechsteOeffnung(jetzt.tag);
    }

    statusFelder.forEach(function (feld) {
      feld.textContent = text;
      feld.classList.toggle("offen", offen);
      feld.hidden = false;
    });
  }

  status();
  setInterval(status, 60 * 1000);
})();
