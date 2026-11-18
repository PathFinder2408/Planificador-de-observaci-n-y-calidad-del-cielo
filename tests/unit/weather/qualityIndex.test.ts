import { describe, expect, it } from "vitest";
import {
  calculateObservationQuality,
  getQualityRating,
  summarizeNightWeather,
} from "@/lib/weather/qualityIndex";

describe("Observation quality index", () => {
  it("scores 100 (Excelente) under ideal Atacama/Coquimbo night conditions", () => {
    const result = calculateObservationQuality({
      cloudCoverPercent: 0,
      humidityPercent: 25,
      windSpeedKmh: 8,
      temperatureC: 10,
    });

    expect(result.score).toBe(100);
    expect(result.rating).toBe("Excelente");
    expect(result.components.cloudScore).toBe(100);
    expect(result.components.humidityScore).toBe(100);
    expect(result.components.windScore).toBe(100);
    expect(result.components.thermalScore).toBe(100);
  });

  it("scores low (Mala) under overcast, humid and windy conditions", () => {
    const result = calculateObservationQuality({
      cloudCoverPercent: 100,
      humidityPercent: 95,
      windSpeedKmh: 60,
      temperatureC: -5,
    });

    expect(result.score).toBeLessThan(20);
    expect(result.rating).toBe("Mala");
  });

  it("classifies intermediate ratings and penalizes high/low temperatures", () => {
    expect(getQualityRating(85)).toBe("Excelente");
    expect(getQualityRating(65)).toBe("Buena");
    expect(getQualityRating(45)).toBe("Regular");
    expect(getQualityRating(20)).toBe("Mala");

    const warm = calculateObservationQuality({
      cloudCoverPercent: 25,
      humidityPercent: 55,
      windSpeedKmh: 25,
      temperatureC: 26,
    });
    expect(warm.components.thermalScore).toBeLessThan(100);
    expect(warm.score).toBeGreaterThanOrEqual(50);
    expect(warm.score).toBeLessThan(85);
  });

  it("summarizes hourly night weather and returns null on empty input", () => {
    expect(summarizeNightWeather([])).toBeNull();

    const summary = summarizeNightWeather([
      {
        localTimeIso: "2026-07-15T21:00",
        hourLabel: "21:00",
        cloudCoverPercent: 30,
        humidityPercent: 50,
        windSpeedKmh: 20,
        temperatureC: 8,
        qualityScore: 70,
      },
      {
        localTimeIso: "2026-07-16T01:00",
        hourLabel: "01:00",
        cloudCoverPercent: 5,
        humidityPercent: 35,
        windSpeedKmh: 10,
        temperatureC: 6,
        qualityScore: 97,
      },
    ]);

    expect(summary).not.toBeNull();
    expect(summary!.bestHour).toEqual({ hourLabel: "01:00", score: 97 });
    expect(summary!.averageCloudCoverPercent).toBe(17.5);
  });
});
