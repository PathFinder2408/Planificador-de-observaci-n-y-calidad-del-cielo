import { describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/env";

describe("parseEnv", () => {
  it("applies safe defaults when optional variables are omitted", () => {
    const config = parseEnv({});

    expect(config.NODE_ENV).toBe("development");
    expect(config.LOG_LEVEL).toBe("info");
    expect(config.OPEN_METEO_BASE_URL).toBe("https://api.open-meteo.com/v1");
    expect(config.EXTERNAL_API_TIMEOUT_MS).toBe(5000);
  });

  it("parses valid custom environment values", () => {
    const config = parseEnv({
      NODE_ENV: "production",
      LOG_LEVEL: "warn",
      OPEN_METEO_BASE_URL: "https://api.open-meteo.com/v1",
      EXTERNAL_API_TIMEOUT_MS: "8000",
    });

    expect(config.NODE_ENV).toBe("production");
    expect(config.LOG_LEVEL).toBe("warn");
    expect(config.EXTERNAL_API_TIMEOUT_MS).toBe(8000);
  });

  it("throws a descriptive error when URL or timeout is invalid", () => {
    expect(() =>
      parseEnv({
        OPEN_METEO_BASE_URL: "not-a-url",
        EXTERNAL_API_TIMEOUT_MS: "100",
      })
    ).toThrow(/Invalid environment configuration/);
  });
});
