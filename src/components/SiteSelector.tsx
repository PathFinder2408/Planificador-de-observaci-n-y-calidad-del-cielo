"use client";

import { Calendar, MapPin, Telescope } from "lucide-react";
import type { ObservatorySite } from "@/data/sites";

interface SiteSelectorProps {
  sites: readonly ObservatorySite[];
  selectedSiteId: string;
  selectedDate: string;
  loading: boolean;
  onSiteChange: (siteId: string) => void;
  onDateChange: (date: string) => void;
}

export function SiteSelector({
  sites,
  selectedSiteId,
  selectedDate,
  loading,
  onSiteChange,
  onDateChange,
}: SiteSelectorProps) {
  const activeSite = sites.find((s) => s.id === selectedSiteId);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg">
      <div className="grid gap-4 md:grid-cols-12 md:items-end">
        <div className="md:col-span-6">
          <label
            htmlFor="site-select"
            className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
          >
            <Telescope className="h-4 w-4 text-sky-400" />
            Observatorio o sitio de observación
          </label>
          <select
            id="site-select"
            value={selectedSiteId}
            disabled={loading}
            onChange={(e) => onSiteChange(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:border-sky-500 focus:outline-none disabled:opacity-60"
          >
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name} — {site.region} ({site.elevationMeters} m)
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <label
            htmlFor="date-input"
            className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
          >
            <Calendar className="h-4 w-4 text-sky-400" />
            Fecha de noche (Chile)
          </label>
          <input
            id="date-input"
            type="date"
            value={selectedDate}
            disabled={loading}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:border-sky-500 focus:outline-none disabled:opacity-60"
          />
        </div>

        <div className="md:col-span-3">
          {activeSite && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 font-medium text-sky-300">
                <MapPin className="h-3.5 w-3.5" />
                <span>{activeSite.project}</span>
              </div>
              <p className="mt-0.5 text-slate-400">
                {activeSite.latitude.toFixed(3)}°, {activeSite.longitude.toFixed(3)}° ·{" "}
                {activeSite.elevationMeters} m s. n. m.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
