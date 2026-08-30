import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { requireAuth } from "@/lib/auth";
import { extractDocumentText } from "@/lib/documentExtract";
import { OpenAI } from "openai";

const LOG = "[extract-dynamic]";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    
    await connectToDatabase();
    
    const doc = await RegulatoryDocument.findOne({
      _id: id,
      userId: (user as Record<string, unknown>)._id,
    });
    
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const missingKeysStr = formData.get("missingKeys") as string | null;

    if (files.length === 0 || !missingKeysStr) {
      return NextResponse.json({ error: "Missing files or missingKeys" }, { status: 400 });
    }

    let missingKeys: string[] = [];
    try {
      missingKeys = JSON.parse(missingKeysStr);
    } catch (e) {
      return NextResponse.json({ error: "Invalid missingKeys format" }, { status: 400 });
    }

    if (missingKeys.length === 0) {
       return NextResponse.json({ success: true, message: "No keys to extract" }, { status: 200 });
    }

    console.log(`${LOG} Extracting ${missingKeys.length} keys from ${files.length} files`);

    let fullText = "";
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const { text } = await extractDocumentText(buffer, file.name);
      if (text) {
        fullText += `\n\n--- DOCUMENT: ${file.name} ---\n\n${text}`;
      }
    }

    if (!fullText || fullText.trim().length === 0) {
       return NextResponse.json({ error: "Could not extract text from documents." }, { status: 400 });
    }

    // Prepare OpenAI Extraction
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY on server" }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });
    const extractionModel = process.env.OPENAI_MODEL || "gpt-4o-mini";

    console.log(`${LOG} Sending to OpenAI for schema-less extraction...`);

    const systemPrompt = `You are an expert medical regulatory data extractor.
Your job is to read the provided clinical document (like a Clinical Investigation Plan or Investigator Brochure) and extract data to satisfy a specific list of missing keys.

Output rules:
- No explanation, no markdown, ONLY valid JSON.
- You MUST return a JSON object where EACH requested key maps to a nested object containing BOTH the "value" and the "source".
- CRITICAL: DO NOT return plain strings or arrays directly! It MUST be { "value": ..., "source": "..." }.
- If a value cannot be reasonably found or inferred from the text, set the "value" to an empty string "" and "source" to "".
- **Example format**:
  {
    "applicantName": { "value": "MedTech Corp", "source": "Certificate_of_Incorporation.pdf" },
    "cipDate": { "value": "12-Oct-2023", "source": "Clinical_Investigation_Plan.pdf" }
  }
- **IMPORTANT FOR TABLES/ARRAYS**: If you notice that some of the requested keys logically form columns of a table or loop (e.g., 'slNo', 'visitName', 'timePoint', 'plannedWindow'), group them into an array of objects. In this specific case, you don't need a "source" key per array element. Just return the array of objects as the "value".
  Example:
  "proceduresAssessments": {
    "source": "Clinical_Investigation_Plan.pdf",
    "value": [
      { "slNo": 1, "visitName": "Baseline", "plannedWindow": "Day 0" },
      { "slNo": 2, "visitName": "Follow-up", "plannedWindow": "Day 7" }
    ]
  }
- **PATIENT INFORMATION SHEET (pis...)**: Keys starting with 'pis' (e.g., pisRisksDiscomforts, pisStudyProcedures) are meant for the Patient Informed Consent form. Extract comprehensive, patient-friendly paragraphs from the document (usually found in the Risk/Benefit or Ethics sections) to satisfy these fields.
- **CHECKBOXES**: If you see keys like 'yes' or 'no', these are literal checkbox placeholders. Ignore them and return "".`;

    // Limit text to ~80k characters (approx 20k tokens) to avoid context limit issues if the document is massive
    // Most CIPs are long, so we take the first 80k characters as a heuristic, or ideally use a long-context model
    const maxChars = 120000; 
    const contextText = fullText.length > maxChars ? fullText.substring(0, maxChars) + "...[TRUNCATED]" : fullText;

    const userPrompt = `MISSING KEYS TO EXTRACT:
${JSON.stringify(missingKeys, null, 2)}

DOCUMENT CONTEXT:
${contextText}`;

    const completion = await openai.chat.completions.create({
      model: extractionModel,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const rawOutput = completion.choices?.[0]?.message?.content || "{}";
    let extractedData = {};
    try {
      extractedData = JSON.parse(rawOutput);
    } catch (e) {
      console.error(`${LOG} Failed to parse JSON from OpenAI:`, rawOutput);
      return NextResponse.json({ error: "Failed to parse AI output." }, { status: 500 });
    }

    console.log(`${LOG} Extraction successful:`, Object.keys(extractedData));
    console.log(`${LOG} Raw AI Output:`, JSON.stringify(extractedData, null, 2));

    // Save back to doc
    if (!doc.sections) {
      doc.sections = new Map();
    }

    const dynamicSection = doc.sections.get("dynamic_extraction") || { fields: {}, fieldSources: {}, completionPct: 100 };
    
    // Merge new extracted data with any existing dynamic data
    const updatedFields = { ...dynamicSection.fields };
    const updatedSources = { ...dynamicSection.fieldSources };
    for (const [k, obj] of Object.entries(extractedData)) {
       if (obj !== undefined && obj !== null && obj !== "") {
          // If OpenAI followed the prompt and returned { value, source }
          if (typeof obj === 'object' && !Array.isArray(obj) && 'value' in obj) {
             const val = (obj as any).value;
             const src = (obj as any).source;
             
             if (val !== undefined && val !== null && val !== "") {
                if (Array.isArray(val) && val.length === 0) continue;
                updatedFields[k] = val;
                if (src) updatedSources[k] = src;
             }
          } 
          // Fallback: If OpenAI ignored the prompt and returned a raw string/array
          else {
             if (Array.isArray(obj) && obj.length === 0) continue;
             updatedFields[k] = obj;
             // No source available because AI didn't provide it
          }
       }
    }
    
    doc.sections.set("dynamic_extraction", {
       fields: updatedFields,
       fieldSources: updatedSources,
       completionPct: 100
    });
    
    // Force Mongoose to save the Map with Mixed types properly
    doc.markModified("sections");
    await doc.save();

    console.log(`${LOG} Saved to doc.sections.dynamic_extraction`);

    return NextResponse.json({ success: true, extractedKeys: Object.keys(extractedData) }, { status: 200 });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(`${LOG} failed:`, error);
    return NextResponse.json(
      { error: "Dynamic extraction failed: " + (error instanceof Error ? error.message : "Unknown") },
      { status: 500 }
    );
  }
}
