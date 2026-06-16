import { readFileSync } from "fs";
import { join } from "path";
import { Pool } from "pg";

// Minimal .env.local loader (no dotenv dependency).
function loadEnvLocal() {
  if (process.env.DATABASE_URL) return;
  try {
    const envPath = join(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // No .env.local — rely on existing environment.
  }
}

async function main() {
  loadEnvLocal();

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Add it to .env.local or the environment.");
    process.exit(1);
  }

  const sql = readFileSync(join(__dirname, "seed.sql"), "utf8");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await pool.query(sql);
    console.log("✓ Database seeded successfully.");
  } catch (err) {
    console.error("✗ Seed failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
