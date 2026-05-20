import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { flatToNestedProduct } from "@/lib/productMapper";
import { Product } from "@/models/Product";
import { requireAuth } from "@/lib/auth";

const productSchema = z.object({
  name: z.string().trim().min(2).max(300),
  manufacturer: z.string().trim().min(2).max(300),
  description: z.string().trim().max(5000).optional(),
  deviceClass: z.enum(["A", "B", "C", "D"]),
  deviceType: z.enum(["medical-device", "ivd"]),
  intendedUse: z.string().trim().max(3000).optional(),
  patientPopulation: z.string().trim().max(500).optional(),
  countries: z.array(z.string().max(10)).min(1),
  status: z.enum(["draft", "active", "archived"]).optional(),
}).passthrough();

export async function GET() {
  try {
    const user = await requireAuth();
    await connectToDatabase();
    const products = await Product.find({ userId: (user as Record<string, unknown>)._id }).sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ products });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("GET /api/products failed:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const raw = await req.json();
    productSchema.parse(raw);
    const nested = flatToNestedProduct(raw);
    await connectToDatabase();
    const product = await Product.create({
      ...nested,
      userId: (user as Record<string, unknown>)._id,
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    console.error("POST /api/products failed:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
