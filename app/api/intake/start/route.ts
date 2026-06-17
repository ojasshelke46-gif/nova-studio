import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { zodErrorResponse, serverErrorResponse, errorResponse } from "@/lib/api-error";
import { generateIntakeQuestion, INTAKE_SYSTEM_PROMPT, FALLBACK_QUESTION } from "@/lib/ai";

const startSchema = z.object({
  contact_id: z.number().int().positive(),
  query: z.string().min(1, "query is required"),
});

interface SessionRow {
  id: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return errorResponse("Invalid JSON", 400);

    const parsed = startSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { contact_id, query: initialQuery } = parsed.data;

    const contacts = await query("SELECT id FROM contacts WHERE id = $1", [contact_id]);
    if (!contacts.length) return errorResponse("Contact not found", 404);

    // The intake flow always opens with at least one question. If the AI judges
    // the single initial message already "done" (or returns no usable question),
    // fall back to a standard opener so the conversation still starts.
    const first = await generateIntakeQuestion([
      { role: "system", content: INTAKE_SYSTEM_PROMPT },
      { role: "user", content: initialQuery },
    ]);
    const question = first.question ?? FALLBACK_QUESTION.question;
    const options = first.options ?? FALLBACK_QUESTION.options;

    const conversation = [
      { role: "user", content: initialQuery },
      { role: "assistant", content: question },
    ];

    const sessions = await query<SessionRow>(
      `INSERT INTO intake_sessions (contact_id, initial_query, conversation, status)
       VALUES ($1, $2, $3::jsonb, 'in_progress') RETURNING id`,
      [contact_id, initialQuery, JSON.stringify(conversation)]
    );

    const session_id = sessions[0].id;

    return NextResponse.json({ session_id, question, options }, { status: 201 });
  } catch {
    return serverErrorResponse();
  }
}
