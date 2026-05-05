import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { DmfRecord } from "@/models/DmfRecord";

const dmfSchema = z.object({
  productName: z.string().trim().min(2).max(200),
  manufacturer: z.string().trim().min(2).max(200),
  intendedUse: z.string().trim().min(5).max(3000),
  riskClass: z.enum(["A", "B", "C", "D"]),
  shelfLife: z.string().trim().min(2).max(100),
  notes: z.string().trim().max(5000).optional(),
});

export async function GET() {
  try {
    await connectToDatabase();
    const records = await DmfRecord.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ records }, { status: 200 });
  } catch (error) {
    console.error("GET /api/dmf-records failed:", error);
    return NextResponse.json({ error: "Failed to fetch DMF records" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = dmfSchema.parse(await req.json());
    await connectToDatabase();
    const record = await DmfRecord.create(payload);
    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }

    console.error("POST /api/dmf-records failed:", error);
    return NextResponse.json({ error: "Failed to save DMF record" }, { status: 500 });
  }
}
