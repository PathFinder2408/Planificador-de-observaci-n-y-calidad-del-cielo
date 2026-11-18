import { NextResponse } from "next/server";
import { OBSERVATORY_SITES } from "@/data/sites";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { sites: OBSERVATORY_SITES },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
