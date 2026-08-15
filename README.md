# Schottland 2026 🏴󠁧󠁢󠁳󠁣󠁴󠁿

Statische Travel-Website zur Schottland-Reise vom **04. bis 14. September 2026** —
mit dem Zug von Würzburg über Brüssel und London nach Aberdeen, Inverness und Glasgow.

## Seiten

| Datei | Route | Inhalt |
|---|---|---|
| `index.html` | `/` | Hero, Kurzübersicht der Stationen, Countdown bis zur Abfahrt |
| `agenda.html` | `/agenda` | Tagesweiser Reiseplan mit Zeiten, Wagen-/Platznummern und Referenzen |
| `map.html` | `/map` | Interaktive Leaflet-Karte mit allen Stationen und der Route |
| `sightseeing.html` | `/sightseeing` | Sehenswürdigkeiten und Aktivitäten je Station |
| `essen.html` | `/essen` | Afternoon Tea und Dinner je Station, mit vegetarischer Kennzeichnung |
| `links.html` | `/links` | Alle Buchungsreferenzen und externen Links |

## Technik

Vanilla HTML/CSS/JS, kein Build-Step, keine Frameworks. Externe Abhängigkeiten:

- **Leaflet 1.9.4** (CDN) mit OpenStreetMap-Tiles — kein API-Key nötig
- **Google Fonts**: Playfair Display (Display) + Inter (Body)
- **Komoot-Embed** für die Wanderung am South Loch Ness Trail
- **Wikipedia-API** für die Fotos in den Sightseeing-Popups (CORS via
  `origin=*`, kein Key). Ist sie nicht erreichbar, bleibt ein gestalteter
  Platzhalter stehen — das Popup funktioniert vollständig ohne Bild.
- **Open-Meteo** für das Wetter (CORS, kein Key, keine Registrierung).
  Offline zeigt die Karte den zuletzt abgerufenen Stand und weist darauf hin.

## Wetter & Standort

Die Startseite zeigt das Wetter an dem Ort, an dem wir laut Reiseplan heute
sind — die Zuordnung Datum → Ort steht im Array `TRIP` in `js/weather.js`.
Außerhalb des Reisezeitraums ist Aberdeen voreingestellt; über die Knöpfe
lässt sich zwischen den vier Basisstationen umschalten.

„Mein Standort" nutzt die Geolocation des Browsers und zeigt zusätzlich die
Entfernung zur nächsten Reisestation. Die Koordinaten werden vor der Abfrage
auf zwei Nachkommastellen gerundet (rund 1 km) — die genaue Position verlässt
das Gerät nicht. Auf der Karte gibt es dafür den Knopf ◎ oben links; dort
bleibt die Position rein lokal.

## Offline & Installation (PWA)

Die Seite ist installierbar und funktioniert offline. `sw.js` legt beim ersten
Besuch alle sechs Seiten samt CSS, JS und Icons ab; Schriften, Leaflet,
besuchte Kartenkacheln und Wikipedia-Bilder kommen beim Surfen dazu.

Strategien: Seitenaufrufe **network-first** (online immer aktuell, offline aus
dem Cache), eigenes CSS/JS **stale-while-revalidate**, Fonts und Leaflet
**cache-first**, Kartenkacheln und Bilder **cache-first mit Obergrenze**
(400 Kacheln, 60 Bilder).

**Wichtig beim Ändern der Shell-Dateien:** `VERSION` in `sw.js` erhöhen. Nur
dann wird neu vorgeladen und die alte Cache-Generation entfernt.

Nicht offline verfügbar: das Komoot-Embed (fremde Seite im iframe) und
Kartenausschnitte, die noch nie geladen wurden.

```
├── index.html · agenda.html · map.html · sightseeing.html
├── essen.html · links.html
├── manifest.webmanifest · sw.js · icons/
├── css/style.css      Gesamtes Styling (dunkelgrün/slate, mobile-first)
└── js/
    ├── main.js         Navigation, Countdown, Service-Worker-Registrierung
    ├── map.js          Leaflet-Karte: Marker, Popups, Routen-Polylines
    └── sightseeing.js  Inhalte & Detail-Popups der Sehenswürdigkeiten
```

Die Inhalte der Sightseeing-Popups (Beschreibung, Eintritt, Öffnungszeiten,
Links) stehen gesammelt im Objekt `SIGHTS` in `js/sightseeing.js` — dort
werden sie gepflegt, das HTML bleibt unverändert.

Die Karte unterscheidet die Verkehrsmittel farblich: Zug (blau), Caledonian Sleeper
(dunkelblau), Eurostar (gelb), lokale Ausflüge (grün gestrichelt).

## Lokal ansehen

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Deployment

### GitHub Pages (aktiv)

Der Workflow `.github/workflows/pages.yml` veröffentlicht die Seite bei jedem
Push auf **`main`**. Einmalig muss dafür im Repository unter
**Settings → Pages** als *Source* **„GitHub Actions"** ausgewählt werden —
danach läuft das Deployment automatisch.

Die Seite liegt anschließend unter `https://<user>.github.io/scotland-travel/`.
Alle Pfade im Projekt sind relativ, die Auslieferung aus einem Unterverzeichnis
funktioniert also ohne weitere Anpassung. Clean URLs (`/agenda` statt
`/agenda.html`) liefert GitHub Pages automatisch.

### Alternativen

- **Netlify** — `netlify.toml` liegt bei, Publish-Verzeichnis ist das Repo-Root.
- **GitLab Pages** — `.gitlab-ci.yml` kopiert die Dateien nach `public/`.
- Jeder andere Static-Host: einfach alle Dateien hochladen.
