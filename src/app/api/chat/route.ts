import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { env } from "@/lib/env";

const reqSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string(),
      }),
    )
    .min(1),
  max_tokens: z.number().int().min(1).max(4096).optional(),
  temperature: z.number().min(0).max(2).optional(),
});

export async function POST(req: Request) {
  try {
    if (!env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is missing." }, { status: 500 });
    }

    const payload = reqSchema.parse(await req.json());
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: payload.messages,
      max_tokens: payload.max_tokens ?? 800,
      temperature: payload.temperature ?? 0.2,
    });

    const content = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ content }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("POST /api/chat failed:", error);
    return NextResponse.json({ error: "Chat request failed" }, { status: 500 });
  }
}

