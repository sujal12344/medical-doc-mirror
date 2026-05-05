import { promises as fs } from "fs";
import { NextResponse } from "next/server";

const LEGACY_HTML_PATH = "/Users/om/Desktop/medical/dmf_chatbot (1).html";

export async function GET() {
  try {
    const html = await fs.readFile(LEGACY_HTML_PATH, "utf8");
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to load legacy DMF chatbot HTML:", error);
    return NextResponse.json(
      {
        error:
          "Could not load DMF chatbot HTML. Ensure the file exists at /Users/om/Desktop/medical/dmf_chatbot (1).html",
      },
      { status: 500 },
    );
  }
}
