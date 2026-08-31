import { NextResponse } from "next/server";
import OpenAI from "openai";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { Product } from "@/models/Product";
import { requireAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { FRAMEWORKS } from "@/lib/frameworks";
import { queryProductDocuments } from "@/lib/productVectorIndex";

const SECTION1_PMF_PROMPT = `
Your task is to generate ONLY Section 1 – General Information of the Plant Master File (PMF).

Use ALL information available in the uploaded documents.

----------------------------------------
IMPORTANT RULES
----------------------------------------

1. NEVER invent information.
2. Every statement must be supported by the uploaded documents.
3. If information cannot be found, write exactly:
"Not Available"
Do NOT guess.
4. If multiple documents contain conflicting information, use the latest approved document.
5. Write professionally in CDSCO PMF language.
6. Do NOT mention document names.
7. Use complete paragraphs wherever appropriate.
8. Preserve official names exactly as written.
9. Use SI units where applicable.
10. If a flow diagram exists, summarize it in text.

----------------------------------------
GENERATE THE FOLLOWING FIELDS
----------------------------------------
### 1.2 Nature of Manufacturing Activities
Describe:
• Manufacturing activities performed
• Products manufactured
• Contract manufacturing (if applicable)
• Assembly
• Packaging
• Labelling
• Sterilization (if applicable)

### 1.3 Product Categories
List all categories manufactured, for example:
• Rapid Tests
• ELISA
• CLIA
• Molecular Diagnostics
• Biochemistry
• Hematology
• Controls
• Calibrators
• Accessories
Include intended application if mentioned.

### 1.4 Regulatory Status
Extract:
• Manufacturing Licence
• ISO 13485 certification
• CE certification
• CDSCO approvals
• Export registrations
• International approvals
For each approval provide:
• Authority
• Certificate number
• Issue date
• Expiry date
• Scope

### 1.5 Company Background
Generate a concise company profile including:
• Year established
• Company history
• Core business
• Manufacturing capabilities
• Areas of specialization
• Market presence
Use only documented information.

### 1.6 Manufacturing Site Information
Extract:
• Total site area
• Built-up area
• Production area
• Warehouse area
• Laboratory area
• Utilities area
• Number of employees
• Number of production shifts
• Operating hours

### 1.7 Organizational Overview
Describe:
• Parent company (if applicable)
• Subsidiaries
• Contract manufacturers
• Major departments
• Organizational structure

### 1.8 Manufacturing Process Overview
Summarize the manufacturing workflow from:
Raw Material Receipt -> Incoming Inspection -> Storage -> Production -> In-Process QC -> Packaging -> Finished Goods Testing -> QA Release -> Storage -> Dispatch.
If a different workflow exists, summarize that instead.

### 1.9 Site Layout Summary
Describe:
• Production blocks
• Warehouses
• QC laboratories
• Administrative offices
• Utility rooms
• Material movement
• Personnel movement
If layout drawings exist, summarize them.

----------------------------------------
OUTPUT FORMAT
----------------------------------------
Return ONLY valid JSON.
Example:
{
  "manufacturerDetails": "...",
  "manufacturingActivities": "...",
  "productCategories": "...",
  "regulatoryStatus": [
    {
      "authority": "",
      "certificateNumber": "",
      "issueDate": "",
      "expiryDate": "",
      "scope": ""
    }
  ],
  "companyBackground": "...",
  "siteInformation": "...",
  "organizationalOverview": "...",
  "manufacturingProcessOverview": "...",
  "siteLayoutSummary": "..."
}

Return no Markdown.
Return no explanations.
Return no comments.
Return only the JSON object.
`;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await connectToDatabase();

    if (!env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
    }

    const doc = await RegulatoryDocument.findOne({
      _id: id,
      userId: (user as Record<string, unknown>)._id,
    });
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    const product = await Product.findById((doc.contextPayload?.productId || doc.contextPayload?.productIds?.[0])).lean();
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const fw = FRAMEWORKS.find((f) => f.id === doc.frameworkId);
    if (!fw) return NextResponse.json({ error: "Framework not found" }, { status: 404 });

    // Build context from uploaded product docs
    const uploadedDocs = (
      (product as Record<string, unknown>).uploadedDocs as {
        originalName: string;
        extractedText: string;
      }[]
    ) || [];

    const uploadedText = uploadedDocs
      .map((d) => `--- ${d.originalName} ---\n${d.extractedText}`)
      .join("\n\n");

    const productNamespaceId =
      (product as Record<string, unknown>).vectorNamespaceId as string ||
      String((product as Record<string, unknown>)._id);
    const userId = String((user as Record<string, unknown>)._id);

    let vectorContext = "";
    try {
      const query = `manufacturer details site address manufacturing activities product categories regulatory status ISO 13485 Manufacturing Licence company background history total site area built-up area production area number of employees organizational structure layout flow diagram`;
      vectorContext = await queryProductDocuments(userId, productNamespaceId, query, 25);
    } catch (e) {
      console.warn("[section1-pmf] Pinecone query failed:", e);
    }

    const contextParts: string[] = [];
    if (vectorContext.trim()) {
      contextParts.push(`--- Pinecone RAG Context ---\n${vectorContext}`);
    }
    if (uploadedText.trim()) {
      contextParts.push(`--- Uploaded Document Content ---\n${uploadedText.slice(0, 70_000)}`);
    }
    contextParts.push(`Product Name: ${(product as Record<string, unknown>).name || "N/A"}\nManufacturer: ${(product as Record<string, unknown>).manufacturer || "N/A"}\nDescription: ${(product as Record<string, unknown>).description || "N/A"}`);

    const sourceContext = contextParts.join("\n\n");

    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a Regulatory Affairs specialist with expertise in CDSCO Plant Master File (PMF) requirements. Generate professional, compliant, and detailed Section 1 JSON details. Follow all instructions and return ONLY a valid JSON object.",
        },
        {
          role: "user",
          content: `${SECTION1_PMF_PROMPT}\n\nSOURCE CONTEXT:\n${sourceContext}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.15,
    });

    const rawJson = completion.choices[0]?.message?.content?.trim() || "{}";
    let generatedData: Record<string, any> = {};
    try {
      generatedData = JSON.parse(rawJson);
    } catch {
      console.error("[section1-pmf] JSON parse failed:", rawJson.slice(0, 300));
      return NextResponse.json(
        { error: "AI did not return valid JSON", raw: rawJson },
        { status: 500 }
      );
    }

    // Now let's save to the document's section s1.
    if (!doc.sections) doc.sections = new Map();

    // Mapping generated fields back into the s1 fields:
    // 1.1: Site Name -> Legal name of manufacturer and Manufacturing site name.
    // 1.2: Site Address -> Registered office address, manufacturing address, contact details, email, website, telephone, fax, site information (area, shifts, employees).
    // 1.3: Relationship with Other Sites -> Organizational structure, parent company, subsidiaries.
    // 1.4: Brief History of Company -> Company history, year established, core business, market presence.
    // 1.5: Manufacturing Activities -> Manufacturing activities performed, contract manufacturing, packaging, labelling.
    // 1.6: Manufacturing Flow -> Process workflow summary.
    // 1.7: Product Categories -> Product categories.
    // 1.8: Flow Diagram -> Site Layout Summary / Flow diagram description.

    // Format regulatoryStatus beautifully
    const regStatusList = Array.isArray(generatedData.regulatoryStatus)
      ? generatedData.regulatoryStatus
      : [];
    let formattedRegStatus = "";
    if (regStatusList.length > 0) {
      formattedRegStatus = "\n\n### Regulatory Status / Approvals\n\n" +
        regStatusList.map((r: any) => {
          return `* **Authority**: ${r.authority || "Not Available"}\n  * **Certificate No**: ${r.certificateNumber || "Not Available"}\n  * **Issue Date**: ${r.issueDate || "Not Available"}\n  * **Expiry Date**: ${r.expiryDate || "Not Available"}\n  * **Scope**: ${r.scope || "Not Available"}`;
        }).join("\n\n");
    }

    const fieldValues: Record<string, string> = {
      "1.2": String(generatedData.manufacturerDetails || "") + (generatedData.siteInformation ? `\n\n### Site Information\n${generatedData.siteInformation}` : "") + formattedRegStatus,
      "1.3": String(generatedData.organizationalOverview || ""),
      "1.4": String(generatedData.companyBackground || ""),
      "1.5": String(generatedData.manufacturingActivities || ""),
      "1.6": String(generatedData.manufacturingProcessOverview || ""),
      "1.7": String(generatedData.productCategories || ""),
      "1.8": String(generatedData.siteLayoutSummary || ""),
    };

    const sectionId = "s1";
    const sectionData = doc.sections.get(sectionId) || { fields: {}, completionPct: 0 };
    sectionData.fields = {
      ...sectionData.fields,
      ...fieldValues,
    };

    const secObj = fw.sections.find((s) => s.id === sectionId);
    if (secObj) {
      const total = secObj.fields.length;
      const filled = secObj.fields.filter((f) =>
        String(sectionData.fields[f.id] || "").trim()
      ).length;
      sectionData.completionPct = Math.round((filled / total) * 100);
    }
    doc.sections.set(sectionId, sectionData);

    doc.markModified("sections");
    await doc.save();

    return NextResponse.json({
      success: true,
      results: generatedData,
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("POST section1-pmf failed:", error);
    return NextResponse.json(
      { error: "Generation failed: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}
