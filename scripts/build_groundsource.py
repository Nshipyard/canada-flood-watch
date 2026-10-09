#!/usr/bin/env python3
"""Build processed data files for canada-flood-watch.

Reads the Groundsource open dataset (Google Research, CC BY 4.0, Zenodo
record 18647054: 2,646,302 geo-tagged flood events from news, 2000-2026),
clips events to Canada using the Canada Flood Map Inventory province
boundaries, and writes compact JSON aggregates for the site.

Raw inputs stay in data/raw/ (excluded from git). Only data/*.json under
public/data/ are committed.
"""
from __future__ import annotations

import json
import sqlite3
import sys
from datetime import date

import pyarrow.parquet as pq
import shapely
from shapely import wkb
from shapely.strtree import STRtree
from pyproj import Transformer

RAW = "data/raw/groundsource_2026.parquet"
CFM = "data/raw/canada_flood_map_inventory.gpkg"
OUT = "public/data"

CANADA_BBOX = (41.0, -141.0, 84.0, -52.0)  # lat_min, lon_min, lat_max, lon_max


def gpkg_to_wkb(blob: bytes) -> bytes:
    """Strip the GeoPackage binary header, returning raw WKB."""
    assert blob[0:2] == b"GP", "not a GeoPackage geometry"
    flags = blob[3]
    env_type = (flags >> 1) & 0x07
    env_size = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}[env_type]
    return blob[8 + env_size :]


def load_provinces():
    """Province polygons from the Canada Flood Map Inventory, reprojected to WGS84."""
    con = sqlite3.connect(CFM)
    rows = con.execute(
        "SELECT province_or_territory, geom FROM province_territory"
    ).fetchall()
    con.close()
    # CFM geometries are EPSG:3978 (NAD83 / Canada Atlas Lambert, metres)
    transformer = Transformer.from_crs("EPSG:3978", "EPSG:4326", always_xy=True)
    polys, names = [], []
    for name, blob in rows:
        geom = wkb.loads(gpkg_to_wkb(bytes(blob)))
        # shapely transform is overkill; use pyproj on exterior coords via mapping
        g2 = shapely.ops.transform(transformer.transform, geom)
        polys.append(g2)
        names.append(name)
    return names, polys


def main() -> None:
    import shapely.ops  # noqa: F401  (needed above; import here to fail fast)

    names, polys = load_provinces()
    canada = shapely.unary_union(polys)
    tree = STRtree(polys)

    by_province: dict[str, int] = {n: 0 for n in names}
    by_province_month: dict[str, dict[int, int]] = {}
    by_year: dict[int, int] = {}
    by_month: dict[int, int] = {}
    points: list[dict] = []  # sampled recent events for the map
    total = 0
    min_date: str | None = None
    max_date: str | None = None

    pf = pq.ParquetFile(RAW)
    n_batches = pf.num_row_groups
    for bi in range(n_batches):
        t = pf.read_row_group(bi, columns=["area_km2", "geometry", "start_date"])
        geoms = shapely.from_wkb(t.column("geometry").to_pylist())
        cent = shapely.centroid(geoms)
        lon = shapely.get_x(cent)
        lat = shapely.get_y(cent)
        area = t.column("area_km2").to_pylist()
        sdate = t.column("start_date").to_pylist()
        lat_min, lon_min, lat_max, lon_max = CANADA_BBOX
        for i in range(len(lon)):
            la, lo = lat[i], lon[i]
            if la is None or not (lat_min <= la <= lat_max and lon_min <= lo <= lon_max):
                continue
            pt = shapely.Point(lo, la)
            if not canada.contains(pt):
                continue
            sd = sdate[i]
            total += 1
            if min_date is None or sd < min_date:
                min_date = sd
            if max_date is None or sd > max_date:
                max_date = sd
            try:
                y, m = int(sd[0:4]), int(sd[5:7])
            except (ValueError, TypeError, IndexError):
                continue
            by_year[y] = by_year.get(y, 0) + 1
            by_month[m] = by_month.get(m, 0) + 1
            hit = tree.query(pt, predicate="within")
            prov = names[int(hit[0])] if len(hit) else "Unknown"
            by_province[prov] = by_province.get(prov, 0) + 1
            pm = by_province_month.setdefault(prov, {})
            pm[m] = pm.get(m, 0) + 1
            if y >= 2010 and len(points) < 9000 and (total % 7 == 0):
                a = area[i]
                points.append(
                    {
                        "lon": round(float(lo), 4),
                        "lat": round(float(la), 4),
                        "date": sd,
                        "area": round(float(a), 2) if a is not None else None,
                        "prov": prov,
                    }
                )
        print(f"batch {bi + 1}/{n_batches}: canada events so far {total}", flush=True)

    by_province = {k: v for k, v in sorted(by_province.items(), key=lambda kv: -kv[1]) if v}
    by_year = {str(k): v for k, v in sorted(by_year.items())}
    by_month = {str(k): v for k, v in sorted(by_month.items())}

    summary = {
        "total_events_canada": total,
        "date_range": [min_date, max_date],
        "source": "Groundsource: A Dataset of Flood Events from News (Google Research, CC BY 4.0, Zenodo 18647054)",
        "source_global_events": 2646302,
        "method": "Events clipped to Canada by centroid-in-province test against Canada Flood Map Inventory boundaries. Counts are news-reported flood observations, not a meteorological census: one storm can produce several rows, and English-language news coverage biases the record.",
        "built": date.today().isoformat(),
    }
    with open(f"{OUT}/summary.json", "w") as f:
        json.dump(summary, f)
    with open(f"{OUT}/by_province.json", "w") as f:
        json.dump(by_province, f)
    with open(f"{OUT}/by_year.json", "w") as f:
        json.dump(by_year, f)
    with open(f"{OUT}/by_month.json", "w") as f:
        json.dump(by_month, f)
    peak_month = {
        prov: max(months.items(), key=lambda kv: kv[1])[0]
        for prov, months in by_province_month.items()
        if months
    }
    with open(f"{OUT}/peak_month_by_province.json", "w") as f:
        json.dump(peak_month, f)
    with open(f"{OUT}/points.json", "w") as f:
        json.dump(points, f, separators=(",", ":"))
    print(f"TOTAL Canada events: {total}; map points sampled: {len(points)}")


if __name__ == "__main__":
    sys.exit(main())
