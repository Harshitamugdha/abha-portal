import { describe, expect, it } from "vitest";
import { isEscapeKey } from "./modal";

describe("isEscapeKey helper", () => {
  it("returns true for Escape key event", () => {
    expect(isEscapeKey({ key: "Escape" })).toBe(true);
  });

  it("returns true for legacy Esc key event", () => {
    expect(isEscapeKey({ key: "Esc" })).toBe(true);
  });

  it("returns false for non-escape keys", () => {
    expect(isEscapeKey({ key: "Enter" })).toBe(false);
    expect(isEscapeKey({ key: "Tab" })).toBe(false);
    expect(isEscapeKey({ key: "Backspace" })).toBe(false);
    expect(isEscapeKey({ key: "ArrowLeft" })).toBe(false);
    expect(isEscapeKey({ key: "x" })).toBe(false);
    expect(isEscapeKey({ key: "" })).toBe(false);
  });
});
