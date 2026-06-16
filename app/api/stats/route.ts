import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { serverErrorResponse } from "@/lib/api-error";

export async function GET() {
  try {
    const rows = await query("SELECT * FROM stats ORDER BY id ASC");
    return NextResponse.json(rows);
  } catch {
    return serverErrorResponse();
  }
}
