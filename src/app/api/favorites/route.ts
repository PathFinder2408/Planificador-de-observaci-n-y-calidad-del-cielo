import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getDbPool, isDatabaseConfigured } from "@/lib/db/client";
import { addFavorite, listFavoritesByUser, removeFavorite } from "@/lib/db/repositories";
import { logger } from "@/lib/logger";

const FavoritePayloadSchema = z.object({
  kind: z.enum(["site", "target"]),
  itemId: z.string().min(1).max(60),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
  }

  try {
    const favorites = await listFavoritesByUser(getDbPool(), session.sub);
    return NextResponse.json({ favorites }, { status: 200 });
  } catch (error) {
    logger.error("List favorites failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Error consultando favoritos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = FavoritePayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de favorito inválidos" }, { status: 400 });
  }

  try {
    const favorite = await addFavorite(
      getDbPool(),
      session.sub,
      parsed.data.kind,
      parsed.data.itemId
    );
    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error) {
    logger.error("Add favorite failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Error guardando favorito" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
  }

  const parsed = FavoritePayloadSchema.safeParse({
    kind: request.nextUrl.searchParams.get("kind"),
    itemId: request.nextUrl.searchParams.get("itemId"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  try {
    const removed = await removeFavorite(
      getDbPool(),
      session.sub,
      parsed.data.kind,
      parsed.data.itemId
    );
    return NextResponse.json({ removed }, { status: 200 });
  } catch (error) {
    logger.error("Delete favorite failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Error eliminando favorito" }, { status: 500 });
  }
}
