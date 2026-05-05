import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { DmfRecord } from "@/models/DmfRecord";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid record id" }, { status: 400 });
    }

    await connectToDatabase();
    const result = await DmfRecord.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/dmf-records/[id] failed:", error);
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 });
  }
}
