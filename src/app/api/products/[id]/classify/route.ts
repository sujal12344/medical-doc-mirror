import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { runHybridClassification } from "@/lib/classification/hybridQuery";

export async function POST(req: NextRequest, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = await getToken({ req });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const companyId = token.sub;

    await connectToDatabase();
    const product = await Product.findOne({ _id: id, userId: companyId });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body = await req.json();
    const { mode, deviceDescription: manualDesc, pdfText } = body;

    let baseDescription = "";
    if (mode === "manual-description") {
      baseDescription = manualDesc || "";
    } else if (mode === "pdf-upload") {
      baseDescription = pdfText || "";
    }

    // Combine with existing product info for maximum context
    const fullDeviceDescription = `
      Name: ${product.name}
      Type: ${product.deviceType}
      Description: ${product.description || "N/A"}
      Intended Use: ${product.intendedUse || "N/A"}

      Detailed Information:
      ${baseDescription}
    `.trim();

    // Call Hybrid AI Engine
    const result = await runHybridClassification({
      companyId,
      productId: id,
      deviceDescription: fullDeviceDescription,
      existingProductData: {
        name: product.name,
        description: product.description,
        intendedUse: product.intendedUse,
        deviceType: product.deviceType,
      },
    });

    // Compute completion percentage
    let filledFields = 0;
    if (result.confirmedClass) filledFields++;
    if (result.appliedRule) filledFields++;
    if (result.isInvasive !== undefined) filledFields++;
    if (result.contactDuration && result.contactDuration !== 'na') filledFields++;
    // We'll count genericName instead of hasPredicate since hasPredicate is outside the AI output schema directly,
    // actually hasPredicate is in our product model but AI doesn't output it directly unless we asked it to.
    if (result.genericName) filledFields++;

    const pct = Math.round((filledFields / 5) * 100);

    // Save back to DB
    product.classification = {
      ...product.classification,
      ...result,
      classConfirmedBy: "ai",
      wizardCompleted: false, // User must manually review and lock
      overallCompletionPct: Math.min(100, pct),
      lastUpdated: new Date(),
    };

    // Keep top-level template sync working
    if (result.confirmedClass && ["A", "B", "C", "D"].includes(result.confirmedClass)) {
      product.deviceClass = result.confirmedClass as "A" | "B" | "C" | "D";
    }

    await product.save();

    return NextResponse.json({ success: true, classification: product.classification });
  } catch (error: any) {
    console.error("Classification POST Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } | Promise<{ id: string }> }) {
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

    const classification = product.classification;
    const confirmedClass = classification?.confirmedClass || product.deviceClass;

    let nextStep = "Classification incomplete.";
    if (confirmedClass === "A") {
      nextStep = "Proceed to Phase 2. Authority: SLA (State)";
    } else if (confirmedClass === "B") {
      nextStep = "Notified Body audit required. Authority: SLA (State)";
    } else if (confirmedClass === "C") {
      nextStep = "CLA (DCGI) authority. Clinical data may be needed.";
    } else if (confirmedClass === "D") {
      nextStep = "CLA (DCGI) authority. Clinical investigation required.";
    }

    return NextResponse.json({
      classification,
      isClassified: !!classification?.wizardCompleted,
      nextStep,
    });
  } catch (error: any) {
    console.error("Classification GET Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
