import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loginStaff } from "./login";
import { createStaffAccount } from "./register";

vi.mock("@/server/db", () => ({
  db: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    institution: { findUnique: vi.fn() },
  },
}));

import { db } from "@/server/db";

const passwordHash = bcrypt.hashSync("Demo@1234", 4);

function staffRow(verified: boolean) {
  return {
    id: "user-kavya",
    role: "DOCTOR",
    name: "Dr Kavya Iyer",
    email: "kavya@citygen.test",
    passwordHash: passwordHash,
    verified: verified,
    memberships: [{ institutionId: "inst-citygen" }],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loginStaff", () => {
  it("logs a verified doctor in and sends them to /doctor", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(staffRow(true) as never);

    const result = await loginStaff("Kavya@CityGen.test", "Demo@1234");
    expect(result.redirectTo).toBe("/doctor");
    expect(result.user.institutionIds).toEqual(["inst-citygen"]);
  });

  it("unknown email and wrong password give exactly the same error", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);
    const unknown = await loginStaff("nobody@x.test", "Demo@1234").catch((error) => error);

    vi.mocked(db.user.findUnique).mockResolvedValueOnce(staffRow(true) as never);
    const wrong = await loginStaff("kavya@citygen.test", "wrong-password").catch((error) => error);

    expect(unknown.code).toBe("UNAUTHENTICATED");
    expect(wrong.code).toBe(unknown.code);
    expect(wrong.message).toBe(unknown.message);
  });

  it("says STAFF_UNVERIFIED only after the password is right", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(staffRow(false) as never);
    await expect(loginStaff("neel@lakeside.test", "wrong-password")).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });

    vi.mocked(db.user.findUnique).mockResolvedValueOnce(staffRow(false) as never);
    await expect(loginStaff("neel@lakeside.test", "Demo@1234")).rejects.toMatchObject({
      code: "STAFF_UNVERIFIED",
    });
  });

  it("a patient can't use the staff login", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({ ...staffRow(true), role: "PATIENT" } as never);

    await expect(loginStaff("asha@x.test", "Demo@1234")).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });
});

describe("createStaffAccount", () => {
  const doctor = {
    name: "Dr New",
    email: "New@Lakeside.test",
    password: "longenough",
    role: "DOCTOR" as const,
    institutionId: "inst-lakeside",
    hprId: "HPR-1",
  };

  it("creates an unverified user with a hashed password and a membership", async () => {
    vi.mocked(db.institution.findUnique).mockResolvedValueOnce({ id: "inst-lakeside", type: "HOSPITAL" } as never);
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);
    vi.mocked(db.user.create).mockResolvedValueOnce({ id: "user-new" } as never);

    const result = await createStaffAccount(doctor);

    expect(result).toEqual({ userId: "user-new" });
    const data = vi.mocked(db.user.create).mock.calls[0][0].data;
    expect(data.verified).toBe(false);
    expect(data.email).toBe("new@lakeside.test");
    expect(data.passwordHash).not.toBe("longenough");
    expect(data.memberships).toEqual({ create: { institutionId: "inst-lakeside" } });
  });

  it("refuses a lab role at a hospital", async () => {
    vi.mocked(db.institution.findUnique).mockResolvedValueOnce({ id: "inst-lakeside", type: "HOSPITAL" } as never);

    await expect(createStaffAccount({ ...doctor, role: "LAB" })).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
    });
  });

  it("an email already in use -> CONFLICT", async () => {
    vi.mocked(db.institution.findUnique).mockResolvedValueOnce({ id: "inst-lakeside", type: "HOSPITAL" } as never);
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({ id: "user-kavya" } as never);

    await expect(createStaffAccount(doctor)).rejects.toMatchObject({ code: "CONFLICT" });
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it("the same email registered twice at the same moment -> CONFLICT, not a crash", async () => {
    vi.mocked(db.institution.findUnique).mockResolvedValueOnce({ id: "inst-lakeside", type: "HOSPITAL" } as never);
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);
    vi.mocked(db.user.create).mockRejectedValueOnce({ code: "P2002" });

    await expect(createStaffAccount(doctor)).rejects.toMatchObject({ code: "CONFLICT" });
  });
});
