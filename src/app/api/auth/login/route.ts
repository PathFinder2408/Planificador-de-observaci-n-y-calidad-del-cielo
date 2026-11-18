import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { attachSessionCookie } from "@/lib/auth/cookies";
import { signSessionToken, verifyPassword } from "@/lib/auth/session";
import { getDbPool, isDatabaseConfigured } from "@/lib/db/client";
import { findUserByEmail } from "@/lib/db/repositories";
import { logger } from "@/lib/logger";

const LoginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Base de datos no configurada en este entorno" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 400 });
  }

  try {
    const db = getDbPool();
    const user = await findUserByEmail(db, parsed.data.email);
    if (!user) {
      return NextResponse.json({ error: "Correo o contraseña incorrectos" }, { status: 401 });
    }

    const isValid = await verifyPassword(parsed.data.password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: "Correo o contraseña incorrectos" }, { status: 401 });
    }

    const token = await signSessionToken({
      sub: user.id,
      email: user.email,
      name: user.name,
    });

    return attachSessionCookie(
      NextResponse.json(
        { user: { id: user.id, email: user.email, name: user.name } },
        { status: 200 }
      ),
      token
    );
  } catch (error) {
    logger.error("Login failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "No se pudo iniciar sesión" }, { status: 500 });
  }
}
