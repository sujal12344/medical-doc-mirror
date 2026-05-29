import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { OpenAI } from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pc = new Pinecone({ apiKey: process.env.PINECONE_KEY! });

const INDEX_NAME = process.env.PINECONE_INDEX!;
const MIN_SCORE = 0.1;
const CHUNK_SIZE = 1500;
const CHUNK_OVERLAP = 200;
const EMBED_BATCH = 32;

function chunkText(text: string): string[] {
  const clean = text.replace(/\n+/g, "\n").replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    let end = i + CHUNK_SIZE;
    if (end < clean.length) {
      const next = clean.indexOf(" ", end);
      if (next !== -1 && next - end < 50) end = next;
    }
    chunks.push(clean.substring(i, end).trim());
    i = end - CHUNK_OVERLAP;
  }
  return chunks;
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const res = await openai.embeddings.create({
    model: process.env.PINECONE_EMBED_MODEL || "text-embedding-3-small",
    input: texts,
  });
  return res.data.map((d) => d.embedding);
}

function normalizeNamespaceProductId(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  const safe = trimmed.replace(/[^a-zA-Z0-9_-]/g, "");
  return safe || null;
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = token.sub;

    const body = await req.json();
    const documentText = body.documentText as string;
    const suppliedNamespaceProductId = normalizeNamespaceProductId(body.productNamespaceId);

    if (!documentText?.trim()) return NextResponse.json({ error: "No document text provided" }, { status: 400 });

    return await runProductAutofill(userId, documentText, suppliedNamespaceProductId);
  } catch (error: unknown) {
    console.error("[autofill] RAG error:", error);
    const message = error instanceof Error ? error.message : "Autofill failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function upsertChunks(
  userId: string,
  namespace: string,
  productNamespaceId: string,
  purpose: string,
  docId: string,
  chunks: string[],
) {
  const index = pc.index(INDEX_NAME).namespace(namespace);
  for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
    const batch = chunks.slice(i, i + EMBED_BATCH);
    const embeddings = await embedBatch(batch);
    const vectors = batch.map((text, j) => ({
      id: `${docId}_chunk_${i + j}`,
      values: embeddings[j],
      metadata: { text, userId, productNamespaceId, purpose, docId },
    }));
    await index.upsert({ records: vectors });
  }
  console.log(`[autofill] Upserted ${chunks.length} vectors to namespace '${namespace}'`);
  return index;
}

async function retrieveContexts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  index: any,
  queries: string[],
  labels: string[],
  userId: string,
  productNamespaceId: string,
  purpose: string,
  docId: string,
) {
  const queryEmbeds = await embedBatch(queries);
  const contexts: string[] = [];

  console.log(`\n${"─".repeat(60)}`);
  console.log(`[autofill] ── RAG RETRIEVAL ──`);
  console.log(`[autofill] Purpose: ${purpose} | DocId: ${docId}`);

  for (let i = 0; i < queries.length; i++) {
    const result = await index.query({
      vector: queryEmbeds[i],
      topK: 5,
      includeMetadata: true,
      filter: { userId, productNamespaceId, purpose, docId },
    });

    console.log(`\n[autofill] Query ${i + 1}: "${labels[i]}"`);
    for (const [idx, m] of result.matches.entries()) {
      const preview = String(m.metadata?.text ?? "").slice(0, 120).replace(/\n/g, " ");
      const quality = (m.score ?? 0) >= MIN_SCORE ? "✓" : "✗ LOW";
      console.log(`[autofill]   [${idx + 1}] score=${m.score?.toFixed(4)} ${quality} | "${preview}…"`);
    }

    const goodMatches = result.matches.filter((m: { score?: number }) => (m.score ?? 0) >= MIN_SCORE);
    contexts.push(goodMatches.map((m: { metadata?: { text?: string } }) => m.metadata?.text ?? "").join("\n\n"));
  }
  return contexts;
}

/** Ensure at least 4 distinct description options for the registration UI */
function buildDescriptionSuggestions(
  primary: string,
  fromModel: unknown,
  extraSources: string[],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  const push = (s: string) => {
    const t = s.replace(/\s+/g, " ").trim();
    if (t.length < 24) return;
    const key = t.toLowerCase().slice(0, 80);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(t);
  };

  if (Array.isArray(fromModel)) {
    for (const item of fromModel) {
      if (typeof item === "string") push(item);
    }
  }

  if (primary?.trim()) push(primary.trim());

  for (const source of extraSources) {
    if (!source?.trim()) continue;
    const sentences = source
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.replace(/\s+/g, " ").trim())
      .filter((s) => s.length >= 40 && s.length <= 420);
    for (const s of sentences) {
      push(s);
      if (out.length >= 8) break;
    }
    if (out.length >= 8) break;
  }

  return out.slice(0, 6);
}

