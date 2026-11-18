import type { ObservatorySite } from "@/data/sites";
import type { NightEphemeris } from "@/lib/astro/ephemeris";
import type { NightVisibilityReport } from "@/lib/astro/visibility";
import type { NightWeatherSummary } from "@/lib/weather/qualityIndex";

export interface ObservationResponse {
  site: ObservatorySite;
  date: string;
  ephemeris: NightEphemeris;
  visibility: NightVisibilityReport;
  weather: NightWeatherSummary | null;
  weatherWarning: string | null;
}
