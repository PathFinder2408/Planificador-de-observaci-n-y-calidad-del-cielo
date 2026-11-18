import { afterEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  const originalUrl = process.env.OPEN_METEO_BASE_URL;

  afterEach(() => {
    if (originalUrl === undefined) {
      delete process.env.OPEN_METEO_BASE_URL;
    } else {
      process.env.OPEN_METEO_BASE_URL = originalUrl;
    }
  });

  it("returns 200 with service status and America/Santiago timezone", async () => {
    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.service).toBe("planificador-observacion-cielo");
    expect(body.timezone).toBe("America/Santiago");
    expect(typeof body.timestamp).toBe("string");
  });

  it("returns 500 when environment configuration is invalid", async () => {
    process.env.OPEN_METEO_BASE_URL = "invalid-url";

    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(500);
    expect(body.status).toBe("error");
  });
});
