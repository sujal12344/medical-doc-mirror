import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/mongodb";
import { ensureClassLock } from "@/lib/productMapper";
import { Product } from "@/models/Product";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> },
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

    const classLock = ensureClassLock(product);
    if (!classLock.ai?.confirmedClass) {
      return NextResponse.json(
        { error: "No AI classification found. Run classification first." },
        { status: 400 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const { hasPredicate, predicateDeviceName, predicateLicenceNumber, isNovel } = body;

    classLock.ai = {
      ...classLock.ai,
      wizardCompleted: true,
      lastUpdated: new Date(),
    };
    if (hasPredicate !== undefined) classLock.ai.hasPredicate = hasPredicate;
    if (predicateDeviceName !== undefined) classLock.ai.predicateDeviceName = predicateDeviceName;
    if (predicateLicenceNumber !== undefined) classLock.ai.predicateLicenceNumber = predicateLicenceNumber;
    if (isNovel !== undefined) classLock.ai.isNovel = isNovel;

    product.markModified("classLock");
    await product.save();

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Classification confirm error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
