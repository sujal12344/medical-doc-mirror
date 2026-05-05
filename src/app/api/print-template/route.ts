import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

type Payload = {
  values?: Record<string, string>;
};

function escHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildAdditionalRows(values: Record<string, string>) {
  const rows = Object.entries(values)
    .filter(([, v]) => !!v?.trim())
    .map(
      ([qid, v]) =>
        `<tr><td style="width:18%">${escHtml(qid)}</td><td>${escHtml(v).replace(/\n/g, "<br/>")}</td></tr>`,
    )
    .join("");

  if (!rows) return "";
  return `
<table style="margin-top:18px;">
  <tr><td colspan="2" class="section-label">ADDITIONAL FILLED FIELDS (AUTO-EXPORTED)</td></tr>
  <tr><th style="width:18%">Field ID</th><th>Value</th></tr>
  ${rows}
</table>`;
}

function replacePlaceholders(template: string, values: Record<string, string>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9._-]+)\s*\}\}/g, (_match, key: string) => {
    if (key === "__ADDITIONAL_FIELDS__") {
      return buildAdditionalRows(values);
    }
    const v = values[key];
    if (!v || !v.trim()) return "Not provided";
    return escHtml(v).replace(/\n/g, "<br/>");
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;
    const values = body.values || {};
    const templatePath = path.join(process.cwd(), "public", "dmf_template_exact.html");
    const template = await fs.readFile(templatePath, "utf8");
    let html = replacePlaceholders(template, values);
    html = html.replace(
      "</body>",
      "\n<script>window.addEventListener('load',()=>{setTimeout(()=>{window.focus();window.print();},120);});</script>\n</body>",
    );

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("print-template POST failed:", error);
    return NextResponse.json({ error: "Failed to generate print template" }, { status: 500 });
  }
}
