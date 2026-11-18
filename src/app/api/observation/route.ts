import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSiteById } from "@/data/sites";
import { calculateNightEphemeris } from "@/lib/astro/ephemeris";
import { parseObservationDate } from "@/lib/astro/timezone";
import { calculateNightVisibility } from "@/lib/astro/visibility";
import { parseEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { fetchNightWeather } from "@/lib/weather/openMeteo";
import type { NightWeatherSummary } from "@/lib/weather/qualityIndex";

const ObservationQuerySchema = z.object({
  siteId: z.string().min(1, "siteId is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const parsedQuery = ObservationQuerySchema.safeParse({
    siteId: searchParams.get("siteId") ?? "",
    date: searchParams.get("date") ?? "",
  });

  if (!parsedQuery.success) {
    return NextResponse.json(
      {
        error: "Invalid query parameters",
        details: parsedQuery.error.issues.map((i) => i.message),
      },
      { status: 400 }
    );
  }

  const { siteId, date } = parsedQuery.data;

  try {
    parseObservationDate(date);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid date" },
      { status: 400 }
    );
  }

  const site = getSiteById(siteId);
  if (!site) {
    return NextResponse.json({ error: `Unknown observatory site: ${siteId}` }, { status: 404 });
  }

  const ephemeris = calculateNightEphemeris(site, date);
  const visibility = calculateNightVisibility(site, date, 30);

  const env = parseEnv();
  let weather: NightWeatherSummary | null = null;
  let weatherWarning: string | null = null;

  try {
    weather = await fetchNightWeather(site.latitude, site.longitude, date, {
      baseUrl: env.OPEN_METEO_BASE_URL,
      timeoutMs: env.EXTERNAL_API_TIMEOUT_MS,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Weather service unavailable";
    weatherWarning =
      "Datos meteorológicos no disponibles temporalmente; mostrando solo efemérides.";
    logger.warn("Open-Meteo degraded fallback activated", {
      siteId: site.id,
      date,
      error: message,
    });
  }

  return NextResponse.json(
    {
      site,
      date,
      ephemeris,
      visibility,
      weather,
      weatherWarning,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
