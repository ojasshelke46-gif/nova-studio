import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectMongo from "@/lib/mongo";
import Event from "@/lib/models/Event";
import { zodErrorResponse, serverErrorResponse } from "@/lib/api-error";

const analyticsSchema = z.object({
  type: z.string().min(1, "type is required"),
  page: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = analyticsSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    await connectMongo();

    const event = await Event.create(parsed.data);

    return NextResponse.json({ id: event._id }, { status: 201 });
  } catch {
    return serverErrorResponse();
  }
}

export async function GET() {
  try {
    await connectMongo();

    // TODO: paginate instead of a hard 100-row cap — dashboard will need older events eventually
    const events = await Event.find().sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json(events);
  } catch {
    return serverErrorResponse();
  }
}
