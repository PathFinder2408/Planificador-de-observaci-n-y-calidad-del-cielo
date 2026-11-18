"use client";

import { Cloud, Droplets, Moon, Sun, Thermometer, Wind } from "lucide-react";
import type { NightEphemeris } from "@/lib/astro/ephemeris";
import type { NightWeatherSummary } from "@/lib/weather/qualityIndex";

interface SummaryCardsProps {
  ephemeris: NightEphemeris;
  weather: NightWeatherSummary | null;
  weatherWarning: string | null;
}

function getRatingStyles(score: number): string {
  if (score >= 80) return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  if (score >= 60) return "border-sky-500/40 bg-sky-500/10 text-sky-300";
  if (score >= 40) return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  return "border-rose-500/40 bg-rose-500/10 text-rose-300";
}

export function SummaryCards({ ephemeris, weather, weatherWarning }: SummaryCardsProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {/* Sol y Crepúsculo */}
      <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Noche Astronómica
          </h2>
          <Sun className="h-5 w-5 text-amber-400" />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-slate-400">Puesta de Sol</dt>
            <dd className="font-mono text-base font-semibold text-white">
              {ephemeris.sunset?.chileTime ?? "--:--"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Salida de Sol</dt>
            <dd className="font-mono text-base font-semibold text-white">
              {ephemeris.sunrise?.chileTime ?? "--:--"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Crepúsculo (-18°)</dt>
            <dd className="font-mono text-base font-semibold text-sky-300">
              {ephemeris.astronomicalDusk?.chileTime ?? "--:--"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Fin noche (-18°)</dt>
            <dd className="font-mono text-base font-semibold text-sky-300">
              {ephemeris.astronomicalDawn?.chileTime ?? "--:--"}
            </dd>
          </div>
        </dl>
      </article>

      {/* Luna */}
      <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Fase Lunar
          </h2>
          <Moon className="h-5 w-5 text-indigo-300" />
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <p className="text-lg font-semibold text-white">{ephemeris.moon.phaseName}</p>
          <span className="font-mono text-sm text-indigo-300">
            {ephemeris.moon.illuminationPercent}% ilum.
          </span>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-slate-400">Salida de Luna</dt>
            <dd className="font-mono text-base font-semibold text-white">
              {ephemeris.moonrise?.chileTime ?? "--:--"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Puesta de Luna</dt>
            <dd className="font-mono text-base font-semibold text-white">
              {ephemeris.moonset?.chileTime ?? "--:--"}
            </dd>
          </div>
        </dl>
      </article>

      {/* Calidad Meteorológica */}
      <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Calidad del Cielo (Open-Meteo)
          </h2>
          {weather && (
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getRatingStyles(
                weather.quality.score
              )}`}
            >
              {weather.quality.score}/100 · {weather.quality.rating}
            </span>
          )}
        </div>

        {weather ? (
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-slate-400" />
              <div>
                <dt className="text-xs text-slate-400">Nubosidad prom.</dt>
                <dd className="font-mono font-semibold text-white">
                  {weather.averageCloudCoverPercent}%
                </dd>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-sky-400" />
              <div>
                <dt className="text-xs text-slate-400">Humedad prom.</dt>
                <dd className="font-mono font-semibold text-white">
                  {weather.averageHumidityPercent}%
                </dd>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-teal-400" />
              <div>
                <dt className="text-xs text-slate-400">Viento 10m</dt>
                <dd className="font-mono font-semibold text-white">
                  {weather.averageWindSpeedKmh} km/h
                </dd>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-amber-400" />
              <div>
                <dt className="text-xs text-slate-400">Temp. 2m</dt>
                <dd className="font-mono font-semibold text-white">
                  {weather.averageTemperatureC} °C
                </dd>
              </div>
            </div>
          </dl>
        ) : (
          <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            {weatherWarning ??
              "Pronóstico meteorológico disponible solo para fechas dentro de la ventana de Open-Meteo."}
          </p>
        )}
      </article>
    </section>
  );
}
