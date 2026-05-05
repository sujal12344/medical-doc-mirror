import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { env } from "@/lib/env";

const requestSchema = z.object({
  question: z.string().trim().min(2).max(5000),
  context: z.string().trim().max(8000).optional(),
});

export async function POST(req: Request) {
  try {
    if (!env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment configuration." },
        { status: 500 },
      );
    }

    const payload = requestSchema.parse(await req.json());
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a regulatory assistant for IVD Device Master File preparation. Provide concise and practical responses.",
        },
        {
          role: "user",
          content: `Question:\n${payload.question}\n\nContext:\n${payload.context || "No extra context."}`,
        },
      ],
    });

    const answer = completion.choices[0]?.message?.content || "No response.";
    return NextResponse.json({ answer }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }

    console.error("POST /api/assistant failed:", error);
    return NextResponse.json({ error: "Assistant request failed" }, { status: 500 });
  }
}
