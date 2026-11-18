import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { attachSessionCookie } from "@/lib/auth/cookies";
import { hashPassword, signSessionToken } from "@/lib/auth/session";
import { getDbPool, isDatabaseConfigured } from "@/lib/db/client";
import { createUser, findUserByEmail } from "@/lib/db/repositories";
import { logger } from "@/lib/logger";

const RegisterSchema = z.object({
  email: z.string().email("Correo inválido"),
  name: z.string().min(2, "Nombre muy corto").max(60),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(100),
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

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  try {
    const db = getDbPool();
    const existing = await findUserByEmail(db, parsed.data.email);
    if (existing) {
      return NextResponse.json({ error: "Este correo ya está registrado" }, { status: 409 });
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await createUser(db, {
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash,
    });

    const token = await signSessionToken({
      sub: user.id,
      email: user.email,
      name: user.name,
    });

    return attachSessionCookie(NextResponse.json({ user }, { status: 201 }), token);
  } catch (error) {
    logger.error("Register failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "No se pudo registrar el usuario" }, { status: 500 });
  }
}
