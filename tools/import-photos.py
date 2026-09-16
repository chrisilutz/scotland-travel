#!/usr/bin/env python3
"""
Fotos aus einem Google-Takeout-Export für die Website aufbereiten.

    python3 tools/import-photos.py ~/Downloads/Takeout

Was das Skript tut:

1. durchsucht den Takeout-Ordner nach Bildern
2. liest Aufnahmezeit und Koordinaten — bevorzugt aus der JSON-Datei, die
   Google neben jedes Bild legt, sonst aus dem EXIF im Bild selbst
3. behält nur Aufnahmen aus dem Reisezeitraum
4. ordnet jedes Foto einem Reisetag und der nächstgelegenen Station zu
5. schreibt web-taugliche Größen nach photos/ — **ohne** Metadaten, die
   Originale bleiben unangetastet
6. erzeugt photos.json, das die Website einliest

Voraussetzung: Pillow  (pip install Pillow)
Für HEIC/HEIF zusätzlich: pip install pillow-heif

Ohne die JSON-Dateien — etwa beim direkten Download eines Albums statt eines
Takeout-Exports — greift das Skript auf das EXIF im Bild zurück. Dann fehlen
allerdings Orte, die Google nur aus dem Standortverlauf kannte, und EXIF-Zeiten
tragen keine Zeitzone (hier wird die Reisezone angenommen). Takeout ist deshalb
die verlässlichere Quelle.

Die Logik zum Auslesen und Zuordnen steckt in Funktionen ohne Pillow-Bezug,
damit sie sich ohne installierte Bildbibliothek testen lässt.
"""

import argparse
import json
import math
import os
import re
import sys
from datetime import datetime, timedelta, timezone

# --------------------------------------------------------------------------
# Reisedaten — spiegelt TRIP aus js/weather.js
# --------------------------------------------------------------------------

TRIP_DAYS = [
    ("2026-09-04", "Hinreise",                      (51.5308, -0.1261)),
    ("2026-09-05", "Aberdeen",                      (57.1620, -2.0930)),
    ("2026-09-06", "Aberdeen → Inverness",          (57.4700, -4.2385)),
    ("2026-09-07", "Wandertag / Kyle of Lochalsh",  (57.2496, -4.4914)),
    ("2026-09-08", "Inverness → Glasgow",           (55.8590, -4.2460)),
    ("2026-09-09", "Stirling / Edinburgh",          (56.1239, -3.9470)),
    ("2026-09-10", "Glasgow",                       (55.8590, -4.2460)),
    ("2026-09-11", "Abreise Glasgow",               (55.8590, -4.2460)),
    ("2026-09-12", "London",                        (51.5390, -0.1426)),
    ("2026-09-13", "London",                        (51.5076, -0.0994)),
    ("2026-09-14", "Heimreise",                     (51.5308, -0.1261)),
]

# Orte für die Beschriftung „aufgenommen bei …"
PLACES = [
    ("Würzburg",            (49.8016,  9.9358)),
    ("Brüssel",             (50.8354,  4.3365)),
    ("London",              (51.5074, -0.1278)),
    ("Aberdeen",            (57.1620, -2.0930)),
    ("Stonehaven",          (56.9640, -2.2110)),
    ("Dunnottar Castle",    (56.9459, -2.1971)),
    ("Inverness",           (57.4700, -4.2385)),
    ("Foyers, Loch Ness",   (57.2496, -4.4914)),
    ("Kyle of Lochalsh",    (57.2796, -5.7132)),
    ("Glasgow",             (55.8590, -4.2460)),
    ("Stirling",            (56.1239, -3.9470)),
    ("Edinburgh",           (55.9520, -3.1900)),
]

# Während der Reise gilt in Großbritannien Sommerzeit (BST, UTC+1).
TRIP_TZ = timezone(timedelta(hours=1))

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}

# iPhone-Aufnahmen liegen oft als HEIC vor. Pillow kann das nur mit dem
# Zusatzpaket pillow-heif lesen — ist es da, wird die Endung mitgenommen.
HEIF_SUFFIXES = {".heic", ".heif"}
HEIF_READY = False
try:
    import pillow_heif                     # noqa: F401
    pillow_heif.register_heif_opener()
    IMAGE_SUFFIXES |= HEIF_SUFFIXES
    HEIF_READY = True
except Exception:
    pass


