"use client";

import { useMemo, useState } from "react";
import { Check, Eye, Star } from "lucide-react";
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

type FilterMode = "all" | "planets" | "messier" | "observable";

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
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">
            Objetos visibles en la noche ({rows.length})
          </h2>
          <p className="text-xs text-slate-400">
            Marca hasta 5 objetos para compararlos en el gráfico de altitud.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["all", "Todos"],
              ["observable", "Observables (≥20°)"],
              ["planets", "Planetas"],
              ["messier", "Catálogo Messier"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filter === key
                  ? "bg-sky-500 text-slate-950"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
              <th className="py-2.5 pr-3">Graficar</th>
              {canFavorite && <th className="py-2.5 pr-3">Fav</th>}
              <th className="py-2.5 pr-3">Objeto</th>
              <th className="py-2.5 pr-3">Tipo</th>
              <th className="py-2.5 pr-3">Constelación</th>
              <th className="py-2.5 pr-3 text-right">Alt. Máx</th>
              <th className="py-2.5 pr-3 text-right">Mejor Hora</th>
              <th className="py-2.5 pr-3 text-right">Tiempo ≥20°</th>
              <th className="py-2.5 text-right">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {rows.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <tr key={item.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 pr-3">
                    <button
                      type="button"
                      onClick={() => onToggleSelect(item.id)}
                      aria-label={`Graficar ${item.name}`}
                      className={`flex h-6 w-6 items-center justify-center rounded-md border transition ${
                        isSelected
                          ? "border-sky-400 bg-sky-500 text-slate-950"
                          : "border-slate-700 bg-slate-950 text-transparent hover:border-slate-500"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  </td>
                  {canFavorite && (
                    <td className="py-2.5 pr-3">
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(item.id)}
                        aria-label={`Favorito ${item.name}`}
                        className="text-slate-400 transition hover:text-amber-400"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            favoriteTargetIds.includes(item.id)
                              ? "fill-amber-400 text-amber-400"
                              : ""
                          }`}
                        />
                      </button>
                    </td>
                  )}
                  <td className="py-2.5 pr-3 font-medium text-white">{item.name}</td>
                  <td className="py-2.5 pr-3 text-xs text-slate-300">{item.category}</td>
                  <td className="py-2.5 pr-3 text-xs text-slate-400">{item.constellation}</td>
                  <td className="py-2.5 pr-3 text-right font-mono text-sky-300">
                    {item.maxAltitudeDeg}°
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono text-slate-200">
                    {item.bestTimeChile}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono text-slate-300">
                    {(item.visibleMinutes / 60).toFixed(1)} h
                  </td>
                  <td className="py-2.5 text-right">
                    {item.isObservable ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
                        <Eye className="h-3 w-3" />
                        Visible
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
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
