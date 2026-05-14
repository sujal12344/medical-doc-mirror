import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { isValidObjectId } from "mongoose";

function flattenObject(obj: any, parentKey = ""): Record<string, any> {
  const flat: Record<string, any> = {};
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const val = obj[key];
    const newKey = parentKey ? `${parentKey}.${key}` : key;
    if (
      typeof val === "object" &&
      val !== null &&
      !Array.isArray(val) &&
      !(val instanceof Date)
    ) {
      Object.assign(flat, flattenObject(val, newKey));
    } else {
      flat[newKey] = val;
    }
  }
  return flat;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id))
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });

    const user = await getSession();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    const body = await req.json();
    if (!body.technicalDossier)
      return NextResponse.json({ error: "No dossier data" }, { status: 400 });

    // Compute per-section and overall completion %
    const td = body.technicalDossier;
    const sectionPcts: number[] = [];

    if (td.sec1) {
      const fields = ["deviceDescription", "modelNumbers", "materials"];
      td.sec1.completionPct = Math.round((fields.filter((f) => td.sec1[f]?.trim()).length / fields.length) * 100);
      sectionPcts.push(td.sec1.completionPct);
    }
    if (td.sec2) {
      const fields = ["labelText", "ifuText", "storageConditions"];
      td.sec2.completionPct = Math.round((fields.filter((f) => td.sec2[f]?.trim()).length / fields.length) * 100);
      sectionPcts.push(td.sec2.completionPct);
    }
    if (td.sec3) {
      const fields = ["manufacturingSite", "manufacturingProcess"];
      td.sec3.completionPct = Math.round((fields.filter((f) => td.sec3[f]?.trim()).length / fields.length) * 100);
      sectionPcts.push(td.sec3.completionPct);
    }
    if (td.sec4) {
      const fields = ["riskManagementStandard", "hazardsIdentified", "riskControlMeasures"];
      td.sec4.completionPct = Math.round((fields.filter((f) => td.sec4[f]?.trim()).length / fields.length) * 100);
      sectionPcts.push(td.sec4.completionPct);
    }
    if (td.sec5) {
      const boolFields = ["performanceTested", "biocompatibilityDone", "shelfLifeTested"];
      td.sec5.completionPct = Math.round((boolFields.filter((f) => td.sec5[f]).length / boolFields.length) * 100);
      sectionPcts.push(td.sec5.completionPct);
    }
    if (td.sec6) {
      td.sec6.completionPct = td.sec6.cerStatus === "complete" ? 100 : td.sec6.cerStatus === "in-progress" ? 50 : 0;
      sectionPcts.push(td.sec6.completionPct);
    }
    if (td.sec7) {
      td.sec7.completionPct = td.sec7.pmsPlanStatus === "complete" ? 100 : td.sec7.pmsPlanStatus === "in-progress" ? 50 : 0;
      sectionPcts.push(td.sec7.completionPct);
    }

    td.overallCompletionPct = sectionPcts.length
      ? Math.round(sectionPcts.reduce((a, b) => a + b, 0) / sectionPcts.length)
      : 0;
    td.lastUpdated = new Date();

    const flatPayload = flattenObject(td, "technicalDossier");

    const updated = await Product.findOneAndUpdate(
      { _id: id, userId: (user as Record<string, unknown>)._id },
      { $set: flatPayload },
      { new: true, runValidators: true }
    ).lean();

    if (!updated)
      return NextResponse.json({ error: "Product not found" }, { status: 404 });

    return NextResponse.json({ ok: true, overallCompletionPct: td.overallCompletionPct });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save dossier" }, { status: 500 });
  }
}
