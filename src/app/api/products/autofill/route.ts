import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { documentText } = await req.json();
    if (!documentText?.trim()) return NextResponse.json({ error: "No document text provided" }, { status: 400 });

    const truncated = documentText.slice(0, 6000); // keep within token limits

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a medical device regulatory expert. Extract product registration fields from the provided document.
Return ONLY valid JSON with exactly these keys (leave empty string or false if not found):
{
  "name": string,
  "manufacturer": string,
  "description": string,
  "intendedUse": string,
  "patientPopulation": string,
  "deviceClass": "A" | "B" | "C" | "D" | "",
  "deviceType": "ivd" | "medical-device" | "",
  "isSterile": boolean,
  "hasSoftware": boolean,
  "isActive": boolean,
  "isInvasive": boolean
}
Do not wrap the response in markdown. Return raw JSON only.`
        },
        {
          role: "user",
          content: `Extract product registration fields from this document:\n\n${truncated}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const content = completion.choices[0].message.content;
    if (!content) return NextResponse.json({ error: "No response from AI" }, { status: 500 });

    const parsed = JSON.parse(content);
    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error("Autofill error:", error);
    return NextResponse.json({ error: error.message || "Autofill failed" }, { status: 500 });
  }
}
