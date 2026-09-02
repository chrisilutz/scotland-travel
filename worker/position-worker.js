/* Cloudflare Worker: Reiseposition aus Home Assistant
   ==================================================================
   Zweck: Die Website soll die aktuelle Position anzeigen, ohne das
   Home-Assistant-Token zu kennen. Der Worker steht dazwischen —
   das Token liegt als Secret bei Cloudflare und erreicht den Browser nie.

       Browser  ──►  dieser Worker  ──►  Home Assistant
     (öffentlich)   (Token als Secret)   (/api/states/…)

   Herausgegeben wird nur das Nötigste: gerundete Koordinaten, Genauigkeit,
   Zonenname und Zeitstempel. Kein Zugriff auf irgendetwas anderes in HA.

   Einrichtung siehe worker/README.md.
*/

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);

    /* Preflight — bei einfachem GET zwar nicht nötig, schadet aber nicht */
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          ...cors,
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Max-Age": "86400"
        }
      });
    }
    if (request.method !== "GET") {
      return json({ available: false, reason: "method-not-allowed" }, cors, 405);
    }

    /* Außerhalb des Reisezeitraums wird gar keine Position ausgeliefert.
       Der Endpunkt ist öffentlich — er soll nur dann etwas verraten,
       wenn es auch gewollt ist. */
    const today = new Date().toISOString().slice(0, 10);
    const start = env.TRIP_START || "2026-09-04";
    const end = env.TRIP_END || "2026-09-14";
    if (today < start || today > end) {
      return json({ available: false, reason: "outside-trip" }, cors);
    }

    if (!env.HA_URL || !env.HA_TOKEN) {
      return json({ available: false, reason: "not-configured" }, cors, 500);
    }

    const entity = env.HA_ENTITY || "person.chrisi";
    let upstream;
    try {
      upstream = await fetch(
        `${env.HA_URL.replace(/\/+$/, "")}/api/states/${encodeURIComponent(entity)}`,
        {
          headers: {
            Authorization: `Bearer ${env.HA_TOKEN}`,
            Accept: "application/json"
          },
          signal: AbortSignal.timeout(5000)
        }
      );
    } catch (err) {
      /* Zeitüberschreitung oder HA nicht erreichbar — bewusst ohne Details,
         damit der öffentliche Endpunkt nichts über die Infrastruktur verrät. */
      return json({ available: false, reason: "upstream-unreachable" }, cors, 502);
    }

    if (!upstream.ok) {
      return json({ available: false, reason: `upstream-${upstream.status}` }, cors, 502);
    }

    const state = await upstream.json();
    const attr = (state && state.attributes) || {};

    if (typeof attr.latitude !== "number" || typeof attr.longitude !== "number") {
      /* Person ohne GPS-Bezug, etwa wenn nur eine Zone bekannt ist */
      return json({ available: false, reason: "no-gps" }, cors);
    }

    /* Auf drei Nachkommastellen runden — rund 100 m. Genau genug für
       „wo sind die gerade", zu grob für die Hausnummer. */
    const round = (v) => Math.round(v * 1000) / 1000;

    return json(
      {
        available: true,
        lat: round(attr.latitude),
        lon: round(attr.longitude),
        acc: Math.round(attr.gps_accuracy || 0),
        zone: typeof state.state === "string" ? state.state : null,
        ts: state.last_updated || null
      },
      cors
    );
  }
};

function corsHeaders(request, env) {
  const allowed = (env.ALLOWED_ORIGIN || "https://chrisilutz.github.io")
    .split(",")
    .map((s) => s.trim());
  const origin = request.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0],
    Vary: "Origin",
    /* Eine Minute Zwischenspeicherung: die Seite kann ruhig oft fragen,
       Home Assistant wird dadurch nicht belastet. */
    "Cache-Control": "public, max-age=60"
  };
}

function json(body, cors, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json; charset=utf-8" }
  });
}
