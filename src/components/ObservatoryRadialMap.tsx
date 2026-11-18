"use client";

import { useMemo, useState } from "react";
import type { ObservatorySite } from "@/data/sites";
import type { NightEphemeris } from "@/lib/astro/ephemeris";
import type { TargetVisibility } from "@/lib/astro/visibility";

interface ObservatoryRadialMapProps {
  site: ObservatorySite;
  ephemeris: NightEphemeris;
  planets: TargetVisibility[];
  messier: TargetVisibility[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
}

type CategoryKey = "planets" | "nebulae" | "clusters" | "galaxies";

interface CategoryGroup {
  key: CategoryKey;
  label: string;
  items: TargetVisibility[];
  y: number;
}

function cleanShortName(raw: string): string {
  const parts = raw.split(" · ");
  if (parts.length !== 2) return raw;
  const [id, title] = parts;
  const simplified = (title ?? "")
    .replace(/^Cúmulo abierto\s+/i, "")
    .replace(/^Cúmulo globular\s+/i, "")
    .replace(/^Cúmulo de\s+/i, "")
    .replace(/^Cúmulo del\s+/i, "")
    .replace(/^Nebulosa de la\s+/i, "")
    .replace(/^Nebulosa del\s+/i, "")
    .replace(/^Nebulosa de\s+/i, "")
    .replace(/^Nebulosa\s+/i, "")
    .replace(/^Galaxia del\s+/i, "")
    .replace(/^Galaxia de\s+/i, "");
  return simplified && simplified !== id ? `${id} ${simplified}` : (id ?? raw);
}

function shortSiteTitle(name: string): string {
  return name.replace(" Observatory", "").replace("Observatorio ", "");
}

export function ObservatoryRadialMap({
  site,
  ephemeris,
  planets,
  messier,
  selectedIds,
  onToggleSelect,
}: ObservatoryRadialMapProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("clusters");

  const groups: CategoryGroup[] = useMemo(() => {
    const nebulae = messier.filter((m) => m.category === "Nebulosa");
    const clusters = messier.filter(
      (m) => m.category === "Cúmulo abierto" || m.category === "Cúmulo globular"
    );
    const galaxies = messier.filter(
      (m) => m.category === "Galaxia" || m.category === "Nube estelar"
    );

    return [
      { key: "planets", label: "Planetas", items: planets, y: 110 },
      { key: "nebulae", label: "Nebulosas", items: nebulae, y: 196 },
      { key: "clusters", label: "Cúmulos", items: clusters, y: 282 },
      { key: "galaxies", label: "Galaxias y nubes", items: galaxies, y: 368 },
    ];
  }, [planets, messier]);

  const activeGroup = groups.find((g) => g.key === activeCategory) ?? groups[0]!;
  const sortedLeaves = useMemo(
    () => [...activeGroup.items].sort((a, b) => b.maxAltitudeDeg - a.maxAltitudeDeg).slice(0, 12),
    [activeGroup]
  );

  const hubX = 110;
  const hubY = 239;
  const catX = 278;

  return (
    <section
      aria-label="Mapa radial de observación"
      className="relative overflow-hidden rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4"
      style={{
        backgroundImage:
          "radial-gradient(circle at 18% 50%, rgba(229, 152, 56, 0.08), transparent 46%), radial-gradient(circle at 75% 48%, rgba(91, 155, 213, 0.06), transparent 52%)",
      }}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Constelación operativa de blancos
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Elige una categoría para desplegar sus blancos y haz clic en cualquiera para graficar su
            altitud.
          </p>
        </div>
        <span className="font-mono-tabular rounded border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">
          {selectedIds.length} en gráfico
        </span>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox="0 0 780 470"
          className="h-auto min-w-[600px] w-full select-none"
          role="img"
          aria-label={`Mapa radial de ${site.name} mostrando ${activeGroup.label}`}
        >
          <defs>
            <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--accent-sodium)" stopOpacity="0.35" />
              <stop offset="70%" stopColor="var(--chart-line-2)" stopOpacity="0.12" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Conexiones Hub -> Categorías */}
          {groups.map((group) => {
            const isActive = group.key === activeGroup.key;
            return (
              <path
                key={`link-${group.key}`}
                d={`M ${hubX + 64} ${hubY} C ${hubX + 125} ${hubY}, ${catX - 55} ${group.y}, ${catX} ${group.y}`}
                fill="none"
                stroke={isActive ? "var(--accent-sodium)" : "var(--border-hairline)"}
                strokeWidth={isActive ? 2 : 1.2}
                strokeOpacity={isActive ? 0.9 : 0.65}
              />
            );
          })}

