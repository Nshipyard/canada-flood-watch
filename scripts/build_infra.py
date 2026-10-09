#!/usr/bin/env python3
"""Build infrastructure-layer data: CFM flood study areas + BC flood protection works.

CFM: Canada Flood Map Inventory GeoPackage (Natural Resources Canada),
675 flood study areas -> compact JSON with reprojected centroids.

BC FPW: BC Geographic Warehouse WFS (EPSG:3005) -> counts + total dike
kilometres -> compact JSON. Geometries stay server-side as live WMS layers.
"""
from __future__ import annotations

import json
import sqlite3
import sys
import urllib.request
from datetime import date

from pyproj import Transformer
from shapely import wkb
from shapely.ops import transform as shp_transform

OUT = "public/data"
CFM = "data/raw/canada_flood_map_inventory.gpkg"
BC_OWS = "https://openmaps.gov.bc.ca/geo/pub/ows"


def gpkg_to_wkb(blob: bytes) -> bytes:
    assert blob[0:2] == b"GP"
    env_type = (blob[3] >> 1) & 0x07
    env_size = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}[env_type]
    return blob[8 + env_size :]


def build_cfm() -> None:
    con = sqlite3.connect(CFM)
    rows = con.execute(
        "SELECT study_name, province_or_territory, study_date, availability_status,"
        " data_owner, public_link, geom FROM flood_map"
    ).fetchall()
    con.close()
    tr = Transformer.from_crs("EPSG:3978", "EPSG:4326", always_xy=True)
    out = []
    for name, prov, sdate, status, owner, link, blob in rows:
        try:
            g = wkb.loads(gpkg_to_wkb(bytes(blob)))
            c = shp_transform(tr.transform, g).centroid
            lon, lat = round(c.x, 4), round(c.y, 4)
        except Exception:
            lon, lat = None, None
        out.append(
            {
                "name": name,
                "prov": prov,
                "date": sdate,
                "status": status,
                "owner": owner,
                "link": link,
                "lon": lon,
                "lat": lat,
            }
        )
    # per-province counts
    by_prov: dict[str, int] = {}
    for r in out:
        by_prov[r["prov"]] = by_prov.get(r["prov"], 0) + 1
    with open(f"{OUT}/cfm_studies.json", "w") as f:
        json.dump(out, f, separators=(",", ":"))
    with open(f"{OUT}/cfm_by_province.json", "w") as f:
        json.dump(dict(sorted(by_prov.items(), key=lambda kv: -kv[1])), f)
    print(f"CFM studies: {len(out)}")


def wfs_count(type_name: str) -> int:
    url = (
        f"{BC_OWS}?service=WFS&version=2.0.0&request=GetFeature"
        f"&typeNames=pub:{type_name}&resultType=hits"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "canada-flood-watch/1.0"})
    with urllib.request.urlopen(req, timeout=120) as r:
        xml = r.read().decode("utf-8", "replace")
    import re

    m = re.search(r'numberMatched="(\d+)"', xml)
    return int(m.group(1)) if m else -1


def wfs_lines_length_km() -> float:
    """Sum dike linework length. BC Albers (EPSG:3005) metres -> km."""
    url = (
        f"{BC_OWS}?service=WFS&version=2.0.0&request=GetFeature"
        "&typeNames=pub:WHSE_WATER_MANAGEMENT.FPW_FLOOD_PROTECTION_WRK_LINE"
        "&outputFormat=application/json"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "canada-flood-watch/1.0"})
    with urllib.request.urlopen(req, timeout=300) as r:
        fc = json.load(r)
    total_m = 0.0
    for feat in fc.get("features", []):
        geom = feat.get("geometry")
        if not geom:
            continue
        total_m += _length_m(geom)
    return round(total_m / 1000.0, 1)


def _length_m(geom: dict) -> float:
    t = geom.get("type")
    coords = geom.get("coordinates", [])
    if t == "LineString":
        return _line_len(coords)
    if t == "MultiLineString":
        return sum(_line_len(c) for c in coords)
    return 0.0


def _line_len(coords) -> float:
    s = 0.0
    for a, b in zip(coords, coords[1:]):
        s += ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5
    return s


def build_bc() -> None:
    lines = wfs_count("WHSE_WATER_MANAGEMENT.FPW_FLOOD_PROTECTION_WRK_LINE")
    structs = wfs_count("WHSE_WATER_MANAGEMENT.FPW_APPURTENANT_STRUCTURE_SVW")
    print(f"BC FPW line features: {lines}, structures: {structs}")
    km = wfs_lines_length_km()
    print(f"BC dike linework: {km} km")
    out = {
        "line_features": lines,
        "structures": structs,
        "dike_km": km,
        "source": "BC Geographic Warehouse, Flood Protection Works (Ministry of Water, Land and Resource Stewardship)",
        "note": "No other province publishes an equivalent open inventory.",
        "built": date.today().isoformat(),
    }
    with open(f"{OUT}/bc_protection.json", "w") as f:
        json.dump(out, f)


if __name__ == "__main__":
    build_cfm()
    try:
        build_bc()
    except Exception as e:
        print(f"BC FPW build failed (non-fatal): {e}", file=sys.stderr)
