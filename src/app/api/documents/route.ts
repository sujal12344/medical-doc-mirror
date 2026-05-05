import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { requireAuth } from "@/lib/auth";

const createSchema = z.object({
  productId: z.string().min(1),
  countryCode: z.string().min(1).max(10),
  frameworkId: z.string().min(1).max(50),
  title: z.string().trim().min(2).max(500),
});

export async function GET() {
  try {
    const user = await requireAuth();
    await connectToDatabase();
    const docs = await RegulatoryDocument.find({ userId: (user as Record<string, unknown>)._id }).sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ documents: docs });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = createSchema.parse(await req.json());
    await connectToDatabase();
    const document = await RegulatoryDocument.create({ ...body, userId: (user as Record<string, unknown>)._id });
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    console.error("POST /api/documents failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
