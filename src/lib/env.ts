import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  OPEN_METEO_BASE_URL: z.string().url().default("https://api.open-meteo.com/v1"),
  EXTERNAL_API_TIMEOUT_MS: z.coerce.number().int().min(500).max(30000).default(5000),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function parseEnv(rawEnv: Record<string, string | undefined> = process.env): EnvConfig {
  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return result.data;
}
