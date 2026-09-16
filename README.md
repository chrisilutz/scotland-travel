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
| `fotos.html` | `/fotos` | Reisefotos als Zeitstrahl und auf der Karte |
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

Ein Reisetag kann Alternativen haben — Feld `alt` im jeweiligen `TRIP`-Eintrag.
Am Montag, 07.09. stehen so Loch Ness und Kyle of Lochalsh nebeneinander, am
Mittwoch, 09.09. Stirling und Edinburgh. Die getroffene Wahl wird pro Tag im
`localStorage` gemerkt und beim nächsten Aufruf wiederhergestellt.

Unter den Wetterdaten zeigt eine kompakte Leaflet-Karte den jeweiligen Ort —
dieselbe Technik wie auf der Kartenseite, also OpenStreetMap ohne API-Schlüssel.
Ist Leaflet nicht erreichbar, bleibt der Kartenbereich ausgeblendet und die
Textangaben stehen weiterhin.

„Mein Standort" nutzt die Geolocation des Browsers und zeigt zusätzlich die
Entfernung zur nächsten Reisestation, auf der Mini-Karte mit Genauigkeitskreis. Die Koordinaten werden vor der Abfrage
auf zwei Nachkommastellen gerundet (rund 1 km) — die genaue Position verlässt
das Gerät nicht. Auf der Karte gibt es dafür den Knopf ◎ oben links; dort
bleibt die Position rein lokal.

## Fotos

Die Fotoseite liest `photos.json`. Diese Datei erzeugt `tools/import-photos.py`
aus einem entpackten Google-Takeout-Export:

```bash
pip install Pillow
python3 tools/import-photos.py ~/Downloads/Takeout
```

Das Skript liest Aufnahmezeit und Koordinaten — bevorzugt aus den JSON-Dateien,
die Google neben jedes Bild legt, ersatzweise aus dem EXIF im Bild selbst.
Google kennt dabei mehrere Namensschemata für die Sidecar-Dateien
(`.json`, `.supplemental-metadata.json`, gekürzte Varianten, `(1)`-Dopplungen);
alle werden erkannt. Koordinaten `0/0` bedeuten „Ort unbekannt" und werden
verworfen.

Behalten werden nur Aufnahmen aus dem Reisezeitraum. Jedes Foto bekommt einen
Reisetag und den nächstgelegenen Ort zugeordnet; Aufnahmen ohne Koordinaten
erscheinen im Zeitstrahl mit dem geplanten Tagesort, aber nicht auf der Karte.

Geschrieben werden verkleinerte WebP-Fassungen nach `photos/gross/` und
`photos/klein/` — **ohne Metadaten**, die Originale bleiben unangetastet.

Nützliche Schalter:

| Schalter | Wirkung |
|---|---|
| `--dry-run` | nur auswerten, nichts schreiben |
| `--round 3` | Koordinaten auf rund 100 m runden |
| `--web-dir` | Pfad, unter dem die Bilder auf der Website liegen |
| `--base-url` | Präfix für die URLs, etwa eine CDN-Adresse |
| `--max-edge` | längste Kante der großen Fassung (Vorgabe 1600) |

**Vor dem Veröffentlichen bedenken:** Das Repository ist öffentlich. Bilder und
Koordinaten, die hier landen, sind für jeden abrufbar — und bleiben über die
Git-Historie erhalten, auch wenn sie später gelöscht werden. Wer das nicht
möchte, legt die Bilder auf einen eigenen Speicher (etwa Cloudflare R2) und
setzt `--base-url` auf dessen Adresse; dann enthält das Repository nur
`photos.json`.

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
    ├── photos.js       Fotoseite: Zeitstrahl, Karte, Großansicht
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
