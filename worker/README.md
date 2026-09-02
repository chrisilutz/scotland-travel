# Positions-Worker

Cloudflare Worker, der die aktuelle Reiseposition aus Home Assistant ausliest
und der Website in stark reduzierter Form bereitstellt.

## Warum überhaupt ein Worker

Die Website ist statisch und liegt in einem öffentlichen Repository. Ein
Home-Assistant-Token im Browser wäre damit für jeden lesbar — und HA-Tokens
sind nicht einschränkbar, sie geben vollen Zugriff auf die Instanz.

Der Worker löst das: Das Token liegt als Cloudflare-Secret, nur der Worker
kennt es. Nach außen gibt er ausschließlich diese Felder heraus:

```json
{ "available": true, "lat": 57.478, "lon": -4.225, "acc": 35,
  "zone": "not_home", "ts": "2026-09-07T13:22:41.512Z" }
```

Ist gerade nichts zu melden, kommt `{"available": false, "reason": "…"}` —
mögliche Gründe: `outside-trip`, `no-gps`, `upstream-unreachable`.

## Einrichtung

### 1. Home Assistant erreichbar machen

Der Worker ruft HA über das Internet auf. Wenn HA nicht ohnehin öffentlich
erreichbar ist, ist ein **Cloudflare Tunnel** der saubere Weg — `cloudflared`
läuft neben HA, und HA bekommt einen Hostnamen, ohne dass im Router ein Port
geöffnet werden muss.

### 2. Token in Home Assistant erzeugen

Profil → ganz unten → *Long-Lived Access Tokens* → Token erstellen. Der Wert
wird nur einmal angezeigt.

### 3. Worker anlegen

```bash
cd worker
npx wrangler login
npx wrangler secret put HA_URL      # z. B. https://ha.deine-domain.de
npx wrangler secret put HA_TOKEN    # das Token aus Schritt 2
npx wrangler deploy
```

Alternativ über das Cloudflare-Dashboard: *Workers & Pages → Create → Worker*,
`position-worker.js` einfügen, unter *Settings → Variables* die beiden Secrets
anlegen und die Werte aus `[vars]` als normale Variablen ergänzen.

### 4. Prüfen

```bash
curl -H "Origin: https://chrisilutz.github.io" \
     https://schottland-position.DEIN-SUBDOMAIN.workers.dev
```

Erwartet wird JSON und ein `access-control-allow-origin`-Header. Außerhalb des
Reisezeitraums antwortet der Worker mit `outside-trip` — zum Testen die Daten
in `TRIP_START`/`TRIP_END` vorübergehend anpassen.

## Was der Worker absichtlich nicht tut

Er gibt **keine** anderen Entitäten heraus, akzeptiert nur `GET`, liefert
außerhalb des Reisezeitraums nichts und rundet die Koordinaten auf drei
Nachkommastellen (rund 100 Meter).

Er ist trotzdem **öffentlich**: Wer die URL kennt, sieht während der Reise die
grobe Position. Das ist die Voraussetzung dafür, dass die Website ohne Login
funktioniert. Soll auch das nicht sein, lässt sich der Worker hinter
Cloudflare Access legen — dann sehen ihn nur angemeldete Personen, und die
Website müsste entsprechend angepasst werden.
