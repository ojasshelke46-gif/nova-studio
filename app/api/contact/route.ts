import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { zodErrorResponse, serverErrorResponse, errorResponse } from "@/lib/api-error";
import { isRateLimited } from "@/lib/rateLimit";
import { sendAdminNotification, sendClientConfirmation } from "@/lib/email";

const contactSchema = z.object({
  name: z.string().min(1, "name is required"),
  email: z.email("email must be a valid email address"),
  message: z.string().min(10, "message must be at least 10 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

    if (isRateLimited(ip)) {
      return errorResponse("Too many requests. Try again later.", 429);
    }

    const body = await req.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const { name, email, message } = parsed.data;

    const rows = await query(
      "INSERT INTO contacts (name, email, message) VALUES ($1, $2, $3) RETURNING *",
      [name, email, message]
    );

    // Fire-and-forget emails — contact is already saved, so a mail failure
    // must not fail the request.
    const contact = { name, email, message };
    void (async () => {
      try {
        await sendAdminNotification(contact);
      } catch {
        // swallow — already logged upstream if it matters
      }
    })();
    void (async () => {
      try {
        await sendClientConfirmation(contact);
      } catch {}
    })();

    return NextResponse.json(rows[0], { status: 201 });
  } catch {
    return serverErrorResponse();
  }
}
