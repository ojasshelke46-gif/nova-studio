import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { zodErrorResponse, serverErrorResponse, errorResponse } from "@/lib/api-error";
import { generateAdminChatAnswer } from "@/lib/ai";

const chatSchema = z.object({
  session_id: z.number().int().positive(),
  question: z.string().min(1, "question is required"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface SessionRow {
  conversation: ConversationMessage[];
}

interface ReportRow {
  report_text: string;
  lead_score: number;
  proposal_draft: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return errorResponse("Invalid JSON", 400);

    const parsed = chatSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { session_id, question, history } = parsed.data;

    const sessions = await query<SessionRow>(
      "SELECT conversation FROM intake_sessions WHERE id = $1",
      [session_id]
    );
    if (!sessions.length) return errorResponse("Session not found", 404);

    const reports = await query<ReportRow>(
      "SELECT report_text, lead_score, proposal_draft FROM intake_reports WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1",
      [session_id]
    );

    const conversation = sessions[0].conversation;

    const transcript = conversation
      .map((m) => `${m.role === "user" ? "Client" : "Intake Bot"}: ${m.content}`)
      .join("\n");

    let intakeContext = `CLIENT INTAKE CONVERSATION:\n${transcript}`;

    if (reports.length) {
      const r = reports[0];
      intakeContext += `\n\nINTAKE REPORT:\nSummary: ${r.report_text}\nLead Score: ${r.lead_score}/100\nProposed Scope:\n${r.proposal_draft}`;
    }

    const answer = await generateAdminChatAnswer(intakeContext, history, question);

    return NextResponse.json({ answer });
  } catch {
    return serverErrorResponse();
  }
}
