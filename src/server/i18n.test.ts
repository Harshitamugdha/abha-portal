import { describe, expect, it, vi, beforeEach } from "vitest";
import enMessages from "../../messages/en.json";
import hiMessages from "../../messages/hi.json";
import { getMessages, resolveLanguage } from "./i18n";
import { setLanguage } from "@/app/actions/i18n";

// Helper to recursively collect all nested key paths
function getDeepKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.keys(obj).flatMap((key) => {
    const val = obj[key];
    const newPrefix = prefix ? `${prefix}.${key}` : key;
    if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      return getDeepKeys(val as Record<string, unknown>, newPrefix);
    }
    return [newPrefix];
  });
}

// Mock next/headers for server-side cookies
const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockImplementation(async () => mockCookieStore),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("SLICE P8.1 - i18n messages, helpers and action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("en.json and hi.json have exactly the same keys", () => {
    it("has identical deep keys in both English and Hindi dictionaries", () => {
      const enKeys = getDeepKeys(enMessages).sort();
      const hiKeys = getDeepKeys(hiMessages).sort();

      expect(hiKeys).toEqual(enKeys);
      expect(enKeys.length).toBeGreaterThan(30);
    });

    it("has non-empty translations for all keys", () => {
      const enKeys = getDeepKeys(enMessages);
      for (const path of enKeys) {
        const parts = path.split(".");
        let enVal: unknown = enMessages;
        let hiVal: unknown = hiMessages;
        for (const p of parts) {
          enVal = (enVal as Record<string, unknown>)[p];
          hiVal = (hiVal as Record<string, unknown>)[p];
        }
        expect(typeof enVal).toBe("string");
        expect((enVal as string).trim().length).toBeGreaterThan(0);
        expect(typeof hiVal).toBe("string");
        expect((hiVal as string).trim().length).toBeGreaterThan(0);
      }
    });
  });

  describe("an unknown cookie value falls back to en", () => {
    it("resolveLanguage falls back to 'en' for any unrecognized, empty or null values", () => {
      expect(resolveLanguage("unknown")).toBe("en");
      expect(resolveLanguage("fr")).toBe("en");
      expect(resolveLanguage("es")).toBe("en");
      expect(resolveLanguage("")).toBe("en");
      expect(resolveLanguage(null)).toBe("en");
      expect(resolveLanguage(undefined)).toBe("en");
      expect(resolveLanguage("EN")).toBe("en");
      expect(resolveLanguage("en")).toBe("en");
      expect(resolveLanguage("hi")).toBe("hi");
    });

    it("getMessages returns English dictionary when cookie has an unknown value", async () => {
      mockCookieStore.get.mockReturnValue({ value: "unknown_cookie_val" });
      const messages = await getMessages();
      expect(messages.landing.heroTitle).toBe(enMessages.landing.heroTitle);
      expect(messages.nav.records).toBe("Records");
    });

    it("getMessages returns English dictionary when langOverride is unrecognized", async () => {
      const messages = await getMessages("invalid_locale");
      expect(messages.landing.heroTitle).toBe(enMessages.landing.heroTitle);
    });

    it("getMessages returns Hindi dictionary when cookie has 'hi'", async () => {
      mockCookieStore.get.mockReturnValue({ value: "hi" });
      const messages = await getMessages();
      expect(messages.landing.heroTitle).toBe(hiMessages.landing.heroTitle);
      expect(messages.nav.records).toBe("रिकॉर्ड्स");
    });
  });

  describe("setLanguage rejects anything but en or hi", () => {
    it("rejects unknown language strings with VALIDATION_FAILED", async () => {
      const res1 = await setLanguage("fr");
      expect(res1.ok).toBe(false);
      if (!res1.ok) {
        expect(res1.error.code).toBe("VALIDATION_FAILED");
      }

      const res2 = await setLanguage("spanish");
      expect(res2.ok).toBe(false);

      const res3 = await setLanguage("");
      expect(res3.ok).toBe(false);

      const res4 = await setLanguage(12345);
      expect(res4.ok).toBe(false);

      const res5 = await setLanguage(null);
      expect(res5.ok).toBe(false);

      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it("rejects invalid FormData values", async () => {
      const formData = new FormData();
      formData.append("lang", "invalid");
      const res = await setLanguage(formData);
      expect(res.ok).toBe(false);
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it("accepts 'en' and sets 1-year preference cookie with path / and sameSite lax", async () => {
      const res = await setLanguage("en");
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.lang).toBe("en");
      }

      expect(mockCookieStore.set).toHaveBeenCalledWith("lang", "en", {
        path: "/",
        sameSite: "lax",
        maxAge: 365 * 24 * 60 * 60,
      });
    });

    it("accepts 'hi' and sets 1-year preference cookie with path / and sameSite lax", async () => {
      const res = await setLanguage("hi");
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.lang).toBe("hi");
      }

      expect(mockCookieStore.set).toHaveBeenCalledWith("lang", "hi", {
        path: "/",
        sameSite: "lax",
        maxAge: 365 * 24 * 60 * 60,
      });
    });

    it("accepts FormData with valid 'hi'", async () => {
      const formData = new FormData();
      formData.append("lang", "hi");
      const res = await setLanguage(formData);
      expect(res.ok).toBe(true);
      expect(mockCookieStore.set).toHaveBeenCalledWith("lang", "hi", expect.any(Object));
    });
  });
});
