import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { errorResponse, serverErrorResponse } from "@/lib/api-error";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!/^\d+$/.test(id)) {
      return errorResponse("Invalid project id", 400, "id");
    }

    const rows = await query("DELETE FROM projects WHERE id = $1 RETURNING id", [id]);

    if (rows.length === 0) {
      return errorResponse("Project not found", 404);
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return serverErrorResponse();
  }
}
