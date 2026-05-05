import { NextResponse } from "next/server";
import { FRAMEWORKS } from "@/lib/frameworks";

export async function GET() {
  const summary = FRAMEWORKS.map((f) => ({
    id: f.id,
    countryCode: f.countryCode,
    countryName: f.countryName,
    flag: f.flag,
    authority: f.authority,
    documentType: f.documentType,
    sectionCount: f.sections.length,
    fieldCount: f.sections.reduce((sum, s) => sum + s.fields.length, 0),
  }));
  return NextResponse.json({ frameworks: summary });
}
