"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Droplets,
  Moon,
  Sun,
  Thermometer,
  Wind,
  XCircle,
} from "lucide-react";
import type { ObservatorySite } from "@/data/sites";
import type { NightEphemeris } from "@/lib/astro/ephemeris";
import type { NightWeatherSummary, QualityRating } from "@/lib/weather/qualityIndex";

interface TelemetryRailProps {
  site: ObservatorySite;
  ephemeris: NightEphemeris;
  weather: NightWeatherSummary | null;
  weatherWarning: string | null;
}

function QualityBadge({ score, rating }: { score: number; rating: QualityRating }) {
  const isOk = score >= 60;
  const isWarn = score >= 40 && score < 60;
  const colorVar = isOk ? "var(--signal-ok)" : isWarn ? "var(--signal-warn)" : "var(--signal-bad)";
  const Icon = isOk ? CheckCircle2 : isWarn ? AlertTriangle : XCircle;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium"
      style={{ borderColor: colorVar, color: colorVar }}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{rating}</span>
    </span>
  );
}

function HourlyDotHistogram({ weather }: { weather: NightWeatherSummary }) {
  const dotsPerColumn = 7;

  return (
    <div
      className="flex items-end gap-1.5"
      role="img"
      aria-label={`Calidad horaria de ${weather.hourly[0]?.hourLabel ?? "19:00"} a ${
        weather.hourly[weather.hourly.length - 1]?.hourLabel ?? "06:00"
      }`}
    >
      {weather.hourly.slice(0, 12).map((point) => {
        const activeDots = Math.max(1, Math.round((point.qualityScore / 100) * dotsPerColumn));
        return (
          <div
            key={point.localTimeIso}
            title={`${point.hourLabel} — ${point.qualityScore}/100`}
            className="flex flex-col-reverse gap-0.5"
          >
            {Array.from({ length: dotsPerColumn }).map((_, idx) => {
              const filled = idx < activeDots;
              return (
                <span
                  key={idx}
                  className="h-1 w-1 rounded-full"
                  style={{
                    backgroundColor: filled ? "var(--accent-sodium)" : "var(--border-hairline)",
                    opacity: filled ? 0.95 : 0.45,
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export function TelemetryRail({ site, ephemeris, weather, weatherWarning }: TelemetryRailProps) {
  return (
    <aside
      aria-label="Panel inspector de estación y atmósfera"
      className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 85% 15%, rgba(229, 152, 56, 0.08), transparent 45%)",
      }}
    >
      {/* Cabecera del sitio */}
      <div className="border-b border-[var(--border-hairline)] p-4">
        <p className="text-xs text-[var(--text-secondary)]">{site.project}</p>
        <h2 className="mt-0.5 text-lg font-semibold text-[var(--text-primary)]">{site.name}</h2>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-mono-tabular text-[var(--text-secondary)]">
            {site.latitude.toFixed(3)}°, {site.longitude.toFixed(3)}°
          </span>
          <span className="font-mono-tabular text-[var(--text-secondary)]">
            {site.elevationMeters} m s. n. m.
          </span>
        </div>
      </div>

      {/* Índice protagonista + histograma horario */}
      <div className="border-b border-[var(--border-hairline)] p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            Índice de calidad del cielo
          </span>
          {weather && (
            <QualityBadge score={weather.quality.score} rating={weather.quality.rating} />
          )}
        </div>

        {weather ? (
          <>
            <div className="mt-3 flex items-end justify-between gap-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-3">
              <div>
                <p className="font-mono-tabular text-3xl font-semibold text-[var(--text-primary)]">
                  {weather.quality.score}
                  <span className="text-sm font-normal text-[var(--text-secondary)]">/100</span>
                </p>
                {weather.bestHour && (
                  <p className="font-mono-tabular mt-0.5 text-xs text-[var(--text-secondary)]">
                    Mejor hora {weather.bestHour.hourLabel} ({weather.bestHour.score}/100)
                  </p>
                )}
              </div>
              <HourlyDotHistogram weather={weather} />
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-2.5 text-xs">
              <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-2.5">
                <dt className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <Cloud className="h-3.5 w-3.5" aria-hidden="true" />
                  Nubosidad
                </dt>
                <dd className="font-mono-tabular mt-1 text-base font-semibold text-[var(--text-primary)]">
                  {weather.averageCloudCoverPercent}%
                </dd>
              </div>
              <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-2.5">
                <dt className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <Droplets className="h-3.5 w-3.5" aria-hidden="true" />
                  Humedad
                </dt>
                <dd className="font-mono-tabular mt-1 text-base font-semibold text-[var(--text-primary)]">
                  {weather.averageHumidityPercent}%
                </dd>
              </div>
              <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-2.5">
                <dt className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <Wind className="h-3.5 w-3.5" aria-hidden="true" />
                  Viento 10 m
                </dt>
                <dd className="font-mono-tabular mt-1 text-base font-semibold text-[var(--text-primary)]">
                  {weather.averageWindSpeedKmh} km/h
                </dd>
              </div>
              <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-2.5">
                <dt className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <Thermometer className="h-3.5 w-3.5" aria-hidden="true" />
                  Temperatura
                </dt>
                <dd className="font-mono-tabular mt-1 text-base font-semibold text-[var(--text-primary)]">
                  {weather.averageTemperatureC} °C
                </dd>
              </div>
            </dl>
          </>
        ) : (
          <p className="mt-3 rounded-lg border border-[var(--signal-warn)] bg-[var(--bg-elevated)] p-3 text-xs text-[var(--text-primary)]">
            {weatherWarning ??
              "Open-Meteo solo entrega pronóstico dentro de los próximos 16 días. Elige una fecha cercana para ver nubosidad y viento."}
          </p>
        )}
      </div>

      {/* Ventana solar y Luna */}
      <div className="grid grid-cols-2 divide-x divide-[var(--border-hairline)] text-xs">
        <div className="p-3.5">
          <div className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
            <Sun className="h-3.5 w-3.5 text-[var(--accent-sodium)]" aria-hidden="true" />
            <span>Noche -18°</span>
          </div>
          <p className="font-mono-tabular mt-1.5 text-sm font-medium text-[var(--accent-sodium)]">
            {ephemeris.astronomicalDusk?.chileTime ?? "--:--"} –{" "}
            {ephemeris.astronomicalDawn?.chileTime ?? "--:--"}
          </p>
        </div>

        <div className="p-3.5">
          <div className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
            <Moon className="h-3.5 w-3.5 text-[var(--text-secondary)]" aria-hidden="true" />
            <span>{ephemeris.moon.phaseName}</span>
          </div>
          <p className="font-mono-tabular mt-1.5 text-sm font-medium text-[var(--text-primary)]">
            {ephemeris.moon.illuminationPercent}% ilum.
          </p>
        </div>
      </div>
    </aside>
  );
}
