import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { zodErrorResponse, serverErrorResponse, errorResponse } from "@/lib/api-error";
import { generateIntakeReport } from "@/lib/ai";

const finalizeSchema = z.object({
  session_id: z.number().int().positive(),
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

interface ScoreBreakdown {
  clarity: number;
  urgency: number;
  budget_signal: number;
  decision_authority: number;
}

interface ReportRow {
  id: number;
  session_id: number;
  report_text: string;
  lead_score: number;
  score_breakdown: ScoreBreakdown | null;
  proposal_draft: string;
  created_at: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return errorResponse("Invalid JSON", 400);

    const parsed = finalizeSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { session_id } = parsed.data;

    const sessions = await query<SessionRow>(
      "SELECT id, conversation, status FROM intake_sessions WHERE id = $1",
      [session_id]
    );
    if (!sessions.length) return errorResponse("Session not found", 404);

    const session = sessions[0];

    // Idempotent — return existing report if already completed
    if (session.status === "completed") {
      const existing = await query<ReportRow>(
        "SELECT * FROM intake_reports WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1",
        [session_id]
      );
      if (existing.length) return NextResponse.json(existing[0]);
    }

    const { report, lead_score, score_breakdown, proposal_draft } =
      await generateIntakeReport(session.conversation);

    const reports = await query<ReportRow>(
      `INSERT INTO intake_reports (session_id, report_text, lead_score, score_breakdown, proposal_draft)
       VALUES ($1, $2, $3, $4::jsonb, $5) RETURNING *`,
      [session_id, report, lead_score, JSON.stringify(score_breakdown), proposal_draft]
    );

    await query(
      "UPDATE intake_sessions SET status = 'completed' WHERE id = $1",
      [session_id]
    );

    return NextResponse.json(reports[0], { status: 201 });
  } catch {
    return serverErrorResponse();
  }
}
