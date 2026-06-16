import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { zodErrorResponse, serverErrorResponse, errorResponse } from "@/lib/api-error";
import { sendPrepEmail } from "@/lib/email";

const sendSchema = z.object({
  contact_id: z.number().int().positive(),
  email_body: z.string().min(1, "email_body is required"),
});

interface ContactRow {
  id: number;
  name: string;
  email: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return errorResponse("Invalid JSON", 400);

    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { contact_id, email_body } = parsed.data;

    const contacts = await query<ContactRow>(
      "SELECT id, name, email FROM contacts WHERE id = $1",
      [contact_id]
    );
    if (!contacts.length) return errorResponse("Contact not found", 404);

    await sendPrepEmail(contacts[0], email_body);

    return NextResponse.json({ success: true });
  } catch (err) {
    // works, could be cleaner — string-matching the error message is fragile,
    // but sendPrepEmail doesn't throw a typed error yet.
    if (err instanceof Error && err.message === "Resend not configured") {
      return errorResponse("Email service not configured", 503);
    }
    return serverErrorResponse();
  }
}
