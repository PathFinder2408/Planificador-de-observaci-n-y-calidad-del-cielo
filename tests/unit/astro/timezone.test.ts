import { describe, expect, it } from "vitest";
import {
  addDaysToDateString,
  chileLocalToUtc,
  formatChileDateTime,
  formatChileTime,
  getChileOffsetMinutes,
  getObservationNightWindow,
  parseObservationDate,
} from "@/lib/astro/timezone";

describe("Chile timezone helpers (America/Santiago)", () => {
  it("validates calendar dates and rejects invalid ones", () => {
    expect(parseObservationDate("2026-07-15")).toEqual({ year: 2026, month: 7, day: 15 });
    expect(() => parseObservationDate("2026-02-30")).toThrow(/Invalid calendar date/);
    expect(() => parseObservationDate("15-07-2026")).toThrow();
  });

  it("computes UTC-3 in austral summer and UTC-4 in austral winter", () => {
    const summerOffset = getChileOffsetMinutes(new Date("2026-01-15T12:00:00Z"));
    const winterOffset = getChileOffsetMinutes(new Date("2026-07-15T12:00:00Z"));

    expect(summerOffset).toBe(-180);
    expect(winterOffset).toBe(-240);

    expect(chileLocalToUtc("2026-01-15", 12, 0).toISOString()).toBe("2026-01-15T15:00:00.000Z");
    expect(chileLocalToUtc("2026-07-15", 12, 0).toISOString()).toBe("2026-07-15T16:00:00.000Z");
  });

  it("builds a 24h observation window from 12:00 local to 12:00 next day", () => {
    const window = getObservationNightWindow("2026-07-15");
    expect(formatChileDateTime(window.startUtc)).toBe("2026-07-15 12:00");
    expect(formatChileDateTime(window.midnightUtc)).toBe("2026-07-16 00:00");
    expect(formatChileDateTime(window.endUtc)).toBe("2026-07-16 12:00");
    expect(formatChileTime(window.midnightUtc)).toBe("00:00");
    expect(addDaysToDateString("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("handles Chile DST transition days accurately", () => {
    // Transición septiembre (invierno UTC-4 -> verano UTC-3) y abril (verano UTC-3 -> invierno UTC-4)
    const springMidnight = chileLocalToUtc("2026-09-06", 0, 30);
    const autumnMidnight = chileLocalToUtc("2026-04-05", 0, 30);

    expect(springMidnight.toISOString()).toBe("2026-09-06T03:30:00.000Z");
    expect(autumnMidnight.toISOString()).toBe("2026-04-05T04:30:00.000Z");
  });
});
