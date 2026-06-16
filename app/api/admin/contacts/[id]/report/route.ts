import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { errorResponse, serverErrorResponse } from "@/lib/api-error";

interface ReportRow {
  session_id: number;
  report_text: string;
  lead_score: number;
  proposal_draft: string;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) return errorResponse("Invalid contact id", 400);

    const rows = await query<ReportRow>(
      `SELECT s.id AS session_id, r.report_text, r.lead_score, r.proposal_draft
       FROM intake_sessions s
       JOIN intake_reports r ON r.session_id = s.id
       WHERE s.contact_id = $1
       ORDER BY r.created_at DESC
       LIMIT 1`,
      [id]
    );

    if (!rows.length) return NextResponse.json(null, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch {
    return serverErrorResponse();
  }
}
