"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useLang, MONTHS, PROVINCE_FR } from "@/i18n";
import { Banner, Nav, Footer } from "@/components/chrome";
import { useFloodData, YearChart, MonthChart, ProvinceChart } from "@/components/Charts";

const FloodMap = dynamic(() => import("@/components/FloodMap"), { ssr: false });

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-canada">{children}</p>
  );
}

function SectionHead({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <div className="max-w-[720px]">
      <Kicker>{kicker}</Kicker>
      <h2 className="display mt-3 text-[34px] md:text-[44px]">{title}</h2>
      <p className="mt-4 text-[16px] leading-relaxed text-ink/70">{body}</p>
    </div>
  );
}

function Hero() {
  const { t } = useLang();
  const { summary, byProvince, bc } = useFloodData();
  const total = summary ? summary.total_events_canada.toLocaleString() : "…";
  const nProv = byProvince ? String(Object.keys(byProvince).length) : "…";
  const stats = [
    { value: total, label: t.stats.events },
    { value: nProv, label: t.stats.provinces },
    { value: "675", label: t.stats.studies },
    { value: bc ? bc.structures.toLocaleString() : "…", label: t.stats.structures },
  ];
  return (
    <section id="top" className="border-b border-line">
      <div className="mx-auto max-w-[1392px] px-6 pb-14 pt-14 md:pt-20">
        <Kicker>{t.hero.kicker}</Kicker>
        <h1 className="display mt-4 max-w-[12ch] text-[52px] md:text-[84px]">{t.hero.title}</h1>
        <p className="mt-6 max-w-[680px] text-[18px] leading-relaxed text-ink/70">{t.hero.sub}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#map" className="rounded-full bg-canada px-6 py-3 text-[15px] font-semibold text-white hover:bg-canada-dark">
            {t.hero.cta1}
          </a>
          <a href="#watch" className="rounded-full border border-ink/25 px-6 py-3 text-[15px] font-semibold hover:border-ink">
            {t.hero.cta2}
          </a>
        </div>
        <dl className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col bg-paper p-6">
              <dd className="display order-1 text-[38px] text-ink">{s.value}</dd>
              <dt className="order-2 mt-2 block text-[13px] leading-snug text-ink/55">{s.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function WatchTable() {
  const { t, lang } = useLang();
  const { byProvince, summary, byMonth } = useFloodData();
  const peakMonth = usePeakMonth();
  if (!byProvince || !summary) return <div className="h-48 animate-pulse rounded-xl bg-muted" />;
  const total = summary.total_events_canada;
  const entries = Object.entries(byProvince)
    .map(([p, v]) => ({ p, v }))
    .slice(0, 10);
  const months = MONTHS[lang];
  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <table className="w-full text-left text-[15px]">
        <thead>
          <tr className="border-b border-line bg-paper-warm text-[13px] uppercase tracking-wide text-ink/55">
            <th className="px-5 py-3 font-semibold">{t.watch.thProvince}</th>
            <th className="px-5 py-3 text-right font-semibold">{t.watch.thEvents}</th>
            <th className="px-5 py-3 text-right font-semibold">{t.watch.thPeak}</th>
            <th className="hidden px-5 py-3 text-right font-semibold sm:table-cell">{t.watch.thShare}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.p} className="border-b border-line/60 last:border-0">
              <td className="px-5 py-3 font-medium">{lang === "fr" ? PROVINCE_FR[e.p] ?? e.p : e.p}</td>
              <td className="px-5 py-3 text-right tabular-nums">{e.v.toLocaleString()}</td>
              <td className="px-5 py-3 text-right text-ink/70">
                {peakMonth && peakMonth[e.p] ? months[+peakMonth[e.p] - 1] : "-"}
              </td>
              <td className="hidden px-5 py-3 text-right tabular-nums text-ink/70 sm:table-cell">
                {((e.v / total) * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function usePeakMonth() {
  const [pm, setPm] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/data/peak_month_by_province.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (live) setPm(j);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return pm;
}

export default function Page() {
  const { t, lang } = useLang();
  const { cfmByProv, bc } = useFloodData();
  return (
    <>
      <Banner />
      <Nav />
      <main>
        <Hero />

        <section id="map" className="border-b border-line bg-paper-warm">
          <div className="mx-auto max-w-[1392px] px-6 py-14 md:py-20">
            <SectionHead kicker={t.map.kicker} title={t.map.title} body={t.map.body} />
            <div className="mt-8">
              <FloodMap />
            </div>
          </div>
        </section>

        <section id="history" className="border-b border-line">
          <div className="mx-auto max-w-[1392px] px-6 py-14 md:py-20">
            <SectionHead kicker={t.history.kicker} title={t.history.title} body={t.history.body} />
            <div className="mt-10 grid gap-10 lg:grid-cols-2">
              <div className="rounded-2xl border border-line p-6">
                <h3 className="display text-[22px]">{t.history.byYear}</h3>
                <div className="mt-4"><YearChart /></div>
              </div>
              <div className="rounded-2xl border border-line p-6">
                <h3 className="display text-[22px]">{t.history.byMonth}</h3>
                <div className="mt-4"><MonthChart /></div>
              </div>
            </div>
            <div className="mt-10 rounded-2xl border border-line p-6">
              <h3 className="display text-[22px]">{t.history.byProvince}</h3>
              <div className="mt-4 max-w-[760px]"><ProvinceChart /></div>
            </div>
            <div className="mt-10 max-w-[760px] rounded-2xl border border-line bg-paper-warm p-6">
              <h3 className="text-[15px] font-semibold">{t.history.caveatsTitle}</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-ink/70">
                {t.history.caveats.map((c) => (
                  <li key={c.slice(0, 24)}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="watch" className="border-b border-line bg-paper-warm">
          <div className="mx-auto max-w-[1392px] px-6 py-14 md:py-20">
            <SectionHead kicker={t.watch.kicker} title={t.watch.title} body={t.watch.body} />
            <div className="mt-10 max-w-[760px] rounded-2xl border border-line bg-paper p-6">
              <h3 className="text-[15px] font-semibold">{t.watch.ruleTitle}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink/70">{t.watch.rule}</p>
            </div>
            <h3 className="display mt-12 text-[26px]">{t.watch.tableTitle}</h3>
            <p className="mt-2 text-[14px] text-ink/55">{t.watch.tableSub}</p>
            <div className="mt-4 max-w-[860px]"><WatchTable /></div>
            <div className="mt-10 max-w-[760px]">
              <h3 className="text-[15px] font-semibold">{t.watch.howto}</h3>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-ink/70">
                {t.watch.steps.map((s) => (
                  <li key={s.slice(0, 24)}>{s}</li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="protection" className="border-b border-line">
          <div className="mx-auto max-w-[1392px] px-6 py-14 md:py-20">
            <SectionHead kicker={t.protection.kicker} title={t.protection.title} body={t.protection.body} />
            <dl className="mt-10 grid max-w-[860px] gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
              <div className="bg-paper p-6">
                <dd className="display text-[38px]">{bc ? bc.dike_km.toLocaleString() : "…"}</dd>
                <dt className="mt-2 text-[13px] text-ink/55">{t.protection.lineKm}</dt>
              </div>
              <div className="bg-paper p-6">
                <dd className="display text-[38px]">{bc ? bc.structures.toLocaleString() : "…"}</dd>
                <dt className="mt-2 text-[13px] text-ink/55">{t.protection.structures}</dt>
              </div>
            </dl>
            <p className="mt-4 max-w-[680px] text-[14px] text-ink/55">{t.protection.note}</p>
            <div className="mt-10 max-w-[760px] rounded-2xl border border-line bg-paper-warm p-6">
              <h3 className="display text-[22px]">{t.protection.cfmTitle}</h3>
              <p className="mt-2 text-[15px] text-ink/70">{t.protection.cfmBody}</p>
              {cfmByProv && (
                <ul className="mt-4 grid grid-cols-2 gap-2 text-[14px] sm:grid-cols-3">
                  {Object.entries(cfmByProv).map(([p, v]) => (
                    <li key={p} className="flex justify-between border-b border-line/60 py-1.5">
                      <span className="text-ink/75">{lang === "fr" ? PROVINCE_FR[p] ?? p : p}</span>
                      <span className="font-semibold tabular-nums">{v}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section id="method" className="border-b border-line bg-paper-warm">
          <div className="mx-auto max-w-[1392px] px-6 py-14 md:py-20">
            <SectionHead kicker={t.method.kicker} title={t.method.title} body="" />
            <MethodItems />
          </div>
        </section>

        <section id="data" className="border-b border-line">
          <div className="mx-auto max-w-[1392px] px-6 py-14 md:py-20">
            <SectionHead kicker={t.data.kicker} title={t.data.title} body={t.data.body} />
            <DataFiles />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function MethodItems() {
  const { t } = useLang();
  const { summary } = useFloodData();
  const total = summary ? summary.total_events_canada.toLocaleString() : "…";
  return (
    <ol className="mt-8 max-w-[800px] list-decimal space-y-4 pl-5 text-[15px] leading-relaxed text-ink/75">
      {t.method.items.map((it) => (
        <li key={it.slice(0, 32)}>{it.replace("{total}", total)}</li>
      ))}
    </ol>
  );
}

function DataFiles() {
  const { t } = useLang();
  return (
    <ul className="mt-8 grid max-w-[1000px] gap-4 md:grid-cols-2">
      {t.data.files.map((f) => (
        <li key={f.name} className="flex items-center justify-between gap-4 rounded-2xl border border-line p-5">
          <div>
            <p className="font-mono text-[14px] font-semibold">{f.name}</p>
            <p className="mt-1 text-[14px] text-ink/60">{f.desc}</p>
          </div>
          <a
            href={`/data/${f.name}`}
            download
            className="shrink-0 rounded-full border border-ink/25 px-4 py-2 text-[14px] font-medium hover:border-ink"
          >
            {t.data.download}
          </a>
        </li>
      ))}
    </ul>
  );
}
