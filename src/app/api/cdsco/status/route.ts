import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { CdscoScanHistory } from "@/models/CdscoScanHistory";
import { CdscoDocument } from "@/models/CdscoDocument";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    await connectToDatabase();

    const [latestScan, totalIndexed, totalError] = await Promise.all([
      CdscoScanHistory.findOne().sort({ startedAt: -1 }).lean(),
      CdscoDocument.countDocuments({ status: "indexed" }),
      CdscoDocument.countDocuments({ status: "error" }),
    ]);

    const recentScans = await CdscoScanHistory.find().sort({ startedAt: -1 }).limit(5).lean();

    return NextResponse.json({
      totalIndexed,
      totalError,
      latestScan,
      recentScans,
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}
