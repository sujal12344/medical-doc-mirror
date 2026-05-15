import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models/Product";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getToken({ req });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const product = await Product.findOne({ _id: id, userId: token.sub });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (!product.classification?.confirmedClass) {
      return NextResponse.json(
        { error: "No AI classification found. Run classification first." },
        { status: 400 }
      );
    }

    // Lock the classification + save predicate data
    const body = await req.json().catch(() => ({}));
    const { hasPredicate, predicateDeviceName, predicateLicenceNumber, isNovel } = body;

    product.classification.wizardCompleted = true;
    product.classification.lastUpdated = new Date();
    if (hasPredicate !== undefined) product.classification.hasPredicate = hasPredicate;
    if (predicateDeviceName !== undefined) product.classification.predicateDeviceName = predicateDeviceName;
    if (predicateLicenceNumber !== undefined) product.classification.predicateLicenceNumber = predicateLicenceNumber;
    if (isNovel !== undefined) product.classification.isNovel = isNovel;
    await product.save();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Classification confirm error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
