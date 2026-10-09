# Flood Watch Canada

Where Canada has flooded since 2000, live rainfall radar and weather alerts, and what flood protection exists. An open-source civic data project by **Richardson Dackam**, part of [Nshipyard Canada](https://canada.nshipyard.com).

Live site: https://flood.canada.nshipyard.com (EN/FR)

## What this is

An operational dashboard in three layers:

1. **Historical**: 21,983 news-reported flood events in Canada (2000-2026), clipped from the open Groundsource dataset (Google Research, CC BY 4.0, Zenodo 18647054). Aggregates by province, year, and month, plus a sampled point layer for the map.
2. **Live**: Environment and Climate Change Canada web services, fetched by the visitor's browser at view time: 1 km precipitation-rate radar mosaic and the Current-Alerts weather alert layer. Timestamps are shown honestly; the radar refreshes about every 10 minutes.
3. **Intelligence (v1, honest)**: a documented watch rule, not a forecast. Regions in the top quarter of historical reported floods get attention when heavy rain or an official alert lands on them. Google's Flood Hub runs the calibrated version of this idea; see `docs/v2-models.md` for the model plan.
4. **Infrastructure**: BC's open flood protection works inventory (1,165 line features, 20,911 structures, 1,109 km of dikes) and the 675-area Canada Flood Map Inventory from Natural Resources Canada. No other province publishes an equivalent open protection inventory.

## Data sources

- Groundsource: A Dataset of Flood Events from News (Google Research, CC BY 4.0), https://zenodo.org/records/18647054
- MSC Datamart and MSC GeoMet (Environment and Climate Change Canada): radar, alerts, https://eccc-msc.github.io/msc-datamart/readme_en
- Canada Flood Map Inventory (Natural Resources Canada), https://ftp.maps.canada.ca/pub/nrcan_rncan/Floods_Inondation/
- Flood Protection Works (Government of British Columbia, BC Geographic Warehouse)

## Refresh cadence

- Historical aggregates rebuild when Groundsource publishes a new dataset version. Build date is stamped in every JSON file under `public/data/`.
- Live layers are always current at view time; they are fetched client-side from ECCC and never cached by this site.

## Reproduce

```bash
python3 -m venv .venv && .venv/bin/pip install pyarrow pandas shapely pyproj
# place groundsource_2026.parquet in data/raw/ (Zenodo 18647054, excluded from git)
.venv/bin/python scripts/build_groundsource.py   # -> public/data/*.json
.venv/bin/python scripts/build_infra.py          # CFM studies + BC protection
npm install && npm run build
```

## Method notes and limits

- One storm can produce several Groundsource rows (entity-based, not meteorological). Counts are news-reported observations, not a flood census.
- News coverage is the sensor: English-language outlets dominate; remote floods are under-reported; locations are approximate (Google rates geocoding ~60% for exact location/timing).
- v1 predicts nothing. For operational forecasting see Google's Flood Hub.

## Author

Built by **Richardson Dackam** ([X](https://x.com/richardsondx), [GitHub](https://github.com/richardsondx)). MIT licensed.
