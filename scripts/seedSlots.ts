import * as dotenv from "dotenv";
import * as path from "path";
import { Pool } from "pg";
import { generateSlots } from "../lib/slots";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const slots = generateSlots();
  console.log(`Seeding ${slots.length} slots...`);

  let inserted = 0;
  for (const slot of slots) {
    const res = await pool.query(
      "INSERT INTO slots (slot_time) VALUES ($1) ON CONFLICT (slot_time) DO NOTHING",
      [slot]
    );
    inserted += res.rowCount ?? 0;
  }

  console.log(`Done. ${inserted} new slots inserted, ${slots.length - inserted} already existed.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
