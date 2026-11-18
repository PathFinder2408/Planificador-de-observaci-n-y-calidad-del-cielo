import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as postLogin } from "@/app/api/auth/login/route";
import { POST as postLogout } from "@/app/api/auth/logout/route";
import { GET as getMe } from "@/app/api/auth/me/route";
import { POST as postRegister } from "@/app/api/auth/register/route";
import {
  DELETE as deleteFavorite,
  GET as getFavorites,
  POST as postFavorite,
} from "@/app/api/favorites/route";
import { hashPassword, SESSION_COOKIE_NAME, signSessionToken } from "@/lib/auth/session";
import * as dbClient from "@/lib/db/client";

describe("Auth and favorites API routes", () => {
  const originalDb = process.env.DATABASE_URL;
  const originalSecret = process.env.AUTH_SECRET;

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalDb === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDb;

    if (originalSecret === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = originalSecret;
  });

  it("returns user=null on /api/auth/me and 401 on /api/favorites without session", async () => {
    const meRes = await getMe(new NextRequest("http://localhost:3000/api/auth/me"));
    const meBody = (await meRes.json()) as { user: unknown };
    expect(meRes.status).toBe(200);
    expect(meBody.user).toBeNull();

    const favGet = await getFavorites(new NextRequest("http://localhost:3000/api/favorites"));
    const favPost = await postFavorite(
      new NextRequest("http://localhost:3000/api/favorites", { method: "POST" })
    );
    const favDel = await deleteFavorite(
      new NextRequest("http://localhost:3000/api/favorites?kind=site&itemId=vera-rubin", {
        method: "DELETE",
      })
    );
    expect(favGet.status).toBe(401);
    expect(favPost.status).toBe(401);
    expect(favDel.status).toBe(401);
  });

  it("returns 503 when DATABASE_URL is not configured", async () => {
    delete process.env.DATABASE_URL;
    process.env.AUTH_SECRET = "test-secret-with-at-least-32-chars";

    const regRes = await postRegister(
      new NextRequest("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "astro@tololo.cl",
          name: "Francisco",
          password: "password123",
        }),
      })
    );
    expect(regRes.status).toBe(503);

    const loginRes = await postLogin(
      new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "astro@tololo.cl", password: "password123" }),
      })
    );
    expect(loginRes.status).toBe(503);

    const token = await signSessionToken({
      sub: "u1",
      email: "astro@tololo.cl",
      name: "Francisco",
    });

    const favRes = await postFavorite(
      new NextRequest("http://localhost:3000/api/favorites", {
        method: "POST",
        headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
        body: JSON.stringify({ kind: "site", itemId: "vera-rubin" }),
      })
    );
    expect(favRes.status).toBe(503);
  });

  it("registers and logs in a user with valid credentials and sets HttpOnly cookie", async () => {
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/test";
    process.env.AUTH_SECRET = "test-secret-with-at-least-32-chars";
    const hashed = await hashPassword("password123");

    const mockQuery = vi
      .fn()
      // register: findUserByEmail -> empty, createUser -> user
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({
        rows: [{ id: "u1", email: "astro@tololo.cl", name: "Francisco" }],
        rowCount: 1,
      })
      // login: findUserByEmail -> user with hash
      .mockResolvedValueOnce({
        rows: [{ id: "u1", email: "astro@tololo.cl", name: "Francisco", password_hash: hashed }],
        rowCount: 1,
      })
      // login wrong password: findUserByEmail -> user with hash
      .mockResolvedValueOnce({
        rows: [{ id: "u1", email: "astro@tololo.cl", name: "Francisco", password_hash: hashed }],
        rowCount: 1,
      });

    vi.spyOn(dbClient, "getDbPool").mockReturnValue({
      query: mockQuery,
    } as unknown as ReturnType<typeof dbClient.getDbPool>);

    const regRes = await postRegister(
      new NextRequest("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "astro@tololo.cl",
          name: "Francisco",
          password: "password123",
        }),
      })
    );
    expect(regRes.status).toBe(201);
    expect(regRes.headers.get("set-cookie")).toContain(`${SESSION_COOKIE_NAME}=`);

    const loginOk = await postLogin(
      new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "astro@tololo.cl", password: "password123" }),
      })
    );
    expect(loginOk.status).toBe(200);
    expect(loginOk.headers.get("set-cookie")).toContain("HttpOnly");

    const loginFail = await postLogin(
      new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "astro@tololo.cl", password: "wrong" }),
      })
    );
    expect(loginFail.status).toBe(401);
  });

  it("lists, adds and deletes favorites when authenticated", async () => {
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/test";
    process.env.AUTH_SECRET = "test-secret-with-at-least-32-chars";

    const token = await signSessionToken({
      sub: "u1",
      email: "astro@tololo.cl",
      name: "Francisco",
    });

    const mockQuery = vi
      .fn()
      .mockResolvedValueOnce({
        rows: [{ id: "f1", user_id: "u1", kind: "site", item_id: "vera-rubin", created_at: "now" }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({
        rows: [{ id: "f1", user_id: "u1", kind: "site", item_id: "vera-rubin", created_at: "now" }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    vi.spyOn(dbClient, "getDbPool").mockReturnValue({
      query: mockQuery,
    } as unknown as ReturnType<typeof dbClient.getDbPool>);

    const headers = { cookie: `${SESSION_COOKIE_NAME}=${token}` };

    const addRes = await postFavorite(
      new NextRequest("http://localhost:3000/api/favorites", {
        method: "POST",
        headers,
        body: JSON.stringify({ kind: "site", itemId: "vera-rubin" }),
      })
    );
    expect(addRes.status).toBe(201);

    const listRes = await getFavorites(
      new NextRequest("http://localhost:3000/api/favorites", { headers })
    );
    const listBody = (await listRes.json()) as { favorites: unknown[] };
    expect(listRes.status).toBe(200);
    expect(listBody.favorites).toHaveLength(1);

    const delRes = await deleteFavorite(
      new NextRequest("http://localhost:3000/api/favorites?kind=site&itemId=vera-rubin", {
        method: "DELETE",
        headers,
      })
    );
    expect(delRes.status).toBe(200);
  });

  it("returns user on /api/auth/me with valid cookie and clears cookie on logout", async () => {
    process.env.AUTH_SECRET = "test-secret-with-at-least-32-chars";
    const token = await signSessionToken({
      sub: "u1",
      email: "astro@tololo.cl",
      name: "Francisco",
    });

    const meRes = await getMe(
      new NextRequest("http://localhost:3000/api/auth/me", {
        headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
      })
    );
    const meBody = (await meRes.json()) as { user: { email: string } | null };
    expect(meRes.status).toBe(200);
    expect(meBody.user?.email).toBe("astro@tololo.cl");

    const logoutRes = await postLogout();
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.headers.get("set-cookie")).toContain(`${SESSION_COOKIE_NAME}=;`);
  });

  it("returns 400 on invalid payloads and 409 on duplicate email registration", async () => {
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/test";
    process.env.AUTH_SECRET = "test-secret-with-at-least-32-chars";

    const mockQuery = vi.fn().mockResolvedValueOnce({
      rows: [{ id: "u1", email: "astro@tololo.cl", name: "Francisco", password_hash: "h" }],
      rowCount: 1,
    });
    vi.spyOn(dbClient, "getDbPool").mockReturnValue({
      query: mockQuery,
    } as unknown as ReturnType<typeof dbClient.getDbPool>);

    const badJson = await postRegister(
      new NextRequest("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: "{not-json",
      })
    );
    expect(badJson.status).toBe(400);

    const dupReg = await postRegister(
      new NextRequest("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "astro@tololo.cl",
          name: "Francisco",
          password: "password123",
        }),
      })
    );
    expect(dupReg.status).toBe(409);

    const badLogin = await postLogin(
      new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "not-an-email", password: "" }),
      })
    );
    expect(badLogin.status).toBe(400);

    const token = await signSessionToken({
      sub: "u1",
      email: "astro@tololo.cl",
      name: "Francisco",
    });
    const badFav = await postFavorite(
      new NextRequest("http://localhost:3000/api/favorites", {
        method: "POST",
        headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
        body: JSON.stringify({ kind: "invalid", itemId: "" }),
      })
    );
    expect(badFav.status).toBe(400);
  });
});
