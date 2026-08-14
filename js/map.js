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
      desc: "Caledonian Sleeper nach Aberdeen — Boarding ab 20:30, Abfahrt 21:15."
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
      desc: "444 King Street. Ankunft mit dem Sleeper 07:50. Old Aberdeen, Footdee & Hafen.",
      link: "https://www.albaguesthouse.co.uk/"
    },
    dunnottar: {
      coords: [56.9459, -2.1971],
      name: "Stonehaven / Dunnottar Castle",
      desc: "Spektakuläre Klippenruine südlich von Stonehaven — per Bus X7 ab Aberdeen.",
      link: "https://www.dunnottarcastle.co.uk/"
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
      desc: "Tagesausflug ab Inverness über die Kyle Line — eine der schönsten Bahnstrecken Großbritanniens."
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
      link: "https://www.stirlingcastle.scot/"
    },
    camden: {
      coords: [51.5390, -0.1426],
      name: "Camden, London — Airbnb",
      desc: "Camden Market & Regent's Canal direkt vor der Tür.",
      link: "https://airbnb.com"
    }
  };

  /* ---- Streckenkorridore -------------------------------------------------
     Stützpunkte an den Unterwegsbahnhöfen der tatsächlich befahrenen Linien,
     damit die Linien den echten Strecken folgen statt Luftlinien zu ziehen.
     Genauigkeit: Bahnhofsebene — keine Gleisgeometrie.                      */

  var corridor = {
    /* ICE 822/316: Main-Strecke, Schnellfahrstrecke Rhein/Main–Köln,
       dann Aachen – Liège – Leuven nach Brüssel */
    iceWuerzburgBruessel: [
      [49.8016, 9.9358],   // Würzburg Hbf
      [50.0510, 9.6900],   // Gemünden am Main
      [49.9900, 9.5300],   // Lohr
      [49.9800, 9.1440],   // Aschaffenburg
      [50.1210, 8.9260],   // Hanau
      [50.1070, 8.6630],   // Frankfurt Hbf
      [50.0530, 8.5700],   // Frankfurt Flughafen Fernbahnhof
      [50.3730, 8.0230],   // Limburg Süd
      [50.4350, 7.8300],   // Montabaur
      [50.7940, 7.2020],   // Siegburg/Bonn
      [50.9430, 6.9590],   // Köln Hbf
      [50.8010, 6.4830],   // Düren
      [50.7680, 6.1040],   // Aachen Hbf
      [50.6600, 5.9700],   // Welkenraedt
      [50.6240, 5.5670],   // Liège-Guillemins
      [50.7500, 5.0800],   // Landen
      [50.8810, 4.7150],   // Leuven
      [50.8354, 4.3365]    // Brüssel-Midi
    ],

    /* Eurostar über HSL 1 und HS1 durch den Kanaltunnel */
    eurostarBruesselLondon: [
      [50.8354, 4.3365],   // Brüssel-Midi
      [50.7350, 4.2350],   // Halle
      [50.6290, 3.7780],   // Ath
      [50.6120, 3.3900],   // Tournai
      [50.6390, 3.0760],   // Lille-Europe
      [50.7250, 2.5370],   // Hazebrouck (LGV Nord)
      [50.9160, 1.8100],   // Calais-Fréthun
      [51.0810, 1.1720],   // Folkestone (Tunnelausfahrt)
      [51.1430, 0.8750],   // Ashford International
      [51.4430, 0.3220],   // Ebbsfleet International
      [51.5410, -0.0030],  // Stratford International
      [51.5308, -0.1261]   // London St Pancras
    ],

    /* Sleeper: West Coast Main Line bis Edinburgh, dann über die Forth Bridge
       und die Küste via Dundee und Stonehaven nach Aberdeen */
    sleeperLondonAberdeen: [
      [51.5282, -0.1337],  // London Euston
      [51.6630, -0.3960],  // Watford Junction
      [52.0340, -0.7740],  // Milton Keynes
      [52.3790, -1.2510],  // Rugby
      [52.5230, -1.4640],  // Nuneaton
      [52.8020, -2.1210],  // Stafford
      [53.0890, -2.4330],  // Crewe
      [53.3860, -2.5940],  // Warrington
      [53.7560, -2.7080],  // Preston
      [54.0480, -2.8070],  // Lancaster
      [54.3020, -2.7370],  // Oxenholme
      [54.6620, -2.7570],  // Penrith
      [54.8925, -2.9329],  // Carlisle
      [55.1240, -3.3540],  // Lockerbie
      [55.3100, -3.4600],  // Beattock
      [55.4900, -3.6900],  // Abington
      [55.6940, -3.6690],  // Carstairs
      [55.9457, -3.2180],  // Edinburgh Haymarket
      [55.9520, -3.1900],  // Edinburgh Waverley
      [56.0000, -3.3880],  // Forth Bridge
      [56.0340, -3.3930],  // Inverkeithing
      [56.1120, -3.1650],  // Kirkcaldy
      [56.2760, -3.1250],  // Ladybank
      [56.4570, -2.9710],  // Dundee
      [56.5610, -2.5830],  // Arbroath
      [56.7100, -2.4670],  // Montrose
      [56.9640, -2.2110],  // Stonehaven
      [57.1430, -2.0980]   // Aberdeen
    ],

    /* Aberdeen – Inverness Line */
    aberdeenInverness: [
      [57.1430, -2.0980],  // Aberdeen
      [57.2050, -2.1900],  // Dyce
      [57.2830, -2.3760],  // Inverurie
      [57.3410, -2.6120],  // Insch
      [57.4430, -2.7860],  // Huntly
      [57.5450, -2.9490],  // Keith
      [57.6480, -3.3150],  // Elgin
      [57.6090, -3.6200],  // Forres
      [57.5860, -3.8700],  // Nairn
      [57.4800, -4.2230]   // Inverness
    ],

    /* Highland Main Line über den Drumochter-Pass, ab Stirling via Croy */
    invernessGlasgow: [
      [57.4800, -4.2230],  // Inverness
      [57.4750, -4.1400],  // Culloden-Viadukt
      [57.2830, -3.8180],  // Carrbridge
      [57.1890, -3.8290],  // Aviemore
      [57.0790, -4.0540],  // Kingussie
      [57.0600, -4.1200],  // Newtonmore
      [56.9350, -4.2450],  // Dalwhinnie
      [56.8500, -4.2400],  // Drumochter-Pass
      [56.7650, -3.8480],  // Blair Atholl
      [56.7030, -3.7350],  // Pitlochry
      [56.5620, -3.5850],  // Dunkeld & Birnam
      [56.3920, -3.4370],  // Perth
      [56.2760, -3.7350],  // Gleneagles
      [56.1200, -3.9350],  // Stirling
      [56.0230, -3.8250],  // Larbert
      [55.9560, -4.0290],  // Croy
      [55.9280, -4.1520],  // Lenzie
      [55.8620, -4.2510]   // Glasgow Queen Street
    ],

    /* Sleeper zurück: durchgehend West Coast Main Line (nicht über Manchester) */
    sleeperGlasgowLondon: [
      [55.8590, -4.2580],  // Glasgow Central
      [55.7920, -4.0000],  // Motherwell
      [55.6940, -3.6690],  // Carstairs
      [55.4900, -3.6900],  // Abington
      [55.3100, -3.4600],  // Beattock
      [55.1240, -3.3540],  // Lockerbie
      [54.8925, -2.9329],  // Carlisle
      [54.6620, -2.7570],  // Penrith
      [54.3020, -2.7370],  // Oxenholme
      [54.0480, -2.8070],  // Lancaster
      [53.7560, -2.7080],  // Preston
      [53.5460, -2.6320],  // Wigan
      [53.3860, -2.5940],  // Warrington
      [53.0890, -2.4330],  // Crewe
      [52.8020, -2.1210],  // Stafford
      [52.5230, -1.4640],  // Nuneaton
      [52.3790, -1.2510],  // Rugby
      [52.0340, -0.7740],  // Milton Keynes
      [51.6630, -0.3960],  // Watford Junction
      [51.5282, -0.1337]   // London Euston
    ],

    /* Bus X7 entlang der A90 nach Stonehaven, dann Küstenweg zur Burg */
    aberdeenDunnottar: [
      [57.1430, -2.0980],  // Aberdeen
      [57.0570, -2.1290],  // Portlethen
      [57.0180, -2.1520],  // Newtonhill
      [56.9640, -2.2110],  // Stonehaven
      [56.9459, -2.1971]   // Dunnottar Castle
    ],

    /* Südufer von Loch Ness über die B862/B852 */
    invernessFoyers: [
      [57.4700, -4.2385],  // Inverness
      [57.3800, -4.3300],  // Dores
      [57.2860, -4.4300],  // Inverfarigaig
      [57.2496, -4.4914]   // Foyers
    ],

    /* Kyle Line: erst nordwestlich nach Dingwall, dann quer zur Westküste */
    invernessKyle: [
      [57.4800, -4.2230],  // Inverness
      [57.4770, -4.4700],  // Beauly
      [57.5200, -4.4600],  // Muir of Ord
      [57.5950, -4.4270],  // Dingwall
      [57.6120, -4.6900],  // Garve
      [57.5810, -5.0670],  // Achnasheen
      [57.4230, -5.4300],  // Strathcarron
      [57.3450, -5.5580],  // Stromeferry
      [57.3370, -5.6560],  // Plockton
      [57.2796, -5.7132]   // Kyle of Lochalsh
    ],

    /* Tagesausflug über dieselbe Strecke wie die Anreise aus dem Norden */
    glasgowStirling: [
      [55.8620, -4.2510],  // Glasgow Queen Street
      [55.9280, -4.1520],  // Lenzie
      [55.9560, -4.0290],  // Croy
      [56.0230, -3.8250],  // Larbert
      [56.1239, -3.9470]   // Stirling
    ]
  };

  function reverse(pts) { return pts.slice().reverse(); }

  /* ---- Karte ---- */
  var map = L.map(mapEl, { scrollWheelZoom: true });

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende'
  }).addTo(map);

  /* ---- Routen-Segmente ----
     Farben: Zug blau · Sleeper dunkel · Eurostar gelb · Ausflug grün gestrichelt */
  var styles = {
    train:     { color: "#2563a8", weight: 4, opacity: 0.9 },
    sleeper:   { color: "#16283c", weight: 4, opacity: 0.9 },
    eurostar:  { color: "#e0a800", weight: 4, opacity: 0.95 },
    excursion: { color: "#3d8465", weight: 3, opacity: 0.9, dashArray: "8 8" }
  };

  var segments = [
    { type: "train",     label: "ICE 822 / 316: Würzburg → Frankfurt → Brüssel", pts: corridor.iceWuerzburgBruessel },
    { type: "eurostar",  label: "Eurostar: Brüssel → London",                    pts: corridor.eurostarBruesselLondon },
    { type: "sleeper",   label: "Caledonian Sleeper: London → Aberdeen",         pts: corridor.sleeperLondonAberdeen },
    { type: "excursion", label: "Bus X7: Aberdeen → Stonehaven / Dunnottar",     pts: corridor.aberdeenDunnottar },
    { type: "train",     label: "Zug: Aberdeen → Inverness",                     pts: corridor.aberdeenInverness },
    { type: "excursion", label: "South Loch Ness Trail: Inverness → Foyers",     pts: corridor.invernessFoyers },
    { type: "excursion", label: "Kyle Line: Inverness → Kyle of Lochalsh",       pts: corridor.invernessKyle },
    { type: "train",     label: "Highland Main Line: Inverness → Glasgow",       pts: corridor.invernessGlasgow },
    { type: "excursion", label: "Tagesausflug: Glasgow → Stirling",              pts: corridor.glasgowStirling },
    { type: "sleeper",   label: "Caledonian Sleeper: Glasgow → London",          pts: corridor.sleeperGlasgowLondon },
    { type: "eurostar",  label: "Eurostar: London → Brüssel",                    pts: reverse(corridor.eurostarBruesselLondon) },
    { type: "train",     label: "ICE: Brüssel → Würzburg",                       pts: reverse(corridor.iceWuerzburgBruessel) }
  ];

  segments.forEach(function (seg) {
    L.polyline(seg.pts, styles[seg.type]).addTo(map).bindTooltip(seg.label, { sticky: true });
  });

  /* ---- Marker (über den Linien) ---- */
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

  /* ---- Ausschnitt auf alle Stationen ---- */
  var all = Object.keys(stations).map(function (k) { return stations[k].coords; });
  map.fitBounds(L.latLngBounds(all).pad(0.08));
})();
