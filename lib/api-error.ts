import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function errorResponse(error: string, status: number, field?: string) {
  return NextResponse.json({ error, ...(field ? { field } : {}) }, { status });
}

export function zodErrorResponse(err: ZodError) {
  const first = err.issues[0];
  return errorResponse(first.message, 400, first.path.join("."));
}

export function serverErrorResponse() {
  return errorResponse("Internal server error", 500);
}
