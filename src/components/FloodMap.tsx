"use client";

import { useEffect, useRef, useState } from "react";
import type L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLang } from "@/i18n";

export interface FloodPoint {
  lon: number;
  lat: number;
  date: string;
  area: number | null;
  prov: string;
}

interface CfmStudy {
  name: string;
  prov: string;
  date: string | null;
  status: string | null;
  owner: string | null;
  lon: number | null;
  lat: number | null;
}

const GEOMET = "https://geo.weather.gc.ca/geomet";
const BC_OWS = "https://openmaps.gov.bc.ca/geo/pub/ows";

export default function FloodMap() {
  const { t, lang } = useLang();
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<Record<string, L.Layer>>({});
  const [on, setOn] = useState({ history: true, studies: false, radar: false, alerts: false, protection: false });
  const [alertInfo, setAlertInfo] = useState<string | null>(null);
  const [alertLoading, setAlertLoading] = useState(false);
  const [built, setBuilt] = useState("");
  const onRef = useRef(on);
  onRef.current = on;
  const langRef = useRef(lang);
  langRef.current = lang;
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    let live = true;
    fetch("/data/summary.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (live && j) setBuilt(j.built ?? "");
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const leaflet = (await import("leaflet")).default;
      if (cancelled || !divRef.current || mapRef.current) return;
      const map = leaflet.map(divRef.current, {
        worldCopyJump: true,
        zoomControl: true,
        scrollWheelZoom: false,
      });
      mapRef.current = map;
      map.setView([56, -106], 4);

      leaflet
        .tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 12,
          minZoom: 3,
        })
        .addTo(map);

      const mk = (l: L.Layer, key: string) => {
        layersRef.current[key] = l;
        if (onRef.current[key as keyof typeof onRef.current]) l.addTo(map);
      };

      // 1. Historical flood events (canvas-rendered for performance)
      const canvas = leaflet.canvas();
      const hist = leaflet.layerGroup([]);
      try {
        const pts: FloodPoint[] = await (await fetch("/data/points.json")).json();
        for (const p of pts) {
          leaflet
            .circleMarker([p.lat, p.lon], {
              renderer: canvas,
              radius: 3,
              color: "#0b5fa5",
              weight: 0,
              fillColor: "#0b5fa5",
              fillOpacity: 0.55,
            })
            .bindTooltip(`${p.date} · ${p.prov}`, { direction: "top", opacity: 0.92 })
            .addTo(hist);
        }
      } catch {
        /* historical layer optional at runtime */
      }
      mk(hist, "history");

      // 2. Flood hazard study areas (CFM centroids)
      const studies = leaflet.layerGroup([]);
      try {
        const rows: CfmStudy[] = await (await fetch("/data/cfm_studies.json")).json();
        for (const s of rows) {
          if (s.lon == null || s.lat == null) continue;
          leaflet
            .circleMarker([s.lat, s.lon], {
              renderer: canvas,
              radius: 3,
              color: "#6b7280",
              weight: 1,
              fillColor: "#9ca3af",
              fillOpacity: 0.7,
            })
            .bindTooltip(`${s.name} (${s.prov})`, { direction: "top", opacity: 0.92 })
            .addTo(studies);
        }
      } catch {
        /* optional */
      }
      mk(studies, "studies");

      // 3. Live ECCC precipitation radar (1 km mosaic, mm/h)
      mk(
        leaflet.tileLayer.wms(GEOMET, {
          layers: "RADAR_1KM_RRAI",
          format: "image/png",
          transparent: true,
          opacity: 0.65,
          attribution: "Environment and Climate Change Canada",
        }),
        "radar"
      );

      // 4. Current ECCC weather alerts
      mk(
        leaflet.tileLayer.wms(GEOMET, {
          layers: langRef.current === "fr" ? "Alertes-en-cours" : "Current-Alerts",
          format: "image/png",
          transparent: true,
          opacity: 0.8,
          attribution: "Environment and Climate Change Canada",
        }),
        "alerts"
      );

      // 5. BC flood protection works (lines + structures)
      const bc = leaflet.layerGroup();
      leaflet
        .tileLayer.wms(BC_OWS, {
          layers: "pub:WHSE_WATER_MANAGEMENT.FPW_FLOOD_PROTECTION_WRK_LINE",
          format: "image/png",
          transparent: true,
          attribution: "Government of British Columbia",
        })
        .addTo(bc);
      leaflet
        .tileLayer.wms(BC_OWS, {
          layers: "pub:WHSE_WATER_MANAGEMENT.FPW_APPURTENANT_STRUCTURE_SVW",
          format: "image/png",
          transparent: true,
          attribution: "Government of British Columbia",
        })
        .addTo(bc);
      mk(bc, "protection");

      // Click to query official alert details via WMS GetFeatureInfo
      map.on("click", async (e: L.LeafletMouseEvent) => {
        if (!onRef.current.alerts) return;
        setAlertLoading(true);
        setAlertInfo(null);
        try {
          const size = map.getSize();
          const b = map.getBounds();
          const sw = map.options.crs!.project(b.getSouthWest());
          const ne = map.options.crs!.project(b.getNorthEast());
          const p = map.latLngToContainerPoint(e.latlng);
          const params = new URLSearchParams({
            service: "WMS",
            version: "1.3.0",
            request: "GetFeatureInfo",
            layers: langRef.current === "fr" ? "Alertes-en-cours" : "Current-Alerts",
            query_layers: langRef.current === "fr" ? "Alertes-en-cours" : "Current-Alerts",
            info_format: "text/plain",
            crs: "EPSG:3857",
            bbox: `${sw.x},${sw.y},${ne.x},${ne.y}`,
            width: String(size.x),
            height: String(size.y),
            i: String(Math.round(p.x)),
            j: String(Math.round(p.y)),
          });
          const r = await fetch(`${GEOMET}?${params.toString()}`);
          const txt = (await r.text()).trim();
          setAlertInfo(txt && !/no features|no data/i.test(txt) ? txt : tRef.current.map.noAlert);
        } catch {
          setAlertInfo(tRef.current.map.noAlert);
        } finally {
          setAlertLoading(false);
        }
      });

      setTimeout(() => {
        if (!cancelled) map.invalidateSize();
      }, 250);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle layers from React state
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    (Object.keys(on) as (keyof typeof on)[]).forEach((k) => {
      const layer = layersRef.current[k];
      if (!layer) return;
      if (on[k]) {
        if (!map.hasLayer(layer)) layer.addTo(map);
      } else if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });
  }, [on]);

  const toggle = (k: keyof typeof on) => setOn((s) => ({ ...s, [k]: !s[k] }));

  const items: { key: keyof typeof on; label: string; swatch: string }[] = [
    { key: "history", label: t.map.lHistory, swatch: "#0b5fa5" },
    { key: "studies", label: t.map.lStudies, swatch: "#9ca3af" },
    { key: "radar", label: t.map.lRadar, swatch: "linear-gradient(90deg,#bfe3ff,#0b5fa5)" },
    { key: "alerts", label: t.map.lAlerts, swatch: "#d80621" },
    { key: "protection", label: t.map.lProtection, swatch: "#166534" },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[13px] font-semibold uppercase tracking-wide text-ink/50">{t.map.layers}</span>
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => toggle(it.key)}
            aria-pressed={on[it.key]}
            className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[14px] font-medium transition-colors ${
              on[it.key] ? "border-ink bg-ink text-white" : "border-line bg-paper text-ink/70 hover:border-ink/40"
            }`}
          >
            <span
              className="inline-block h-3 w-3 rounded-full border border-black/10"
              style={{ background: it.swatch }}
              aria-hidden="true"
            />
            {it.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-line">
        <div ref={divRef} className="h-[420px] w-full md:h-[560px]" />
      </div>
      <p className="mt-2 text-[13px] text-ink/55">{t.map.clickHint}</p>

      {(alertLoading || alertInfo) && (
        <div className="mt-3 rounded-xl border border-line bg-paper-warm p-4">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-[14px] font-semibold">{t.map.alertAt}</h3>
            <button onClick={() => { setAlertInfo(null); setAlertLoading(false); }} className="text-[13px] font-medium text-ink/60 hover:text-ink">
              {t.map.close}
            </button>
          </div>
          {alertLoading ? (
            <p className="mt-1 text-[14px] text-ink/60">…</p>
          ) : (
            <pre className="mt-1 max-h-56 overflow-auto whitespace-pre-wrap text-[13px] leading-relaxed text-ink/80">{alertInfo}</pre>
          )}
        </div>
      )}

      <div className="mt-4 rounded-xl border border-line bg-paper-warm p-4">
        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink/50">{t.map.timestamps}</h3>
        <p className="mt-1 text-[14px] text-ink/75">{t.map.histNote.replace("{built}", built)}</p>
        <p className="mt-1 text-[14px] text-ink/75">{t.map.liveNote}</p>
      </div>
    </div>
  );
}
