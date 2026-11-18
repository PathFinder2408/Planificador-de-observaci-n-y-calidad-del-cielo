import { z } from "zod";

export const CHILE_TIMEZONE = "America/Santiago";

const DateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

export interface ObservationWindow {
  dateStr: string;
  startUtc: Date;
  endUtc: Date;
  midnightUtc: Date;
}

export function parseObservationDate(dateStr: string): {
  year: number;
  month: number;
  day: number;
} {
  DateStringSchema.parse(dateStr);
  const parts = dateStr.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() + 1 !== month ||
    probe.getUTCDate() !== day
  ) {
    throw new Error(`Invalid calendar date: ${dateStr}`);
  }

  return { year, month, day };
}

export function getChileOffsetMinutes(utcDate: Date): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: CHILE_TIMEZONE,
    timeZoneName: "shortOffset",
  });
  const parts = formatter.formatToParts(utcDate);
  const tzPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT-4";
  const match = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(tzPart);
  if (!match) {
    throw new Error(`Unable to parse Chile timezone offset from: ${tzPart}`);
  }
  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? "0");
  return sign * (hours * 60 + minutes);
}

export function chileLocalToUtc(dateStr: string, hour: number, minute = 0): Date {
  const { year, month, day } = parseObservationDate(dateStr);
  const approxUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const firstOffset = getChileOffsetMinutes(new Date(approxUtcMs));
  const candidate = new Date(approxUtcMs - firstOffset * 60_000);
  const refinedOffset = getChileOffsetMinutes(candidate);
  if (refinedOffset !== firstOffset) {
    return new Date(approxUtcMs - refinedOffset * 60_000);
  }
  return candidate;
}

export function addDaysToDateString(dateStr: string, days: number): string {
  const { year, month, day } = parseObservationDate(dateStr);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  const y = next.getUTCFullYear();
  const m = String(next.getUTCMonth() + 1).padStart(2, "0");
  const d = String(next.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getObservationNightWindow(dateStr: string): ObservationWindow {
  const nextDateStr = addDaysToDateString(dateStr, 1);
  const startUtc = chileLocalToUtc(dateStr, 12, 0);
  const endUtc = chileLocalToUtc(nextDateStr, 12, 0);
  const midnightUtc = chileLocalToUtc(nextDateStr, 0, 0);
  return { dateStr, startUtc, endUtc, midnightUtc };
}

export function formatChileTime(date: Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: CHILE_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatChileDateTime(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CHILE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}
