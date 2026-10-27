import { defineConfig } from "prisma/config";
import { loadEnv } from "./scripts/lib/env";

loadEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Default lets `prisma generate` run before .env exists (fresh clone, Docker build).
    url: process.env.DATABASE_URL ?? "file:./data/blog.db",
  },
});
