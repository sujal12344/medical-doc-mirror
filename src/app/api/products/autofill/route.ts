import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { OpenAI } from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pc = new Pinecone({ apiKey: process.env.PINECONE_KEY! });

// Uses PINECONE_INDEX (medical-docs) — consistent with hybridQuery.ts
// Namespace is per-user: company_{userId} so classification engine can reuse these vectors
const INDEX_NAME = process.env.PINECONE_INDEX!;
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

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = token.sub;

    const { documentText } = await req.json();
    if (!documentText?.trim()) return NextResponse.json({ error: "No document text provided" }, { status: 400 });

    // ── 1. Chunk ──────────────────────────────────────────────────────────────
    const chunks = chunkText(documentText);
    const textPreview = documentText.slice(0, 200).replace(/\n/g, " ");
    console.log(`[autofill] ${chunks.length} chunks from ${documentText.length} chars`);
    console.log(`[autofill] Text preview: "${textPreview}"`);


    // Namespace is per-company — matches hybridQuery.ts so classification engine reuses these vectors
    const NAMESPACE = `company_${userId}`;
    const index = pc.index(INDEX_NAME).namespace(NAMESPACE);
    const docId = `autofill_${userId}_${Date.now()}`;

    for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
      const batch = chunks.slice(i, i + EMBED_BATCH);
      const embeddings = await embedBatch(batch);
      const vectors = batch.map((text, j) => ({
        id: `${docId}_chunk_${i + j}`,
        values: embeddings[j],
        metadata: { text, userId, purpose: "autofill", docId },
      }));
      await index.upsert({ records: vectors });
    }
    console.log(`[autofill] Upserted ${chunks.length} vectors to namespace '${NAMESPACE}'`);

    // ── 3. Five targeted RAG queries ─────────────────────────────────────────
    const queries = [
      "product name trade name manufacturer company name brand",
      "intended use intended purpose patient population anatomical site clinical indication",
      "sterile active invasive software drug combination IVD in-vitro diagnostic classification class",
      "surgical implant body orifice contact duration invasive CNS cardiac life support radiation drug delivery absorbed tissue",
      "blood donor screening HIV hepatitis HBsAg HCV HTLV malaria syphilis CMV blood grouping ABO Rh self-test near-patient point of care genetic testing drug monitoring tumour marker cancer HLA fertility prenatal",
    ];

    const QUERY_LABELS = ["Identity (name/manufacturer)", "Intended Use / Patient Pop", "Classification characteristics", "Invasion / Risk flags", "IVD Part II context"];

    const queryEmbeds = await embedBatch(queries);
    const contexts: string[] = [];

    console.log(`\n${"─".repeat(60)}`);
    console.log(`[autofill] ── RAG RETRIEVAL ──`);
    console.log(`[autofill] Namespace: ${NAMESPACE} | DocId: ${docId}`);

    const MIN_SCORE = 0.10; // docId filter already isolates current doc — low threshold just drops empty/null vectors

    for (let i = 0; i < queries.length; i++) {
      const result = await index.query({
        vector: queryEmbeds[i],
        topK: 5,
        includeMetadata: true,
        filter: { userId, purpose: "autofill", docId },
      });

      console.log(`\n[autofill] Query ${i + 1}: "${QUERY_LABELS[i]}"`);
      console.log(`[autofill]   Matches: ${result.matches.length}`);

      result.matches.forEach((m, idx) => {
        const preview = String(m.metadata?.text ?? "").slice(0, 120).replace(/\n/g, " ");
        const quality = (m.score ?? 0) >= MIN_SCORE ? "✓" : "✗ LOW";
        console.log(`[autofill]   [${idx + 1}] score=${m.score?.toFixed(4)} ${quality} | "${preview}…"`);
      });

      const goodMatches = result.matches.filter((m) => (m.score ?? 0) >= MIN_SCORE);
      console.log(`[autofill]   Using ${goodMatches.length}/${result.matches.length} matches above score threshold`);

      const text = goodMatches.map((m) => m.metadata?.text ?? "").join("\n\n");
      contexts.push(text);
    }


    // ── 4. GPT extraction ─────────────────────────────────────────────────────
    const contextBlock = contexts
      .map((c, i) => `[Context ${i + 1} — ${QUERY_LABELS[i]}]\n${c}`)
      .join("\n\n---\n\n");

    console.log(`\n[autofill] ── GPT EXTRACTION ──`);
    console.log(`[autofill] Context block length: ${contextBlock.length} chars`);
    console.log(`[autofill] Calling ${process.env.OPENAI_MODEL || "gpt-4o-mini"}…`);

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a senior medical device regulatory affairs expert specialising in India MDR 2017 and CDSCO classification rules.
Extract product registration fields from the provided IFU / brochure document excerpts.
Return ONLY valid raw JSON with exactly these keys (use empty string or false if not found):
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
    console.log(`[autofill]   chunksIndexed      : ${chunks.length}`);
    console.log(`${"─".repeat(60)}\n`);

    return NextResponse.json({ ...parsed, chunksIndexed: chunks.length });

  } catch (error: any) {
    console.error("[autofill] RAG error:", error);
    return NextResponse.json({ error: error.message || "Autofill failed" }, { status: 500 });
  }
}
