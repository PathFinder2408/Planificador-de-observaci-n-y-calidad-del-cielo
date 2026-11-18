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
import type { TargetVisibility } from "@/lib/astro/visibility";

interface AltitudeChartProps {
  sampleTimesChile: string[];
  selectedTargets: TargetVisibility[];
}

const LINE_COLORS = ["#38bdf8", "#a78bfa", "#34d399", "#fbbf24", "#f472b6"];

export function AltitudeChart({ sampleTimesChile, selectedTargets }: AltitudeChartProps) {
  if (selectedTargets.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-center text-sm text-slate-400">
        Selecciona al menos un objeto en la tabla para graficar su curva de altitud nocturna.
      </section>
    );
  }

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
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-white">
            Curva de Altitud Nocturna (America/Santiago)
          </h2>
          <p className="text-xs text-slate-400">
            Línea punteada en 20° marca la altura mínima recomendada sobre el horizonte.
          </p>
        </div>
        <span className="text-xs text-slate-400">
          Mostrando {selectedTargets.length} objeto(s) seleccionado(s)
        </span>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
            <YAxis domain={[0, 90]} unit="°" stroke="#94a3b8" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#334155",
                borderRadius: "0.75rem",
                color: "#f8fafc",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <ReferenceLine y={20} stroke="#f59e0b" strokeDasharray="4 4" />
            {selectedTargets.map((target, idx) => (
              <Line
                key={target.id}
                type="monotone"
                dataKey={target.id}
                name={target.name}
                stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
