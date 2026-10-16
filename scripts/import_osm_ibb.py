#!/usr/bin/env python3
"""Import named business/service/address features from OpenStreetMap around Ibb, Yemen.

Only queries OpenStreetMap/Overpass endpoints. Does not use Google Maps content.
The default rectangle is approximate, not an authoritative administrative boundary.
"""
from __future__ import annotations

import csv
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data"
SOUTH = float(os.getenv("IBB_SOUTH", "13.94"))
WEST = float(os.getenv("IBB_WEST", "44.12"))
NORTH = float(os.getenv("IBB_NORTH", "14.03"))
EAST = float(os.getenv("IBB_EAST", "44.22"))
BBOX = f"{SOUTH},{WEST},{NORTH},{EAST}"
USER_AGENT = "IbbOpenDataResearchImporter/1.0 (GitHub repository h776117073-eng/Maps)"
ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
]
CSV_FIELDS = [
    "osm_type", "osm_id", "name", "name:ar", "name:en", "category",
    "address", "addr:housenumber", "addr:street", "addr:place",
    "addr:suburb", "addr:district", "addr:city", "addr:postcode",
    "phone", "contact:phone", "website", "contact:website",
    "opening_hours", "shop", "amenity", "office", "tourism", "leisure",
    "healthcare", "craft", "historic", "public_transport", "railway",
    "lat", "lon", "coordinate_method", "osm_url", "tags_json",
]

# Keep all named places and address-bearing objects in the full dataset, but avoid cluttering
# the map's default POI layer with every suburb or locality.
POI_TAG_KEYS = {
    "shop", "amenity", "office", "tourism", "leisure", "healthcare", "craft",
    "historic", "public_transport", "railway", "government", "emergency", "club",
}

# Collect mapped points of interest and address-bearing features in the approximate city area.
# A rectangle can include outskirts and cannot guarantee coverage of the legal city boundary.
QUERY = f"""[out:json][timeout:90];
(
  nwr["shop"]({BBOX});
  nwr["amenity"]({BBOX});
  nwr["office"]({BBOX});
  nwr["tourism"]({BBOX});
  nwr["leisure"]({BBOX});
  nwr["healthcare"]({BBOX});
  nwr["craft"]({BBOX});
  nwr["historic"]({BBOX});
  nwr["public_transport"]({BBOX});
  nwr["railway"="station"]({BBOX});
  nwr["government"]({BBOX});
  nwr["emergency"]({BBOX});
  nwr["club"]({BBOX});
  nwr["place"]({BBOX});
  nwr["building"]["name"]({BBOX});
  nwr["addr:housenumber"]({BBOX});
  nwr["addr:place"]({BBOX});
);
out center tags;
"""

