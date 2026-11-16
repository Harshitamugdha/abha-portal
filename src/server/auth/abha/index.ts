import "server-only";
import type { AbhaInput } from "@/contracts/format";
import { db } from "@/server/db";
import { MockAbhaProvider, type AbhaDirectoryEntry } from "./mock";
import type { AbhaProvider } from "./types";

// Gives the rest of the app THE ABHA provider. Login code calls getAbhaProvider() and never
// knows (or cares) that it's the mock. Swapping in real ABDM later means changing only this file.

// The mock's "directory" of people is our seeded AbhaProfile table.
async function findInDatabase(input: AbhaInput): Promise<AbhaDirectoryEntry | null> {
  let profile;
  if (input.kind === "number") {
    profile = await db.abhaProfile.findUnique({ where: { abhaNumber: input.value }, include: { user: true } });
  } else {
    profile = await db.abhaProfile.findUnique({ where: { abhaAddress: input.value }, include: { user: true } });
  }

  if (!profile) {
    return null;
  }

  return {
    abhaNumber: profile.abhaNumber,
    abhaAddress: profile.abhaAddress,
    name: profile.user.name,
    mobileLast4: profile.mobileLast4,
    dob: profile.dob,
    gender: profile.gender,
  };
}

// The mock keeps OTP transactions in memory. In dev, Next.js re-runs files on every save, which
// would wipe them, so we keep the provider on globalThis (same idea as db.ts, TRAPS §10).
const globalStore = globalThis as unknown as { abhaProvider: AbhaProvider | undefined };

export function getAbhaProvider(): AbhaProvider {
  const providerName = process.env.ABHA_PROVIDER || "mock";
  if (providerName !== "mock") {
    throw new Error(`Unknown ABHA_PROVIDER "${providerName}". Only "mock" exists.`);
  }

  if (!globalStore.abhaProvider) {
    globalStore.abhaProvider = new MockAbhaProvider(findInDatabase);
  }
  return globalStore.abhaProvider;
}
