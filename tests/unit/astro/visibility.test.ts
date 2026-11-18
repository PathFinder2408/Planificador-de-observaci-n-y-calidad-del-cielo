import { describe, expect, it } from "vitest";
import { getSiteById } from "@/data/sites";
import { calculateNightVisibility } from "@/lib/astro/visibility";

describe("Night visibility for planets and Messier objects", () => {
  const tololo = getSiteById("cerro-tololo");
  if (!tololo) throw new Error("cerro-tololo site missing");

  it("evaluates 7 planets and 20 Messier objects over the astronomical night", () => {
    const report = calculateNightVisibility(tololo, "2026-07-15", 30);

    expect(report.planets).toHaveLength(7);
    expect(report.messier).toHaveLength(20);
    expect(report.sampleTimesChile.length).toBeGreaterThan(15);

    // En julio (invierno austral), M8 (Laguna) y M7 (Ptolomeo) culminan muy altos en Coquimbo
    const m8 = report.messier.find((m) => m.id === "M8");
    const m7 = report.messier.find((m) => m.id === "M7");
    expect(m8).toBeDefined();
    expect(m7).toBeDefined();
    expect(m8!.maxAltitudeDeg).toBeGreaterThan(75);
    expect(m7!.maxAltitudeDeg).toBeGreaterThan(75);
    expect(m8!.isObservable).toBe(true);
    expect(m8!.visibleMinutes).toBeGreaterThan(180);
  });

  it("shows Orion Nebula (M42) high in austral summer nights", () => {
    const report = calculateNightVisibility(tololo, "2026-01-15", 30);
    const m42 = report.messier.find((m) => m.id === "M42");

    expect(m42).toBeDefined();
    expect(m42!.maxAltitudeDeg).toBeGreaterThan(55);
    expect(m42!.isObservable).toBe(true);
    expect(m42!.series).toHaveLength(report.sampleTimesChile.length);
  });

  it("falls back to default hours when astronomical twilight is absent (polar summer)", () => {
    const polarSite = {
      ...tololo,
      id: "antarctica-test",
      latitude: -78.0,
      longitude: -70.0,
      elevationMeters: 100,
    };
    const report = calculateNightVisibility(polarSite, "2026-12-21", 10);
    expect(report.sampleTimesChile.length).toBeGreaterThan(10);
    expect(report.sampleTimesChile.length).toBeLessThanOrEqual(96);
  });
});
