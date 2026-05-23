import { OpenAI } from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

export type ClassificationOutput = {
  genericName: string;
  isInvasive: boolean;
  invasionType: 'body-orifice' | 'surgically-invasive' | 'na';
  isActive: boolean;
  isSterile: boolean;
  isImplantable: boolean;
  isIVD: boolean;
  contactDuration: 'transient' | 'short-term' | 'long-term' | 'na';
  isDrugDeviceCombo: boolean;
  containsAnimalTissue: boolean;
  isContraceptive: boolean;
  directCNSContact: boolean;
  directHeartContact: boolean;
  lifeSupporting: boolean;
  ionizingRadiation: boolean;
  confirmedClass: 'A' | 'B' | 'C' | 'D' | '';
  appliedRule: string;
  classificationRationale: string;
  confidence: 'high' | 'medium' | 'low';
  aiWarnings: string[];
};

export async function runHybridClassification(input: {
  companyId: string;
  productId?: string;
  deviceDescription: string;
  existingProductData?: object;
}): Promise<ClassificationOutput> {
  const { companyId, productId, deviceDescription, existingProductData } = input;

  // Initialize clients
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const pc = new Pinecone({ apiKey: process.env.PINECONE_KEY! });
  const indexName = process.env.PINECONE_INDEX2!;
  const index = pc.index(indexName);

  try {
    // 1. Generate embedding of deviceDescription
    const embedRes = await openai.embeddings.create({
      model: process.env.PINECONE_EMBED_MODEL || "text-embedding-3-small",
      input: deviceDescription,
    });
    const queryVector = embedRes.data[0].embedding;

    // 2. Query product namespace (registration autofill uploads)
    let deviceContext = "";

    try {
      const productNs = index.namespace(`product_${companyId}`);
      const productMatches = await productNs.query({
        vector: queryVector,
        topK: 5,
        includeMetadata: true,
      });
      if (productMatches.matches.length > 0) {
        deviceContext =
          "Product document context:\n" +
          productMatches.matches.map((m) => m.metadata?.text || "").join("\n\n");
      }
    } catch (err) {
      console.warn("Could not fetch product namespace context, skipping.", err);
    }

    if (!deviceContext.trim()) {
      deviceContext = deviceDescription;
    } else {
      deviceContext = `User Description: ${deviceDescription}\n\n${deviceContext}`;
    }

    // 3. Query 2 — Knowledge namespace (MDR 2017 Rules)
    let rulesContext = "";
    try {
      const knowledgeNs = index.namespace("regulatory-knowledge-india");
      const knowledgeMatches = await knowledgeNs.query({
        vector: queryVector,
        topK: 10,
        includeMetadata: true,
      });

      if (knowledgeMatches.matches.length > 0) {
        rulesContext = knowledgeMatches.matches
          .map((m) => m.metadata?.text || "")
          .join("\n\n");
      }
    } catch (err) {
      console.warn("Could not fetch regulatory knowledge context, skipping.", err);
    }

    // 4. Call GPT-4o-mini
    const systemPrompt = `You are an expert in India Medical Devices Rules 2017 (MDR 2017).
Your job is to classify a medical device using the First Schedule classification rules provided.
Analyse the device information and apply the correct rule.
Return ONLY valid JSON matching this exact structure:
{
  "genericName": string,
  "isInvasive": boolean,
  "invasionType": "body-orifice" | "surgically-invasive" | "na",
  "isActive": boolean,
  "isSterile": boolean,
  "isImplantable": boolean,
  "isIVD": boolean,
  "contactDuration": "transient" | "short-term" | "long-term" | "na",
  "isDrugDeviceCombo": boolean,
  "containsAnimalTissue": boolean,
  "isContraceptive": boolean,
  "directCNSContact": boolean,
  "directHeartContact": boolean,
  "lifeSupporting": boolean,
  "ionizingRadiation": boolean,
  "confirmedClass": "A" | "B" | "C" | "D",
  "appliedRule": string,
  "classificationRationale": string,
  "confidence": "high" | "medium" | "low",
  "aiWarnings": string[]
}
For boolean fields you are unsure about, set to false and add a warning in aiWarnings array.
Do not wrap your response in markdown code blocks, just return raw JSON.`;

    const userPrompt = `DEVICE INFORMATION:
${deviceContext}

MDR 2017 FIRST SCHEDULE RULES:
${rulesContext || "Use your internal knowledge of India MDR 2017 Schedule III / First Schedule if context is empty."}

Existing product data (if any):
${existingProductData ? JSON.stringify(existingProductData, null, 2) : "None provided."}

Return JSON classification with all fields filled based on the rules provided.`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) throw new Error("Empty response from AI");

    const parsedOutput = JSON.parse(responseContent) as ClassificationOutput;
    
    // Ensure all base fields exist even if AI hallucinated slightly
    return {
      ...parsedOutput,
      aiWarnings: parsedOutput.aiWarnings || [],
    };

  } catch (error) {
    console.error("Hybrid Query Classification Error:", error);
    // Return a default safe fallback
    return {
      genericName: "Unknown",
      isInvasive: false,
      invasionType: 'na',
      isActive: false,
      isSterile: false,
      isImplantable: false,
      isIVD: false,
      contactDuration: 'na',
      isDrugDeviceCombo: false,
      containsAnimalTissue: false,
      isContraceptive: false,
      directCNSContact: false,
      directHeartContact: false,
      lifeSupporting: false,
      ionizingRadiation: false,
      confirmedClass: '',
      appliedRule: '',
      classificationRationale: '',
      confidence: 'low',
      aiWarnings: ['AI could not parse device. Manual input required.', String(error)]
    };
  }
}
