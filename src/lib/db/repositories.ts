import crypto from "node:crypto";
import type { QueryExecutor } from "@/lib/db/client";

export type FavoriteKind = "site" | "target";

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  password_hash: string;
}

export interface FavoriteRecord {
  id: string;
  user_id: string;
  kind: FavoriteKind;
  item_id: string;
  created_at: string;
}

export async function findUserByEmail(
  db: QueryExecutor,
  email: string
): Promise<UserRecord | null> {
  const normalized = email.trim().toLowerCase();
  const result = await db.query<UserRecord>(
    "SELECT id, email, name, password_hash FROM users WHERE email = $1 LIMIT 1",
    [normalized]
  );
  return result.rows[0] ?? null;
}

export async function createUser(
  db: QueryExecutor,
  input: { email: string; name: string; passwordHash: string }
): Promise<Omit<UserRecord, "password_hash">> {
  const id = crypto.randomUUID();
  const normalized = input.email.trim().toLowerCase();
  const result = await db.query<Omit<UserRecord, "password_hash">>(
    "INSERT INTO users (id, email, name, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, email, name",
    [id, normalized, input.name.trim(), input.passwordHash]
  );
  const created = result.rows[0];
  if (!created) {
    throw new Error("Failed to insert user record");
  }
  return created;
}

export async function listFavoritesByUser(
  db: QueryExecutor,
  userId: string
): Promise<FavoriteRecord[]> {
  const result = await db.query<FavoriteRecord>(
    "SELECT id, user_id, kind, item_id, created_at FROM favorites WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );
  return result.rows;
}

export async function addFavorite(
  db: QueryExecutor,
  userId: string,
  kind: FavoriteKind,
  itemId: string
): Promise<FavoriteRecord> {
  const id = crypto.randomUUID();
  const result = await db.query<FavoriteRecord>(
    `INSERT INTO favorites (id, user_id, kind, item_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, kind, item_id) DO UPDATE SET item_id = EXCLUDED.item_id
     RETURNING id, user_id, kind, item_id, created_at`,
    [id, userId, kind, itemId]
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to save favorite");
  }
  return row;
}

export async function removeFavorite(
  db: QueryExecutor,
  userId: string,
  kind: FavoriteKind,
  itemId: string
): Promise<boolean> {
  const result = await db.query(
    "DELETE FROM favorites WHERE user_id = $1 AND kind = $2 AND item_id = $3",
    [userId, kind, itemId]
  );
  return (result.rowCount ?? 0) > 0;
}
