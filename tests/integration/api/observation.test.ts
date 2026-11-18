import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as getObservation } from "@/app/api/observation/route";
import { GET as getSites } from "@/app/api/sites/route";
import { clearWeatherCache } from "@/lib/weather/openMeteo";

describe("GET /api/sites & GET /api/observation", () => {
  afterEach(() => {
    clearWeatherCache();
    vi.unstubAllGlobals();
  });

  it("returns all 10 Chilean observatory sites from /api/sites", async () => {
    const response = await getSites();
    const body = (await response.json()) as { sites: unknown[] };

    expect(response.status).toBe(200);
    expect(body.sites).toHaveLength(10);
  });

  it("returns 400 on missing or invalid query params and 404 on unknown site", async () => {
    const missing = await getObservation(new NextRequest("http://localhost:3000/api/observation"));
    expect(missing.status).toBe(400);

    const invalidDate = await getObservation(
      new NextRequest("http://localhost:3000/api/observation?siteId=vera-rubin&date=2026-02-30")
    );
    expect(invalidDate.status).toBe(400);

    const unknownSite = await getObservation(
      new NextRequest("http://localhost:3000/api/observation?siteId=unknown&date=2026-07-15")
    );
    expect(unknownSite.status).toBe(404);
  });

  it("returns ephemeris, visibility and weather when Open-Meteo succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            hourly: {
              time: ["2026-07-15T22:00", "2026-07-16T01:00"],
              temperature_2m: [8, 6],
              relative_humidity_2m: [35, 38],
              cloud_cover: [0, 5],
              wind_speed_10m: [10, 12],
            },
          }),
          { status: 200 }
        )
      )
    );

    const response = await getObservation(
      new NextRequest("http://localhost:3000/api/observation?siteId=vera-rubin&date=2026-07-15")
    );
    const body = (await response.json()) as {
      site: { id: string };
      ephemeris: { moon: { phaseName: string } };
      visibility: { messier: unknown[] };
      weather: { quality: { score: number } } | null;
      weatherWarning: string | null;
    };

    expect(response.status).toBe(200);
    expect(body.site.id).toBe("vera-rubin");
    expect(body.visibility.messier).toHaveLength(20);
    expect(body.weather).not.toBeNull();
    expect(body.weather!.quality.score).toBeGreaterThanOrEqual(90);
    expect(body.weatherWarning).toBeNull();
  });

  it("degrades gracefully with weather=null when Open-Meteo fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network down")));

    const response = await getObservation(
      new NextRequest("http://localhost:3000/api/observation?siteId=vera-rubin&date=2026-07-16")
    );
    const body = (await response.json()) as {
      ephemeris: unknown;
      visibility: { messier: unknown[] };
      weather: unknown;
      weatherWarning: string | null;
    };

    expect(response.status).toBe(200);
    expect(body.ephemeris).toBeDefined();
    expect(body.visibility.messier).toHaveLength(20);
    expect(body.weather).toBeNull();
    expect(body.weatherWarning).toMatch(/no disponibles/i);
  });
});
