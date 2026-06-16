import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { zodErrorResponse, serverErrorResponse, errorResponse } from "@/lib/api-error";
import { generateEmailDraft } from "@/lib/ai";

const draftSchema = z.object({
  session_id: z.number().int().positive(),
});

interface ReportRow {
  report_text: string;
  lead_score: number;
  proposal_draft: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return errorResponse("Invalid JSON", 400);

    const parsed = draftSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { session_id } = parsed.data;

    const reports = await query<ReportRow>(
      "SELECT report_text, lead_score, proposal_draft FROM intake_reports WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1",
      [session_id]
    );
    if (!reports.length) return errorResponse("No report found for this session. Run /api/intake/finalize first.", 404);

    const { report_text, proposal_draft } = reports[0];
    const draft = await generateEmailDraft(report_text, proposal_draft);

    return NextResponse.json({ draft });
  } catch {
    return serverErrorResponse();
  }
}
