/* Fotoseite: Zeitstrahl und Karte
   ------------------------------------------------------------------
   Liest photos.json, das tools/import-photos.py aus einem
   Google-Takeout-Export erzeugt. Fehlt die Datei, erklärt die Seite,
   wie sie entsteht — sie bricht nicht.

   Fotos ohne Koordinaten erscheinen im Zeitstrahl, aber nicht auf der
   Karte; sie bekommen beim Import den geplanten Tagesort als Angabe.
*/

(function () {
  "use strict";

  var root = document.getElementById("photos");
  if (!root) return;

  var elTimeline = document.getElementById("photo-timeline");
  var elMap = document.getElementById("photo-map");
  var elStatus = document.getElementById("photo-status");
  var elCount = document.getElementById("photo-count");
  var tabs = document.querySelectorAll("[data-view]");

  var modal = document.getElementById("photo-modal");
  var modalImg = document.getElementById("photo-modal-img");
  var modalCaption = document.getElementById("photo-modal-caption");

  var PHOTOS = [];
  var DAYS = [];
  var current = -1;
  var leafletMap = null;

  var WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function formatDay(iso) {
    var parts = iso.split("-");
    var d = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2]));
    return WEEKDAYS[d.getUTCDay()] + " " + parts[2] + "." + parts[1] + ".";
  }

  function formatTime(ts) {
    /* ts ist eine ISO-Zeit mit Zonenangabe aus dem Import — die Uhrzeit
       daraus ist bereits Ortszeit, deshalb schlicht abschneiden. */
    var m = /T(\d{2}:\d{2})/.exec(ts);
    return m ? m[1] + " Uhr" : "";
  }

  /* ---- Laden ---- */

  fetch("photos.json", { cache: "no-cache" })
    .then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then(function (data) {
      PHOTOS = (data && data.photos) || [];
      DAYS = (data && data.days) || [];
      if (!PHOTOS.length) return showEmpty();
      elStatus.hidden = true;
      root.hidden = false;
      renderCount();
      renderTimeline();
    })
    .catch(showEmpty);

  function showEmpty() {
    root.hidden = true;
    elStatus.hidden = false;
  }

  function renderCount() {
    var located = PHOTOS.filter(function (p) { return p.lat != null; }).length;
    elCount.textContent =
      PHOTOS.length + " Fotos aus " + DAYS.length + " Reisetagen · " +
      located + " davon mit Ortsangabe";
  }

  /* ---- Zeitstrahl ---- */

  function renderTimeline() {
    var html = DAYS.map(function (day) {
      var shots = PHOTOS.filter(function (p) { return p.date === day.date; });
      return '<section class="photo-day">' +
        '<h2><span class="photo-day-date">' + formatDay(day.date) + "</span> " +
        esc(day.label) + '<span class="photo-day-count">' + shots.length + "</span></h2>" +
        '<div class="photo-grid">' +
          shots.map(function (p) {
            return '<button type="button" class="photo-thumb" data-id="' + esc(p.id) + '">' +
              '<img src="' + esc(p.thumb) + '" alt="' +
                esc((p.place || day.label) + ", " + formatDay(p.date)) +
                '" loading="lazy" decoding="async">' +
              (p.lat == null ? '<span class="photo-noloc" title="ohne Ortsangabe">○</span>' : "") +
            "</button>";
          }).join("") +
        "</div></section>";
    }).join("");
    elTimeline.innerHTML = html;
  }

  /* ---- Karte ---- */

  function buildMap() {
    if (leafletMap || typeof L === "undefined") return;

    var located = PHOTOS.filter(function (p) { return p.lat != null; });
    if (!located.length) {
      elMap.innerHTML = '<p class="photo-hint">Keine der Aufnahmen trägt Koordinaten.</p>';
      return;
    }

    leafletMap = L.map(elMap, { scrollWheelZoom: false });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(leafletMap);

    /* Aufnahmen am selben Ort zusammenfassen — sonst liegen Dutzende
       Marker übereinander. Auf drei Nachkommastellen ≈ 100 m. */
    var groups = {};
    located.forEach(function (p) {
      var key = p.lat.toFixed(3) + "," + p.lon.toFixed(3);
      (groups[key] = groups[key] || []).push(p);
    });

    Object.keys(groups).forEach(function (key) {
      var shots = groups[key];
      var pos = [shots[0].lat, shots[0].lon];
      var icon = L.divIcon({
        className: "",
        html: '<div class="photo-pin">' +
              '<img src="' + esc(shots[0].thumb) + '" alt="">' +
              (shots.length > 1 ? '<span>' + shots.length + "</span>" : "") +
              "</div>",
        iconSize: [46, 46],
        iconAnchor: [23, 23],
        popupAnchor: [0, -20]
      });

      var popup =
        '<div class="popup-title">' + esc(shots[0].place || "Aufnahmeort") + "</div>" +
        '<div class="popup-desc">' + shots.length +
          (shots.length === 1 ? " Aufnahme" : " Aufnahmen") + "</div>" +
        '<div class="photo-popup-grid">' +
          shots.slice(0, 6).map(function (p) {
            return '<button type="button" class="photo-thumb" data-id="' + esc(p.id) + '">' +
                   '<img src="' + esc(p.thumb) + '" alt=""></button>';
          }).join("") +
        "</div>";

      L.marker(pos, { icon: icon }).addTo(leafletMap).bindPopup(popup);
    });

    leafletMap.fitBounds(L.latLngBounds(located.map(function (p) {
      return [p.lat, p.lon];
    })).pad(0.15));

    setTimeout(function () { leafletMap.invalidateSize(); }, 0);
  }

  /* ---- Ansicht umschalten ---- */

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var view = tab.getAttribute("data-view");
      tabs.forEach(function (t) {
        t.classList.toggle("active", t === tab);
        t.setAttribute("aria-selected", t === tab ? "true" : "false");
      });
      elTimeline.hidden = view !== "timeline";
      elMap.hidden = view !== "map";
      if (view === "map") {
        buildMap();
        if (leafletMap) setTimeout(function () { leafletMap.invalidateSize(); }, 0);
      }
    });
  });

  /* ---- Großansicht ---- */

  function indexOfId(id) {
    for (var i = 0; i < PHOTOS.length; i++) if (PHOTOS[i].id === id) return i;
    return -1;
  }

  function openAt(index) {
    if (index < 0 || index >= PHOTOS.length) return;
    current = index;
    var p = PHOTOS[index];
    modalImg.src = p.src;
    modalImg.alt = (p.place || "") + " · " + formatDay(p.date);
    modalCaption.innerHTML =
      '<strong>' + esc(p.place || "Ohne Ortsangabe") + "</strong>" +
      '<span>' + formatDay(p.date) + " · " + formatTime(p.ts) + "</span>" +
      '<span class="photo-modal-pos">' + (index + 1) + " von " + PHOTOS.length + "</span>";
    if (typeof modal.showModal === "function" && !modal.open) modal.showModal();
  }

  function step(delta) {
    var next = current + delta;
    if (next < 0) next = PHOTOS.length - 1;
    if (next >= PHOTOS.length) next = 0;
    openAt(next);
  }

  /* Klicks auf Vorschaubilder — auch auf die in den Karten-Popups,
     die es beim Seitenaufbau noch gar nicht gab. */
  document.addEventListener("click", function (e) {
    var thumb = e.target.closest && e.target.closest(".photo-thumb");
    if (!thumb) return;
    var index = indexOfId(thumb.getAttribute("data-id"));
    if (index !== -1) openAt(index);
  });

  modal.querySelector(".modal-close").addEventListener("click", function () { modal.close(); });
  modal.querySelector(".photo-prev").addEventListener("click", function () { step(-1); });
  modal.querySelector(".photo-next").addEventListener("click", function () { step(1); });

  modal.addEventListener("click", function (e) {
    if (e.target === modal) modal.close();
  });

  document.addEventListener("keydown", function (e) {
    if (!modal.open) return;
    if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
  });
})();
