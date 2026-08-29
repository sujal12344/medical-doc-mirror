import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { requireAuth } from "@/lib/auth";
import { CDSCO_FORM_GROUPS } from "@/lib/frameworks/asia/india-forms";

const createSchema = z.object({
  contextPayload: z.record(z.string(), z.any()).optional(),
  countryCode: z.string().min(1).max(10),
  frameworkId: z.string().min(1).max(50),
  title: z.string().trim().min(2).max(500),
});

export async function GET() {
  try {
    const user = await requireAuth();
    await connectToDatabase();
    const docs = await RegulatoryDocument.find({ userId: (user as Record<string, unknown>)._id }).sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ documents: docs });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

  export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = createSchema.parse(await req.json());
    
    // Resolve FormDefinition
    let formDef;
    const normalizedFrameworkId = body.frameworkId.replace(/^IN_/, '').replace(/_/g, '-');
    for (const group of CDSCO_FORM_GROUPS) {
      formDef = group.forms.find(f => f.id === normalizedFrameworkId);
      if (formDef) break;
    }

    if (formDef) {
      const productIds = body.contextPayload?.productIds;
      const allowedKeys = ["productIds"];
      const payloadKeys = Object.keys(body.contextPayload || {});
      const unknownKeys = payloadKeys.filter(k => !allowedKeys.includes(k));
      
      if (unknownKeys.length > 0) {
        return NextResponse.json({ error: `Unknown context keys: ${unknownKeys.join(', ')}` }, { status: 400 });
      }

      if (formDef.requiredContexts?.includes("PRODUCT_MULTI")) {
        if (!Array.isArray(productIds) || productIds.length === 0) {
          return NextResponse.json({ error: "PRODUCT_MULTI requires a non-empty productIds array" }, { status: 400 });
        }
      }

      if (formDef.requiredContexts?.includes("PRODUCT_SINGLE")) {
        if (!Array.isArray(productIds) || productIds.length !== 1) {
          return NextResponse.json({ error: "PRODUCT_SINGLE requires exactly one ID in productIds" }, { status: 400 });
        }
      }

      if (Array.isArray(productIds) && productIds.some(id => typeof id !== 'string' || id.trim() === '')) {
        return NextResponse.json({ error: "Invalid product ID values" }, { status: 400 });
      }
    }

    await connectToDatabase();
    const document = await RegulatoryDocument.create({ ...body, userId: (user as Record<string, unknown>)._id });
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    console.error("POST /api/documents failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
