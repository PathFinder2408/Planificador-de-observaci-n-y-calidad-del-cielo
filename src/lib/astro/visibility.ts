import { Body, Equator, Horizon, Observer } from "astronomy-engine";
import { MESSIER_CATALOG, type MessierObject } from "@/data/messier";
import type { ObservatorySite } from "@/data/sites";
import { calculateNightEphemeris } from "@/lib/astro/ephemeris";
import { chileLocalToUtc, addDaysToDateString, formatChileTime } from "@/lib/astro/timezone";

export interface AltitudePoint {
  utcIso: string;
  chileTime: string;
  altitudeDeg: number;
  azimuthDeg: number;
}

export interface TargetVisibility {
  id: string;
  name: string;
  category: "Planeta" | MessierObject["type"];
  constellation: string;
  magnitude: number | null;
  maxAltitudeDeg: number;
  bestTimeChile: string;
  visibleMinutes: number;
  isObservable: boolean;
  series: AltitudePoint[];
}

export interface NightVisibilityReport {
  siteId: string;
  dateStr: string;
  windowStartUtc: string;
  windowEndUtc: string;
  sampleTimesChile: string[];
  planets: TargetVisibility[];
  messier: TargetVisibility[];
}

interface PlanetDefinition {
  id: string;
  name: string;
  body: Body;
}

const PLANETS: readonly PlanetDefinition[] = [
  { id: "mercury", name: "Mercurio", body: Body.Mercury },
  { id: "venus", name: "Venus", body: Body.Venus },
  { id: "mars", name: "Marte", body: Body.Mars },
  { id: "jupiter", name: "Júpiter", body: Body.Jupiter },
  { id: "saturn", name: "Saturno", body: Body.Saturn },
  { id: "uranus", name: "Urano", body: Body.Uranus },
  { id: "neptune", name: "Neptuno", body: Body.Neptune },
];

const MAX_SAMPLES = 96;

function buildSampleDates(startUtc: Date, endUtc: Date, stepMinutes: number): Date[] {
  const safeStep = Math.max(10, Math.min(120, stepMinutes));
  const stepMs = safeStep * 60_000;
  const samples: Date[] = [];

  for (let ms = startUtc.getTime(); ms <= endUtc.getTime(); ms += stepMs) {
    if (samples.length >= MAX_SAMPLES) {
      break;
    }
    samples.push(new Date(ms));
  }
  return samples;
}

function summarizeSeries(
  series: AltitudePoint[],
  stepMinutes: number
): {
  maxAltitudeDeg: number;
  bestTimeChile: string;
  visibleMinutes: number;
  isObservable: boolean;
} {
  let maxAlt = -90;
  let bestTime = series[0]?.chileTime ?? "--:--";
  let visibleCount = 0;

  for (const point of series) {
    if (point.altitudeDeg > maxAlt) {
      maxAlt = point.altitudeDeg;
      bestTime = point.chileTime;
    }
    if (point.altitudeDeg >= 20) {
      visibleCount += 1;
    }
  }

  return {
    maxAltitudeDeg: Number(maxAlt.toFixed(1)),
    bestTimeChile: bestTime,
    visibleMinutes: visibleCount * stepMinutes,
    isObservable: maxAlt >= 20,
  };
}

function evaluatePlanet(
  planet: PlanetDefinition,
  observer: Observer,
  samples: Date[],
  stepMinutes: number
): TargetVisibility {
  const series: AltitudePoint[] = samples.map((date) => {
    const eq = Equator(planet.body, date, observer, true, true);
    const hor = Horizon(date, observer, eq.ra, eq.dec, "normal");
    return {
      utcIso: date.toISOString(),
      chileTime: formatChileTime(date),
      altitudeDeg: Number(hor.altitude.toFixed(1)),
      azimuthDeg: Number(hor.azimuth.toFixed(1)),
    };
  });

  const summary = summarizeSeries(series, stepMinutes);
  return {
    id: planet.id,
    name: planet.name,
    category: "Planeta",
    constellation: "Sistema Solar",
    magnitude: null,
    ...summary,
    series,
  };
}

function evaluateMessier(
  obj: MessierObject,
  observer: Observer,
  samples: Date[],
  stepMinutes: number
): TargetVisibility {
  const series: AltitudePoint[] = samples.map((date) => {
    const hor = Horizon(date, observer, obj.raHours, obj.decDegrees, "normal");
    return {
      utcIso: date.toISOString(),
      chileTime: formatChileTime(date),
      altitudeDeg: Number(hor.altitude.toFixed(1)),
      azimuthDeg: Number(hor.azimuth.toFixed(1)),
    };
  });

  const summary = summarizeSeries(series, stepMinutes);
  return {
    id: obj.id,
    name: `${obj.id} · ${obj.name}`,
    category: obj.type,
    constellation: obj.constellation,
    magnitude: obj.magnitude,
    ...summary,
    series,
  };
}

export function calculateNightVisibility(
  site: ObservatorySite,
  dateStr: string,
  stepMinutes = 30
): NightVisibilityReport {
  const ephemeris = calculateNightEphemeris(site, dateStr);
  const nextDate = addDaysToDateString(dateStr, 1);

  const startStr = ephemeris.astronomicalDusk?.utcIso ?? ephemeris.sunset?.utcIso;
  const endStr = ephemeris.astronomicalDawn?.utcIso ?? ephemeris.sunrise?.utcIso;

  const startUtc = startStr ? new Date(startStr) : chileLocalToUtc(dateStr, 19, 30);
  const endUtc = endStr ? new Date(endStr) : chileLocalToUtc(nextDate, 6, 30);

  const samples = buildSampleDates(startUtc, endUtc, stepMinutes);
  const observer = new Observer(site.latitude, site.longitude, site.elevationMeters);

  const planets = PLANETS.map((planet) => evaluatePlanet(planet, observer, samples, stepMinutes));
  const messier = MESSIER_CATALOG.map((obj) =>
    evaluateMessier(obj, observer, samples, stepMinutes)
  );

  return {
    siteId: site.id,
    dateStr,
    windowStartUtc: startUtc.toISOString(),
    windowEndUtc: endUtc.toISOString(),
    sampleTimesChile: samples.map(formatChileTime),
    planets,
    messier,
  };
}
