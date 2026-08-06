import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { requireAuth } from "@/lib/auth";


export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const { sectionId, fields } = await req.json();
    if (!sectionId || !fields) return NextResponse.json({ error: "Missing sectionId or fields" }, { status: 400 });

    await connectToDatabase();
    const doc = await RegulatoryDocument.findOne({ _id: id, userId: (user as Record<string, unknown>)._id });
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const totalFields = Object.keys(fields).length;
    const filledFields = Object.values(fields).filter((v) => typeof v === "string" && (v as string).trim()).length;
    const completionPct = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

    const fieldKeys = Object.keys(fields);
    console.log("[dmf-sections] PUT save", {
      documentId: id,
      sectionId,
      fieldCount: fieldKeys.length,
      dottedFieldIds: fieldKeys.filter((k) => k.includes(".")).length,
      completionPct,
    });

    doc.sections.set(sectionId, { fields: { ...fields }, completionPct });
    doc.markModified("sections");
    await doc.save();

    return NextResponse.json({ ok: true, completionPct });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("PUT sections failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
