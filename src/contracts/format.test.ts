import { describe, expect, it } from "vitest";
import { formatAbha, formatIST, maskAbha, parseAbhaInput } from "./format";

describe("formatIST", () => {
  it("shows a UTC time in Indian time", () => {
    expect(formatIST("2026-09-17T04:30:00.000Z")).toBe("17 Sep 2026, 10:00 AM");
  });

  it("moves to the next day when UTC is late evening", () => {
    expect(formatIST("2026-09-17T18:45:00.000Z")).toBe("18 Sep 2026, 12:15 AM");
  });

  it("crosses into a new year", () => {
    expect(formatIST("2026-12-31T20:00:00.000Z")).toBe("1 Jan 2027, 1:30 AM");
  });

  it("shows noon as 12 PM", () => {
    expect(formatIST("2026-09-17T06:30:00.000Z")).toBe("17 Sep 2026, 12:00 PM");
  });

  it("accepts a Date as well as a string", () => {
    expect(formatIST(new Date("2026-09-17T04:30:00.000Z"))).toBe("17 Sep 2026, 10:00 AM");
  });

  it("returns an empty string for an invalid date", () => {
    expect(formatIST("not a date")).toBe("");
  });
});

describe("formatAbha and maskAbha", () => {
  it("adds hyphens to a 14-digit number", () => {
    expect(formatAbha("91100000000001")).toBe("91-1000-0000-0001");
  });

  it("round trips with parseAbhaInput", () => {
    const shown = formatAbha("91100000000001");
    expect(parseAbhaInput(shown)).toEqual({ kind: "number", value: "91100000000001" });
  });

  it("leaves anything that isn't 14 digits unchanged", () => {
    expect(formatAbha("12345")).toBe("12345");
  });

  it("masks all but the last four digits", () => {
    expect(maskAbha("91100000000001")).toBe("XX-XXXX-XXXX-0001");
  });

  it("masks everything if the number is invalid", () => {
    expect(maskAbha("abc")).toBe("XX-XXXX-XXXX-XXXX");
  });
});

describe("parseAbhaInput", () => {
  it("accepts a number with hyphens", () => {
    expect(parseAbhaInput("91-1000-0000-0001")).toEqual({ kind: "number", value: "91100000000001" });
  });

  it("accepts a number without hyphens", () => {
    expect(parseAbhaInput("91100000000001")).toEqual({ kind: "number", value: "91100000000001" });
  });

  it("accepts a number with spaces and surrounding whitespace", () => {
    expect(parseAbhaInput("  91 1000 0000 0001 ")).toEqual({ kind: "number", value: "91100000000001" });
  });

  it("accepts an address and lowercases it", () => {
    expect(parseAbhaInput("Asha.Verma@ABDM")).toEqual({ kind: "address", value: "asha.verma@abdm" });
  });

  it("rejects a number with the wrong length", () => {
    expect(parseAbhaInput("91-1000-0000-001")).toBeNull();
  });

  it("rejects letters mixed into a number", () => {
    expect(parseAbhaInput("91-1000-0000-00A1")).toBeNull();
  });

  it("rejects an address that isn't @abdm", () => {
    expect(parseAbhaInput("asha@gmail.com")).toBeNull();
  });

  it("rejects empty input", () => {
    expect(parseAbhaInput("   ")).toBeNull();
  });
});