# --------------------------------------------------------------------------
# Metadaten lesen  (ohne Pillow testbar)
# --------------------------------------------------------------------------

def find_sidecar(image_path):
    """Die JSON-Datei zu einem Bild finden.

    Google hat das Namensschema mehrfach geändert und kürzt lange Namen ab:
        IMG_1234.jpg.json
        IMG_1234.jpg.supplemental-metadata.json
        IMG_1234.jpg.supplemental-met.json      (gekürzt)
        IMG_1234.jpg(1).json                    (bei Namensdopplungen)
    Deshalb wird über das Präfix gesucht statt über einen festen Namen.
    """
    directory = os.path.dirname(image_path)
    base = os.path.basename(image_path)
    stem, _ = os.path.splitext(base)

    exact = os.path.join(directory, base + ".json")
    if os.path.exists(exact):
        return exact

    try:
        entries = os.listdir(directory)
    except OSError:
        return None

    # Kandidaten: beginnen mit dem Bildnamen oder dem Namensstamm
    for name in sorted(entries):
        if not name.endswith(".json"):
            continue
        if name.startswith(base) or re.match(re.escape(stem) + r"[.(]", name):
            return os.path.join(directory, name)
    return None


def valid_coords(lat, lon):
    """Google schreibt 0/0, wenn kein Ort bekannt ist."""
    if lat is None or lon is None:
        return False
    if abs(lat) < 1e-7 and abs(lon) < 1e-7:
        return False
    return -90 <= lat <= 90 and -180 <= lon <= 180


def read_sidecar(path):
    """Zeit und Ort aus der Takeout-JSON. Gibt (timestamp, lat, lon) zurück."""
    try:
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
    except (OSError, ValueError):
        return None, None, None

    ts = None
    taken = data.get("photoTakenTime") or data.get("creationTime") or {}
    raw = taken.get("timestamp")
    if raw is not None:
        try:
            ts = int(raw)
        except (TypeError, ValueError):
            ts = None

    lat = lon = None
    for key in ("geoData", "geoDataExif"):
        geo = data.get(key) or {}
        a, b = geo.get("latitude"), geo.get("longitude")
        if valid_coords(a, b):
            lat, lon = float(a), float(b)
            break

    return ts, lat, lon


def _dms_to_deg(value, ref):
    """EXIF speichert Koordinaten als Grad/Minuten/Sekunden."""
    try:
        d, m, s = (float(x) for x in value)
    except (TypeError, ValueError):
        return None
    deg = d + m / 60.0 + s / 3600.0
    if ref in ("S", "W"):
        deg = -deg
    return deg


def read_exif(path):
    """Rückfallebene: Zeit und Ort aus dem Bild selbst (braucht Pillow)."""
    try:
        from PIL import Image, ExifTags
    except ImportError:
        return None, None, None

    try:
        with Image.open(path) as img:
            exif = img.getexif()
            if not exif:
                return None, None, None

            ts = None
            tags = {ExifTags.TAGS.get(k, k): v for k, v in exif.items()}
            taken = tags.get("DateTimeOriginal") or tags.get("DateTime")
            if taken:
                try:
                    dt = datetime.strptime(str(taken), "%Y:%m:%d %H:%M:%S")
                    # EXIF-Zeiten sind Ortszeit ohne Zone — Reisezone annehmen
                    ts = int(dt.replace(tzinfo=TRIP_TZ).timestamp())
                except ValueError:
                    ts = None

            lat = lon = None
            gps = exif.get_ifd(0x8825) if hasattr(exif, "get_ifd") else None
            if gps:
                g = {ExifTags.GPSTAGS.get(k, k): v for k, v in gps.items()}
                lat = _dms_to_deg(g.get("GPSLatitude"), g.get("GPSLatitudeRef"))
                lon = _dms_to_deg(g.get("GPSLongitude"), g.get("GPSLongitudeRef"))
                if not valid_coords(lat, lon):
                    lat = lon = None

            return ts, lat, lon
    except Exception:
        return None, None, None


# --------------------------------------------------------------------------
# Zuordnen  (ohne Pillow testbar)
# --------------------------------------------------------------------------

def distance_km(a, b):
    R = 6371.0
    rad = math.radians
    dlat = rad(b[0] - a[0])
    dlon = rad(b[1] - a[1])
    q = (math.sin(dlat / 2) ** 2 +
         math.cos(rad(a[0])) * math.cos(rad(b[0])) * math.sin(dlon / 2) ** 2)
    return 2 * R * math.asin(math.sqrt(q))


