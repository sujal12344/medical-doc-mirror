import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Company } from "@/models/Company";
import { requireAuth } from "@/lib/auth";
import { Storage } from "@google-cloud/storage";
import OpenAI from "openai";
import mammoth from "mammoth";

// Import pdf-parse safely to avoid Next.js build crash
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (
  dataBuffer: Buffer,
  options?: Record<string, unknown>
) => Promise<{ text: string; numpages: number; numrender: number; info: unknown; metadata: unknown; version: string }>;

export const maxDuration = 120;
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireAuth();
    const { id } = await ctx.params;
    if (!isValidObjectId(id)) return NextResponse.json({ message: "Invalid company id" }, { status: 400 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ message: "Missing file" }, { status: 400 });
    }

    // Read the file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Upload to Google Cloud Storage
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const bucketName = process.env.GCS_BUCKET?.trim();

    if (!projectId || !clientEmail || !privateKey || !bucketName) {
      console.error("[licenses] Missing GCS environment variables");
      return NextResponse.json({ message: "Storage not configured on server" }, { status: 500 });
    }

    const storage = new Storage({
      projectId,
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
    });

    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const gcsPath = `company-docs/${id}/licenses/${timestamp}_${sanitizedFileName}`;
    
    const bucket = storage.bucket(bucketName);
    const gcsFile = bucket.file(gcsPath);

    await gcsFile.save(buffer, {
      contentType: file.type || (sanitizedFileName.endsWith(".docx") ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/pdf"),
      metadata: {
        cacheControl: "public, max-age=31536000",
      },
    });

    // Generate public URL (assuming bucket is configured for public access, or we can just use the public link format)
    const documentUrl = `https://storage.googleapis.com/${bucketName}/${gcsPath}`;

    // 2. Parse the PDF or DOCX
    let parsedText = "";
    try {
      if (sanitizedFileName.toLowerCase().endsWith(".docx") || sanitizedFileName.toLowerCase().endsWith(".doc")) {
        const result = await mammoth.extractRawText({ buffer });
        parsedText = result.value;
      } else {
        const data = await pdfParse(buffer);
        parsedText = data.text;
      }
    } catch (parseError) {
      console.error("[licenses] Parse error:", parseError);
      return NextResponse.json({ message: "Failed to read document text" }, { status: 400 });
    }

    // 3. Extract License Details with OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const extractionResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini", // fast and cheap for this task
      messages: [
        {
          role: "system",
          content: `You are an expert regulatory affairs AI reading Indian CDSCO Medical Device licenses (e.g. Form MD-9, MD-15, MD-17, MD-5, MD-13, MD-28, etc.).
Extract the exact license type/form number, issue date, and expiry date. 
Return dates in ISO 8601 format (YYYY-MM-DD). 

CRITICAL RULE FOR EXPIRY DATES:
Under Indian MDR 2017, many licenses (like MD-5, MD-9, MD-15, MD-17) 
are perpetual but require a retention fee to be paid every 5 years.
If the PDF does not explicitly state an expiry date, CALCULATE the expiry date as
exactly 5 years from the Issue Date, because the user needs an alert to pay the retention fee. 
If the form explicitly states a different validity period (e.g. 3 years for some Test Licenses),
calculate it based on that. If you absolutely cannot determine an issue date, leave expiryDate null.`
        },
        {
          role: "user",
          content: `Extract the license data from the following text:\n\n${parsedText.substring(0, 8000)}` // First 8000 chars should be plenty for headers
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "license_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              licenseType: { type: "string", description: "The form number (e.g. 'MD-17', 'MD-9')" },
              issueDate: { type: ["string", "null"], description: "Issue date in YYYY-MM-DD format" },
              expiryDate: { type: ["string", "null"], description: "Expiry date in YYYY-MM-DD format. Null if not specified or perpetual." },
            },
            required: ["licenseType", "issueDate", "expiryDate"],
            additionalProperties: false
          }
        }
      }
    });

    const extraction = JSON.parse(extractionResponse.choices[0].message.content || "{}");

    // 4. Save to Database
    await connectToDatabase();
    
    const newLicense = {
      fileName: sanitizedFileName,
      mimeType: file.type || "application/pdf",
      documentUrl,
      licenseType: extraction.licenseType || "Unknown",
      issueDate: extraction.issueDate ? new Date(extraction.issueDate) : undefined,
      expiryDate: extraction.expiryDate ? new Date(extraction.expiryDate) : undefined,
      uploadedAt: new Date(),
    };

    // Note: Assuming the user is a company user and can only update their own company
    // If user._id is the company id, or if we just rely on ctx.params.id (which is safer if admin is updating)
    const company = await Company.findByIdAndUpdate(
      id,
      { $push: { regulatoryLicenses: newLicense } },
      { returnDocument: "after", runValidators: true }
    );

    if (!company) {
      return NextResponse.json({ message: "Company not found" }, { status: 404 });
    }

    const savedLicense = company.regulatoryLicenses[company.regulatoryLicenses.length - 1];

    return NextResponse.json({ 
      message: "License successfully uploaded and parsed", 
      license: savedLicense 
    });

  } catch (error) {
    if ((error as Error).message === "Unauthorized") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    console.error("[licenses] POST error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// DELETE — remove a license from regulatoryLicenses by _id
export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireAuth();
    const { id } = await ctx.params;
    if (!isValidObjectId(id)) return NextResponse.json({ message: "Invalid company id" }, { status: 400 });

    const body = await req.json() as { licenseId: string };
    if (!body.licenseId) return NextResponse.json({ message: "Missing licenseId" }, { status: 400 });

    await connectToDatabase();
    
    // We could optionally delete the file from GCS here, but for now we just remove the DB reference
    const company = await Company.findByIdAndUpdate(
      id,
      { $pull: { regulatoryLicenses: { _id: body.licenseId } } },
      { returnDocument: "after" }
    );

    if (!company) return NextResponse.json({ message: "Company not found" }, { status: 404 });
    return NextResponse.json({ message: "License removed successfully" });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    console.error("[licenses] DELETE error:", error);
    return NextResponse.json({ message: "Failed to remove license" }, { status: 500 });
  }
}
