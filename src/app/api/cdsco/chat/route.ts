import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { queryCdscoKnowledge } from "@/lib/cdsco/ingest";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL,
});

const CHAT_MODEL = process.env.DEEPSEEK_CHAT_MODEL!;

const SYSTEM_PROMPT = `You are an expert regulatory assistant specializing in India's CDSCO (Central Drugs Standard Control Organisation) and medical device regulations under the Medical Devices Rules, 2017.

You have access to the latest regulatory documents, notifications, and guidance directly scraped from the CDSCO official portal.

Guidelines:
- Provide accurate, professionally worded answers grounded in the retrieved documents
- Cite the source document title when referencing specific regulations or notifications
- If the retrieved context does not contain enough information, say so clearly — do not hallucinate
- Use clear, structured formatting with bullet points or numbered lists where appropriate
- Focus on actionable regulatory guidance`;

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const { messages, query } = await req.json();
    if (!query && (!messages || messages.length === 0)) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const userQuery = query || messages[messages.length - 1]?.content || "";

    // Retrieve relevant context from Pinecone
    const context = await queryCdscoKnowledge(userQuery, 8);
    const contextText = context.length > 0
      ? context
          .map((c, i) => `[${i + 1}] **${c.title}**\n${c.text}`)
          .join("\n\n---\n\n")
      : "No specific regulatory documents found for this query.";

    const systemMessage = `${SYSTEM_PROMPT}

## Retrieved Regulatory Context
${contextText}`;

    // Build message history
    const history = Array.isArray(messages) ? messages.slice(-6) : [];
    const chatMessages = [
      { role: "system" as const, content: systemMessage },
      ...history.filter((m: any) => m.role !== "system"),
      { role: "user" as const, content: userQuery },
    ];

    const completion = await deepseek.chat.completions.create({
      model: CHAT_MODEL,
      messages: chatMessages,
      max_tokens: 2048,
      temperature: 0.3,
    });

    const answer = completion.choices[0]?.message?.content || "No response generated.";

    return NextResponse.json({
      answer,
      sources: context.map((c) => ({ title: c.title, url: c.sourceUrl, score: c.score })),
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[cdsco/chat] Error:", error);
    return NextResponse.json({ error: "Failed to generate response." }, { status: 500 });
  }
}
