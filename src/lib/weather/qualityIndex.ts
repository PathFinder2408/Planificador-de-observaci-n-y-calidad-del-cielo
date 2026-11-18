export type QualityRating = "Excelente" | "Buena" | "Regular" | "Mala";

export interface WeatherMetrics {
  cloudCoverPercent: number;
  humidityPercent: number;
  windSpeedKmh: number;
  temperatureC: number;
}

export interface HourlyWeatherPoint extends WeatherMetrics {
  localTimeIso: string;
  hourLabel: string;
  qualityScore: number;
}

export interface QualityBreakdown {
  score: number;
  rating: QualityRating;
  components: {
    cloudScore: number;
    humidityScore: number;
    windScore: number;
    thermalScore: number;
  };
}

export interface NightWeatherSummary {
  averageCloudCoverPercent: number;
  averageHumidityPercent: number;
  averageWindSpeedKmh: number;
  averageTemperatureC: number;
  quality: QualityBreakdown;
  bestHour: { hourLabel: string; score: number } | null;
  hourly: HourlyWeatherPoint[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getQualityRating(score: number): QualityRating {
  if (score >= 80) return "Excelente";
  if (score >= 60) return "Buena";
  if (score >= 40) return "Regular";
  return "Mala";
}

/**
 * Calcula el Índice de Calidad de Observación (0-100):
 * - Nubosidad (55%): 0% nubes -> 100 pts; >= 91% -> 0 pts.
 * - Humedad relativa (20%): <= 40% -> 100 pts; >= 95% -> 0 pts.
 * - Viento a 10 m (15%): <= 15 km/h -> 100 pts; >= 55 km/h -> 0 pts.
 * - Estabilidad térmica (10%): óptimo entre 2 °C y 18 °C.
 */
export function calculateObservationQuality(metrics: WeatherMetrics): QualityBreakdown {
  const cloudScore = clamp(100 - metrics.cloudCoverPercent * 1.1, 0, 100);
  const humidityScore =
    metrics.humidityPercent <= 40
      ? 100
      : clamp(100 - ((metrics.humidityPercent - 40) / 55) * 100, 0, 100);
  const windScore =
    metrics.windSpeedKmh <= 15
      ? 100
      : clamp(100 - ((metrics.windSpeedKmh - 15) / 40) * 100, 0, 100);

  let thermalScore = 100;
  if (metrics.temperatureC < 2) {
    thermalScore = clamp(100 - (2 - metrics.temperatureC) * 5, 0, 100);
  } else if (metrics.temperatureC > 18) {
    thermalScore = clamp(100 - (metrics.temperatureC - 18) * 5, 0, 100);
  }

  const weighted = 0.55 * cloudScore + 0.2 * humidityScore + 0.15 * windScore + 0.1 * thermalScore;
  const score = Math.round(clamp(weighted, 0, 100));

  return {
    score,
    rating: getQualityRating(score),
    components: {
      cloudScore: Math.round(cloudScore),
      humidityScore: Math.round(humidityScore),
      windScore: Math.round(windScore),
      thermalScore: Math.round(thermalScore),
    },
  };
}

export function summarizeNightWeather(points: HourlyWeatherPoint[]): NightWeatherSummary | null {
  if (points.length === 0) {
    return null;
  }

  let cloudSum = 0;
  let humiditySum = 0;
  let windSum = 0;
  let tempSum = 0;
  let bestHour: { hourLabel: string; score: number } | null = null;

  for (const point of points) {
    cloudSum += point.cloudCoverPercent;
    humiditySum += point.humidityPercent;
    windSum += point.windSpeedKmh;
    tempSum += point.temperatureC;

    if (!bestHour || point.qualityScore > bestHour.score) {
      bestHour = { hourLabel: point.hourLabel, score: point.qualityScore };
    }
  }

  const count = points.length;
  const averages: WeatherMetrics = {
    cloudCoverPercent: Number((cloudSum / count).toFixed(1)),
    humidityPercent: Number((humiditySum / count).toFixed(1)),
    windSpeedKmh: Number((windSum / count).toFixed(1)),
    temperatureC: Number((tempSum / count).toFixed(1)),
  };

  return {
    averageCloudCoverPercent: averages.cloudCoverPercent,
    averageHumidityPercent: averages.humidityPercent,
    averageWindSpeedKmh: averages.windSpeedKmh,
    averageTemperatureC: averages.temperatureC,
    quality: calculateObservationQuality(averages),
    bestHour,
    hourly: points,
  };
}
