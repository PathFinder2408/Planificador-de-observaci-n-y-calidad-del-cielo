import { afterEach, describe, expect, it, vi } from "vitest";
import { clearWeatherCache, fetchNightWeather } from "@/lib/weather/openMeteo";

function buildValidOpenMeteoPayload() {
  return {
    hourly: {
      time: [
        "2026-07-15T15:00", // diurno -> se filtra
        "2026-07-15T21:00",
        "2026-07-15T22:00",
        "2026-07-16T02:00",
        "2026-07-16T10:00", // diurno -> se filtra
      ],
      temperature_2m: [18, 9, 8, 6, 14],
      relative_humidity_2m: [30, 35, 38, 40, 32],
      cloud_cover: [10, 5, 0, 10, 20],
      wind_speed_10m: [12, 10, 8, 14, 15],
    },
  };
}

describe("Open-Meteo resilient client", () => {
  afterEach(() => {
    clearWeatherCache();
  });

  it("parses night hours, filters daytime hours and caches subsequent requests", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify(buildValidOpenMeteoPayload()), { status: 200 })
      );

    const first = await fetchNightWeather(-30.2446, -70.7494, "2026-07-15", {
      fetchFn: fetchMock,
      retryDelayMs: 0,
    });
    const second = await fetchNightWeather(-30.2446, -70.7494, "2026-07-15", {
      fetchFn: fetchMock,
      retryDelayMs: 0,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first.hourly).toHaveLength(3);
    expect(first.quality.score).toBeGreaterThanOrEqual(90);
    expect(second).toEqual(first);
  });

  it("retries on HTTP 500 and succeeds when a retry returns 200", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("Upstream error", { status: 500 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify(buildValidOpenMeteoPayload()), { status: 200 })
      );

    const result = await fetchNightWeather(-30.2446, -70.7494, "2026-07-15", {
      fetchFn: fetchMock,
      maxRetries: 2,
      retryDelayMs: 0,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.hourly).toHaveLength(3);
  });

  it("does not retry on HTTP 404 or invalid Zod schema", async () => {
    const notFoundFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("Not Found", { status: 404 }));

    await expect(
      fetchNightWeather(-30.2446, -70.7494, "2026-07-15", {
        fetchFn: notFoundFetch,
        maxRetries: 2,
        retryDelayMs: 0,
      })
    ).rejects.toThrow(/HTTP 404/);
    expect(notFoundFetch).toHaveBeenCalledTimes(1);

    const invalidPayloadFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify({ unexpected: true }), { status: 200 }));

    await expect(
      fetchNightWeather(-30.2446, -70.7494, "2026-07-16", {
        fetchFn: invalidPayloadFetch,
        maxRetries: 2,
        retryDelayMs: 0,
      })
    ).rejects.toThrow();
    expect(invalidPayloadFetch).toHaveBeenCalledTimes(1);
  });

  it("aborts and throws on timeout", async () => {
    const slowFetch = vi.fn<typeof fetch>(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new Error("The operation was aborted"));
          });
        })
    );

    await expect(
      fetchNightWeather(-30.2446, -70.7494, "2026-07-17", {
        fetchFn: slowFetch,
        timeoutMs: 25,
        maxRetries: 1,
        retryDelayMs: 0,
      })
    ).rejects.toThrow(/aborted/);
    expect(slowFetch).toHaveBeenCalledTimes(2);
  });
});
