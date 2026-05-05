import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { DocumentVersion } from "@/models/DocumentVersion";
import { requireAuth } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, ctx: Ctx) {
  try {
    const user = await requireAuth();
    const { id } = await ctx.params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    await connectToDatabase();

    const doc = await RegulatoryDocument.findOne({ _id: id, userId: (user as Record<string, unknown>)._id }).lean();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const versions = await DocumentVersion.find({ documentId: id }).sort({ version: -1 }).lean();
    return NextResponse.json({ versions });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = await requireAuth();
    const { id } = await ctx.params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const { changeNote } = await req.json().catch(() => ({ changeNote: "" }));
    await connectToDatabase();

    const doc = await RegulatoryDocument.findOne({ _id: id, userId: (user as Record<string, unknown>)._id });
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const snapshot = Object.fromEntries(doc.sections);
    const version = await DocumentVersion.create({
      documentId: id,
      version: doc.version,
      snapshot,
      changeNote: changeNote || `Version ${doc.version}`,
      createdBy: (user as Record<string, unknown>)._id,
    });

    doc.version += 1;
    await doc.save();

    return NextResponse.json({ version, newVersion: doc.version }, { status: 201 });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("POST versions failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
