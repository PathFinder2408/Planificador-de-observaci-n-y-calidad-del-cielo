"use client";

import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { OBSERVATORY_SITES } from "@/data/sites";
import type { ObservationResponse } from "@/lib/types/observation";
import { AltitudeChart } from "@/components/AltitudeChart";
import { AuthBar, type AuthUser } from "@/components/AuthBar";
import { ObjectsTable } from "@/components/ObjectsTable";
import { ObservatoryRadialMap } from "@/components/ObservatoryRadialMap";
import { SiteSelector } from "@/components/SiteSelector";
import { TelemetryRail } from "@/components/TelemetryRail";

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
        /* ignore abort */
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
          throw new Error(body.error ?? `No se pudo consultar la noche (HTTP ${response.status}).`);
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
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar las efemérides. Intenta recargar la página."
        );
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
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border-hairline)] pb-5">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Planificador de observación astronómica
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Efemérides y calidad atmosférica nocturna para observatorios de la Región de Coquimbo y
            el norte de Chile.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <button
              type="button"
              onClick={() => void handleToggleFavorite("site", siteId)}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)]"
            >
              <Star
                className={`h-3.5 w-3.5 ${
                  isSiteFavorite
                    ? "fill-[var(--accent-sodium)] text-[var(--accent-sodium)]"
                    : "text-[var(--text-secondary)]"
                }`}
                aria-hidden="true"
              />
              {isSiteFavorite ? "Sitio guardado" : "Guardar sitio"}
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
        <div
          role="alert"
          className="rounded-lg border border-[var(--signal-bad)] bg-[var(--bg-surface)] p-4 text-sm text-[var(--text-primary)]"
        >
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-10 text-center text-sm text-[var(--text-secondary)]">
          Calculando efemérides y consultando pronóstico atmosférico...
        </div>
      )}

      {data && (
        <>
          <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
            <div className="min-w-0 lg:col-span-8">
              <ObservatoryRadialMap
                site={data.site}
                ephemeris={data.ephemeris}
                planets={data.visibility.planets}
                messier={data.visibility.messier}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
              />
            </div>

            <div className="min-w-0 lg:col-span-4">
              <TelemetryRail
                site={data.site}
                ephemeris={data.ephemeris}
                weather={data.weather}
                weatherWarning={data.weatherWarning}
              />
            </div>
          </div>

          <AltitudeChart
            ephemeris={data.ephemeris}
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
