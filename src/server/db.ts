import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// One Prisma client for the whole app (TRAPS §10).
// In dev, Next.js re-runs this file on every save. If we made a new client each time, we'd open a
// new connection pool on every save until Postgres says "too many clients".
// So in dev we keep the client on `globalThis`, which survives those re-runs, and reuse it.

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// TypeScript doesn't know about our `prisma` property on globalThis, so we describe it here.
const globalStore = globalThis as unknown as { prisma: PrismaClient | undefined };

let client = globalStore.prisma;
if (!client) {
  client = createClient();
}

if (process.env.NODE_ENV !== "production") {
  globalStore.prisma = client;
}

export const db = client;
