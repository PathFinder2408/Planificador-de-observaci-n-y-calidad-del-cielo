import { Pool, type QueryResult, type QueryResultRow } from "pg";
import { parseEnv } from "@/lib/env";

export interface QueryExecutor {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: readonly unknown[]
  ): Promise<QueryResult<T>>;
}

let cachedPool: Pool | null = null;

export function isDatabaseConfigured(): boolean {
  const env = parseEnv();
  return Boolean(env.DATABASE_URL);
}

export function getDbPool(): Pool {
  const env = parseEnv();
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }
  if (!cachedPool) {
    cachedPool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 5,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });
  }
  return cachedPool;
}
