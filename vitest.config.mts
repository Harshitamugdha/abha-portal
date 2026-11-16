import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Same "@/..." shortcut as tsconfig.json, so tests can import "@/contracts/shared".
    alias: {
      "@": path.resolve("src"), // npm runs tests from the project root
      // `import "server-only"` throws everywhere except inside Next.js's server. Tests run outside
      // Next.js, so point it at the package's own empty file (what Next.js itself uses on the server).
      "server-only": path.resolve("node_modules/server-only/empty.js"),
    },
  },
  test: {
    environment: "node",
    // Vitest 5.1.0 crashes on this machine with the default "forks" pool
    // ("Cannot read properties of undefined (reading 'config')"), even for a one-line test.
    // "vmThreads" works. Try removing this line after the next Vitest update.
    pool: "vmThreads",
    include: ["src/**/*.test.ts", "prisma/**/*.test.ts"],
  },
});
