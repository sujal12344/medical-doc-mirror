import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Company } from "@/models/Company";

export async function PUT(req: Request) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await connectToDatabase();

    const companyId = (user as Record<string, unknown>)._id;
    
    // We expect a partial update to the businessSetup object
    // Like { "businessSetup.gstNumber": "27AAAAA0000A1Z5" } or full object
    
    const updatePayload: Record<string, string> = {};
    if (body.businessSetup) {
      for (const [key, value] of Object.entries(body.businessSetup)) {
        if (typeof value === 'string') {
          updatePayload[`businessSetup.${key}`] = value;
        }
      }
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
    console.error("Failed to update business setup:", error);
    return NextResponse.json({ error: "Failed to update business setup" }, { status: 500 });
  }
}
