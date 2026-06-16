import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { zodErrorResponse, errorResponse, serverErrorResponse } from "@/lib/api-error";

const patchSchema = z.object({
  status: z.string().min(1, "status is required"),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!/^\d+$/.test(id)) {
      return errorResponse("Invalid contact id", 400, "id");
    }

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const rows = await query(
      "UPDATE contacts SET status = $1 WHERE id = $2 RETURNING *",
      [parsed.data.status, id]
    );

    if (rows.length === 0) {
      return errorResponse("Contact not found", 404);
    }

    return NextResponse.json(rows[0]);
  } catch {
    return serverErrorResponse();
  }
}
