import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { zodErrorResponse, serverErrorResponse, errorResponse } from "@/lib/api-error";
import { generateIntakeQuestion, INTAKE_SYSTEM_PROMPT } from "@/lib/ai";

const MAX_QUESTIONS = 4;

const respondSchema = z.object({
  session_id: z.number().int().positive(),
  answer: z.string().min(1, "answer is required"),
});

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface SessionRow {
  id: number;
  conversation: ConversationMessage[];
  status: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return errorResponse("Invalid JSON", 400);

    const parsed = respondSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { session_id, answer } = parsed.data;

    const sessions = await query<SessionRow>(
      "SELECT id, conversation, status FROM intake_sessions WHERE id = $1",
      [session_id]
    );
    if (!sessions.length) return errorResponse("Session not found", 404);

    const session = sessions[0];
    if (session.status === "ready_for_report") {
      return errorResponse("Session already complete", 400);
    }

    const conversation: ConversationMessage[] = session.conversation;

    // Questions asked = assistant messages in conversation
    const questionsAsked = conversation.filter((m) => m.role === "assistant").length;

    const updatedConversation: ConversationMessage[] = [
      ...conversation,
      { role: "user", content: answer },
    ];

    // 4th answer received — mark done, no more AI calls
    if (questionsAsked >= MAX_QUESTIONS) {
      await query(
        "UPDATE intake_sessions SET conversation = $1::jsonb, status = 'ready_for_report' WHERE id = $2",
        [JSON.stringify(updatedConversation), session_id]
      );
      return NextResponse.json({ session_id, done: true });
    }

    const { question, options } = await generateIntakeQuestion([
      { role: "system", content: INTAKE_SYSTEM_PROMPT },
      ...updatedConversation,
    ]);

    const finalConversation: ConversationMessage[] = [
      ...updatedConversation,
      { role: "assistant", content: question },
    ];

    await query(
      "UPDATE intake_sessions SET conversation = $1::jsonb WHERE id = $2",
      [JSON.stringify(finalConversation), session_id]
    );

    return NextResponse.json({ session_id, question, options, done: false });
  } catch {
    return serverErrorResponse();
  }
}
