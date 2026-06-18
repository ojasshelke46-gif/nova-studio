import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { serverErrorResponse } from "@/lib/api-error";
import { generateSlots } from "@/lib/slots";

export interface Slot {
  id: number;
  slot_time: string;
  is_booked: boolean;
}

// Top up the slots table so there's always a rolling window of future
// availability. Seeded slots go stale as time passes; this regenerates the next
// 10 weekdays on demand whenever we're running low, so booking dates stay
// adaptive to the current date without needing a cron job or manual reseed.
async function ensureFutureSlots() {
  const rows = await query<{ max: string | null }>("SELECT MAX(slot_time) AS max FROM slots");
  const max = rows[0]?.max ? new Date(rows[0].max) : null;

  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 7);

  // Enough runway already — nothing to do.
  if (max && max > horizon) return;

  const slots = generateSlots();
  if (slots.length === 0) return;

  const values = slots.map((_, i) => `($${i + 1})`).join(", ");
  await query(
    `INSERT INTO slots (slot_time) VALUES ${values} ON CONFLICT (slot_time) DO NOTHING`,
    slots
  );
}

export async function GET() {
  try {
    await ensureFutureSlots();

    // Only future, unbooked slots — past dates and times earlier today are excluded.
    const slots = await query<Slot>(
      "SELECT id, slot_time, is_booked FROM slots WHERE is_booked = false AND slot_time > NOW() ORDER BY slot_time ASC"
    );
    return NextResponse.json(slots);
  } catch {
    return serverErrorResponse();
  }
}
