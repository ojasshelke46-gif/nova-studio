import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { zodErrorResponse, serverErrorResponse } from "@/lib/api-error";

const projectSchema = z.object({
  title: z.string().min(1, "title is required"),
  category: z.string().min(1, "category is required"),
  image_url: z.string().min(1, "image_url is required"),
});

export async function GET() {
  try {
    const rows = await query("SELECT * FROM projects ORDER BY created_at DESC, id DESC");
    return NextResponse.json(rows);
  } catch {
    return serverErrorResponse();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = projectSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const { title, category, image_url } = parsed.data;

    const rows = await query(
      "INSERT INTO projects (title, category, image_url) VALUES ($1, $2, $3) RETURNING *",
      [title, category, image_url]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch {
    return serverErrorResponse();
  }
}
