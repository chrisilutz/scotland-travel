/* Service Worker — Schottland 2026
   ------------------------------------------------------------------
   Macht die Seite installierbar und offline nutzbar. Alle Pfade sind
   relativ zum Scope, damit die Auslieferung unter einem Unterverzeichnis
   (GitHub Pages: /scotland-travel/) unverändert funktioniert.

   Strategien:
   - Seitenaufrufe      network-first  → immer aktuell, offline aus dem Cache
   - eigenes CSS/JS     stale-while-revalidate
   - Fonts & Leaflet    cache-first (versionierte, stabile URLs)
   - Kartenkacheln      cache-first mit Obergrenze
   - Wikipedia-Bilder   cache-first mit Obergrenze
   - Wetter (Open-Meteo) network-first, offline der letzte Stand

   Version erhöhen, wenn sich die Shell-Dateien ändern — der alte Cache
   wird beim Aktivieren entfernt.
*/

var VERSION = "v5";
var SHELL = "schottland-shell-" + VERSION;
var RUNTIME = "schottland-runtime-" + VERSION;
var TILES = "schottland-tiles-" + VERSION;
var IMAGES = "schottland-images-" + VERSION;
var WEATHER = "schottland-weather-" + VERSION;

var CURRENT = [SHELL, RUNTIME, TILES, IMAGES, WEATHER];

/* Obergrenzen, damit der Speicher nicht unbegrenzt wächst */
var MAX_TILES = 400;
var MAX_IMAGES = 60;

var SHELL_FILES = [
  "./",
  "index.html",
  "agenda.html",
  "map.html",
  "sightseeing.html",
  "essen.html",
  "links.html",
  "css/style.css",
  "js/main.js",
  "js/map.js",
  "js/sightseeing.js",
  "js/weather.js",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png"
];

/* ---- Installation: Shell vorab ablegen ---- */
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(SHELL).then(function (cache) {
      /* Einzeln hinzufügen: eine fehlende Datei soll nicht die ganze
         Installation scheitern lassen. */
      return Promise.all(
        SHELL_FILES.map(function (url) {
          return cache.add(new Request(url, { cache: "reload" })).catch(function () {});
        })
      );
    }).then(function () { return self.skipWaiting(); })
  );
});

/* ---- Aktivierung: alte Cache-Generationen entfernen ---- */
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key.indexOf("schottland-") === 0 && CURRENT.indexOf(key) === -1) {
            return caches.delete(key);
          }
        })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

/* ---- Hilfsfunktionen ---- */

function trim(cacheName, max) {
  return caches.open(cacheName).then(function (cache) {
    return cache.keys().then(function (keys) {
      if (keys.length <= max) return;
      /* Einfügereihenfolge = Reihenfolge der Schlüssel: ältestes zuerst weg */
      return Promise.all(
        keys.slice(0, keys.length - max).map(function (k) { return cache.delete(k); })
      );
    });
  });
}

function cacheFirst(request, cacheName, max) {
  return caches.open(cacheName).then(function (cache) {
    return cache.match(request).then(function (hit) {
      if (hit) return hit;
      return fetch(request).then(function (response) {
        if (response && (response.ok || response.type === "opaque")) {
          cache.put(request, response.clone());
          if (max) trim(cacheName, max);
        }
        return response;
      });
    });
  });
}

function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName).then(function (cache) {
    return cache.match(request).then(function (hit) {
      var network = fetch(request).then(function (response) {
        if (response && response.ok) cache.put(request, response.clone());
        return response;
      }).catch(function () { return hit; });
      return hit || network;
    });
  });
}

/* Seitenaufrufe: erst Netz, sonst Cache, sonst Startseite */
function networkFirst(request) {
  return fetch(request).then(function (response) {
    if (response && response.ok) {
      var copy = response.clone();
      caches.open(SHELL).then(function (cache) { cache.put(request, copy); });
    }
    return response;
  }).catch(function () {
    return caches.match(request).then(function (hit) {
      return hit || caches.match("index.html") || caches.match("./");
    });
  });
}

/* ---- Anfragen abfangen ---- */
self.addEventListener("fetch", function (event) {
  var request = event.request;

  /* Nur GET; POST und Ähnliches unangetastet lassen */
  if (request.method !== "GET") return;

  var url;
  try { url = new URL(request.url); } catch (e) { return; }

  /* Nur http(s) — Erweiterungen und andere Schemata ignorieren */
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  var host = url.hostname;
  var sameOrigin = url.origin === self.location.origin;

  /* Seitenaufrufe */
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  /* Eigene Dateien */
  if (sameOrigin) {
    event.respondWith(staleWhileRevalidate(request, SHELL));
    return;
  }

  /* Wetter: immer erst ans Netz, offline den zuletzt geholten Stand.
     Die Seite erkennt am Zeitstempel selbst, dass er alt ist. */
  if (host === "api.open-meteo.com") {
    event.respondWith(
      fetch(request).then(function (response) {
        if (response && response.ok) {
          var copy = response.clone();
          caches.open(WEATHER).then(function (cache) { cache.put(request, copy); });
        }
        return response;
      }).catch(function () {
        return caches.open(WEATHER).then(function (cache) {
          return cache.match(request).then(function (hit) {
            /* Nur exakte Treffer: ein Stand für einen anderen Ort wäre
               irreführend. Sonst scheitert der Abruf und die Seite sagt es. */
            return hit || Response.error();
          });
        });
      })
    );
    return;
  }

  /* Schriften und Leaflet: stabile, versionierte URLs */
  if (host === "fonts.googleapis.com" || host === "fonts.gstatic.com" || host === "unpkg.com") {
    event.respondWith(cacheFirst(request, RUNTIME));
    return;
  }

  /* Kartenkacheln — begrenzt, damit nur tatsächlich besuchte Ausschnitte
     offline verfügbar sind (kein Vorabladen ganzer Regionen). */
  if (host === "tile.openstreetmap.org") {
    event.respondWith(cacheFirst(request, TILES, MAX_TILES));
    return;
  }

  /* Wikipedia: Bilder und die API-Antworten der Sightseeing-Popups */
  if (host === "upload.wikimedia.org") {
    event.respondWith(cacheFirst(request, IMAGES, MAX_IMAGES));
    return;
  }
  if (/\.wikipedia\.org$/.test(host)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME));
    return;
  }

  /* Alles Übrige unverändert durchreichen (z. B. das Komoot-Embed). */
});
