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
| `links.html` | `/links` | Alle Buchungsreferenzen und externen Links |

## Technik

Vanilla HTML/CSS/JS, kein Build-Step, keine Frameworks. Externe Abhängigkeiten:

- **Leaflet 1.9.4** (CDN) mit OpenStreetMap-Tiles — kein API-Key nötig
- **Google Fonts**: Playfair Display (Display) + Inter (Body)
- **Komoot-Embed** für die Wanderung am South Loch Ness Trail
- **Wikipedia-API** für die Fotos in den Sightseeing-Popups (CORS via
  `origin=*`, kein Key). Ist sie nicht erreichbar, bleibt ein gestalteter
  Platzhalter stehen — das Popup funktioniert vollständig ohne Bild.

```
├── index.html · agenda.html · map.html · sightseeing.html · links.html
├── css/style.css      Gesamtes Styling (dunkelgrün/slate, mobile-first)
└── js/
    ├── main.js         Mobile-Navigation + Countdown
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
