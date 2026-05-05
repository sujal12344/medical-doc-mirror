import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { requireAuth } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const user = await requireAuth();
    const { id } = await ctx.params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const { sectionId, fields } = await req.json();
    if (!sectionId || !fields) return NextResponse.json({ error: "Missing sectionId or fields" }, { status: 400 });

    await connectToDatabase();
    const doc = await RegulatoryDocument.findOne({ _id: id, userId: (user as Record<string, unknown>)._id });
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const totalFields = Object.keys(fields).length;
    const filledFields = Object.values(fields).filter((v) => typeof v === "string" && (v as string).trim()).length;
    const completionPct = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

    doc.sections.set(sectionId, { fields, completionPct });
    await doc.save();

    return NextResponse.json({ ok: true, completionPct });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("PUT sections failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
