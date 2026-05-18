import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = file.name.toLowerCase();

    let text = "";

    // ── PDF extraction ──────────────────────────────────────────────────────
    if (fileName.endsWith(".pdf")) {
      // Import from lib path directly — avoids pdf-parse's test file loader
      // which crashes in Next.js with ENOENT: test/data/05-versions-space.pdf
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js" as any)).default;
      const result = await pdfParse(buffer);
      text = result.text;
      console.log(`[extract-text] PDF: ${result.numpages} pages → ${text.length} chars`);
      console.log(`[extract-text] Preview: "${text.slice(0, 150).replace(/\n/g, " ")}"`);


    // ── Plain text / doc fallback ────────────────────────────────────────────
    } else {
      text = buffer.toString("utf-8");
      console.log(`[extract-text] Text file: ${text.length} chars`);
    }

    if (!text.trim()) {
      return NextResponse.json({ error: "Could not extract text from file" }, { status: 422 });
    }

    return NextResponse.json({ text, charCount: text.length });

  } catch (error: any) {
    console.error("[extract-text] Error:", error.message);
    return NextResponse.json({ error: error.message || "Extraction failed" }, { status: 500 });
  }
}