def fetch_overpass() -> tuple[dict[str, Any], str]:
    body = urllib.parse.urlencode({"data": QUERY}).encode("utf-8")
    failures: list[str] = []
    for attempt, endpoint in enumerate(ENDPOINTS, start=1):
        request = urllib.request.Request(
            endpoint,
            data=body,
            headers={
                "User-Agent": USER_AGENT,
                "Accept": "application/json",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                payload = response.read()
                parsed = json.loads(payload.decode("utf-8"))
                if not isinstance(parsed.get("elements"), list):
                    raise ValueError("Overpass response had no elements array")
                return parsed, endpoint
        except Exception as exc:  # try the next public instance if one fails
            failures.append(f"{endpoint}: {type(exc).__name__}: {exc}")
            if attempt < len(ENDPOINTS):
                time.sleep(2 * attempt)
    raise RuntimeError("All Overpass endpoints failed:\n" + "\n".join(failures))

def category_for(tags: dict[str, str]) -> str:
    priority = [
        "shop", "amenity", "office", "tourism", "leisure", "healthcare",
        "craft", "historic", "public_transport", "railway", "government",
        "emergency", "club", "place", "building",
    ]
    for key in priority:
        if tags.get(key):
            return f"{key}:{tags[key]}"
    if tags.get("addr:housenumber") or tags.get("addr:place"):
        return "address"
    return "other"

def element_point(element: dict[str, Any]) -> tuple[float | None, float | None, str]:
    if element.get("type") == "node" and "lat" in element and "lon" in element:
        return float(element["lat"]), float(element["lon"]), "node_location"
    center = element.get("center") or {}
    if "lat" in center and "lon" in center:
        return float(center["lat"]), float(center["lon"]), "way_or_relation_center"
    return None, None, "no_point_available"

def normalize(element: dict[str, Any]) -> dict[str, Any]:
    tags = {str(k): str(v) for k, v in (element.get("tags") or {}).items()}
    lat, lon, method = element_point(element)
    osm_type = str(element.get("type", "unknown"))
    osm_id = int(element.get("id", 0))
    full_address = ", ".join(
        value for value in [
            tags.get("addr:housenumber"), tags.get("addr:street"),
            tags.get("addr:place"), tags.get("addr:suburb") or tags.get("addr:district"),
            tags.get("addr:city"), tags.get("addr:postcode"),
        ] if value
    )
    row: dict[str, Any] = {
        "osm_type": osm_type,
        "osm_id": osm_id,
        "name": tags.get("name") or tags.get("name:ar") or tags.get("name:en") or "",
        "name:ar": tags.get("name:ar", ""),
        "name:en": tags.get("name:en", ""),
        "category": category_for(tags),
        "address": full_address,
        "lat": lat,
        "lon": lon,
        "coordinate_method": method,
        "osm_url": f"https://www.openstreetmap.org/{osm_type}/{osm_id}",
        "tags": tags,
    }
    for field in CSV_FIELDS:
        if field not in row and field != "tags_json":
            row[field] = tags.get(field, "")
    row["tags_json"] = json.dumps(tags, ensure_ascii=False, sort_keys=True)
    return row

def normalized_name(value: str) -> str:
    value = unicodedata.normalize("NFKC", value).casefold()
    value = re.sub(r"[\u064B-\u065F\u0670\u0640]", "", value)
    return re.sub(r"[^\w]+", " ", value, flags=re.UNICODE).strip()

def write_geojson(path: Path, items: list[dict[str, Any]], name: str) -> None:
    features = []
    for r in items:
        props = {k: v for k, v in r.items() if k not in {"lat", "lon", "tags"}}
        props["tags"] = r["tags"]
        geometry = None if r["lat"] is None or r["lon"] is None else {
            "type": "Point", "coordinates": [r["lon"], r["lat"]]
        }
        features.append({"type": "Feature", "id": f'{r["osm_type"]}/{r["osm_id"]}',
                         "geometry": geometry, "properties": props})
    payload = {
        "type": "FeatureCollection",
        "name": name,
        "attribution": "© OpenStreetMap contributors",
        "licence": "Open Database License (ODbL)",
        "bbox_south_west_north_east": [SOUTH, WEST, NORTH, EAST],
        "features": features,
    }
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def main() -> int:
    if not (SOUTH < NORTH and WEST < EAST):
        print("Invalid Ibb bounds; expected south<north and west<east.", file=sys.stderr)
        return 2

    print(f"Querying OpenStreetMap/Overpass in approximate bbox {BBOX}")
    payload, endpoint = fetch_overpass()
    unique: dict[str, dict[str, Any]] = {}
    for element in payload["elements"]:
        record = normalize(element)
        key = f'{record["osm_type"]}/{record["osm_id"]}'
        unique[key] = record
    records = sorted(unique.values(), key=lambda r: (r["category"], r["name"].casefold(), r["osm_type"], r["osm_id"]))
    located = [r for r in records if r["lat"] is not None and r["lon"] is not None]
    pois = [r for r in records if any(r["tags"].get(key) for key in POI_TAG_KEYS)]

    OUT.mkdir(parents=True, exist_ok=True)
    write_geojson(OUT / "openstreetmap_ibb_places.geojson", records,
                  "OpenStreetMap mapped features and address-bearing objects around Ibb, Yemen")
    write_geojson(OUT / "openstreetmap_ibb_pois.geojson", pois,
                  "OpenStreetMap establishments and points of interest around Ibb, Yemen")

    with (OUT / "openstreetmap_ibb_places.csv").open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=CSV_FIELDS, extrasaction="ignore")
        writer.writeheader()
        for r in records:
            flat = {k: r.get(k, "") for k in CSV_FIELDS}
            flat["tags_json"] = r["tags_json"]
            writer.writerow(flat)

    with (OUT / "openstreetmap_ibb_establishments.csv").open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=CSV_FIELDS, extrasaction="ignore")
        writer.writeheader()
        for r in pois:
            flat = {k: r.get(k, "") for k in CSV_FIELDS}
            flat["tags_json"] = r["tags_json"]
            writer.writerow(flat)

    # Report repeated normalized names for human review; never auto-delete same-name branches.
    name_groups: dict[str, list[dict[str, Any]]] = {}
    for r in records:
        normalized = normalized_name(r["name"])
        if normalized:
            name_groups.setdefault(normalized, []).append(r)
    duplicate_groups = [(normalized, group) for normalized, group in name_groups.items() if len(group) > 1]
    with (OUT / "openstreetmap_ibb_duplicate_name_review.csv").open("w", encoding="utf-8-sig", newline="") as handle:
        fields = ["normalized_name", "name", "object_count", "osm_object_ids", "coordinates", "osm_urls"]
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for normalized, group in sorted(duplicate_groups, key=lambda x: x[0]):
            writer.writerow({
                "normalized_name": normalized,
                "name": group[0]["name"],
                "object_count": len(group),
                "osm_object_ids": " | ".join(f'{r["osm_type"]}/{r["osm_id"]}' for r in group),
                "coordinates": " | ".join(f'{r["lat"]},{r["lon"]}' for r in group),
                "osm_urls": " | ".join(r["osm_url"] for r in group),
            })

    cats = Counter(r["category"] for r in records)
    types = Counter(r["osm_type"] for r in records)
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    metadata = {
        "dataset_name": "OpenStreetMap mapped places and address-bearing features around Ibb, Yemen",
        "retrieved_at_utc": now,
        "source": "OpenStreetMap contributors via Overpass API",
        "endpoint_used": endpoint,
        "source_data_url": "https://www.openstreetmap.org/",
        "licence": "Open Database License (ODbL)",
        "attribution": "© OpenStreetMap contributors",
        "licence_url": "https://www.openstreetmap.org/copyright",
        "overpass_api_docs": "https://wiki.openstreetmap.org/wiki/Overpass_API",
        "query_bounds_south_west_north_east": [SOUTH, WEST, NORTH, EAST],
        "bounds_warning": "Approximate rectangle only; it can include outskirts and does not guarantee the official Ibb city boundary.",
        "element_count": len(records),
        "located_count": len(located),
        "unlocated_count": len(records) - len(located),
        "named_count": sum(bool(r["name"]) for r in records),
        "unnamed_count": sum(not bool(r["name"]) for r in records),
        "establishments_and_poi_count": len(pois),
        "records_with_phone": sum(bool(r.get("phone") or r.get("contact:phone")) for r in records),
        "records_with_address": sum(bool(r.get("address") or any(r["tags"].get(k) for k in ("addr:housenumber", "addr:street", "addr:place", "addr:city"))) for r in records),
        "records_with_website": sum(bool(r.get("website") or r.get("contact:website")) for r in records),
        "records_with_opening_hours": sum(bool(r.get("opening_hours")) for r in records),
        "normalized_duplicate_name_groups_for_review": len(duplicate_groups),
        "counts_by_category": dict(sorted(cats.items())),
        "counts_by_osm_type": dict(sorted(types.items())),
        "source_query": QUERY,
        "verification_notice": "OSM features are not independently verified. Absence from this dataset does not mean a business is absent from Ibb.",
        "duplicate_review_notice": "Repeated normalized names are listed for manual review; branches are not automatically removed.",
        "google_maps_notice": "No Google Maps content was extracted or included.",
    }
    (OUT / "openstreetmap_ibb_metadata.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps({
        "endpoint": endpoint,
        "elements": len(records),
        "located": len(located),
        "categories": dict(sorted(cats.items())),
        "establishments_and_poi_count": len(pois),
        "named_count": sum(bool(r["name"]) for r in records),
        "files": [
            "data/openstreetmap_ibb_places.csv",
            "data/openstreetmap_ibb_places.geojson",
            "data/openstreetmap_ibb_establishments.csv",
            "data/openstreetmap_ibb_pois.geojson",
            "data/openstreetmap_ibb_duplicate_name_review.csv",
            "data/openstreetmap_ibb_metadata.json",
        ],
    }, ensure_ascii=False, indent=2))
    return 0

if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Import failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
