"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { NightEphemeris } from "@/lib/astro/ephemeris";
import type { TargetVisibility } from "@/lib/astro/visibility";

interface AltitudeChartProps {
  ephemeris: NightEphemeris;
  sampleTimesChile: string[];
  selectedTargets: TargetVisibility[];
}

const LINE_VARS = [
  "var(--chart-line-1)",
  "var(--chart-line-2)",
  "var(--chart-line-3)",
  "var(--chart-line-4)",
  "var(--chart-line-5)",
];

export function AltitudeChart({
  ephemeris,
  sampleTimesChile,
  selectedTargets,
}: AltitudeChartProps) {
  const chartData = sampleTimesChile.map((time, index) => {
    const row: Record<string, string | number> = { time };
    for (const target of selectedTargets) {
      const point = target.series[index];
      if (point) {
        row[target.id] = point.altitudeDeg;
      }
    }
    return row;
  });

  return (
    <section
      aria-label="Ventana nocturna y curva de altitud"
      className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)]"
    >
      {/* Elemento memorable: Banda de Ventana Nocturna integrada */}
      <div className="border-b border-[var(--border-hairline)] p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Ventana nocturna y curva de altitud
          </h2>
          <span className="font-mono-tabular text-xs text-[var(--text-secondary)]">
            Horario America/Santiago
          </span>
        </div>

        <div
          className="mt-3 grid grid-cols-2 gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-2.5 text-xs sm:grid-cols-4"
          aria-label="Hitos de la noche astronómica"
        >
          <div>
            <span className="block text-[var(--text-secondary)]">Ocaso solar</span>
            <span className="font-mono-tabular font-medium text-[var(--text-primary)]">
              {ephemeris.sunset?.chileTime ?? "--:--"}
            </span>
          </div>
          <div>
            <span className="block text-[var(--text-secondary)]">Crepúsculo (-18°)</span>
            <span className="font-mono-tabular font-medium text-[var(--accent-sodium)]">
              {ephemeris.astronomicalDusk?.chileTime ?? "--:--"}
            </span>
          </div>
          <div>
            <span className="block text-[var(--text-secondary)]">Alba (-18°)</span>
            <span className="font-mono-tabular font-medium text-[var(--accent-sodium)]">
              {ephemeris.astronomicalDawn?.chileTime ?? "--:--"}
            </span>
          </div>
          <div>
            <span className="block text-[var(--text-secondary)]">Amanecer solar</span>
            <span className="font-mono-tabular font-medium text-[var(--text-primary)]">
              {ephemeris.sunrise?.chileTime ?? "--:--"}
            </span>
          </div>
        </div>
      </div>

      {/* Área del gráfico */}
      <div className="p-4">
        {selectedTargets.length === 0 ? (
          <p className="py-12 text-center text-sm text-[var(--text-secondary)]">
            Marca al menos un objeto en la tabla para graficar su trayectoria nocturna.
          </p>
        ) : (
          <>
            <p className="mb-3 text-xs text-[var(--text-secondary)]">
              La línea punteada en 20° marca la altura mínima recomendada sobre el horizonte.
            </p>
            <div
              className="overflow-x-auto"
              role="img"
              aria-label={`Gráfico de altitud nocturna para ${selectedTargets.map((t) => t.name).join(", ")}`}
            >
              <div className="h-72 min-w-[460px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border-hairline)" strokeDasharray="3 3" />
                    <XAxis dataKey="time" stroke="var(--text-secondary)" fontSize={12} />
                    <YAxis domain={[0, 90]} unit="°" stroke="var(--text-secondary)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--bg-surface)",
                        borderColor: "var(--border-hairline)",
                        borderRadius: "0.375rem",
                        color: "var(--text-primary)",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <ReferenceLine
                      y={20}
                      stroke="var(--accent-sodium)"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                    />
                    {selectedTargets.map((target, idx) => (
                      <Line
                        key={target.id}
                        type="monotone"
                        dataKey={target.id}
                        name={target.name}
                        stroke={LINE_VARS[idx % LINE_VARS.length]}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
