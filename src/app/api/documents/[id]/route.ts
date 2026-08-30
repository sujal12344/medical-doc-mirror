import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { Product } from "@/models/Product";
import { requireAuth } from "@/lib/auth";


export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    await connectToDatabase();
    const doc = await RegulatoryDocument.findOne({ _id: id, userId: (user as Record<string, unknown>)._id }).lean();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { resolvePlaceholders } = await import("@/lib/frameworks/resolvers");
    const { prefillData, products } = await resolvePlaceholders(doc, (user as Record<string, unknown>)._id as string, false);

    return NextResponse.json({ document: doc, products, prefillData });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    await connectToDatabase();
    const result = await RegulatoryDocument.findOneAndDelete({ _id: id, userId: (user as Record<string, unknown>)._id });
    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
