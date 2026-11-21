import "server-only";
import type { AbhaInput } from "@/contracts/format";
import { db } from "@/server/db";
import { MockAbhaProvider } from "./mock";
import type { AbhaProvider } from "./types";

async function findInDatabase(input: AbhaInput) {
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

const globalStore = globalThis as unknown as { abhaProvider: AbhaProvider | undefined };

export function getAbhaProvider(): AbhaProvider {
  if (process.env.ABHA_PROVIDER && process.env.ABHA_PROVIDER !== "mock") {
    throw new Error("Only ABHA_PROVIDER=mock exists.");
  }

  if (!globalStore.abhaProvider) {
    globalStore.abhaProvider = new MockAbhaProvider(findInDatabase);
  }
  return globalStore.abhaProvider;
}
