import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/v1/health", () => {
  it("returns ok: true and ISO timestamp", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(typeof body.at).toBe("string");
    expect(new Date(body.at).toISOString()).toBe(body.at);
  });
});
