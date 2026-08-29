import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Company } from "@/models/Company";
import OpenAI from "openai";
import { Storage } from "@google-cloud/storage";
// pdf-parse/index.js runs a readFileSync self-test at module evaluation time
// which crashes Next.js during build. Import from the implementation directly.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (
  dataBuffer: Buffer
) => Promise<{ text: string }>;
import mammoth from "mammoth";

export const maxDuration = 120;
export const runtime = "nodejs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf") {
    const result = await pdfParse(buffer);
    return result.text;
  }
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  // Plain text fallback
  return buffer.toString("utf-8");
}

// ─── POST — upload COI, extract, save ─────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const userId = (user as Record<string, unknown>)._id as string;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const maxUploadBytes = parseInt(process.env.MAX_UPLOAD_BYTES || "100000000", 10);
    if (file.size > maxUploadBytes) {
      return NextResponse.json({ error: "File exceeds the maximum allowed size" }, { status: 413 });
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF, DOCX, or TXT file." },
        { status: 400 }
      );
    }

    // 1. Extract raw text from the uploaded document
    const buffer = Buffer.from(await file.arrayBuffer());
    const rawText = await extractText(buffer, file.type);

    if (!rawText || rawText.trim().length < 30) {
      return NextResponse.json(
        {
          error:
            "Could not extract readable text from the document. " +
            "Please ensure the file is not a scanned image-only PDF.",
        },
        { status: 422 }
      );
    }

    // 2. Send to GPT for structured extraction
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a regulatory document parser for Indian medical device companies.
Extract the following fields from the Certificate of Incorporation (COI) or company registration document.
Return ONLY a valid JSON object — do not add any extra keys.

Required JSON schema:
{
  "applicantName": "Full registered company name as it appears on the document",
  "bodyConstitution": "Legal entity type e.g. Private Limited, LLP, OPC, Partnership, Sole Proprietorship",
  "registeredOfficeAddress": "Full registered office address including city, state and pincode on one line",
  "incorporationDate": "Date of incorporation in DD/MM/YYYY format",
  "cinNumber": "Corporate Identity Number (CIN) or LLPIN or firm registration number",
  "signatories": [
    { "name": "Full name of director/partner/proprietor", "designation": "Director / Managing Partner / Proprietor" }
  ]
}

If a field cannot be found, return "" for strings or [] for arrays. Do NOT hallucinate values.`,
        },
        {
          role: "user",
          content: `Extract company registration details from this document:\n\n${rawText.slice(0, 8000)}`,
        },
      ],
    });

    let extracted: {
      applicantName?: string;
      bodyConstitution?: string;
      registeredOfficeAddress?: string;
      incorporationDate?: string;
      cinNumber?: string;
      signatories?: { name: string; designation: string }[];
    };

    try {
      const raw = completion.choices[0].message.content || "{}";
      // Strip markdown fences if model wraps the JSON
      const cleaned = raw.replace(/^```[a-z]*\s*/i, "").replace(/\s*```\s*$/i, "").trim();
      extracted = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "AI extraction failed. Please try again or contact support." },
        { status: 500 }
      );
    }

    // 2.5 Store original file in access-controlled storage
    let fileUrl = "";
    try {
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
      const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
      const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n');
      const bucketName = process.env.GCS_BUCKET?.trim();

      if (projectId && clientEmail && privateKey && bucketName) {
        const storage = new Storage({
          projectId,
          credentials: { client_email: clientEmail, private_key: privateKey },
        });
        const bucket = storage.bucket(bucketName);
        const timestamp = Date.now();
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
        const gcsPath = `coi-docs/${userId}/${timestamp}_${sanitizedFileName}`;
        
        const gcsFile = bucket.file(gcsPath);
        await gcsFile.save(buffer, { contentType: file.type });
        
        fileUrl = gcsPath;
      }
    } catch (gcsError) {
      console.error("[COI GCS Upload Error]", gcsError);
    }

    // 3. Save extracted data to the Company document in the DB
    await connectToDatabase();
    const updatedCompany = await Company.findByIdAndUpdate(
      userId,
      {
        $set: {
          coiData: {
            fileUrl,
            fileName: file.name,
            extractedAt: new Date(),
            applicantName:           extracted.applicantName           || "",
            bodyConstitution:        extracted.bodyConstitution        || "",
            registeredOfficeAddress: extracted.registeredOfficeAddress || "",
            incorporationDate:       extracted.incorporationDate       || "",
            cinNumber:               extracted.cinNumber               || "",
            signatories:             extracted.signatories             || [],
          },
        },
      },
      { new: true, select: "coiData" }
    );

    if (!updatedCompany) {
      return NextResponse.json({ error: "Company profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      coiData: updatedCompany?.coiData,
    });
  } catch (error) {
    const err = error as Error;
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[COI Extract Error]", err);
    return NextResponse.json({ error: "Failed to process document" }, { status: 500 });
  }
}

// ─── GET — return current coiData ─────────────────────────────────────────────

export async function GET() {
  try {
    const user = await requireAuth();
    const userId = (user as Record<string, unknown>)._id as string;
    await connectToDatabase();
    const company = await Company.findById(userId).select("coiData").lean();
    let coiData = (company as { coiData?: any })?.coiData || null;

    if (coiData?.fileUrl && !coiData.fileUrl.startsWith('http')) {
      try {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
        const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
        const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n');
        const bucketName = process.env.GCS_BUCKET?.trim();
        if (projectId && clientEmail && privateKey && bucketName) {
           const storage = new Storage({ projectId, credentials: { client_email: clientEmail, private_key: privateKey } });
           const [url] = await storage.bucket(bucketName).file(coiData.fileUrl).getSignedUrl({
             version: 'v4', action: 'read', expires: Date.now() + 15 * 60 * 1000
           });
           coiData.fileUrl = url;
        }
      } catch (err) { console.error("Error signing URL", err); }
    }

    return NextResponse.json({ coiData });
  } catch (error) {
    const err = error as Error;
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
