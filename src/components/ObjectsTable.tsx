"use client";

import { useMemo, useState } from "react";
import { Check, Eye, EyeOff, Star } from "lucide-react";
import type { TargetVisibility } from "@/lib/astro/visibility";

interface ObjectsTableProps {
  planets: TargetVisibility[];
  messier: TargetVisibility[];
  selectedIds: string[];
  favoriteTargetIds: string[];
  canFavorite: boolean;
  onToggleSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

type FilterMode = "all" | "observable" | "planets" | "messier";

function cleanTargetName(rawName: string): string {
  const parts = rawName.split(" · ");
  return parts.length === 2 ? `${parts[0]} (${parts[1]})` : rawName;
}

export function ObjectsTable({
  planets,
  messier,
  selectedIds,
  favoriteTargetIds,
  canFavorite,
  onToggleSelect,
  onToggleFavorite,
}: ObjectsTableProps) {
  const [filter, setFilter] = useState<FilterMode>("all");

  const rows = useMemo(() => {
    const combined = [...planets, ...messier];
    const filtered = combined.filter((item) => {
      if (filter === "planets") return item.category === "Planeta";
      if (filter === "messier") return item.category !== "Planeta";
      if (filter === "observable") return item.isObservable;
      return true;
    });
    return [...filtered].sort((a, b) => b.maxAltitudeDeg - a.maxAltitudeDeg);
  }, [planets, messier, filter]);

  return (
    <section
      aria-label="Tabla de planetas y objetos Messier"
      className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Objetos celestes ({rows.length})
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Selecciona hasta 5 blancos para comparar sus curvas de altitud.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar objetos">
          {(
            [
              ["all", "Todos"],
              ["observable", "Observables"],
              ["planets", "Planetas"],
              ["messier", "Catálogo Messier"],
            ] as const
          ).map(([key, label]) => {
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(key)}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                  active
                    ? "border-[var(--accent-sodium)] bg-[var(--accent-sodium)] text-[var(--accent-sodium-contrast)]"
                    : "border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-hairline)] text-xs font-medium text-[var(--text-secondary)]">
              <th className="py-2 pr-3">Graficar</th>
              {canFavorite && <th className="py-2 pr-3">Favorito</th>}
              <th className="py-2 pr-3">Objeto</th>
              <th className="py-2 pr-3">Tipo</th>
              <th className="py-2 pr-3">Constelación</th>
              <th className="py-2 pr-3 text-right">Alt. máx.</th>
              <th className="py-2 pr-3 text-right">Mejor hora</th>
              <th className="py-2 pr-3 text-right">Horas ≥20°</th>
              <th className="py-2 text-right">Visibilidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-hairline)]">
            {rows.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const isFav = favoriteTargetIds.includes(item.id);
              const label = cleanTargetName(item.name);

              return (
                <tr key={item.id} className="hover:bg-[var(--bg-elevated)]">
                  <td className="py-2.5 pr-3">
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => onToggleSelect(item.id)}
                      aria-label={`Graficar ${label}`}
                      className={`flex h-6 w-6 items-center justify-center rounded border ${
                        isSelected
                          ? "border-[var(--accent-sodium)] bg-[var(--accent-sodium)] text-[var(--accent-sodium-contrast)]"
                          : "border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-transparent"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </td>
                  {canFavorite && (
                    <td className="py-2.5 pr-3">
                      <button
                        type="button"
                        aria-pressed={isFav}
                        onClick={() => onToggleFavorite(item.id)}
                        aria-label={`Guardar favorito ${label}`}
                        className="rounded p-1 text-[var(--text-secondary)] hover:text-[var(--accent-sodium)]"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            isFav ? "fill-[var(--accent-sodium)] text-[var(--accent-sodium)]" : ""
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    </td>
                  )}
                  <td className="py-2.5 pr-3 font-medium text-[var(--text-primary)]">{label}</td>
                  <td className="py-2.5 pr-3 text-xs text-[var(--text-secondary)]">
                    {item.category}
                  </td>
                  <td className="py-2.5 pr-3 text-xs text-[var(--text-secondary)]">
                    {item.constellation}
                  </td>
                  <td className="font-mono-tabular py-2.5 pr-3 text-right text-[var(--text-primary)]">
                    {item.maxAltitudeDeg}°
                  </td>
                  <td className="font-mono-tabular py-2.5 pr-3 text-right text-[var(--text-primary)]">
                    {item.bestTimeChile}
                  </td>
                  <td className="font-mono-tabular py-2.5 pr-3 text-right text-[var(--text-secondary)]">
                    {(item.visibleMinutes / 60).toFixed(1)} h
                  </td>
                  <td className="py-2.5 text-right">
                    {item.isObservable ? (
                      <span
                        className="inline-flex items-center gap-1 text-xs font-medium"
                        style={{ color: "var(--signal-ok)" }}
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        Visible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                        Bajo
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