def nearest_place(coords):
    best, best_d = None, float("inf")
    for name, pos in PLACES:
        d = distance_km(coords, pos)
        if d < best_d:
            best, best_d = name, d
    return best, best_d


def local_date(ts):
    """Reisetag aus dem Zeitstempel — in Ortszeit, nicht UTC."""
    return datetime.fromtimestamp(ts, TRIP_TZ).strftime("%Y-%m-%d")


def build_entry(image_path, ts, lat, lon, round_to=None):
    """Aus den Rohdaten den Eintrag für photos.json bauen."""
    date = local_date(ts)
    day = next((d for d in TRIP_DAYS if d[0] == date), None)

    place = None
    if valid_coords(lat, lon):
        if round_to:
            factor = 10 ** round_to
            lat = round(lat * factor) / factor
            lon = round(lon * factor) / factor
        place, dist = nearest_place((lat, lon))
        if dist > 40:          # zu weit weg, um sinnvoll benannt zu werden
            place = None
    elif day:
        # Ohne Koordinaten wenigstens den geplanten Tagesort nennen
        place = day[1]
        lat = lon = None

    return {
        "source": image_path,
        "ts": datetime.fromtimestamp(ts, TRIP_TZ).isoformat(),
        "date": date,
        "lat": lat,
        "lon": lon,
        "place": place,
        "located": valid_coords(lat, lon),
    }


def in_trip_window(date, start, end):
    return start <= date <= end


# --------------------------------------------------------------------------
# Bilder verkleinern  (braucht Pillow)
# --------------------------------------------------------------------------

def make_derivative(src, dest, max_edge, quality):
    """Verkleinerte Kopie ohne Metadaten schreiben. Gibt (breite, hoehe)."""
    from PIL import Image, ImageOps

    with Image.open(src) as img:
        img = ImageOps.exif_transpose(img)      # gedrehte Aufnahmen aufrichten
        img = img.convert("RGB")
        img.thumbnail((max_edge, max_edge), Image.LANCZOS)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        # Ohne exif=… speichern: die Ableitungen tragen keine GPS-Daten mehr
        img.save(dest, "WEBP", quality=quality, method=6)
        return img.size


# --------------------------------------------------------------------------
# Hauptlauf
# --------------------------------------------------------------------------

def collect(takeout_dir, start, end, round_to, verbose=True):
    """Alle passenden Fotos einsammeln. Gibt (eintraege, statistik)."""
    stats = {"gefunden": 0, "ohne_zeit": 0, "ausserhalb": 0, "ohne_ort": 0,
             "uebernommen": 0, "heic_uebersprungen": 0, "andere_uebersprungen": 0}
    entries = []

    for root, _dirs, files in os.walk(takeout_dir):
        for name in sorted(files):
            suffix = os.path.splitext(name)[1].lower()
            if suffix not in IMAGE_SUFFIXES:
                if suffix in HEIF_SUFFIXES:
                    stats["heic_uebersprungen"] += 1
                elif suffix and suffix != ".json":
                    stats["andere_uebersprungen"] += 1
                continue
            path = os.path.join(root, name)
            stats["gefunden"] += 1

            ts = lat = lon = None
            sidecar = find_sidecar(path)
            if sidecar:
                ts, lat, lon = read_sidecar(sidecar)

            if ts is None or not valid_coords(lat, lon):
                e_ts, e_lat, e_lon = read_exif(path)
                ts = ts if ts is not None else e_ts
                if not valid_coords(lat, lon):
                    lat, lon = e_lat, e_lon

            if ts is None:
                stats["ohne_zeit"] += 1
                continue

            entry = build_entry(path, ts, lat, lon, round_to)
            if not in_trip_window(entry["date"], start, end):
                stats["ausserhalb"] += 1
                continue
            if not entry["located"]:
                stats["ohne_ort"] += 1

            entries.append(entry)
            stats["uebernommen"] += 1

    entries.sort(key=lambda e: e["ts"])
    return entries, stats