          {/* Abanico Categoría activa -> Blancos */}
          {sortedLeaves.map((leaf, index) => {
            const count = Math.max(1, sortedLeaves.length - 1);
            const t = sortedLeaves.length === 1 ? 0.5 : index / count;
            const leafY = 38 + t * 394;
            const archOffset = Math.sin(t * Math.PI) * 52;
            const leafX = 505 + archOffset;
            const isSelected = selectedIds.includes(leaf.id);

            const startX = catX + 136;
            const startY = activeGroup.y;
            const cp1X = startX + 75;
            const cp2X = leafX - 75;

            return (
              <g key={leaf.id}>
                <path
                  d={`M ${startX} ${startY} C ${cp1X} ${startY}, ${cp2X} ${leafY}, ${leafX} ${leafY}`}
                  fill="none"
                  stroke={
                    isSelected
                      ? "var(--accent-sodium)"
                      : leaf.isObservable
                        ? "var(--text-secondary)"
                        : "var(--border-hairline)"
                  }
                  strokeWidth={isSelected ? 1.8 : 1}
                  strokeOpacity={isSelected ? 0.95 : leaf.isObservable ? 0.45 : 0.35}
                />

                <g
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={`Alternar gráfico para ${cleanShortName(leaf.name)}, altitud máxima ${leaf.maxAltitudeDeg} grados`}
                  onClick={() => onToggleSelect(leaf.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onToggleSelect(leaf.id);
                    }
                  }}
                  className="cursor-pointer"
                >
                  <circle
                    cx={leafX}
                    cy={leafY}
                    r={isSelected ? 4.5 : 3.2}
                    fill={
                      isSelected
                        ? "var(--accent-sodium)"
                        : leaf.isObservable
                          ? "var(--signal-ok)"
                          : "var(--text-secondary)"
                    }
                  />
                  <rect
                    x={leafX + 8}
                    y={leafY - 12}
                    width={205}
                    height={24}
                    rx={5}
                    fill={isSelected ? "var(--bg-elevated)" : "var(--bg-canvas)"}
                    stroke={isSelected ? "var(--accent-sodium)" : "var(--border-hairline)"}
                    strokeWidth={isSelected ? 1.4 : 0.8}
                  />
                  <text
                    x={leafX + 16}
                    y={leafY + 4}
                    fill="var(--text-primary)"
                    fontSize="10.5"
                    fontWeight={isSelected ? "600" : "400"}
                  >
                    {cleanShortName(leaf.name)}
                  </text>
                  <text
                    x={leafX + 205}
                    y={leafY + 4}
                    textAnchor="end"
                    fill={leaf.isObservable ? "var(--accent-sodium)" : "var(--text-secondary)"}
                    fontSize="10"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    {leaf.maxAltitudeDeg}°
                  </text>
                </g>
              </g>
            );
          })}

          {/* Nodo Central: Observatorio y Luna */}
          <circle cx={hubX} cy={hubY} r={88} fill="url(#hubGlow)" />
          <circle
            cx={hubX}
            cy={hubY}
            r={66}
            fill="var(--bg-elevated)"
            stroke="var(--border-hairline)"
            strokeWidth={1.2}
          />
          <circle
            cx={hubX}
            cy={hubY}
            r={54}
            fill="none"
            stroke="var(--accent-sodium)"
            strokeOpacity={0.45}
            strokeDasharray="3 4"
          />
          <circle
            cx={hubX}
            cy={hubY - 10}
            r={16}
            fill="var(--accent-sodium)"
            fillOpacity={Math.max(0.2, ephemeris.moon.illuminationPercent / 100)}
            stroke="var(--accent-sodium)"
            strokeWidth={1.2}
          />
          <text
            x={hubX}
            y={hubY + 20}
            textAnchor="middle"
            fill="var(--text-primary)"
            fontSize="11"
            fontWeight="600"
          >
            {shortSiteTitle(site.name)}
          </text>
          <text
            x={hubX}
            y={hubY + 35}
            textAnchor="middle"
            fill="var(--text-secondary)"
            fontSize="10"
            fontFamily="IBM Plex Mono, monospace"
          >
            {site.elevationMeters} m · Luna {ephemeris.moon.illuminationPercent}%
          </text>

          {/* Nodos de Categoría */}
          {groups.map((group) => {
            const isActive = group.key === activeGroup.key;
            const observableCount = group.items.filter((i) => i.isObservable).length;
            return (
              <g
                key={group.key}
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                aria-label={`Categoría ${group.label}, ${observableCount} observables de ${group.items.length}`}
                onClick={() => setActiveCategory(group.key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveCategory(group.key);
                  }
                }}
                className="cursor-pointer"
              >
                <rect
                  x={catX}
                  y={group.y - 24}
                  width={136}
                  height={48}
                  rx={8}
                  fill={isActive ? "var(--bg-elevated)" : "var(--bg-canvas)"}
                  stroke={isActive ? "var(--accent-sodium)" : "var(--border-hairline)"}
                  strokeWidth={isActive ? 1.8 : 1}
                />
                <text
                  x={catX + 12}
                  y={group.y - 3}
                  fill="var(--text-primary)"
                  fontSize="12"
                  fontWeight="600"
                >
                  {group.label}
                </text>
                <text
                  x={catX + 12}
                  y={group.y + 14}
                  fill={isActive ? "var(--accent-sodium)" : "var(--text-secondary)"}
                  fontSize="10.5"
                  fontFamily="IBM Plex Mono, monospace"
                >
                  {observableCount}/{group.items.length} visibles
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
