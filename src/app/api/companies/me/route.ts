import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Company } from "@/models/Company";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    await connectToDatabase();
    const company = await Company.findById((session.user as any).id).select("-companyPassword").lean();
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    
    return NextResponse.json({ company });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch company" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await connectToDatabase();

    const company = await Company.findByIdAndUpdate(
      (session.user as any).id,
      {
        companyName: body.companyName,
        companyNumber: body.companyNumber,
        description: body.description,
        country: body.country,
      },
      { new: true }
    ).select("-companyPassword").lean();

    return NextResponse.json({ company });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
  }
}
