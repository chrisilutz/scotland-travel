/* Wetter am aktuellen Ort der Reise
   ------------------------------------------------------------------
   Datenquelle: Open-Meteo (open-meteo.com) — kostenlos, ohne
   Registrierung und ohne API-Schlüssel, CORS ist freigegeben. Damit
   bleibt die Seite statisch und ohne Geheimnisse im Quelltext.

   Der Ort ergibt sich aus dem Datum: für jeden Reisetag ist hinterlegt,
   wo wir sind. Außerhalb des Reisezeitraums steht Aberdeen voreingestellt,
   umschalten geht über die Knöpfe.

   „Mein Standort" nutzt die Geolocation des Browsers. Die Koordinaten
   werden auf zwei Nachkommastellen gerundet (rund 1 km), bevor sie an
   Open-Meteo gehen — die genaue Position verlässt das Gerät nicht.
*/

(function () {
  "use strict";

  var body = document.getElementById("weather-body");
  var mapEl = document.getElementById("weather-map");
  if (!body) return;

  /* ---- Wo sind wir wann? ---- */
  var TRIP = [
    { date: "2026-09-04", name: "London",            coords: [51.5308, -0.1261], note: "Anreise & Nachtzug" },
    { date: "2026-09-05", name: "Aberdeen",          coords: [57.1620, -2.0930], note: "Old Aberdeen & Footdee" },
    { date: "2026-09-06", name: "Inverness",         coords: [57.4700, -4.2385], note: "Anreise aus Aberdeen" },
    { date: "2026-09-07", name: "Foyers, Loch Ness", coords: [57.2496, -4.4914], note: "Wandertag" },
    { date: "2026-09-08", name: "Glasgow",           coords: [55.8590, -4.2460], note: "Anreise aus Inverness" },
    { date: "2026-09-09", name: "Stirling",          coords: [56.1239, -3.9470], note: "Tagesausflug" },
    { date: "2026-09-10", name: "Glasgow",           coords: [55.8590, -4.2460], note: "Kelvingrove & West End" },
    { date: "2026-09-11", name: "Glasgow",           coords: [55.8590, -4.2460], note: "Abreise mit dem Sleeper" },
    { date: "2026-09-12", name: "London",            coords: [51.5390, -0.1426], note: "Camden & Hamilton" },
    { date: "2026-09-13", name: "London",            coords: [51.5076, -0.0994], note: "South Bank" },
    { date: "2026-09-14", name: "London",            coords: [51.5308, -0.1261], note: "Heimreise" }
  ];

  var BASES = [
    { name: "Aberdeen",  coords: [57.1620, -2.0930] },
    { name: "Inverness", coords: [57.4700, -4.2385] },
    { name: "Glasgow",   coords: [55.8590, -4.2460] },
    { name: "London",    coords: [51.5308, -0.1261] }
  ];

  /* ---- WMO-Wettercodes ---- */
  var WMO = {
    0:  ["Klar", "☀️"],
    1:  ["Überwiegend klar", "🌤️"],
    2:  ["Teilweise bewölkt", "⛅"],
    3:  ["Bedeckt", "☁️"],
    45: ["Nebel", "🌫️"],
    48: ["Reifnebel", "🌫️"],
    51: ["Leichter Nieselregen", "🌦️"],
    53: ["Nieselregen", "🌦️"],
    55: ["Dichter Nieselregen", "🌧️"],
    56: ["Gefrierender Niesel", "🌧️"],
    57: ["Gefrierender Niesel", "🌧️"],
    61: ["Leichter Regen", "🌦️"],
    63: ["Regen", "🌧️"],
    65: ["Starker Regen", "🌧️"],
    66: ["Gefrierender Regen", "🌧️"],
    67: ["Gefrierender Regen", "🌧️"],
    71: ["Leichter Schneefall", "🌨️"],
    73: ["Schneefall", "🌨️"],
    75: ["Starker Schneefall", "❄️"],
    77: ["Schneegriesel", "🌨️"],
    80: ["Leichte Regenschauer", "🌦️"],
    81: ["Regenschauer", "🌧️"],
    82: ["Heftige Regenschauer", "⛈️"],
    85: ["Schneeschauer", "🌨️"],
    86: ["Starke Schneeschauer", "❄️"],
    95: ["Gewitter", "⛈️"],
    96: ["Gewitter mit Hagel", "⛈️"],
    99: ["Gewitter mit Hagel", "⛈️"]
  };

  function describe(code) { return WMO[code] || ["Unbekannt", "🌡️"]; }

  /* ---- Hilfsfunktionen ---- */

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + "-" +
           String(d.getMonth() + 1).padStart(2, "0") + "-" +
           String(d.getDate()).padStart(2, "0");
  }

  function currentTripDay() {
    var t = todayISO();
    for (var i = 0; i < TRIP.length; i++) if (TRIP[i].date === t) return TRIP[i];
    return null;
  }

  /* Entfernung in km (Haversine) */
  function distance(a, b) {
    var R = 6371, rad = function (x) { return x * Math.PI / 180; };
    var dLat = rad(b[0] - a[0]), dLon = rad(b[1] - a[1]);
    var q = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(q));
  }

  function nearestStation(coords) {
    var best = null, bestD = Infinity;
    TRIP.concat(BASES).forEach(function (s) {
      var d = distance(coords, s.coords);
      if (d < bestD) { bestD = d; best = s; }
    });
    return { station: best, km: bestD };
  }

  function num(v, digits) {
    return typeof v === "number" ? v.toFixed(digits || 0).replace(".", ",") : "–";
  }

  /* ---- Abruf ---- */

  function fetchWeather(coords) {
    /* Auf ~1 km runden: genauer muss es für Wetter nicht sein, und bei
       „Mein Standort" bleibt die exakte Position auf dem Gerät. */
    var lat = Math.round(coords[0] * 100) / 100;
    var lon = Math.round(coords[1] * 100) / 100;
    var url = "https://api.open-meteo.com/v1/forecast" +
      "?latitude=" + lat + "&longitude=" + lon +
      "&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m" +
      "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
      "&timezone=auto&forecast_days=1";
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  }

  /* ---- Mini-Karte ----------------------------------------------------
     Leaflet mit OpenStreetMap, also ohne API-Schlüssel. Ist Leaflet nicht
     erreichbar, bleibt der Kartenbereich einfach weg — die Textangaben
     stehen weiterhin. */

  var miniMap = null, miniMarker = null, miniCircle = null;

  var pin = function () {
    return L.divIcon({
      className: "",
      html: '<div style="width:16px;height:16px;border-radius:50% 50% 50% 0;' +
            'transform:rotate(-45deg);background:#1a3a2c;border:2px solid #f5f1e8;' +
            'box-shadow:0 2px 6px rgba(0,0,0,.4);"></div>',
      iconSize: [16, 16], iconAnchor: [8, 16]
    });
  };

  function ensureMap() {
    if (!mapEl || typeof L === "undefined") return null;
    if (miniMap) return miniMap;

    mapEl.hidden = false;
    miniMap = L.map(mapEl, {
      zoomControl: true,
      scrollWheelZoom: false,     // damit das Scrollen der Seite nicht hängen bleibt
      attributionControl: true
    });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(miniMap);
    return miniMap;
  }

  function updateMap() {
    var m = ensureMap();
    if (!m || !state.coords) return;

    if (miniMarker) { m.removeLayer(miniMarker); miniMarker = null; }
    if (miniCircle) { m.removeLayer(miniCircle); miniCircle = null; }

    if (state.isGeo) {
      /* Eigener Standort: Punkt mit Genauigkeitskreis */
      if (state.accuracy) {
        miniCircle = L.circle(state.coords, {
          radius: state.accuracy,
          color: "#2563a8", weight: 1, fillColor: "#2563a8", fillOpacity: 0.12
        }).addTo(m);
      }
      miniMarker = L.circleMarker(state.coords, {
        radius: 7, color: "#fff", weight: 3, fillColor: "#2563a8", fillOpacity: 1
      }).addTo(m);
    } else {
      miniMarker = L.marker(state.coords, { icon: pin() }).addTo(m);
    }

    m.setView(state.coords, state.isGeo ? 12 : 11);
    /* Der Container ist beim ersten Zeichnen oft noch ohne Maße. */
    setTimeout(function () { m.invalidateSize(); }, 0);
  }

  /* ---- Darstellung ---- */

  var state = { label: null, note: null, coords: null };

  function render(data) {
    var c = data.current || {};
    var d = data.daily || {};
    var w = describe(c.weather_code);

    /* Alter der Messung bestimmen: current.time ist Ortszeit, mit dem
       UTC-Versatz lässt sich daraus der echte Zeitpunkt errechnen. */
    var stamp = Date.parse(c.time + "Z") - (data.utc_offset_seconds || 0) * 1000;
    var ageMin = isNaN(stamp) ? null : Math.round((Date.now() - stamp) / 60000);
    var stale = ageMin !== null && ageMin > 90;

    body.innerHTML =
      '<div class="weather-head">' +
        '<span class="weather-place">' + state.label + "</span>" +
        (state.note ? '<span class="weather-note">' + state.note + "</span>" : "") +
      "</div>" +
      '<div class="weather-now">' +
        '<span class="weather-icon" aria-hidden="true">' + w[1] + "</span>" +
        '<span class="weather-temp">' + num(c.temperature_2m) + "°</span>" +
        '<span class="weather-desc">' + w[0] + "</span>" +
      "</div>" +
      '<dl class="weather-detail">' +
        "<dt>Gefühlt</dt><dd>" + num(c.apparent_temperature) + "°</dd>" +
        "<dt>Wind</dt><dd>" + num(c.wind_speed_10m) + " km/h</dd>" +
        "<dt>Heute</dt><dd>" + num(d.temperature_2m_min && d.temperature_2m_min[0]) + "° bis " +
          num(d.temperature_2m_max && d.temperature_2m_max[0]) + "°</dd>" +
        "<dt>Regenrisiko</dt><dd>" +
          num(d.precipitation_probability_max && d.precipitation_probability_max[0]) + " %</dd>" +
      "</dl>" +
      '<p class="weather-stamp">' +
        (stale
          ? "Letzter bekannter Stand — vermutlich offline"
          : "Stand: " + (c.time || "").slice(11, 16) + " Uhr Ortszeit") +
      "</p>";

    renderButtons();
    updateMap();
  }

  function renderError(msg) {
    body.innerHTML =
      '<div class="weather-head"><span class="weather-place">' + state.label + "</span></div>" +
      '<p class="weather-fail">' + msg + "</p>";
    renderButtons();
    updateMap();   /* Ort bleibt sichtbar, auch wenn das Wetter fehlt */
  }

  function renderButtons() {
    var row = document.createElement("div");
    row.className = "weather-switch";

    var today = currentTripDay();
    var options = [];
    if (today) options.push({ label: "Heute", target: today, note: today.note });
    BASES.forEach(function (b) { options.push({ label: b.name, target: b }); });

    options.forEach(function (o) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = o.label;
      if (state.label === o.target.name && !state.isGeo) b.className = "active";
      b.addEventListener("click", function () { show(o.target, o.note); });
      row.appendChild(b);
    });

    if ("geolocation" in navigator) {
      var g = document.createElement("button");
      g.type = "button";
      g.className = "geo" + (state.isGeo ? " active" : "");
      g.textContent = "📍 Mein Standort";
      g.addEventListener("click", function () { useGeolocation(g); });
      row.appendChild(g);
    }

    body.appendChild(row);
  }

  function show(place, note) {
    state = { label: place.name, note: note || place.note || null, coords: place.coords, isGeo: false };
    body.innerHTML = '<p class="weather-loading">Wetter wird geladen …</p>';
    fetchWeather(place.coords)
      .then(render)
      .catch(function () {
        renderError("Das Wetter konnte nicht geladen werden. Ohne Netz zeigt die Seite den zuletzt abgerufenen Stand.");
      });
  }

  function useGeolocation(btn) {
    btn.disabled = true;
    btn.textContent = "📍 wird ermittelt …";
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        var coords = [pos.coords.latitude, pos.coords.longitude];
        var near = nearestStation(coords);
        state = {
          accuracy: pos.coords.accuracy,
          label: "Mein Standort",
          note: near.km < 3
            ? "bei " + near.station.name
            : num(near.km) + " km von " + near.station.name,
          coords: coords,
          isGeo: true
        };
        body.innerHTML = '<p class="weather-loading">Wetter wird geladen …</p>';
        fetchWeather(coords).then(render).catch(function () {
          renderError("Standort ermittelt, aber das Wetter ist gerade nicht abrufbar.");
        });
      },
      function (err) {
        btn.disabled = false;
        btn.textContent = "📍 Mein Standort";
        var msg = err.code === 1
          ? "Standortfreigabe abgelehnt."
          : "Standort konnte nicht ermittelt werden.";
        var p = body.querySelector(".weather-geo-error") || document.createElement("p");
        p.className = "weather-geo-error";
        p.textContent = msg;
        body.appendChild(p);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }

  /* ---- Start ---- */
  var start = currentTripDay();
  show(start || BASES[0], start ? start.note : "Voreingestellt — Reisezeitraum liegt außerhalb von heute");
})();
