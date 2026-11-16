// Prisma 7 reads its settings from this file, not from package.json.
// Prisma 7 also no longer loads .env on its own, so we load it here first (TRAPS §10).
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Read directly (not with Prisma's env() helper) so `prisma generate` still works on a fresh
    // clone that has no .env yet. Commands that need the database will say the URL is missing.
    url: process.env.DATABASE_URL,
  },
});
