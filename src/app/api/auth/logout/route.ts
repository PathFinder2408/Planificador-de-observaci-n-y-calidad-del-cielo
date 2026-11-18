import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/cookies";

export async function POST(): Promise<NextResponse> {
  return clearSessionCookie(NextResponse.json({ ok: true }, { status: 200 }));
}