def main():
    ap = argparse.ArgumentParser(description="Takeout-Fotos für die Website aufbereiten")
    ap.add_argument("takeout", help="Ordner des entpackten Google-Takeout-Exports")
    ap.add_argument("--out", default="photos", help="Zielordner im Dateisystem (Vorgabe: photos)")
    ap.add_argument("--web-dir", default="photos",
                    help="Pfad, unter dem die Bilder auf der Website liegen (Vorgabe: photos). "
                         "Getrennt von --out, damit die URLs in photos.json unabhängig davon "
                         "stimmen, wohin die Dateien geschrieben wurden.")
    ap.add_argument("--json", default="photos.json", help="Zieldatei für die Metadaten")
    ap.add_argument("--base-url", default="", help="Präfix für die Bild-URLs, z. B. eine CDN-Adresse")
    ap.add_argument("--max-edge", type=int, default=1600, help="längste Kante der großen Fassung")
    ap.add_argument("--thumb-edge", type=int, default=400, help="längste Kante der Vorschau")
    ap.add_argument("--quality", type=int, default=82, help="WebP-Qualität")
    ap.add_argument("--round", type=int, default=None, metavar="N",
                    help="Koordinaten auf N Nachkommastellen runden (3 ≈ 100 m)")
    ap.add_argument("--start", default="2026-09-04")
    ap.add_argument("--end", default="2026-09-14")
    ap.add_argument("--dry-run", action="store_true", help="nur auswerten, nichts schreiben")
    args = ap.parse_args()

    if not os.path.isdir(args.takeout):
        sys.exit(f"Ordner nicht gefunden: {args.takeout}")

    print(f"Durchsuche {args.takeout} …")
    entries, stats = collect(args.takeout, args.start, args.end, args.round)

    print(f"  Bilddateien gefunden : {stats['gefunden']}")
    print(f"  ohne Aufnahmezeit    : {stats['ohne_zeit']}")
    print(f"  außerhalb der Reise  : {stats['ausserhalb']}")
    print(f"  ohne Koordinaten     : {stats['ohne_ort']} (erscheinen nur im Zeitstrahl)")
    print(f"  übernommen           : {stats['uebernommen']}")

    if stats["heic_uebersprungen"]:
        print(f"\n  ACHTUNG: {stats['heic_uebersprungen']} HEIC/HEIF-Dateien übersprungen.")
        print("  Zum Einlesen:  pip install pillow-heif")
    if stats["andere_uebersprungen"]:
        print(f"  {stats['andere_uebersprungen']} Dateien mit unbekannter Endung übersprungen "
              "(Videos o. Ä.).")

    if not entries:
        sys.exit("Keine passenden Fotos gefunden.")

    if args.dry_run:
        print("\n--dry-run: keine Dateien geschrieben.")
        return

    photos = []
    for index, entry in enumerate(entries, start=1):
        name = f"{index:04d}.webp"
        # Wohin geschrieben wird …
        large_path = os.path.join(args.out, "gross", name)
        thumb_path = os.path.join(args.out, "klein", name)
        # … und unter welcher Adresse die Website sie erwartet
        web_dir = args.web_dir.rstrip("/")
        large_url = f"{web_dir}/gross/{name}"
        thumb_url = f"{web_dir}/klein/{name}"

        width, height = make_derivative(entry["source"], large_path, args.max_edge, args.quality)
        make_derivative(entry["source"], thumb_path, args.thumb_edge, args.quality)

        photos.append({
            "id": f"{index:04d}",
            "src": args.base_url + large_url,
            "thumb": args.base_url + thumb_url,
            "w": width,
            "h": height,
            "ts": entry["ts"],
            "date": entry["date"],
            "lat": entry["lat"],
            "lon": entry["lon"],
            "place": entry["place"],
        })
        if index % 25 == 0:
            print(f"  … {index} von {len(entries)} verkleinert")

    days = []
    for date, label, _pos in TRIP_DAYS:
        count = sum(1 for p in photos if p["date"] == date)
        if count:
            days.append({"date": date, "label": label, "count": count})

    payload = {
        "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "days": days,
        "photos": photos,
    }
    with open(args.json, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=1)

    located = sum(1 for p in photos if p["lat"] is not None)
    print(f"\n{len(photos)} Fotos geschrieben, davon {located} mit Koordinaten.")
    print(f"Metadaten: {args.json}")
    print(f"Bilder   : {args.out}/gross/ und {args.out}/klein/")
    print(f"URLs     : {args.web_dir.rstrip('/')}/gross/… (über --web-dir bzw. --base-url anpassbar)")
    print("\nDie Ableitungen enthalten keine EXIF-Daten mehr — die Originale bleiben unberührt.")


if __name__ == "__main__":
    main()
