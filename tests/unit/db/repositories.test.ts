import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { QueryExecutor } from "@/lib/db/client";
import {
  addFavorite,
  createUser,
  findUserByEmail,
  listFavoritesByUser,
  removeFavorite,
} from "@/lib/db/repositories";

describe("Database repositories and SQL migrations", () => {
  it("normalizes email when finding and creating users", async () => {
    const queryMock = vi.fn().mockResolvedValue({
      rows: [{ id: "u1", email: "francisco@inacap.cl", name: "Francisco" }],
      rowCount: 1,
      command: "INSERT",
      oid: 0,
      fields: [],
    });
    const db: QueryExecutor = { query: queryMock as unknown as QueryExecutor["query"] };

    const created = await createUser(db, {
      email: "  Francisco@INACAP.cl ",
      name: " Francisco ",
      passwordHash: "hash",
    });
    expect(created.email).toBe("francisco@inacap.cl");
    expect(queryMock.mock.calls[0]?.[1]?.[1]).toBe("francisco@inacap.cl");

    await findUserByEmail(db, "Francisco@INACAP.cl");
    expect(queryMock.mock.calls[1]?.[1]).toEqual(["francisco@inacap.cl"]);
  });

  it("manages favorites CRUD queries", async () => {
    const queryMock = vi
      .fn()
      .mockResolvedValueOnce({
        rows: [
          {
            id: "f1",
            user_id: "u1",
            kind: "site",
            item_id: "vera-rubin",
            created_at: "2026-11-18T00:00:00Z",
          },
        ],
        rowCount: 1,
        command: "INSERT",
        oid: 0,
        fields: [],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "f1",
            user_id: "u1",
            kind: "site",
            item_id: "vera-rubin",
            created_at: "2026-11-18T00:00:00Z",
          },
        ],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: [],
      })
      .mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: "DELETE",
        oid: 0,
        fields: [],
      });

    const db: QueryExecutor = { query: queryMock as unknown as QueryExecutor["query"] };

    const added = await addFavorite(db, "u1", "site", "vera-rubin");
    expect(added.item_id).toBe("vera-rubin");

    const list = await listFavoritesByUser(db, "u1");
    expect(list).toHaveLength(1);

    const removed = await removeFavorite(db, "u1", "site", "vera-rubin");
    expect(removed).toBe(true);
  });

  it("includes versioned UP and DOWN SQL migrations", () => {
    const upPath = path.resolve(process.cwd(), "db/migrations/0001_init.up.sql");
    const downPath = path.resolve(process.cwd(), "db/migrations/0001_init.down.sql");
    const upSql = fs.readFileSync(upPath, "utf8");
    const downSql = fs.readFileSync(downPath, "utf8");

    expect(upSql).toContain("CREATE TABLE IF NOT EXISTS users");
    expect(upSql).toContain("CREATE TABLE IF NOT EXISTS favorites");
    expect(downSql).toContain("DROP TABLE IF EXISTS favorites");
    expect(downSql).toContain("DROP TABLE IF EXISTS users");
  });
});
