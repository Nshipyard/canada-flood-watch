"use client";

import { useEffect, useState } from "react";
import { useLang, MONTHS, PROVINCE_FR } from "@/i18n";

function useJson<T>(path: string): T | null {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    let live = true;
    fetch(path)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (live) setData(j);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [path]);
  return data;
}

export function useFloodData() {
  const summary = useJson<{ total_events_canada: number; date_range: [string, string]; built: string }>(
    "/data/summary.json"
  );
  const byYear = useJson<Record<string, number>>("/data/by_year.json");
  const byMonth = useJson<Record<string, number>>("/data/by_month.json");
  const byProvince = useJson<Record<string, number>>("/data/by_province.json");
  const bc = useJson<{ line_features: number; structures: number; dike_km: number }>("/data/bc_protection.json");
  const cfmByProv = useJson<Record<string, number>>("/data/cfm_by_province.json");
  return { summary, byYear, byMonth, byProvince, bc, cfmByProv };
}

const BAR = "#0b5fa5";

export function YearChart() {
  const { t } = useLang();
  const { byYear } = useFloodData();
  if (!byYear) return <div className="h-48 animate-pulse rounded-xl bg-muted" />;
  const entries = Object.entries(byYear).map(([y, v]) => ({ y: +y, v }));
  const max = Math.max(...entries.map((e) => e.v));
  const W = 720, H = 200, pad = 28;
  const bw = (W - pad * 2) / entries.length;
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={t.history.byYear}>
        {entries.map((e, i) => {
          const h = (e.v / max) * (H - pad * 2);
          return (
            <g key={e.y}>
              <rect
                x={pad + i * bw + 1}
                y={H - pad - h}
                width={Math.max(1, bw - 2)}
                height={h}
                fill={BAR}
                opacity={0.85}
              >
                <title>{`${e.y}: ${e.v.toLocaleString()}`}</title>
              </rect>
              {i % 5 === 0 && (
                <text x={pad + i * bw} y={H - 10} fontSize="10" fill="rgba(10,15,30,.55)">{e.y}</text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 text-[13px] text-ink/55">{t.history.byYearSub}</figcaption>
    </figure>
  );
}

export function MonthChart() {
  const { t, lang } = useLang();
  const { byMonth } = useFloodData();
  if (!byMonth) return <div className="h-48 animate-pulse rounded-xl bg-muted" />;
  const total = Object.values(byMonth).reduce((a, b) => a + b, 0);
  const months = MONTHS[lang];
  const entries = Array.from({ length: 12 }, (_, i) => ({
    m: months[i],
    v: byMonth[String(i + 1)] ?? 0,
  }));
  const max = Math.max(...entries.map((e) => e.v));
  const W = 720, H = 200, pad = 28;
  const bw = (W - pad * 2) / 12;
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={t.history.byMonth}>
        {entries.map((e, i) => {
          const h = (e.v / max) * (H - pad * 2);
          return (
            <g key={i}>
              <rect
                x={pad + i * bw + 4}
                y={H - pad - h}
                width={bw - 8}
                height={h}
                fill={BAR}
                opacity={0.85}
              >
                <title>{`${e.m}: ${((e.v / total) * 100).toFixed(1)}%`}</title>
              </rect>
              <text x={pad + i * bw + bw / 2} y={H - 10} fontSize="10" textAnchor="middle" fill="rgba(10,15,30,.55)">{e.m}</text>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 text-[13px] text-ink/55">{t.history.byMonthSub}</figcaption>
    </figure>
  );
}

export function ProvinceChart() {
  const { t, lang } = useLang();
  const { byProvince, summary } = useFloodData();
  if (!byProvince || !summary) return <div className="h-64 animate-pulse rounded-xl bg-muted" />;
  const entries = Object.entries(byProvince).map(([p, v]) => ({ p, v }));
  const max = Math.max(...entries.map((e) => e.v));
  const W = 720, rowH = 30, H = entries.length * rowH + 16;
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={t.history.byProvince}>
        {entries.map((e, i) => {
          const w = (e.v / max) * (W - 280);
          const label = lang === "fr" ? PROVINCE_FR[e.p] ?? e.p : e.p;
          const valX = 208 + Math.max(2, w);
          return (
            <g key={e.p}>
              <text x={0} y={i * rowH + 20} fontSize="12" fill="rgba(10,15,30,.8)">{label}</text>
              <rect x={200} y={i * rowH + 8} width={Math.max(2, w)} height={14} fill={BAR} opacity={0.85}>
                <title>{`${label}: ${e.v.toLocaleString()}`}</title>
              </rect>
              <text x={valX} y={i * rowH + 20} fontSize="12" fill="rgba(10,15,30,.6)">
                {e.v.toLocaleString()}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 text-[13px] text-ink/55">{t.history.byProvinceSub}</figcaption>
    </figure>
  );
}
