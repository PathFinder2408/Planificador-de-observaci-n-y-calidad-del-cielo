"use client";

import { useEffect, useMemo, useState } from "react";
import { OBSERVATORY_SITES } from "@/data/sites";
import type { ObservationResponse } from "@/lib/types/observation";
import { AltitudeChart } from "@/components/AltitudeChart";
import { ObjectsTable } from "@/components/ObjectsTable";
import { SiteSelector } from "@/components/SiteSelector";
import { SummaryCards } from "@/components/SummaryCards";

function getTodayInChile(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string): string => parts.find((p) => p.type === t)?.value ?? "01";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function ObservationPlanner() {
  const [siteId, setSiteId] = useState<string>("vera-rubin");
  const [date, setDate] = useState<string>(() => getTodayInChile());
  const [data, setData] = useState<ObservationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    fetch(
      `/api/observation?siteId=${encodeURIComponent(siteId)}&date=${encodeURIComponent(date)}`,
      {
        signal: controller.signal,
      }
    )
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `Error HTTP ${response.status}`);
        }
        return (await response.json()) as ObservationResponse;
      })
      .then((payload) => {
        setData(payload);
        setError(null);
        setSelectedIds((prev) => {
          if (prev.length > 0) return prev;
          return [...payload.visibility.planets, ...payload.visibility.messier]
            .filter((t) => t.isObservable)
            .sort((a, b) => b.maxAltitudeDeg - a.maxAltitudeDeg)
            .slice(0, 3)
            .map((t) => t.id);
        });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setError(err instanceof Error ? err.message : "Error cargando datos de observación");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [siteId, date]);

  const handleSiteChange = (nextSiteId: string) => {
    setLoading(true);
    setSiteId(nextSiteId);
  };

  const handleDateChange = (nextDate: string) => {
    setLoading(true);
    setDate(nextDate);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 5) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const selectedTargets = useMemo(() => {
    if (!data) return [];
    const all = [...data.visibility.planets, ...data.visibility.messier];
    return all.filter((item) => selectedIds.includes(item.id));
  }, [data, selectedIds]);

  return (
    <div className="space-y-6">
      <SiteSelector
        sites={OBSERVATORY_SITES}
        selectedSiteId={siteId}
        selectedDate={date}
        loading={loading}
        onSiteChange={handleSiteChange}
        onDateChange={handleDateChange}
      />

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-10 text-center text-sm text-slate-400">
          Calculando efemérides astronómicas y consultando pronóstico meteorológico...
        </div>
      )}

      {data && (
        <>
          <SummaryCards
            ephemeris={data.ephemeris}
            weather={data.weather}
            weatherWarning={data.weatherWarning}
          />
          <AltitudeChart
            sampleTimesChile={data.visibility.sampleTimesChile}
            selectedTargets={selectedTargets}
          />
          <ObjectsTable
            planets={data.visibility.planets}
            messier={data.visibility.messier}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
          />
        </>
      )}
    </div>
  );
}
