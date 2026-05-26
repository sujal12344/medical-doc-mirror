import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { extractDocumentText } from "@/lib/documentExtract";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await extractDocumentText(buffer, file.name);

    if (!result.text.trim()) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from file. If this is a scanned PDF, ensure OPENAI_API_KEY is set for OCR.",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      text: result.text,
      charCount: result.charCount,
      method: result.method,
      pageCount: result.pageCount,
      ocrPages: result.ocrPages,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Extraction failed";
    if (error instanceof Error && error.stack) {
      console.error("[extract-text] Error:", message, "\n", error.stack.split("\n").slice(0, 5).join("\n"));
    } else {
      console.error("[extract-text] Error:", message);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
