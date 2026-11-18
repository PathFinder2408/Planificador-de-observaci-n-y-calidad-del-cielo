import {
  Body,
  Illumination,
  MoonPhase,
  Observer,
  SearchAltitude,
  SearchRiseSet,
  type AstroTime,
} from "astronomy-engine";
import type { ObservatorySite } from "@/data/sites";
import { formatChileTime, getObservationNightWindow } from "@/lib/astro/timezone";

export interface EventTimestamp {
  utcIso: string;
  chileTime: string;
}

export interface MoonSummary {
  phaseAngleDeg: number;
  illuminationFraction: number;
  illuminationPercent: number;
  phaseName: string;
}

export interface NightEphemeris {
  siteId: string;
  dateStr: string;
  timezone: "America/Santiago";
  sunset: EventTimestamp | null;
  sunrise: EventTimestamp | null;
  astronomicalDusk: EventTimestamp | null;
  astronomicalDawn: EventTimestamp | null;
  moonrise: EventTimestamp | null;
  moonset: EventTimestamp | null;
  moon: MoonSummary;
}

function toEventTimestamp(astroTime: AstroTime | null): EventTimestamp | null {
  if (!astroTime) {
    return null;
  }
  const date = astroTime.date;
  return {
    utcIso: date.toISOString(),
    chileTime: formatChileTime(date),
  };
}

export function getMoonPhaseName(phaseAngleDeg: number): string {
  const angle = ((phaseAngleDeg % 360) + 360) % 360;
  if (angle < 22.5 || angle >= 337.5) return "Luna Nueva";
  if (angle < 67.5) return "Creciente Iluminante";
  if (angle < 112.5) return "Cuarto Creciente";
  if (angle < 157.5) return "Gibosa Creciente";
  if (angle < 202.5) return "Luna Llena";
  if (angle < 247.5) return "Gibosa Menguante";
  if (angle < 292.5) return "Cuarto Menguante";
  return "Menguante";
}

export function calculateNightEphemeris(site: ObservatorySite, dateStr: string): NightEphemeris {
  const window = getObservationNightWindow(dateStr);
  const observer = new Observer(site.latitude, site.longitude, site.elevationMeters);

  const sunset = SearchRiseSet(Body.Sun, observer, -1, window.startUtc, 1);
  const sunriseStart = sunset?.date ?? window.startUtc;
  const sunrise = SearchRiseSet(Body.Sun, observer, +1, sunriseStart, 1);

  const astronomicalDusk = SearchAltitude(Body.Sun, observer, -1, window.startUtc, 1, -18);
  const dawnStart = astronomicalDusk?.date ?? window.startUtc;
  const astronomicalDawn = SearchAltitude(Body.Sun, observer, +1, dawnStart, 1, -18);

  const moonrise = SearchRiseSet(Body.Moon, observer, +1, window.startUtc, 1);
  const moonset = SearchRiseSet(Body.Moon, observer, -1, window.startUtc, 1);

  const phaseAngleDeg = MoonPhase(window.midnightUtc);
  const illumination = Illumination(Body.Moon, window.midnightUtc);

  return {
    siteId: site.id,
    dateStr,
    timezone: "America/Santiago",
    sunset: toEventTimestamp(sunset),
    sunrise: toEventTimestamp(sunrise),
    astronomicalDusk: toEventTimestamp(astronomicalDusk),
    astronomicalDawn: toEventTimestamp(astronomicalDawn),
    moonrise: toEventTimestamp(moonrise),
    moonset: toEventTimestamp(moonset),
    moon: {
      phaseAngleDeg: Number(phaseAngleDeg.toFixed(1)),
      illuminationFraction: Number(illumination.phase_fraction.toFixed(4)),
      illuminationPercent: Math.round(illumination.phase_fraction * 100),
      phaseName: getMoonPhaseName(phaseAngleDeg),
    },
  };
}
