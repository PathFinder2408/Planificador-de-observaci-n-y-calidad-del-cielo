import { describe, expect, it } from "vitest";
import { getSiteById } from "@/data/sites";
import { calculateNightEphemeris, getMoonPhaseName } from "@/lib/astro/ephemeris";

describe("Night ephemeris calculations", () => {
  const rubin = getSiteById("vera-rubin");
  if (!rubin) throw new Error("vera-rubin site missing");

  it("computes winter solstice sunset/sunrise and astronomical twilight in Coquimbo", () => {
    const eph = calculateNightEphemeris(rubin, "2026-06-21");

    expect(eph.timezone).toBe("America/Santiago");
    expect(eph.sunset).not.toBeNull();
    expect(eph.sunrise).not.toBeNull();
    expect(eph.astronomicalDusk).not.toBeNull();
    expect(eph.astronomicalDawn).not.toBeNull();

    // En junio (invierno, UTC-4), el Sol se pone cerca de 17:45-18:05 CLT en Coquimbo
    const sunsetHour = Number(eph.sunset?.chileTime.split(":")[0]);
    const sunriseHour = Number(eph.sunrise?.chileTime.split(":")[0]);
    expect(sunsetHour).toBeGreaterThanOrEqual(17);
    expect(sunsetHour).toBeLessThanOrEqual(18);
    expect(sunriseHour).toBeGreaterThanOrEqual(7);
    expect(sunriseHour).toBeLessThanOrEqual(8);

    // El crepúsculo astronómico ocurre después de la puesta de Sol y antes del amanecer
    const duskMs = new Date(eph.astronomicalDusk!.utcIso).getTime();
    const dawnMs = new Date(eph.astronomicalDawn!.utcIso).getTime();
    const sunsetMs = new Date(eph.sunset!.utcIso).getTime();
    expect(duskMs).toBeGreaterThan(sunsetMs);
    expect(dawnMs).toBeGreaterThan(duskMs);
  });

  it("computes shorter astronomical night on summer solstice than winter solstice", () => {
    const winter = calculateNightEphemeris(rubin, "2026-06-21");
    const summer = calculateNightEphemeris(rubin, "2026-12-21");

    const winterDuration =
      new Date(winter.astronomicalDawn!.utcIso).getTime() -
      new Date(winter.astronomicalDusk!.utcIso).getTime();
    const summerDuration =
      new Date(summer.astronomicalDawn!.utcIso).getTime() -
      new Date(summer.astronomicalDusk!.utcIso).getTime();

    expect(winterDuration).toBeGreaterThan(summerDuration);
  });

  it("matches known reference New Moon (2026-02-17) and Full Moon (2026-03-03)", () => {
    const newMoonNight = calculateNightEphemeris(rubin, "2026-02-17");
    expect(newMoonNight.moon.illuminationPercent).toBeLessThanOrEqual(5);
    expect(newMoonNight.moon.phaseName).toBe("Luna Nueva");

    const fullMoonNight = calculateNightEphemeris(rubin, "2026-03-03");
    expect(fullMoonNight.moon.illuminationPercent).toBeGreaterThanOrEqual(95);
    expect(fullMoonNight.moon.phaseName).toBe("Luna Llena");
  });

  it("maps all 8 lunar phase octants to Spanish labels", () => {
    expect(getMoonPhaseName(0)).toBe("Luna Nueva");
    expect(getMoonPhaseName(45)).toBe("Creciente Iluminante");
    expect(getMoonPhaseName(90)).toBe("Cuarto Creciente");
    expect(getMoonPhaseName(135)).toBe("Gibosa Creciente");
    expect(getMoonPhaseName(180)).toBe("Luna Llena");
    expect(getMoonPhaseName(225)).toBe("Gibosa Menguante");
    expect(getMoonPhaseName(270)).toBe("Cuarto Menguante");
    expect(getMoonPhaseName(315)).toBe("Menguante");
  });

  it("returns null rise/set events gracefully when a body does not cross horizon in 24h", () => {
    const polarSite = {
      ...rubin,
      id: "antarctica-test",
      latitude: -78.0,
      longitude: -70.0,
      elevationMeters: 100,
    };
    const eph = calculateNightEphemeris(polarSite, "2026-12-21");
    expect(eph.sunset).toBeNull();
    expect(eph.astronomicalDusk).toBeNull();
  });
});
