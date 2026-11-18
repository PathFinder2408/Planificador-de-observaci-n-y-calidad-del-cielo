import { NextResponse } from "next/server";
import { parseEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export async function GET(): Promise<NextResponse> {
  try {
    const env = parseEnv();
    return NextResponse.json(
      {
        status: "ok",
        service: "planificador-observacion-cielo",
        environment: env.NODE_ENV,
        timezone: "America/Santiago",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Healthcheck failed", { error: message });
    return NextResponse.json(
      { status: "error", message: "Service configuration invalid" },
      { status: 500 }
    );
  }
}
