"use client";

import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { OBSERVATORY_SITES } from "@/data/sites";
import type { ObservationResponse } from "@/lib/types/observation";
import { AltitudeChart } from "@/components/AltitudeChart";
import { AuthBar, type AuthUser } from "@/components/AuthBar";
import { ObjectsTable } from "@/components/ObjectsTable";
import { SiteSelector } from "@/components/SiteSelector";
import { SummaryCards } from "@/components/SummaryCards";

interface FavoriteItem {
  kind: "site" | "target";
  item_id: string;
}

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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/me", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((body: { user: AuthUser | null }) => {
        setUser(body.user);
      })
      .catch(() => {
        /* ignore abort or offline auth check */
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    fetch("/api/favorites", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : { favorites: [] }))
      .then((body: { favorites?: FavoriteItem[] }) => {
        setFavorites(body.favorites ?? []);
      })
      .catch(() => {
        /* ignore abort */
      });
    return () => controller.abort();
  }, [user]);

  useEffect(() => {
    const controller = new AbortController();

    fetch(
      `/api/observation?siteId=${encodeURIComponent(siteId)}&date=${encodeURIComponent(date)}`,
      { signal: controller.signal }
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

  const handleAuthChange = (nextUser: AuthUser | null) => {
    setUser(nextUser);
    if (!nextUser) {
      setFavorites([]);
    }
  };

  const handleToggleFavorite = async (kind: "site" | "target", itemId: string) => {
    if (!user) return;
    const exists = favorites.some((f) => f.kind === kind && f.item_id === itemId);
    if (exists) {
      const res = await fetch(
        `/api/favorites?kind=${encodeURIComponent(kind)}&itemId=${encodeURIComponent(itemId)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setFavorites((prev) => prev.filter((f) => !(f.kind === kind && f.item_id === itemId)));
      }
    } else {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, itemId }),
      });
      if (res.ok) {
        setFavorites((prev) => [...prev, { kind, item_id: itemId }]);
      }
    }
  };

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

  const favoriteTargetIds = useMemo(
    () => favorites.filter((f) => f.kind === "target").map((f) => f.item_id),
    [favorites]
  );

  const isSiteFavorite = favorites.some((f) => f.kind === "site" && f.item_id === siteId);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-400">
            Región de Coquimbo &amp; Observatorios de Chile
          </p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Planificador de Observación y Calidad del Cielo
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-400">
            Efemérides calculadas en{" "}
            <span className="font-mono text-slate-300">America/Santiago</span> con{" "}
            <span className="font-mono text-slate-300">astronomy-engine</span> e índice de calidad
            nocturna con datos reales de Open-Meteo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <button
              type="button"
              onClick={() => void handleToggleFavorite("site", siteId)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 hover:border-amber-400/60"
            >
              <Star
                className={`h-3.5 w-3.5 ${isSiteFavorite ? "fill-amber-400 text-amber-400" : "text-slate-400"}`}
              />
              {isSiteFavorite ? "Sitio favorito" : "Guardar sitio"}
            </button>
          )}
          <AuthBar user={user} onAuthChange={handleAuthChange} />
        </div>
      </header>

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
            favoriteTargetIds={favoriteTargetIds}
            canFavorite={Boolean(user)}
            onToggleSelect={handleToggleSelect}
            onToggleFavorite={(id) => void handleToggleFavorite("target", id)}
          />
        </>
      )}
    </div>
  );
}
