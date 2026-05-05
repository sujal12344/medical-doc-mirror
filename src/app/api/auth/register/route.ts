import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { Company } from "@/models/Company";

const registerSchema = z.object({
  companyName: z.string().trim().min(2).max(100),
  companyEmail: z.string().trim().email().max(200),
  companyPassword: z.string().min(6).max(128),
  companyNumber: z.string().trim().max(20).optional(),
  description: z.string().trim().max(500).optional(),
  country: z.string().trim().max(3).optional(),
});

export async function POST(req: Request) {
  try {
    const body = registerSchema.parse(await req.json());
    await connectToDatabase();

    const existing = await Company.findOne({ companyEmail: body.companyEmail.toLowerCase() }).lean();
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const company = await Company.create({ 
      ...body, 
      companyEmail: body.companyEmail.toLowerCase(),
      companyPassword: body.companyPassword
    });


    return NextResponse.json(
      { user: { id: company._id, email: company.companyEmail, name: company.companyName } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("POST /api/auth/register failed:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
