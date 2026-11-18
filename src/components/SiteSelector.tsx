"use client";

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
  return (
    <section
      aria-label="Selección de observatorio y fecha"
      className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4"
    >
      <div className="grid gap-4 sm:grid-cols-12 sm:items-end">
        <div className="sm:col-span-8">
          <label
            htmlFor="site-select"
            className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
          >
            Observatorio o estación base
          </label>
          <select
            id="site-select"
            value={selectedSiteId}
            disabled={loading}
            onChange={(e) => onSiteChange(e.target.value)}
            className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] disabled:opacity-60"
          >
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name} ({site.region}, {site.elevationMeters} m)
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-4">
          <label
            htmlFor="date-input"
            className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
          >
            Fecha de observación (Chile)
          </label>
          <input
            id="date-input"
            type="date"
            value={selectedDate}
            disabled={loading}
            onChange={(e) => onDateChange(e.target.value)}
            className="font-mono-tabular w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] disabled:opacity-60"
          />
        </div>
      </div>
    </section>
  );
}
