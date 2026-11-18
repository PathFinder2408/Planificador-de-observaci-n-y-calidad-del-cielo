import { afterEach, describe, expect, it } from "vitest";
import {
  getAuthSecret,
  hashPassword,
  signSessionToken,
  verifyPassword,
  verifySessionToken,
} from "@/lib/auth/session";

describe("Auth session and password helpers", () => {
  const originalSecret = process.env.AUTH_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.AUTH_SECRET;
    } else {
      process.env.AUTH_SECRET = originalSecret;
    }
  });

  it("hashes and verifies passwords with bcryptjs", async () => {
    const hash = await hashPassword("observatorio-2026");
    expect(hash).not.toBe("observatorio-2026");
    expect(await verifyPassword("observatorio-2026", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("signs and verifies JWT session tokens and rejects tampered tokens", async () => {
    const secret = new TextEncoder().encode("test-secret-with-at-least-32-chars");
    const token = await signSessionToken(
      { sub: "user-123", email: "astro@tololo.cl", name: "Francisco" },
      secret
    );

    const decoded = await verifySessionToken(token, secret);
    expect(decoded).toEqual({
      sub: "user-123",
      email: "astro@tololo.cl",
      name: "Francisco",
    });

    expect(await verifySessionToken(`${token}tamper`, secret)).toBeNull();
  });

  it("throws when AUTH_SECRET is missing", () => {
    delete process.env.AUTH_SECRET;
    expect(() => getAuthSecret()).toThrow(/AUTH_SECRET is not configured/);
  });
});
