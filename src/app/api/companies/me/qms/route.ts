import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Company } from "@/models/Company";

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

export async function PUT(req: Request) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const body = await req.json();

    if (!body.qms) {
      return NextResponse.json({ error: "Missing qms data" }, { status: 400 });
    }

    const qms = body.qms;

    // Calculate iso13485 completion
    let isoPct = 0;
    if (qms.iso13485) {
      const parts = [
        qms.iso13485.managementResponsibility || 0,
        qms.iso13485.resourceManagement || 0,
        qms.iso13485.productRealization || 0,
        qms.iso13485.measurementAnalysis || 0
      ];
      isoPct = Math.round(parts.reduce((a, b) => a + b, 0) / 4);
    }

    // Overall completion - just a rough metric based on ISO setup + having at least 1 SOP
    let overallPct = isoPct * 0.8; 
    if (qms.sops?.length > 0) overallPct += 20;
    qms.completionPct = Math.min(Math.round(overallPct), 100);
    qms.lastUpdated = new Date();

    const flatUpdate = flattenObject({ qms });

    const company = await Company.findByIdAndUpdate(
      (user as any)._id,
      { $set: flatUpdate },
      { new: true, runValidators: true }
    ).lean();

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, completionPct: qms.completionPct });
  } catch (error: any) {
    console.error("QMS Save Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
