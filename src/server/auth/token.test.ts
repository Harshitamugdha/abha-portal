import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionUser } from "@/contracts/shared";
import { createSessionToken, readSessionToken } from "./token";

const kavya: SessionUser = {
  id: "user-kavya",
  role: "DOCTOR",
  name: "Dr Kavya Iyer",
  verified: true,
  institutionIds: ["inst-citygen"],
};

beforeEach(() => {
  vi.stubEnv("JWT_SECRET", "test-secret-that-is-at-least-32-characters-long");
  vi.stubEnv("SESSION_HOURS", "8");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("session token", () => {
  it("gives back the same user it was made for", async () => {
    const token = await createSessionToken(kavya);
    expect(await readSessionToken(token)).toEqual(kavya);
  });

  it("rejects a tampered token (role changed to ADMIN)", async () => {
    const token = await createSessionToken(kavya);
    const [header, payload, signature] = token.split(".");

    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    data.user.role = "ADMIN";
    const forgedPayload = Buffer.from(JSON.stringify(data)).toString("base64url");

    expect(await readSessionToken(`${header}.${forgedPayload}.${signature}`)).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await createSessionToken(kavya);
    vi.stubEnv("JWT_SECRET", "a-completely-different-secret-of-32-plus-chars");
    expect(await readSessionToken(token)).toBeNull();
  });

  it("rejects garbage", async () => {
    expect(await readSessionToken("not-a-jwt")).toBeNull();
  });

  it("expires after SESSION_HOURS", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-16T10:00:00Z"));
    const token = await createSessionToken(kavya);

    vi.setSystemTime(new Date("2026-11-16T17:59:00Z"));
    expect(await readSessionToken(token)).toEqual(kavya);

    vi.setSystemTime(new Date("2026-11-16T18:00:01Z"));
    expect(await readSessionToken(token)).toBeNull();
  });

  it("refuses to work without a proper JWT_SECRET", async () => {
    vi.stubEnv("JWT_SECRET", "replace-with-32+-random-characters");
    await expect(createSessionToken(kavya)).rejects.toThrow("JWT_SECRET");
  });
});
