# v2: serving a Groundsource-trained flash-flood model

Status: plan only. Version 1 of Flood Watch Canada runs no flood model; it
applies a documented heuristic (top-quartile historical counts plus live
radar and alerts). This document describes what a v2 model service would
require, so the step from dashboard to forecast is explicit and reviewable.

## What Google demonstrated

Google's Flood Hub flash-flood forecasts use the Groundsource recipe:
Gemini turned about 5 million news articles into 2.6 million geo-tagged
flood events (Zenodo record 18647054, CC BY 4.0), and a model trained on
those events now serves urban flash-flood forecasts inside Flood Hub,
alongside riverine forecasts that reach 2 billion people in 150 countries.
The dataset is the training signal; the model learns where floods get
reported given rainfall, terrain, and antecedent conditions.

## Training data for a Canadian v2

1. **Labels**: Groundsource events clipped to Canada (this repo's
   `public/data/points.json` pipeline, scripts/build_groundsource.py).
   21,983 events, 2000-2026. Treat as positive-only labels with known
   news-coverage bias; sample negatives from non-event days and places.
2. **Rainfall features**: MSC Datamart radar precipitation accumulations
   (RADAR_1KM_RRAI and the URPP 8h/14h products) and MSC GeoMet quantitative
   precipitation forecasts, lagged 1-72h before each event.
3. **Terrain features**: Canadian Digital Elevation Model derivatives
   (slope, topographic wetness index) at the event locations.
4. **Antecedent conditions**: prior 7-day precipitation totals from the
   same radar products; snowmelt season flag from MSC data.
5. **Validation**: hold out whole years (e.g., train to 2020, validate on
   the 2021 BC atmospheric river and 2013 Alberta floods) rather than
   random splits, so the metric measures generalization to unseen storms.

## Serving surface

- Batch inference every 6 hours over a fixed Canadian grid, writing
  per-cell 24h flash-flood probability to a tile layer the map already
  knows how to render.
- The existing v1 watch rule stays as the fallback whenever the model
  service is stale or unavailable; the UI labels which signal is shown.
- Calibration is mandatory before any public probability is displayed:
  reliability diagrams on the held-out years, published in docs/.

## What v2 will not do

- It will not predict water levels or arrival times (that needs
  hydrological routing, a different model family).
- It will not fix the news-bias problem; the plan must include
  reweighting or explicit uncertainty for under-reported regions.
- It will not run until the validation above is published. An
  uncalibrated probability on a public dashboard is worse than the v1
  heuristic.
