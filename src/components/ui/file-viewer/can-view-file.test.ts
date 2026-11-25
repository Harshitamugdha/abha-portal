import { describe, expect, it } from "vitest";
import { canViewFile } from "./can-view-file";

describe("canViewFile helper", () => {
  it("returns true when record has a valid non-empty fileId", () => {
    expect(canViewFile({ fileId: "file-123" })).toBe(true);
    expect(canViewFile({ id: "rec-1", fileId: "file-pdf-lab" })).toBe(true);
  });

  it("returns false when fileId is null", () => {
    expect(canViewFile({ fileId: null })).toBe(false);
  });

  it("returns false when fileId is undefined or missing", () => {
    expect(canViewFile({})).toBe(false);
    expect(canViewFile({ id: "rec-1" })).toBe(false);
    expect(canViewFile({ fileId: undefined })).toBe(false);
  });

  it("returns false when fileId is empty string or only whitespace", () => {
    expect(canViewFile({ fileId: "" })).toBe(false);
    expect(canViewFile({ fileId: "   " })).toBe(false);
  });

  it("returns false when record itself is null or undefined", () => {
    expect(canViewFile(null)).toBe(false);
    expect(canViewFile(undefined)).toBe(false);
  });
});
