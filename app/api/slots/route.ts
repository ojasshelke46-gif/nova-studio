import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { serverErrorResponse } from "@/lib/api-error";

export interface Slot {
  id: number;
  slot_time: string;
  is_booked: boolean;
}

export async function GET() {
  try {
    const slots = await query<Slot>(
      "SELECT id, slot_time, is_booked FROM slots WHERE is_booked = false ORDER BY slot_time ASC"
    );
    return NextResponse.json(slots);
  } catch {
    return serverErrorResponse();
  }
}