async function runProductAutofill(userId: string, documentText: string, suppliedNamespaceProductId: string | null) {
  const chunks = chunkText(documentText);
  console.log(`[autofill:product] ${chunks.length} chunks from ${documentText.length} chars`);

  // Option B: strict product-level namespace product_${userId}_${productNamespaceId}
  // Before DB product exists we use a generated temporary productNamespaceId and return it to client.
  const productNamespaceId = suppliedNamespaceProductId ?? `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const namespace = `product_${userId}_${productNamespaceId}`;
  const docId = `${productNamespaceId}_${Date.now()}`;
  const index = await upsertChunks(userId, namespace, productNamespaceId, "autofill", docId, chunks);

  const queries = [
      "product name trade name manufacturer company name brand",
      "intended use intended purpose patient population anatomical site clinical indication",
      "sterile active invasive software drug combination IVD in-vitro diagnostic classification class",
      "surgical implant body orifice contact duration invasive CNS cardiac life support radiation drug delivery absorbed tissue",
      "blood donor screening HIV hepatitis HBsAg HCV HTLV malaria syphilis CMV blood grouping ABO Rh self-test near-patient point of care genetic testing drug monitoring tumour marker cancer HLA fertility prenatal",
      "device description product summary principle technology method reagent kit composition mechanism analytical colorimetric enzymatic",
    ];

  const QUERY_LABELS = [
    "Identity (name/manufacturer)",
    "Intended Use / Patient Pop",
    "Classification characteristics",
    "Invasion / Risk flags",
    "IVD Part II context",
    "Device description",
  ];
  const contexts = await retrieveContexts(index, queries, QUERY_LABELS, userId, productNamespaceId, "autofill", docId);

  const ragBlock = contexts
    .map((c, i) => `[Context ${i + 1} — ${QUERY_LABELS[i]}]\n${c}`)
    .join("\n\n---\n\n");

  // With 1–3 chunks, every RAG query returns the same snippet — always include full doc for intendedUse/description
  const injectFullDoc = chunks.length <= 3 || documentText.length < 8000;
  const contextBlock = injectFullDoc
    ? `[Full document — use for intendedUse, description, patientPopulation]\n${documentText.trim()}\n\n---\n\n[Retrieved excerpts]\n${ragBlock}`
    : ragBlock;

  console.log(`\n[autofill:product] ── GPT EXTRACTION ──`);
    console.log(
      `[autofill] Context block length: ${contextBlock.length} chars` +
        (injectFullDoc ? ` (full doc ${documentText.length} chars + RAG)` : ""),
    );
    console.log(`[autofill] Calling ${process.env.OPENAI_MODEL || "gpt-4o-mini"}…`);

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a senior medical device regulatory affairs expert specialising in India MDR 2017 and CDSCO classification rules.
Extract product registration fields from the provided IFU / brochure document excerpts.
You MUST populate "intendedUse" and "description" when any indication, purpose, principle, or product summary appears in the document.
intendedUse = clinical/indication statement (what the test detects, specimen, setting).
description = your single best technical summary (kit type, method e.g. ELISA/CLIA/colorimetric, analyte).
descriptionSuggestions = REQUIRED array of at least 4 distinct one- to three-sentence device descriptions from the document, each a complete regulatory-style statement. Use different angles when the document allows:
  (1) Analytical method — principle, reagent, measurement conditions (e.g. colorimetric at stated pH)
  (2) Product form — kit type, components, specimen/material
  (3) Technology & purpose — what is measured and how at a high level
  (4) CDSCO DMF section 1.1b style — formal device description for master file
Do not repeat the same wording across suggestions. Set "description" to the best single option (usually matches suggestion 1).
Return ONLY valid raw JSON with exactly these keys (use empty string or false if not found):
{
  "name": string,
  "manufacturer": string,
  "description": string,
  "descriptionSuggestions": string[],
  "intendedUse": string,
  "patientPopulation": string,
  "deviceClass": "A" | "B" | "C" | "D" | "",
  "deviceType": "ivd" | "medical-device" | "",
  "isSterile": boolean,
  "hasSoftware": boolean,
  "isActive": boolean,
  "activeType": "therapeutic" | "diagnostic" | "other" | "",
  "isInvasive": boolean,
  "invasionType": "non-invasive" | "body-orifice" | "surgically-invasive" | "",
  "contactDuration": "transient" | "short-term" | "long-term" | "",
  "directCNSContact": boolean,
  "directHeartContact": boolean,
  "lifeSupporting": boolean,
  "isImplantable": boolean,
  "ionizingRadiation": boolean,
  "isDrugDeviceCombo": boolean,
  "containsAnimalTissue": boolean,
  "isContraceptive": boolean,
  "absorbed": boolean,
  "reusableSurgicalInstrument": boolean,
  "oralCavityOrEarOrNasal": boolean,
  "mucousMembraneAbsorption": boolean,
  "drugAdministration": boolean,
  "ivdSelfTest": boolean,
  "ivdNearPatient": boolean,
  "ivdBloodDonorScreening": boolean,
  "ivdBloodGrouping": boolean,
  "ivdForKnownCondition": boolean,
  "ivdTargetsHIV": boolean,
  "ivdTargetsHBV": boolean,
  "ivdTargetsHCV": boolean,
  "ivdTargetsHTLV": boolean,
  "ivdTargetsMalaria": boolean,
  "ivdTargetsSyphilis": boolean,
  "ivdTargetsCMV": boolean,
  "ivdTargetsSTI": boolean,
  "ivdGeneticTesting": boolean,
  "ivdDrugMonitoring": boolean,
  "ivdHLATyping": boolean,
  "ivdCongenitalScreening": boolean,
  "ivdCancerMarkers": boolean,
  "ivdFertility": boolean
}

REGULATORY DEFINITIONS — apply these precisely:

isActive (MDR 2017 / CDSCO definition):
  TRUE only if the device's primary medical function depends on electrical energy, software, battery,
  electronic circuitry, electromechanical operation, or an external power source.
  Examples: ECG machine, ventilator, infusion pump, pulse oximeter, analyser hardware, powered surgical tool.
  FALSE for: reagent kits, test strips, IVD reagents, assay kits, colorimetric tests, enzyme-linked assays,
  lateral flow tests, biochemical/antibody-antigen reactions, chemical binding.
  RULE: Do NOT set isActive=true because of words like reagent, assay, enzyme, colorimetric, binding, reaction.

activeType (only set if isActive=true):
  "therapeutic" — delivers energy to treat: ventilator, infusion pump, laser, TENS, electrosurgical unit.
  "diagnostic"  — gathers information: X-ray machine, ECG, ultrasound scanner, pulse oximeter, imaging device.
  "other"       — powered but neither therapeutic nor diagnostic: electric hospital bed, powered wheelchair.

isInvasive: TRUE only if device enters the body (surgically or through a body orifice).
  FALSE for external diagnostics, reagents, skin-contact-only devices.

invasionType (only set if isInvasive=true):
  "non-invasive"        — stays on intact or injured skin, does not enter the body.
  "body-orifice"        — enters through natural opening: mouth, ear, nose, urethra, vagina, rectum.
  "surgically-invasive" — penetrates body surface via incision, puncture, or trocar site.
  Set "non-invasive" only if device explicitly contacts intact skin and never penetrates.

contactDuration (only set if invasionType is body-orifice or surgically-invasive):
  "transient"  — less than 60 minutes continuous use.
  "short-term" — 60 minutes to 30 days continuous use.
  "long-term"  — more than 30 days continuous use.

isSterile: TRUE if document says supplied sterile / aseptic / sterile packaging / single use sterile.
directCNSContact: TRUE if device touches brain, spinal cord, or CSF.
directHeartContact: TRUE if device touches heart, aorta, or central blood vessels.
lifeSupporting: TRUE if patient survival depends on the device functioning.
isImplantable: TRUE if device is intended to remain inside the body after the procedure.
ionizingRadiation: TRUE if device emits X-ray, gamma, beta, or alpha radiation.
isDrugDeviceCombo: TRUE if a medicinal product is an integral part of the device.
containsAnimalTissue: TRUE if device contains non-viable animal or human cells, tissue, or derivatives.
isContraceptive: TRUE if device is intended for contraception or STD prevention.
absorbed: TRUE if device is wholly or mainly absorbed by the body during or after use.
reusableSurgicalInstrument: TRUE if device is a reusable, non-implanted instrument for use in surgery.
oralCavityOrEarOrNasal: TRUE if device is used ONLY in the mouth, ear canal, or nasal cavity (not deeper).
mucousMembraneAbsorption: TRUE if device or its coating is absorbed by mucous membrane.
drugAdministration: TRUE if delivering a medicinal product is a primary function of the device.
hasSoftware: TRUE if device includes embedded firmware, mobile app, or onboard algorithm as part of medical function.

deviceType: "ivd" for in-vitro diagnostics (tests samples outside body). "medical-device" for all others.

deviceClass (India MDR 2017 First Schedule — only assign if you can cite a specific rule):
  Leave empty if insufficient information.
  FOR IVDs (Part II): Class A (Rule 2(v)) = specific-purpose reagent/kit. Class B (Rule 2(vi)) = performance evaluation substance only.
  Class C = blood grouping, HLA, certain infection markers. Class D = HIV/HBV/HCV blood donor screening.
  IMPORTANT: A colorimetric/enzymatic/turbidimetric reagent kit for a specific analyte is almost always Class A (Rule 2(v)).

patientPopulation: who the device is intended for (e.g. "adults", "neonates", "human serum samples").

IVD PART II FIELDS (First Schedule Part II, MDR 2017 — only set for deviceType="ivd", false for medical-device):
  ivdBloodDonorScreening: TRUE if used to screen donated blood/plasma/cells before transfusion.
  ivdBloodGrouping: TRUE if for ABO, Rh, Kell, Kidd, Duffy, Lewis, MNS typing or antibody screening.
  ivdSelfTest: TRUE if intended for lay users to perform and interpret without professional assistance.
  ivdNearPatient: TRUE if for use outside a central lab (GP surgery, bedside, clinic, pharmacy, POC).
  ivdForKnownCondition: TRUE if self-test/near-patient test monitors a pre-existing diagnosis (e.g. blood glucose for diabetic, INR for warfarin). Lowers class from C to B.
  ivdTargetsHIV: TRUE if detects HIV 1, HIV 2, anti-HIV, p24 antigen, or HIV NAT.
  ivdTargetsHBV: TRUE if detects HBsAg, anti-HBc, hepatitis B surface antigen or antibody.
  ivdTargetsHCV: TRUE if detects HCV antibody, antigen, or NAT.
  ivdTargetsHTLV: TRUE if detects HTLV I or HTLV II.
  ivdTargetsMalaria: TRUE if detects Plasmodium for blood donation screening.
  ivdTargetsSyphilis: TRUE if detects Treponema pallidum, RPR, VDRL, TPPA, or syphilis serology.
  ivdTargetsCMV: TRUE if detects cytomegalovirus IgG/IgM for blood donor screening.
  ivdTargetsSTI: TRUE if detects Chlamydia, gonorrhoea, HSV, Trichomonas, or other STI markers.
  ivdGeneticTesting: TRUE if detects heritable genetic mutations or chromosomal disorders.
  ivdCongenitalScreening: TRUE if for prenatal/neonatal screening (Down syndrome, NTD, trisomies, PKU).
  ivdHLATyping: TRUE if for HLA tissue typing for transplantation matching.
  ivdDrugMonitoring: TRUE if for therapeutic drug monitoring (anticoagulants, immunosuppressants, antibiotics).
  ivdCancerMarkers: TRUE if for tumour markers (PSA, CA-125, AFP, CEA, HER2, CA 19-9, etc.).
  ivdFertility: TRUE if for fertility, ovulation, or pregnancy hormones (hCG, LH, FSH, progesterone).`,
        },


        {
          role: "user",
          content: `Extract product registration fields from these document excerpts:\n\n${contextBlock}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const parsed = JSON.parse(completion.choices[0].message.content || "{}");

    const descriptionContext = contexts[QUERY_LABELS.length - 1] ?? "";
    const descriptionSuggestions = buildDescriptionSuggestions(
      typeof parsed.description === "string" ? parsed.description : "",
      parsed.descriptionSuggestions,
      [descriptionContext, documentText],
    );
    parsed.descriptionSuggestions = descriptionSuggestions;
    if (!parsed.description?.trim() && descriptionSuggestions[0]) {
      parsed.description = descriptionSuggestions[0];
    }

    console.log(`\n[autofill] ── EXTRACTED FIELDS ──`);
    console.log(`[autofill]   name              : ${parsed.name || "(not found)"}`);
    console.log(`[autofill]   manufacturer      : ${parsed.manufacturer || "(not found)"}`);
    console.log(`[autofill]   deviceType        : ${parsed.deviceType || "(not found)"}`);
    console.log(`[autofill]   deviceClass        : ${parsed.deviceClass || "(not found)"}`);
    console.log(`[autofill]   patientPopulation  : ${parsed.patientPopulation || "(not found)"}`);
    console.log(`[autofill]   --- Part I fields ---`);
    console.log(`[autofill]   isActive           : ${parsed.isActive}  activeType: ${parsed.activeType || "n/a"}`);
    console.log(`[autofill]   invasionType       : ${parsed.invasionType || "(not found)"}`);
    console.log(`[autofill]   contactDuration    : ${parsed.contactDuration || "(not found)"}`);
    console.log(`[autofill]   isImplantable      : ${parsed.isImplantable}`);
    console.log(`[autofill]   isDrugDeviceCombo  : ${parsed.isDrugDeviceCombo}`);
    console.log(`[autofill]   directCNSContact   : ${parsed.directCNSContact}`);
    console.log(`[autofill]   directHeartContact : ${parsed.directHeartContact}`);
    console.log(`[autofill]   lifeSupporting     : ${parsed.lifeSupporting}`);
    console.log(`[autofill]   ionizingRadiation  : ${parsed.ionizingRadiation}`);
    console.log(`[autofill]   containsAnimalTissue: ${parsed.containsAnimalTissue}`);
    console.log(`[autofill]   isContraceptive    : ${parsed.isContraceptive}`);
    console.log(`[autofill]   absorbed           : ${parsed.absorbed}`);
    console.log(`[autofill]   drugAdministration : ${parsed.drugAdministration}`);
    console.log(`[autofill]   isSterile          : ${parsed.isSterile}`);
    console.log(`[autofill]   hasSoftware        : ${parsed.hasSoftware}`);
    console.log(`[autofill]   --- IVD Part II fields ---`);
    console.log(`[autofill]   ivdBloodDonorScreen: ${parsed.ivdBloodDonorScreening}`);
    console.log(`[autofill]   ivdBloodGrouping   : ${parsed.ivdBloodGrouping}`);
    console.log(`[autofill]   ivdSelfTest        : ${parsed.ivdSelfTest}`);
    console.log(`[autofill]   ivdNearPatient     : ${parsed.ivdNearPatient}`);
    console.log(`[autofill]   ivdForKnownCond    : ${parsed.ivdForKnownCondition}`);
    console.log(`[autofill]   ivdTargets HIV/HBV/HCV/HTLV/Malaria: ${parsed.ivdTargetsHIV}/${parsed.ivdTargetsHBV}/${parsed.ivdTargetsHCV}/${parsed.ivdTargetsHTLV}/${parsed.ivdTargetsMalaria}`);
    console.log(`[autofill]   ivdTargets Syph/CMV/STI/Fertility  : ${parsed.ivdTargetsSyphilis}/${parsed.ivdTargetsCMV}/${parsed.ivdTargetsSTI}/${parsed.ivdFertility}`);
    console.log(`[autofill]   ivdSpecial Genetic/Prenatal/HLA    : ${parsed.ivdGeneticTesting}/${parsed.ivdCongenitalScreening}/${parsed.ivdHLATyping}`);
    console.log(`[autofill]   ivdSpecial Drug/Cancer             : ${parsed.ivdDrugMonitoring}/${parsed.ivdCancerMarkers}`);
    console.log(`[autofill]   intendedUse        : ${(parsed.intendedUse || "(not found)").slice(0, 100)}…`);
    console.log(`[autofill]   description        : ${(parsed.description || "(not found)").slice(0, 100)}…`);
    console.log(`[autofill]   descriptionSuggestions: ${descriptionSuggestions.length} option(s)`);
    descriptionSuggestions.slice(0, 4).forEach((s: string, i: number) => {
      console.log(`[autofill]     [${i + 1}] ${s.slice(0, 90)}…`);
    });
  console.log(`[autofill:product]   chunksIndexed: ${chunks.length}`);
  console.log(`${"─".repeat(60)}\n`);

  return NextResponse.json({ ...parsed, chunksIndexed: chunks.length, productNamespaceId, namespace });
}
