import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Company } from "@/models/Company";

// Helper to flatten a deeply nested object for MongoDB $set
function flattenObject(obj: any, parentKey = ""): Record<string, any> {
  const flattened: Record<string, any> = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const newKey = parentKey ? `${parentKey}.${key}` : key;
      if (typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
        Object.assign(flattened, flattenObject(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    }
  }
  return flattened;
}

export async function PUT(req: Request) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await connectToDatabase();

    const companyId = (user as Record<string, unknown>)._id;

    const updatePayload: Record<string, any> = {};

    if (body.businessGenesis) {
      const flattenedGenesis = flattenObject(body.businessGenesis, "businessGenesis");
      Object.assign(updatePayload, flattenedGenesis);
      updatePayload["businessGenesis.lastUpdated"] = new Date();
    }

    if (body.deviceClassification) {
      const flattenedDC = flattenObject(body.deviceClassification, "deviceClassification");
      Object.assign(updatePayload, flattenedDC);
      updatePayload["deviceClassification.lastUpdated"] = new Date();
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      companyId,
      { $set: updatePayload },
      { new: true, runValidators: true }
    ).select("-companyPassword");

    if (!updatedCompany) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({ company: updatedCompany });
  } catch (error) {
    console.error("Failed to update business genesis:", error);
    return NextResponse.json({ error: "Failed to update business genesis" }, { status: 500 });
  }
}
