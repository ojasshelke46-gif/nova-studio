import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import pool from "@/lib/db";
import { zodErrorResponse, serverErrorResponse, errorResponse } from "@/lib/api-error";
import { sendBookingConfirmation } from "@/lib/email";
import { query } from "@/lib/db";

const bookingSchema = z.object({
  contact_id: z.number().int().positive(),
  slot_id: z.number().int().positive(),
});

interface ContactRow {
  id: number;
  name: string;
  email: string;
}

interface SlotRow {
  id: number;
  slot_time: string;
  is_booked: boolean;
}

interface BookingRow {
  id: number;
  contact_id: number;
  slot_id: number;
  status: string;
  created_at: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return errorResponse("Invalid JSON", 400);

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { contact_id, slot_id } = parsed.data;

  // Verify contact exists before acquiring lock
  const contacts = await query<ContactRow>(
    "SELECT id, name, email FROM contacts WHERE id = $1",
    [contact_id]
  );
  if (!contacts.length) return errorResponse("Contact not found", 404);
  const contact = contacts[0];

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock the slot row — prevents concurrent bookings of same slot
    const slotRes = await client.query<SlotRow>(
      "SELECT id, slot_time, is_booked FROM slots WHERE id = $1 FOR UPDATE",
      [slot_id]
    );

    if (!slotRes.rows.length) {
      await client.query("ROLLBACK");
      return errorResponse("Slot not found", 404);
    }

    const slot = slotRes.rows[0];

    if (slot.is_booked) {
      await client.query("ROLLBACK");
      return errorResponse("Slot no longer available", 409);
    }

    await client.query("UPDATE slots SET is_booked = true WHERE id = $1", [slot_id]);

    const bookingRes = await client.query<BookingRow>(
      "INSERT INTO bookings (contact_id, slot_id, status) VALUES ($1, $2, 'confirmed') RETURNING *",
      [contact_id, slot_id]
    );

    await client.query("COMMIT");

    const booking = bookingRes.rows[0];

    // Fire-and-forget confirmation email
    void (async () => {
      try {
        await sendBookingConfirmation(contact, new Date(slot.slot_time));
      } catch {
        // email failure must not affect booking response
      }
    })();

    return NextResponse.json(
      { ...booking, slot_time: slot.slot_time },
      { status: 201 }
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Booking transaction failed:", err);
    return serverErrorResponse();
  } finally {
    client.release();
  }
}
