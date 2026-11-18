import { z } from "zod";
import { addDaysToDateString, CHILE_TIMEZONE } from "@/lib/astro/timezone";
import {
  calculateObservationQuality,
  summarizeNightWeather,
  type HourlyWeatherPoint,
  type NightWeatherSummary,
} from "@/lib/weather/qualityIndex";

const OpenMeteoHourlySchema = z.object({
  time: z.array(z.string()),
  temperature_2m: z.array(z.number().nullable()),
  relative_humidity_2m: z.array(z.number().nullable()),
  cloud_cover: z.array(z.number().nullable()),
  wind_speed_10m: z.array(z.number().nullable()),
});

const OpenMeteoResponseSchema = z.object({
  hourly: OpenMeteoHourlySchema,
});

export interface OpenMeteoClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  cacheTtlMs?: number;
  fetchFn?: typeof fetch;
}

interface CacheEntry {
  expiresAt: number;
  data: NightWeatherSummary;
}

const MAX_CACHE_ENTRIES = 100;
const weatherCache = new Map<string, CacheEntry>();

export function clearWeatherCache(): void {
  weatherCache.clear();
}

function buildForecastUrl(
  baseUrl: string,
  latitude: number,
  longitude: number,
  dateStr: string
): string {
  const nextDateStr = addDaysToDateString(dateStr, 1);
  const url = new URL(`${baseUrl.replace(/\/$/, "")}/forecast`);
  url.searchParams.set("latitude", latitude.toFixed(4));
  url.searchParams.set("longitude", longitude.toFixed(4));
  url.searchParams.set("hourly", "temperature_2m,relative_humidity_2m,cloud_cover,wind_speed_10m");
  url.searchParams.set("start_date", dateStr);
  url.searchParams.set("end_date", nextDateStr);
  url.searchParams.set("timezone", CHILE_TIMEZONE);
  return url.toString();
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function waitMs(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
  fetchFn: typeof fetch
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchFn(url, { signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
}

function extractNightHours(
  raw: z.infer<typeof OpenMeteoResponseSchema>,
  dateStr: string
): HourlyWeatherPoint[] {
  const nextDateStr = addDaysToDateString(dateStr, 1);
  const { time, temperature_2m, relative_humidity_2m, cloud_cover, wind_speed_10m } = raw.hourly;

  const length = Math.min(
    time.length,
    temperature_2m.length,
    relative_humidity_2m.length,
    cloud_cover.length,
    wind_speed_10m.length
  );

  const points: HourlyWeatherPoint[] = [];
  for (let i = 0; i < length; i += 1) {
    const iso = time[i];
    const temp = temperature_2m[i];
    const hum = relative_humidity_2m[i];
    const cloud = cloud_cover[i];
    const wind = wind_speed_10m[i];

    if (!iso || temp == null || hum == null || cloud == null || wind == null) {
      continue;
    }

    const [dayPart, hourPart] = iso.split("T");
    const hour = Number((hourPart ?? "00:00").slice(0, 2));
    const isNightHour =
      (dayPart === dateStr && hour >= 19) || (dayPart === nextDateStr && hour <= 6);

    if (!isNightHour) {
      continue;
    }

    const quality = calculateObservationQuality({
      cloudCoverPercent: cloud,
      humidityPercent: hum,
      windSpeedKmh: wind,
      temperatureC: temp,
    });

    points.push({
      localTimeIso: iso,
      hourLabel: (hourPart ?? "00:00").slice(0, 5),
      cloudCoverPercent: cloud,
      humidityPercent: hum,
      windSpeedKmh: wind,
      temperatureC: temp,
      qualityScore: quality.score,
    });
  }

  return points;
}

export async function fetchNightWeather(
  latitude: number,
  longitude: number,
  dateStr: string,
  options: OpenMeteoClientOptions = {}
): Promise<NightWeatherSummary> {
  const baseUrl = options.baseUrl ?? "https://api.open-meteo.com/v1";
  const timeoutMs = options.timeoutMs ?? 5000;
  const maxRetries = Math.max(0, Math.min(3, options.maxRetries ?? 2));
  const retryDelayMs = options.retryDelayMs ?? 150;
  const cacheTtlMs = options.cacheTtlMs ?? 15 * 60_000;
  const fetchFn = options.fetchFn ?? fetch;

  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)},${dateStr}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const url = buildForecastUrl(baseUrl, latitude, longitude, dateStr);
  let lastError: Error = new Error("Open-Meteo request failed");

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, timeoutMs, fetchFn);
      if (!response.ok) {
        if (isRetryableStatus(response.status) && attempt < maxRetries) {
          await waitMs(retryDelayMs * 2 ** attempt);
          continue;
        }
        throw new Error(`Open-Meteo HTTP ${response.status}`);
      }

      const json: unknown = await response.json();
      const parsed = OpenMeteoResponseSchema.parse(json);
      const nightPoints = extractNightHours(parsed, dateStr);
      const summary = summarizeNightWeather(nightPoints);
      if (!summary) {
        throw new Error("Open-Meteo returned no valid night weather hours");
      }

      if (weatherCache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = weatherCache.keys().next().value;
        if (oldestKey) weatherCache.delete(oldestKey);
      }
      weatherCache.set(cacheKey, { expiresAt: Date.now() + cacheTtlMs, data: summary });
      return summary;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown Open-Meteo error");
      const isZodOrHttpClientError =
        error instanceof z.ZodError || lastError.message.startsWith("Open-Meteo HTTP 4");
      if (isZodOrHttpClientError || attempt >= maxRetries) {
        break;
      }
      await waitMs(retryDelayMs * 2 ** attempt);
    }
  }

  throw lastError;
}
