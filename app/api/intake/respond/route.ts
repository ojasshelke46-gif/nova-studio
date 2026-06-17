import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { zodErrorResponse, serverErrorResponse, errorResponse } from "@/lib/api-error";
import { generateIntakeQuestion, INTAKE_SYSTEM_PROMPT, FALLBACK_QUESTION } from "@/lib/ai";

// Floor — the AI must ask at least this many questions before it may complete,
// regardless of what it judges. Below this, done is ignored and we keep asking.
const MIN_QUESTIONS = 4;

// Hard ceiling — safety net. Between MIN and MAX the AI decides when to finish;
// this only forces done if it hasn't by round 6.
const MAX_QUESTIONS = 6;

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

    // Hard ceiling reached — force done, no more AI calls.
    if (questionsAsked >= MAX_QUESTIONS) {
      await query(
        "UPDATE intake_sessions SET conversation = $1::jsonb, status = 'ready_for_report' WHERE id = $2",
        [JSON.stringify(updatedConversation), session_id]
      );
      return NextResponse.json({ session_id, done: true });
    }

    // Below the floor the AI is not allowed to finish — remind it to keep asking.
    const belowFloor = questionsAsked < MIN_QUESTIONS;
    const systemContent = belowFloor
      ? `${INTAKE_SYSTEM_PROMPT}\n\nIMPORTANT: ${questionsAsked} question(s) asked so far. You must ask at least ${MIN_QUESTIONS} questions before completing. Do NOT set done to true yet — ask the next most relevant question.`
      : INTAKE_SYSTEM_PROMPT;

    const { done, question, options } = await generateIntakeQuestion([
      { role: "system", content: systemContent },
      ...updatedConversation,
    ]);

    // Only honor done once the floor is met. (Above the floor, a done/null
    // response means wrap up.)
    if (!belowFloor && (done || !question || !options)) {
      await query(
        "UPDATE intake_sessions SET conversation = $1::jsonb, status = 'ready_for_report' WHERE id = $2",
        [JSON.stringify(updatedConversation), session_id]
      );
      return NextResponse.json({ session_id, done: true });
    }

    // Below the floor — or AI returned a real question — ask the next one. If the
    // AI tried to finish early, fall back to a standard question so the flow continues.
    const nextQuestion = question ?? FALLBACK_QUESTION.question;
    const nextOptions = options ?? FALLBACK_QUESTION.options;

    const finalConversation: ConversationMessage[] = [
      ...updatedConversation,
      { role: "assistant", content: nextQuestion },
    ];

    await query(
      "UPDATE intake_sessions SET conversation = $1::jsonb WHERE id = $2",
      [JSON.stringify(finalConversation), session_id]
    );

    return NextResponse.json({ session_id, question: nextQuestion, options: nextOptions, done: false });
  } catch {
    return serverErrorResponse();
  }
}
