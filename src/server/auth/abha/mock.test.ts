import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MockAbhaProvider, type AbhaDirectoryEntry, type FindInDirectory } from "./mock";

const asha: AbhaDirectoryEntry = {
  abhaNumber: "91100000000001",
  abhaAddress: "asha.verma@abdm",
  name: "Asha Verma",
  mobileLast4: "4821",
  dob: new Date("1990-04-12T00:00:00Z"),
  gender: "F",
};

const findInFakeDirectory: FindInDirectory = async (input) => {
  if (input.kind === "number" && input.value === asha.abhaNumber) return asha;
  if (input.kind === "address" && input.value === asha.abhaAddress) return asha;
  return null;
};

const MINUTE = 60 * 1000;

let provider: MockAbhaProvider;

beforeEach(() => {
  provider = new MockAbhaProvider(findInFakeDirectory);
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-16T10:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

async function errorCodeOf(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return (error as { code: string }).code;
  }
  return "NO ERROR";
}

describe("happy path", () => {
  it("logs in with the ABHA number and the right OTP", async () => {
    const { txnId, maskedMobile } = await provider.requestOtp("91-1000-0000-0001");
    expect(maskedMobile).toBe("******4821");

    const result = await provider.verifyOtp(txnId, "123456");
    expect(result).toEqual({ abhaNumber: "91100000000001" });
  });

  it("also works with the ABHA address, in any case", async () => {
    const { txnId } = await provider.requestOtp("Asha.Verma@ABDM");
    expect(await provider.verifyOtp(txnId, "123456")).toEqual({ abhaNumber: "91100000000001" });
  });

  it("returns the profile without the mobile number", async () => {
    const profile = await provider.getProfile("91100000000001");
    expect(profile).toEqual({
      abhaNumber: "91100000000001",
      abhaAddress: "asha.verma@abdm",
      name: "Asha Verma",
      dob: "1990-04-12",
      gender: "F",
    });
  });
});

describe("wrong OTP", () => {
  it("kills the transaction after 3 wrong tries, so even the right OTP then fails", async () => {
    const { txnId } = await provider.requestOtp("91100000000001");

    expect(await errorCodeOf(provider.verifyOtp(txnId, "000000"))).toBe("OTP_INVALID");
    expect(await errorCodeOf(provider.verifyOtp(txnId, "111111"))).toBe("OTP_INVALID");
    expect(await errorCodeOf(provider.verifyOtp(txnId, "222222"))).toBe("OTP_INVALID");

    expect(await errorCodeOf(provider.verifyOtp(txnId, "123456"))).toBe("OTP_INVALID");
  });

  it("still accepts the right OTP after 2 wrong tries", async () => {
    const { txnId } = await provider.requestOtp("91100000000001");
    await errorCodeOf(provider.verifyOtp(txnId, "000000"));
    await errorCodeOf(provider.verifyOtp(txnId, "111111"));

    expect(await provider.verifyOtp(txnId, "123456")).toEqual({ abhaNumber: "91100000000001" });
  });

  it("can't use the same OTP twice", async () => {
    const { txnId } = await provider.requestOtp("91100000000001");
    await provider.verifyOtp(txnId, "123456");

    expect(await errorCodeOf(provider.verifyOtp(txnId, "123456"))).toBe("OTP_INVALID");
  });

  it("rejects a txnId that never existed", async () => {
    expect(await errorCodeOf(provider.verifyOtp("made-up-id", "123456"))).toBe("OTP_INVALID");
  });
});

describe("expiry (5 minutes)", () => {
  it("works at 4 minutes 59 seconds", async () => {
    const { txnId } = await provider.requestOtp("91100000000001");
    vi.advanceTimersByTime(5 * MINUTE - 1000);

    expect(await provider.verifyOtp(txnId, "123456")).toEqual({ abhaNumber: "91100000000001" });
  });

  it("fails at exactly 5 minutes", async () => {
    const { txnId } = await provider.requestOtp("91100000000001");
    vi.advanceTimersByTime(5 * MINUTE);

    expect(await errorCodeOf(provider.verifyOtp(txnId, "123456"))).toBe("OTP_INVALID");
  });
});

describe("rate limit (3 requests per 10 minutes)", () => {
  it("refuses the 4th request", async () => {
    await provider.requestOtp("91100000000001");
    await provider.requestOtp("91100000000001");
    await provider.requestOtp("91100000000001");

    expect(await errorCodeOf(provider.requestOtp("91100000000001"))).toBe("RATE_LIMITED");
  });

  it("counts the number and the address as the same person", async () => {
    await provider.requestOtp("91100000000001");
    await provider.requestOtp("asha.verma@abdm");
    await provider.requestOtp("91-1000-0000-0001");

    expect(await errorCodeOf(provider.requestOtp("asha.verma@abdm"))).toBe("RATE_LIMITED");
  });

  it("allows a new request once 10 minutes have passed", async () => {
    await provider.requestOtp("91100000000001");
    await provider.requestOtp("91100000000001");
    await provider.requestOtp("91100000000001");

    vi.advanceTimersByTime(10 * MINUTE + 1000);

    const reply = await provider.requestOtp("91100000000001");
    expect(reply.txnId).toBeTruthy();
  });
});

describe("unknown ABHA", () => {
  it("gets a reply with the same shape as a real one", async () => {
    const real = await provider.requestOtp("91100000000001");
    const unknown = await provider.requestOtp("91100000000099");

    expect(Object.keys(unknown).sort()).toEqual(Object.keys(real).sort());
    expect(unknown.maskedMobile).toMatch(/^\*{6}\d{4}$/);
  });

  it("never logs in, even with the demo OTP", async () => {
    const { txnId } = await provider.requestOtp("91100000000099");
    expect(await errorCodeOf(provider.verifyOtp(txnId, "123456"))).toBe("OTP_INVALID");
  });

  it("has no profile", async () => {
    expect(await errorCodeOf(provider.getProfile("91100000000099"))).toBe("NOT_FOUND");
  });
});

describe("input and dev hint", () => {
  it("rejects something that isn't an ABHA", async () => {
    expect(await errorCodeOf(provider.requestOtp("hello"))).toBe("VALIDATION_FAILED");
  });

  it("includes devOtp only in development", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect((await provider.requestOtp("91100000000001")).devOtp).toBeUndefined();

    vi.stubEnv("NODE_ENV", "development");
    expect((await provider.requestOtp("asha.verma@abdm")).devOtp).toBe("123456");
  });
});
