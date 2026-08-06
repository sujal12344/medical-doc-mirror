import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { requireAuth } from "@/lib/auth";


// POST — add a file to uploadedDocs
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ message: "Invalid id" }, { status: 400 });

    const body = await req.json() as { fileName: string; mimeType: string; base64: string };
    if (!body.fileName || !body.base64) {
      return NextResponse.json({ message: "Missing fileName or base64" }, { status: 400 });
    }

    await connectToDatabase();
    const doc = await RegulatoryDocument.findOneAndUpdate(
      { _id: id, userId: (user as Record<string, unknown>)._id },
      {
        $push: {
          uploadedDocs: {
            fileName: body.fileName,
            mimeType: body.mimeType || "application/octet-stream",
            base64: body.base64,
            uploadedAt: new Date(),
          },
        },
      },
      { returnDocument: "after" }
    ).lean();

    if (!doc) return NextResponse.json({ message: "Document not found" }, { status: 404 });
    return NextResponse.json({ document: doc });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    console.error("[upload-doc] POST error:", error);
    return NextResponse.json({ message: "Failed to save file" }, { status: 500 });
  }
}

// DELETE — remove a file from uploadedDocs by fileName
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ message: "Invalid id" }, { status: 400 });

    const body = await req.json() as { fileName: string };
    if (!body.fileName) return NextResponse.json({ message: "Missing fileName" }, { status: 400 });

    await connectToDatabase();
    const doc = await RegulatoryDocument.findOneAndUpdate(
      { _id: id, userId: (user as Record<string, unknown>)._id },
      { $pull: { uploadedDocs: { fileName: body.fileName } } },
      { returnDocument: "after" }
    ).lean();

    if (!doc) return NextResponse.json({ message: "Document not found" }, { status: 404 });
    return NextResponse.json({ document: doc });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    console.error("[upload-doc] DELETE error:", error);
    return NextResponse.json({ message: "Failed to remove file" }, { status: 500 });
  }
}
