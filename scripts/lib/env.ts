import { existsSync } from "node:fs";

/** Loads `.env` for CLI scripts (Next.js loads it on its own). Existing variables win. */
export function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    if (existsSync(file)) process.loadEnvFile(file);
  }
}
