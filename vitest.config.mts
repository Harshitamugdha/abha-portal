import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve("src"),
      "server-only": path.resolve("node_modules/server-only/empty.js"),
    },
  },
  test: {
    environment: "node",
    pool: "vmThreads",
    include: ["src/**/*.test.ts", "prisma/**/*.test.ts"],
  },
});
