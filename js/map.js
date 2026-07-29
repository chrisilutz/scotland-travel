/* Interaktive Reisekarte (Leaflet.js / OpenStreetMap) */

(function () {
  "use strict";

  var mapEl = document.getElementById("map");
  if (!mapEl) return;

  /* Fallback, falls das Leaflet-CDN nicht erreichbar ist */
  if (typeof L === "undefined") {
    mapEl.innerHTML =
      '<div class="map-fallback">' +
      "<p><strong>Die Karte konnte nicht geladen werden.</strong></p>" +
      '<p>Leaflet ist gerade nicht erreichbar — die Stationen stehen auch in der ' +
      '<a href="agenda.html">Agenda</a>.</p></div>';
    return;
  }

  /* ---- Stationen ---- */
  var stations = {
    wuerzburg: {
      coords: [49.8016, 9.9358],
      name: "Würzburg Hbf",
      desc: "Start & Ziel der Reise. Abfahrt Fr 04.09. um 06:55 mit ICE 822."
    },
    bruessel: {
      coords: [50.8354, 4.3365],
      name: "Brüssel-Midi",
      desc: "Umstieg vom ICE auf den Eurostar nach London (1. Klasse)."
    },
    stpancras: {
      coords: [51.5308, -0.1261],
      name: "London St Pancras International",
      desc: "Ankunft & Abfahrt Eurostar. Direkt gegenüber: King's Cross."
    },
    euston: {
      coords: [51.5282, -0.1337],
      name: "London Euston",
      desc: "Abfahrtsbahnhof des Caledonian Sleeper nach Aberdeen — Boarding ab 20:00."
    },
    victoriapalace: {
      coords: [51.4966, -0.1428],
      name: "Victoria Palace Theatre",
      desc: "Hamilton Musical, Sa 12.09. um 19:30 · Ref. TFJ55FB.",
      link: "https://www.delfontmackintosh.co.uk"
    },
    aberdeen: {
      coords: [57.1620, -2.0930],
      name: "Aberdeen — Alba Guest House",
      desc: "444 King Street. Ankunft Sleeper 07:40. Old Aberdeen, Footdee & Hafen.",
      link: "https://www.albaguesthouse.co.uk"
    },
    dunnottar: {
      coords: [56.9459, -2.1971],
      name: "Stonehaven / Dunnottar Castle",
      desc: "Spektakuläre Klippenruine südlich von Stonehaven — per Bus X7 ab Aberdeen.",
      link: "https://www.dunnottarcastle.co.uk"
    },
    inverness: {
      coords: [57.4700, -4.2385],
      name: "Inverness — Ballifeary Guest House",
      desc: "10 Ballifeary Road, IV3 5PJ · Ref. WTB192B333. Basis für Loch Ness & Highlands.",
      link: "https://ballifeary.co.uk"
    },
    foyers: {
      coords: [57.2496, -4.4914],
      name: "Foyers / Loch Ness",
      desc: "South Loch Ness Trail: 15,8 km, 390 Hm — Moor, Nadelwald & Foyers Bay.",
      link: "https://www.komoot.com/tour/3091298275?share_token=afX9f9H9KsuinnRdtXRdiW5yBOV7ynvk35whkNdhzB718P6arz"
    },
    kyle: {
      coords: [57.2796, -5.7132],
      name: "Kyle of Lochalsh",
      desc: "Tagesausflug ab Inverness — eine der schönsten Bahnstrecken Großbritanniens."
    },
    glasgow: {
      coords: [55.8590, -4.2460],
      name: "Glasgow — Airbnb Merchant City",
      desc: "Ref. HMSWJ44A2W. George Square, Kelvingrove & West End.",
      link: "https://airbnb.com"
    },
    stirling: {
      coords: [56.1239, -3.9470],
      name: "Stirling Castle",
      desc: "Tagesausflug ab Glasgow (35 Min.) — Castle & National Wallace Monument.",
      link: "https://www.stirlingcastle.scot"
    },
    camden: {
      coords: [51.5390, -0.1426],
      name: "Camden, London — Airbnb",
      desc: "Camden Market & Regent's Canal direkt vor der Tür.",
      link: "https://airbnb.com"
    }
  };

  /* ---- Karte ---- */
  var map = L.map(mapEl, { scrollWheelZoom: true });

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende'
  }).addTo(map);

  /* ---- Marker ---- */
  var markerIcon = L.divIcon({
    className: "",
    html:
      '<div style="width:18px;height:18px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);' +
      'background:#1a3a2c;border:2px solid #f5f1e8;box-shadow:0 2px 6px rgba(0,0,0,.4);"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 18],
    popupAnchor: [0, -18]
  });

  Object.keys(stations).forEach(function (key) {
    var s = stations[key];
    var html =
      '<div class="popup-title">' + s.name + "</div>" +
      '<div class="popup-desc">' + s.desc + "</div>" +
      (s.link
        ? '<a class="popup-link" href="' + s.link + '" target="_blank" rel="noopener">Website öffnen →</a>'
        : "");
    L.marker(s.coords, { icon: markerIcon, title: s.name }).addTo(map).bindPopup(html);
  });

  /* ---- Routen-Segmente ----
     Farben: Zug blau · Sleeper dunkel · Eurostar gelb · Ausflug grün gestrichelt */
  var styles = {
    train:     { color: "#2563a8", weight: 4, opacity: 0.9 },
    sleeper:   { color: "#16283c", weight: 4, opacity: 0.9 },
    eurostar:  { color: "#e0a800", weight: 4, opacity: 0.95 },
    excursion: { color: "#3d8465", weight: 3, opacity: 0.9, dashArray: "8 8" }
  };

  var segments = [
    { type: "train",     label: "ICE Würzburg → Brüssel",            pts: [stations.wuerzburg.coords, [50.1055, 8.6629], [50.9413, 6.9583], stations.bruessel.coords] },
    { type: "eurostar",  label: "Eurostar Brüssel → London",         pts: [stations.bruessel.coords, [51.0353, 2.3766], stations.stpancras.coords] },
    { type: "sleeper",   label: "Caledonian Sleeper London → Aberdeen", pts: [stations.euston.coords, [52.9680, -1.1666], [55.9520, -3.1900], [56.4620, -2.9707], stations.aberdeen.coords] },
    { type: "excursion", label: "Ausflug Dunnottar Castle",          pts: [stations.aberdeen.coords, stations.dunnottar.coords] },
    { type: "train",     label: "Zug Aberdeen → Inverness",          pts: [stations.aberdeen.coords, [57.4770, -3.1290], stations.inverness.coords] },
    { type: "excursion", label: "South Loch Ness Trail",             pts: [stations.inverness.coords, [57.3670, -4.3520], stations.foyers.coords] },
    { type: "excursion", label: "Ausflug Kyle of Lochalsh",          pts: [stations.inverness.coords, [57.3390, -4.6690], [57.2790, -5.5130], stations.kyle.coords] },
    { type: "train",     label: "Zug Inverness → Glasgow (Cairngorms)", pts: [stations.inverness.coords, [57.1050, -4.0350], [56.7080, -3.7280], [56.3960, -3.4370], [56.1170, -3.9360], stations.glasgow.coords] },
    { type: "excursion", label: "Tagesausflug Stirling",             pts: [stations.glasgow.coords, stations.stirling.coords] },
    { type: "sleeper",   label: "Caledonian Sleeper Glasgow → London", pts: [stations.glasgow.coords, [54.8925, -2.9329], [53.4808, -2.2426], stations.euston.coords] },
    { type: "eurostar",  label: "Eurostar London → Brüssel",         pts: [stations.stpancras.coords, [51.0353, 2.3766], stations.bruessel.coords] },
    { type: "train",     label: "ICE Brüssel → Würzburg",            pts: [stations.bruessel.coords, [50.9413, 6.9583], [50.1055, 8.6629], stations.wuerzburg.coords] }
  ];

  segments.forEach(function (seg) {
    L.polyline(seg.pts, styles[seg.type]).addTo(map).bindTooltip(seg.label, { sticky: true });
  });

  /* ---- Ausschnitt auf alle Stationen ---- */
  var all = Object.keys(stations).map(function (k) { return stations[k].coords; });
  map.fitBounds(L.latLngBounds(all).pad(0.08));
})();
