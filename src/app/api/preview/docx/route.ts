import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import mammoth from "mammoth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const formId = searchParams.get("formId");
    const fileName = searchParams.get("fileName");

    if (!formId || !fileName) {
      return NextResponse.json({ error: "Missing formId or fileName" }, { status: 400 });
    }

    // Secure the path to prevent directory traversal
    const safeFormId = formId.replace(/[^a-zA-Z0-9-]/g, "");
    const safeFileName = fileName.replace(/[^a-zA-Z0-9_.-]/g, "");
    
    const filePath = path.join(process.cwd(), "format", safeFormId.toLowerCase(), safeFileName);

    let fileBuffer;
    try {
      fileBuffer = await fs.readFile(filePath);
    } catch (err) {
      return NextResponse.json({ error: "Template not found on server" }, { status: 404 });
    }

    const { extractPlaceholdersFromTemplate } = await import("@/lib/docxTemplateHelper");
    const placeholders = extractPlaceholdersFromTemplate(filePath);

    const result = await mammoth.convertToHtml({ buffer: fileBuffer });
    const html = result.value; 

    return NextResponse.json({ html, placeholders });
  } catch (err) {
    console.error("Preview error:", err);
    return NextResponse.json({ error: "Failed to generate preview" }, { status: 500 });
  }
}
