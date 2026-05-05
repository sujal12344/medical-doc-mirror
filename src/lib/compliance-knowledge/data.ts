import type { CountryCompliance } from "./types";

export const COMPLIANCE_DATA: CountryCompliance[] = [
  // ─── INDIA ───
  {
    countryCode: "IN", countryName: "India", flag: "🇮🇳", region: "Asia",
    overview: "India regulates medical devices under the Medical Device Rules 2017, administered by the Central Drugs Standard Control Organisation (CDSCO). Since April 2020, medical devices are regulated as drugs under the Drugs and Cosmetics Act 1940. IVD devices follow a risk-based classification (A–D). Import licenses require an Indian Authorized Representative and testing at CDSCO-approved labs.",
    regulatoryAuthority: { name: "Central Drugs Standard Control Organisation", abbreviation: "CDSCO", website: "https://cdsco.gov.in", description: "Under the Ministry of Health & Family Welfare, CDSCO is the national regulatory body responsible for approval of drugs, clinical trials, and medical devices in India." },
    classification: { system: "Risk-based 4-class system (A, B, C, D) aligned with GHTF principles",
      classes: [
        { name: "Class A", description: "Low risk — general controls only", examples: "Tongue depressors, bandages, surgical drapes" },
        { name: "Class B", description: "Low-moderate risk — special controls", examples: "Hypodermic needles, suction equipment, powered wheelchairs" },
        { name: "Class C", description: "Moderate-high risk — premarket evaluation", examples: "Ventilators, bone fixation plates, hemodialysis equipment" },
        { name: "Class D", description: "High risk — stringent premarket approval", examples: "Heart valves, implantable defibrillators, HIV test kits" },
      ],
    },
    keyLaws: [
      { name: "Drugs and Cosmetics Act, 1940", description: "Primary legislation governing drugs, cosmetics, and medical devices in India", year: "1940" },
      { name: "Medical Device Rules (MDR), 2017", description: "Specific rules for registration, import, manufacture, sale and distribution of medical devices", year: "2017" },
      { name: "IVDR Notification 2020", description: "Brought all IVD devices under regulatory purview with mandatory registration", year: "2020" },
      { name: "BIS Standards", description: "Bureau of Indian Standards — mandatory quality certifications for certain device categories" },
      { name: "Clinical Investigation Rules", description: "Rules governing clinical trials for medical devices in India" },
    ],
    submissionFlow: [
      { step: 1, title: "Appoint Indian Authorized Representative", description: "Foreign manufacturers must appoint an Indian agent (authorized representative) with a valid wholesale drug license", duration: "2–4 weeks" },
      { step: 2, title: "Device Classification", description: "Determine device class (A/B/C/D) per First Schedule of MDR 2017. Class A requires only notification; B/C/D require registration.", duration: "1 week" },
      { step: 3, title: "Prepare Device Master File (DMF)", description: "Compile technical documentation: device description, design & manufacturing, risk analysis, essential principles, clinical evidence, labelling, stability studies", duration: "4–8 weeks" },
      { step: 4, title: "Testing at CDSCO-approved Lab", description: "Submit samples for testing at a CDSCO-recognized laboratory. For IVDs, clinical evaluation at an Indian lab may be required.", duration: "4–12 weeks" },
      { step: 5, title: "Submit Application to CDSCO", description: "File Form MD-14 (import) or MD-15 (manufacture) via CDSCO's online SUGAM portal with DMF and test reports", duration: "1–2 weeks" },
      { step: 6, title: "CDSCO Review & Query Resolution", description: "CDSCO reviews the application. Technical queries are raised via portal. Applicant must respond within specified timelines.", duration: "6–12 months" },
      { step: 7, title: "Import/Manufacturing License Issued", description: "Upon approval, CDSCO issues Form MD-9 (import license) or Form MD-6 (manufacturing license)", duration: "2–4 weeks" },
      { step: 8, title: "Post-Market Surveillance", description: "Mandatory adverse event reporting, periodic safety update reports, and compliance with post-market obligations" },
    ],
    requiredForms: [
      { name: "Form MD-14", description: "Application for import registration/license of medical device", mandatory: true },
      { name: "Form MD-15", description: "Application for manufacturing license of medical device", mandatory: true },
      { name: "Device Master File (DMF)", description: "Complete technical dossier covering all 22 sections per CDSCO guidance", mandatory: true },
      { name: "Form MD-3", description: "Site Master File for manufacturing premises", mandatory: true },
      { name: "Form MD-33", description: "Free Sale Certificate from country of origin", mandatory: true },
      { name: "Clinical Investigation Application", description: "Required for new devices needing Indian clinical data", mandatory: false },
      { name: "Certificate of Analysis (COA)", description: "Batch test results for each component of the device", mandatory: true },
      { name: "ISO 13485 Certificate", description: "Quality Management System certification", mandatory: true },
    ],
    timelines: { standardReview: "6–18 months (depending on device class)", expeditedReview: "3–6 months for Class A/B devices", renewalPeriod: "5 years from date of issue", notes: "CDSCO has implemented online processing via SUGAM portal. Fast-track pathway available for breakthrough devices." },
    fees: [
      { category: "Import License Application (Class C/D)", amount: "₹50,000 (≈$600)", notes: "Per device per application" },
      { category: "Import License Application (Class A/B)", amount: "₹25,000 (≈$300)" },
      { category: "Manufacturing License", amount: "₹25,000–₹50,000" },
      { category: "Retention Fee (Annual)", amount: "₹10,000–₹25,000" },
      { category: "Testing Fees (CDSCO Lab)", amount: "₹10,000–₹1,00,000", notes: "Depends on device complexity and tests required" },
    ],
    localRequirements: [
      "Indian Authorized Representative mandatory for foreign manufacturers",
      "Labelling must include information in English and Hindi",
      "Wholesale drug license required for the Indian agent",
      "Clinical evaluation at Indian labs may be required for IVD devices",
      "Device must conform to Indian standard (BIS) where applicable",
      "Post-market adverse event reporting via the CDSCO MedWatch portal",
    ],
    tips: [
      "Start with appointing a reliable Indian authorized representative early — they manage all CDSCO interactions",
      "Ensure your DMF is complete before submission — incomplete DMFs are the #1 cause of delays",
      "For IVDs: prepare for mandatory Indian lab evaluation, which adds 2–3 months",
      "Track CDSCO query responses diligently — missing the response window can reset your application",
      "Keep your ISO 13485 certification current throughout the process",
    ],
    recentUpdates: [
      "2024: CDSCO launched single-window clearance for medical device imports",
      "2023: New rules for software-as-medical-device (SaMD) classification",
      "2022: Mandatory BIS marking for 37 categories of medical devices",
    ],
  },

  // ─── UNITED STATES ───
  {
    countryCode: "US", countryName: "United States", flag: "🇺🇸", region: "Americas",
    overview: "The US FDA regulates medical devices under the Federal Food, Drug, and Cosmetic Act. Devices are classified into Class I, II, or III based on risk. Most devices require either a 510(k) premarket notification (demonstrating substantial equivalence to a predicate device) or a PMA (Premarket Approval) for high-risk devices. The FDA also has De Novo pathway for novel low-to-moderate risk devices.",
    regulatoryAuthority: { name: "Food and Drug Administration", abbreviation: "FDA", website: "https://www.fda.gov", description: "The FDA's Center for Devices and Radiological Health (CDRH) oversees premarket review, post-market surveillance, and manufacturing quality of medical devices sold in the United States." },
    classification: { system: "3-class risk-based system",
      classes: [
        { name: "Class I", description: "Low risk — general controls (most exempt from 510(k))", examples: "Elastic bandages, examination gloves, manual stethoscopes" },
        { name: "Class II", description: "Moderate risk — general controls + special controls, typically requires 510(k)", examples: "Powered wheelchairs, pregnancy test kits, infusion pumps" },
        { name: "Class III", description: "High risk — requires Premarket Approval (PMA)", examples: "Heart valves, implantable pacemakers, high-risk IVDs" },
      ],
    },
    keyLaws: [
      { name: "Federal Food, Drug, and Cosmetic Act (FD&C Act)", description: "Primary legislation establishing FDA authority over medical devices", year: "1938" },
      { name: "Medical Device Amendments", description: "Established the 3-tier classification system and premarket review pathways", year: "1976" },
      { name: "Safe Medical Devices Act (SMDA)", description: "Strengthened post-market surveillance and adverse event reporting", year: "1990" },
      { name: "FDA Modernization Act (FDAMA)", description: "Streamlined device review processes", year: "1997" },
      { name: "21st Century Cures Act", description: "Created breakthrough device designation and modernized digital health regulation", year: "2016" },
      { name: "21 CFR Part 820 (QSR → QMSR)", description: "Quality System Regulation transitioning to align with ISO 13485", year: "2024" },
    ],
    submissionFlow: [
      { step: 1, title: "Device Classification", description: "Use the FDA Product Classification Database to determine device class, product code, and applicable review pathway (510(k), De Novo, or PMA)", duration: "1–2 weeks" },
      { step: 2, title: "Establishment Registration & Device Listing", description: "Register the manufacturing facility with FDA and list the device. Required before marketing.", duration: "1–2 weeks" },
      { step: 3, title: "Prepare Premarket Submission", description: "For 510(k): prepare predicate comparison, performance testing, biocompatibility. For PMA: compile full clinical data package.", duration: "2–6 months" },
      { step: 4, title: "eSTAR Submission", description: "Submit electronically via FDA's eSTAR system. Includes device description, substantial equivalence comparison (510k) or safety/effectiveness data (PMA).", duration: "1–2 weeks" },
      { step: 5, title: "FDA Review", description: "FDA performs substantive review. May issue Additional Information (AI) requests. Interactive review available for 510(k).", duration: "3–12 months" },
      { step: 6, title: "Clearance/Approval", description: "510(k) clearance letter or PMA approval order issued. Device can be marketed in the US.", duration: "Upon decision" },
      { step: 7, title: "Post-Market Requirements", description: "Comply with MDR/MedWatch adverse event reporting, Quality System inspections, and any post-market study commitments." },
    ],
    requiredForms: [
      { name: "510(k) Premarket Notification", description: "Demonstrates substantial equivalence to a legally marketed predicate device", mandatory: true },
      { name: "PMA Application", description: "Full safety and effectiveness data for Class III devices", mandatory: false },
      { name: "De Novo Classification Request", description: "For novel devices without a predicate, Class I/II risk", mandatory: false },
      { name: "FDA Form 3514 (CDRH Premarket Review Submission Cover Sheet)", description: "Required cover sheet for all device submissions", mandatory: true },
      { name: "FDA Form 2891/2892 (Establishment Registration)", description: "Annual establishment registration and device listing", mandatory: true },
      { name: "FDA Form 3500A (MedWatch)", description: "Mandatory adverse event reporting for manufacturers", mandatory: true },
    ],
    timelines: { standardReview: "510(k): 90-day review goal (often 3–6 months total); PMA: 180-day review (often 12–18 months)", expeditedReview: "Breakthrough Device Designation: priority review with interactive process", renewalPeriod: "510(k) clearance does not expire; establishment registration renewed annually", notes: "FDA user fees apply. FY2025 510(k) fee: ~$21,760 (standard), reduced for small businesses." },
    fees: [
      { category: "510(k) Standard", amount: "$21,760 (FY2025)", notes: "Small business: $5,440" },
      { category: "PMA Application", amount: "$442,016 (FY2025)", notes: "Small business: $110,504" },
      { category: "De Novo", amount: "$134,930 (FY2025)", notes: "Small business: $33,733" },
      { category: "Annual Establishment Registration", amount: "$7,653 (FY2025)" },
      { category: "PMA Supplement", amount: "$66,302–$331,510" },
    ],
    localRequirements: [
      "US Agent required for foreign manufacturers (21 CFR 807.40)",
      "Labelling must comply with 21 CFR Part 801",
      "UDI (Unique Device Identification) required per FDA timeline",
      "Quality System must comply with 21 CFR Part 820 (transitioning to QMSR/ISO 13485)",
      "MDR (Medical Device Reporting) for adverse events mandatory",
      "510(k) holders must monitor for changes requiring new submissions",
    ],
    tips: [
      "Identify your predicate device early and confirm with FDA via Pre-Submission (Q-Sub) meeting",
      "Use the Pre-Submission program — free FDA feedback before your formal submission saves months",
      "Ensure your testing aligns with FDA-recognized consensus standards to streamline review",
      "For IVDs, check if your device qualifies for CLIA waiver to expand market access",
      "Consider Breakthrough Device Designation for truly novel devices — provides FDA interaction throughout development",
    ],
    recentUpdates: [
      "2024: QMSR final rule published — transitioning from QSR to ISO 13485 alignment (effective Feb 2026)",
      "2024: FDA updated cybersecurity guidance for medical devices",
      "2023: Expanded use of real-world evidence for regulatory decision-making",
    ],
  },

  // ─── EUROPEAN UNION ───
  {
    countryCode: "EU", countryName: "European Union", flag: "🇪🇺", region: "Europe",
    overview: "The EU regulates medical devices under the Medical Device Regulation (MDR) 2017/745 and In-Vitro Diagnostic Regulation (IVDR) 2017/746, which replaced the legacy Directives. Devices require CE marking through a Notified Body. The system is based on conformity assessment procedures tied to device risk classification.",
    regulatoryAuthority: { name: "European Commission / Notified Bodies", abbreviation: "EC / NB", website: "https://health.ec.europa.eu/medical-devices-sector_en", description: "The European Commission sets the regulatory framework. Notified Bodies (e.g., TÜV, BSI, SGS) perform conformity assessments and issue CE certificates. MDCG provides guidance." },
    classification: { system: "MDR: 4 classes (I, IIa, IIb, III); IVDR: 4 classes (A, B, C, D)",
      classes: [
        { name: "Class I (MDR)", description: "Low risk — self-declaration (Ia/Is for measuring/sterile need NB)", examples: "Wheelchairs, stethoscopes, hospital beds" },
        { name: "Class IIa (MDR)", description: "Medium risk — NB audit of technical documentation or QMS", examples: "Hearing aids, blood transfusion tubes, dental crowns" },
        { name: "Class IIb (MDR)", description: "Medium-high risk — NB reviews technical documentation", examples: "Ventilators, dialysis machines, surgical lasers" },
        { name: "Class III (MDR)", description: "High risk — full NB review of design and manufacturing", examples: "Drug-eluting stents, hip implants, breast implants" },
      ],
    },
    keyLaws: [
      { name: "MDR (EU) 2017/745", description: "Medical Device Regulation — primary legislation for medical devices in the EU, replaced MDD 93/42/EEC", year: "2017" },
      { name: "IVDR (EU) 2017/746", description: "In-Vitro Diagnostic Regulation — replaced IVDD 98/79/EC with stricter classification", year: "2017" },
      { name: "EUDAMED", description: "European Database on Medical Devices — for registration, UDI, certificates, vigilance", year: "2021+" },
      { name: "Harmonised Standards (EN ISO series)", description: "EN ISO 13485, EN ISO 14971, EN 62304 — presumption of conformity with MDR/IVDR" },
    ],
    submissionFlow: [
      { step: 1, title: "Device Classification", description: "Classify using MDR Annex VIII or IVDR Annex VIII classification rules. Determines the applicable conformity assessment procedure.", duration: "1–2 weeks" },
      { step: 2, title: "Appoint European Authorised Representative", description: "Non-EU manufacturers must designate an EU-based Authorised Representative (Article 11 MDR).", duration: "2–4 weeks" },
      { step: 3, title: "Prepare Technical Documentation", description: "Compile per MDR Annex II/III: device description, design info, risk management, clinical evaluation, biocompatibility, labelling, IFU.", duration: "3–12 months" },
      { step: 4, title: "Implement QMS (ISO 13485)", description: "Establish or align QMS to EN ISO 13485. Required for all classes except Class I (non-sterile, non-measuring).", duration: "3–6 months" },
      { step: 5, title: "Clinical Evaluation", description: "Perform clinical evaluation per MDR Article 61 and MEDDEV 2.7/1 Rev 4. Clinical investigations may be needed for novel or high-risk devices.", duration: "2–12 months" },
      { step: 6, title: "Notified Body Assessment", description: "Select a Notified Body designated for your device type. They review documentation, audit QMS, and witness testing as applicable.", duration: "6–18 months" },
      { step: 7, title: "CE Marking & Declaration of Conformity", description: "Upon NB certificate issuance, manufacturer draws up EU Declaration of Conformity and affixes CE mark.", duration: "1–2 weeks" },
      { step: 8, title: "EUDAMED Registration & UDI", description: "Register in EUDAMED (when modules become available), assign UDI per EU UDI requirements.", duration: "Ongoing" },
      { step: 9, title: "Post-Market Surveillance & Vigilance", description: "Implement PMS plan, PSUR, field safety corrective actions (FSCA), and serious incident reporting." },
    ],
    requiredForms: [
      { name: "Technical Documentation (Annex II/III)", description: "Complete device dossier per MDR/IVDR requirements", mandatory: true },
      { name: "EU Declaration of Conformity", description: "Manufacturer's declaration that the device meets MDR/IVDR requirements", mandatory: true },
      { name: "Clinical Evaluation Report (CER)", description: "Systematic review of clinical data per MEDDEV 2.7/1 Rev 4", mandatory: true },
      { name: "Risk Management File (ISO 14971)", description: "Complete risk analysis, evaluation, and control documentation", mandatory: true },
      { name: "Post-Market Surveillance Plan", description: "Proactive monitoring plan per MDR Article 84", mandatory: true },
      { name: "PSUR / PMCF Plan", description: "Periodic Safety Update Report / Post-Market Clinical Follow-up", mandatory: true },
      { name: "Summary of Safety and Clinical Performance (SSCP)", description: "Required for Class III and implantable devices", mandatory: false },
    ],
    timelines: { standardReview: "NB review: 6–18 months (longer due to MDR transition backlog)", renewalPeriod: "CE certificate valid for max 5 years", notes: "Significant Notified Body capacity constraints during MDR transition. Apply to NB 12+ months before target date." },
    fees: [
      { category: "Notified Body Application Fee", amount: "€10,000–€30,000", notes: "Varies significantly by NB and device complexity" },
      { category: "QMS Audit (Annual)", amount: "€8,000–€25,000" },
      { category: "Technical Documentation Review", amount: "€15,000–€60,000", notes: "Per device family, per NB" },
      { category: "Certificate Maintenance (Annual)", amount: "€5,000–€15,000" },
      { category: "EU Authorised Representative Fee", amount: "€5,000–€20,000/year" },
    ],
    localRequirements: [
      "EU Authorised Representative mandatory for non-EU manufacturers",
      "Person Responsible for Regulatory Compliance (PRRC) must be designated",
      "UDI assignment and EUDAMED registration required",
      "Labelling per MDR Annex I Chapter III (multilingual as needed)",
      "Post-Market Surveillance system and vigilance reporting mandatory",
      "Implant cards required for implantable devices",
    ],
    tips: [
      "Engage your Notified Body as early as possible — capacity is limited and waitlists are long",
      "Clinical evaluation strategy should be decided early — literature-based vs clinical investigation has major timeline implications",
      "Keep your legacy MDD certificates in mind — understand transition timelines to avoid gaps",
      "Plan for the EU Authorised Representative + PRRC requirement well ahead of CE marking",
      "Use harmonised standards for presumption of conformity — significantly reduces NB review burden",
    ],
    recentUpdates: [
      "2024: Extended transition periods for MDD to MDR for certain device classes",
      "2024: MDCG guidance on clinical evaluation updates",
      "2023: IVDR transition staggered implementation dates confirmed",
    ],
  },

  // ─── UNITED KINGDOM ───
  {
    countryCode: "GB", countryName: "United Kingdom", flag: "🇬🇧", region: "Europe",
    overview: "Post-Brexit, the UK has its own regulatory framework under the Medicines and Healthcare products Regulatory Agency (MHRA). The UK MDR 2002 (amended) applies, and the UKCA marking is being introduced to replace CE marking. Currently, CE marks are still recognized during the transition period.",
    regulatoryAuthority: { name: "Medicines and Healthcare products Regulatory Agency", abbreviation: "MHRA", website: "https://www.gov.uk/government/organisations/mhra", description: "MHRA regulates medicines, medical devices, and blood products in the UK. It serves as both the competent authority and the approval body." },
    classification: { system: "Currently aligned with EU MDR/IVDR classification, transitioning to UK-specific system",
      classes: [
        { name: "Class I", description: "Low risk — self-certification", examples: "Bandages, walking aids" },
        { name: "Class IIa", description: "Medium risk — UK Approved Body review", examples: "Hearing aids, dental materials" },
        { name: "Class IIb", description: "Medium-high risk", examples: "Infusion pumps, dialysis equipment" },
        { name: "Class III", description: "High risk — full Approved Body review", examples: "Heart valves, spinal implants" },
      ],
    },
    keyLaws: [
      { name: "Medical Devices Regulations 2002 (SI 2002/618)", description: "Primary UK legislation for medical devices, amended post-Brexit", year: "2002" },
      { name: "Medicines and Medical Devices Act 2021", description: "Powers to create new UK device regulations", year: "2021" },
    ],
    submissionFlow: [
      { step: 1, title: "Appoint UK Responsible Person", description: "Non-UK manufacturers must designate a UK Responsible Person (UKRP).", duration: "2–4 weeks" },
      { step: 2, title: "Device Classification", description: "Classify per UK MDR classification rules (currently aligned with EU MDR).", duration: "1 week" },
      { step: 3, title: "Register with MHRA", description: "All devices placed on the UK market must be registered with MHRA. Class I devices: manufacturer registers directly.", duration: "2–4 weeks" },
      { step: 4, title: "UK Approved Body Assessment", description: "For Class IIa+ devices, obtain UKCA certificate from a UK Approved Body.", duration: "6–18 months" },
      { step: 5, title: "UKCA / CE Marking", description: "Apply UKCA mark (or CE mark during transition). CE marks accepted until June 2028.", duration: "Upon certification" },
      { step: 6, title: "Post-Market Obligations", description: "Adverse event reporting to MHRA, post-market surveillance, and vigilance.", duration: "Ongoing" },
    ],
    requiredForms: [
      { name: "MHRA Device Registration", description: "Online registration of device and manufacturer details", mandatory: true },
      { name: "UK Declaration of Conformity", description: "Manufacturer's declaration for UKCA-marked devices", mandatory: true },
      { name: "Technical Documentation", description: "Equivalent to EU MDR Annex II/III requirements", mandatory: true },
    ],
    timelines: { standardReview: "6–18 months via UK Approved Body", renewalPeriod: "UKCA certificate: 5 years", notes: "CE marking recognized in Great Britain until June 2028. Northern Ireland follows EU MDR." },
    fees: [
      { category: "MHRA Registration (per device group)", amount: "Free (currently)" },
      { category: "UK Approved Body Assessment", amount: "£8,000–£50,000", notes: "Depends on device class and complexity" },
    ],
    localRequirements: [
      "UK Responsible Person (UKRP) mandatory for overseas manufacturers",
      "MHRA registration required before placing on UK market",
      "Northern Ireland follows EU MDR (Windsor Framework)",
      "Labelling must comply with UK MDR requirements",
    ],
    tips: [
      "Leverage your existing EU CE marking during the transition period",
      "Monitor MHRA announcements for final UKCA implementation dates — they have shifted multiple times",
      "For Northern Ireland, maintain EU MDR compliance (dual compliance may be needed)",
    ],
  },

  // ─── CHINA ───
  {
    countryCode: "CN", countryName: "China", flag: "🇨🇳", region: "Asia",
    overview: "China's National Medical Products Administration (NMPA) regulates medical devices under the Regulations for the Supervision and Administration of Medical Devices (State Council Decree No. 739). Devices are classified into Class I, II, and III. Registration involves mandatory Chinese testing at NMPA-designated labs.",
    regulatoryAuthority: { name: "National Medical Products Administration", abbreviation: "NMPA", website: "https://www.nmpa.gov.cn", description: "NMPA (formerly CFDA) is the regulatory authority for drugs, medical devices, and cosmetics in China. Device registration is handled by the Center for Medical Device Evaluation (CMDE)." },
    classification: { system: "3-class risk-based system",
      classes: [
        { name: "Class I", description: "Low risk — filing (Bei'an) at municipal level", examples: "Surgical instruments, medical forceps" },
        { name: "Class II", description: "Moderate risk — registration at provincial level", examples: "Clinical chemistry analyzers, blood glucose meters" },
        { name: "Class III", description: "High risk — NMPA registration required", examples: "Pacemakers, IVD reagents for infectious disease" },
      ],
    },
    keyLaws: [
      { name: "Regulations for Supervision and Administration of Medical Devices (Decree 739)", description: "Core regulation for medical device lifecycle management", year: "2021" },
      { name: "Administrative Measures for Medical Device Registration and Filing (Order 47)", description: "Detailed registration procedures", year: "2021" },
      { name: "In-Vitro Diagnostic Reagent Registration and Filing Measures (Order 48)", description: "Specific regulations for IVD devices", year: "2021" },
    ],
    submissionFlow: [
      { step: 1, title: "Appoint Chinese Legal Agent", description: "Foreign manufacturers must designate a China-based legal agent (registration agent).", duration: "2–4 weeks" },
      { step: 2, title: "Device Classification", description: "Confirm classification per NMPA Classification Catalogue.", duration: "1–2 weeks" },
      { step: 3, title: "Chinese Testing", description: "Submit samples to an NMPA-designated testing laboratory for safety and performance testing per Chinese standards (GB/YY standards).", duration: "3–12 months" },
      { step: 4, title: "Clinical Evaluation", description: "Prepare clinical evaluation report. Clinical trials in China may be required unless device qualifies for exemption.", duration: "6–24 months" },
      { step: 5, title: "Registration Application to NMPA/CMDE", description: "Submit registration dossier to CMDE (Class III) or provincial authority (Class II).", duration: "2–4 weeks" },
      { step: 6, title: "Technical Review", description: "CMDE performs technical review with possible supplementary requests.", duration: "6–12 months" },
      { step: 7, title: "Registration Certificate Issued", description: "NMPA issues registration certificate upon approval.", duration: "2–4 weeks" },
    ],
    requiredForms: [
      { name: "Registration Application Form", description: "Formal application per Order 47/48", mandatory: true },
      { name: "Technical Documentation Dossier", description: "Comprehensive technical file per NMPA requirements", mandatory: true },
      { name: "Chinese Testing Report", description: "From NMPA-designated lab per applicable GB/YY standards", mandatory: true },
      { name: "Clinical Evaluation Report / Clinical Trial Data", description: "Clinical evidence per NMPA clinical evaluation requirements", mandatory: true },
      { name: "Certificate of Origin", description: "Free Sale Certificate from country of origin", mandatory: true },
    ],
    timelines: { standardReview: "Class II: 6–12 months; Class III: 12–24 months (including testing)", renewalPeriod: "5 years (renewal application 6 months before expiry)", notes: "Chinese clinical trials add significant time. Seek exemption where possible." },
    fees: [
      { category: "Registration Fee (Class II)", amount: "¥21,600 (≈$3,000)" },
      { category: "Registration Fee (Class III)", amount: "¥30,800 (≈$4,300)" },
      { category: "Testing Fees", amount: "¥50,000–¥500,000", notes: "Highly variable based on standards and tests" },
      { category: "Clinical Trial (if required)", amount: "¥500,000–¥5,000,000+" },
    ],
    localRequirements: [
      "Chinese legal agent/registration agent mandatory",
      "Testing at NMPA-designated Chinese labs mandatory (no acceptance of foreign test reports)",
      "Chinese-language labelling and IFU required",
      "Clinical trials in China may be required unless exempt",
      "Post-market adverse event reporting mandatory",
    ],
    tips: [
      "Start Chinese testing early — it's the longest single step in the process",
      "Check the clinical trial exemption list to avoid costly and time-consuming Chinese clinical trials",
      "Work with an experienced Chinese registration agent who understands CMDE reviewer expectations",
      "GB/YY standards may differ from international standards — ensure your testing covers Chinese-specific requirements",
    ],
  },

  // ─── JAPAN ───
  {
    countryCode: "JP", countryName: "Japan", flag: "🇯🇵", region: "Asia",
    overview: "Japan's Pharmaceuticals and Medical Devices Agency (PMDA) regulates medical devices under the Pharmaceutical and Medical Device Act (PMD Act). The Marketing Authorization Holder (MAH) system requires a Japan-based entity to hold the marketing authorization. Devices are classified into 4 classes.",
    regulatoryAuthority: { name: "Pharmaceuticals and Medical Devices Agency", abbreviation: "PMDA", website: "https://www.pmda.go.jp", description: "PMDA reviews marketing authorization applications for medical devices. The Ministry of Health, Labour and Welfare (MHLW) issues final approval for high-risk devices." },
    classification: { system: "4-class system (I–IV)",
      classes: [
        { name: "Class I", description: "General medical devices — notification only", examples: "X-ray film, surgical instruments" },
        { name: "Class II", description: "Controlled medical devices — third-party certification or PMDA review", examples: "MRI, electronic endoscopes, dental materials" },
        { name: "Class III", description: "Specially controlled medical devices — PMDA Shonin review", examples: "Dialyzers, ventilators, absorbable sutures" },
        { name: "Class IV", description: "Specially controlled (high risk) — MHLW Shonin approval", examples: "Pacemakers, stents, high-risk IVDs" },
      ],
    },
    keyLaws: [
      { name: "Pharmaceutical and Medical Device Act (PMD Act)", description: "Primary legislation for drugs and medical devices in Japan", year: "2014" },
      { name: "MHLW Ministerial Ordinances", description: "Detailed requirements for registration, QMS, and GVP" },
      { name: "JIS Standards", description: "Japanese Industrial Standards — many aligned with ISO/IEC" },
    ],
    submissionFlow: [
      { step: 1, title: "Designate Marketing Authorization Holder (MAH)", description: "A Japan-based MAH (D-MAH for foreign manufacturers) must be designated to hold the license.", duration: "4–8 weeks" },
      { step: 2, title: "Device Classification", description: "Classify per MHLW classification rules and identify applicable PMDA product category.", duration: "1–2 weeks" },
      { step: 3, title: "Japanese Testing (JIS/ISO)", description: "Testing per applicable JIS or adopted ISO standards at recognized labs.", duration: "2–6 months" },
      { step: 4, title: "QMS Compliance (MHLW Ordinance 169)", description: "Demonstrate QMS compliance through PMDA QMS audit of manufacturing facility.", duration: "3–6 months" },
      { step: 5, title: "Prepare Shonin Application", description: "Compile CTD-formatted application with device description, testing data, clinical evidence, risk analysis.", duration: "2–4 months" },
      { step: 6, title: "PMDA Review", description: "PMDA performs scientific review with possible queries and expert panel consultation.", duration: "6–14 months" },
      { step: 7, title: "MHLW Approval (Shonin)", description: "For Class III/IV, MHLW issues Shonin approval. Class II can be certified by Registered Certification Bodies.", duration: "1–3 months" },
    ],
    requiredForms: [
      { name: "Shonin Application (承認申請書)", description: "Marketing authorization application per PMD Act", mandatory: true },
      { name: "STED (Summary Technical Documentation)", description: "Technical file following STED format (GHTF-based)", mandatory: true },
      { name: "QMS Compliance Certificate", description: "Evidence of QMS conformity per MHLW Ordinance 169", mandatory: true },
      { name: "GVP Compliance Documentation", description: "Good Vigilance Practice system documentation", mandatory: true },
    ],
    timelines: { standardReview: "Class II (Todokede): 1 month; Class II (Ninsho): 3–6 months; Class III/IV (Shonin): 6–14 months", renewalPeriod: "Re-examination period varies (3–7 years for new devices)", notes: "Pre-submission consultation with PMDA available and highly recommended." },
    fees: [
      { category: "Shonin Application (new device)", amount: "¥1,300,000–¥4,280,000 (≈$9,000–$30,000)" },
      { category: "QMS Audit Fee", amount: "¥500,000–¥2,000,000" },
      { category: "Ninsho Certification", amount: "¥300,000–¥1,000,000" },
    ],
    localRequirements: [
      "Designated Marketing Authorization Holder (D-MAH) in Japan required",
      "QMS audit by PMDA for manufacturing sites",
      "Japanese-language labelling and IFU mandatory",
      "GVP (Good Vigilance Practice) system required",
      "Clinical data must meet Japanese regulatory expectations (J-GCP for trials)",
    ],
    tips: [
      "Start D-MAH selection early — they are your regulatory face in Japan",
      "Use PMDA pre-submission consultation (面談) to align expectations",
      "Leverage existing clinical data from US/EU where possible, but be prepared for PMDA-specific requests",
      "JIS standards are increasingly ISO-harmonized, but check for Japan-specific deviations",
    ],
  },

  // ─── SOUTH KOREA ───
  {
    countryCode: "KR", countryName: "South Korea", flag: "🇰🇷", region: "Asia",
    overview: "South Korea's Ministry of Food and Drug Safety (MFDS) regulates medical devices under the Medical Devices Act. The country uses a 4-class risk-based system. All devices require a Korean registration via a local license holder.",
    regulatoryAuthority: { name: "Ministry of Food and Drug Safety", abbreviation: "MFDS", website: "https://www.mfds.go.kr", description: "MFDS (formerly KFDA) is responsible for medical device safety, review, and market surveillance in South Korea." },
    classification: { system: "4-class system (I–IV)",
      classes: [
        { name: "Class I", description: "Low risk — notification", examples: "Manual surgical instruments" },
        { name: "Class II", description: "Moderate risk — MFDS review", examples: "X-ray equipment, ultrasonic diagnostic devices" },
        { name: "Class III", description: "Moderate-high risk — technical review", examples: "Hemodialysis machines, patient monitors" },
        { name: "Class IV", description: "High risk — full MFDS review", examples: "Pacemakers, coronary stents" },
      ],
    },
    keyLaws: [
      { name: "Medical Devices Act", description: "Primary legislation for medical device regulation", year: "2003" },
      { name: "MFDS Regulations on Medical Device Approval", description: "Detailed requirements for technical review and licensing" },
    ],
    submissionFlow: [
      { step: 1, title: "Appoint Korean License Holder (KLH)", description: "Foreign manufacturers need a Korea-based license holder.", duration: "2–4 weeks" },
      { step: 2, title: "Korean Testing (KGMP)", description: "Testing at MFDS-recognized Korean labs per Korean and international standards.", duration: "2–6 months" },
      { step: 3, title: "Technical Documentation", description: "Prepare MFDS-format technical file including STED.", duration: "1–3 months" },
      { step: 4, title: "MFDS Review", description: "Submit via Korean license holder. MFDS performs technical review.", duration: "3–12 months" },
      { step: 5, title: "Registration Issued", description: "MFDS issues product license upon approval.", duration: "2–4 weeks" },
    ],
    requiredForms: [
      { name: "Medical Device Technical File (STED format)", description: "Complete technical documentation per MFDS requirements", mandatory: true },
      { name: "Korean Test Reports", description: "Safety and performance testing at recognized labs", mandatory: true },
      { name: "GMP Certificate (KGMP)", description: "Manufacturing facility must demonstrate KGMP compliance", mandatory: true },
    ],
    timelines: { standardReview: "Class I: 15 days; Class II: 2–4 months; Class III/IV: 4–12 months", renewalPeriod: "License valid indefinitely with annual reporting", notes: "MFDS has been streamlining review timelines for MDSAP-certified manufacturers." },
    fees: [
      { category: "Class II Review Fee", amount: "₩500,000–₩2,000,000 (≈$400–$1,500)" },
      { category: "Class III/IV Review Fee", amount: "₩2,000,000–₩8,000,000 (≈$1,500–$6,000)" },
    ],
    localRequirements: [
      "Korean License Holder (KLH) required",
      "Korean-language labelling mandatory",
      "Testing at MFDS-designated Korean labs",
      "Post-market surveillance and adverse event reporting to MFDS",
    ],
    tips: [
      "MFDS recognizes MDSAP audit results — consider MDSAP certification to streamline entry",
      "Korean testing can sometimes accept foreign lab data if the lab has MRA with Korea",
    ],
  },

  // ─── CANADA ───
  {
    countryCode: "CA", countryName: "Canada", flag: "🇨🇦", region: "Americas",
    overview: "Health Canada regulates medical devices under the Food and Drugs Act and the Medical Devices Regulations (SOR/98-282). Devices are classified into 4 classes (I–IV). Most require a Medical Device Licence (MDL) before sale.",
    regulatoryAuthority: { name: "Health Canada — Medical Devices Bureau", abbreviation: "HC", website: "https://www.canada.ca/en/health-canada.html", description: "The Medical Devices Bureau within the Therapeutic Products Directorate reviews device applications and issues licences." },
    classification: { system: "4-class system (I–IV)",
      classes: [
        { name: "Class I", description: "Lowest risk — establishment licence only, no device licence needed", examples: "Surgical instruments, hospital beds" },
        { name: "Class II", description: "Low risk — declaration of conformity", examples: "Contact lenses, pregnancy test kits" },
        { name: "Class III", description: "Moderate risk — premarket review", examples: "Orthopedic implants, glucose monitors" },
        { name: "Class IV", description: "Highest risk — premarket review + QMS audit", examples: "Pacemakers, HIV test kits" },
      ],
    },
    keyLaws: [
      { name: "Food and Drugs Act", description: "Primary legislation governing drugs and medical devices", year: "1985" },
      { name: "Medical Devices Regulations (SOR/98-282)", description: "Specific regulations for device classification, licensing, and post-market requirements", year: "1998" },
      { name: "Vanessa's Law (Protecting Canadians from Unsafe Drugs Act)", description: "Strengthened post-market safety powers", year: "2014" },
    ],
    submissionFlow: [
      { step: 1, title: "Device Classification", description: "Classify per Canadian Medical Devices Regulations Schedule 1, Rules 1–16.", duration: "1 week" },
      { step: 2, title: "Establish Quality System (MDSAP)", description: "CAN/CSA ISO 13485 compliance. Health Canada accepts MDSAP audits.", duration: "3–6 months" },
      { step: 3, title: "Prepare Application", description: "Compile Medical Device Licence application with safety and effectiveness data.", duration: "2–4 months" },
      { step: 4, title: "Submit to Health Canada", description: "Submit via Medical Devices Bureau online portal.", duration: "1–2 weeks" },
      { step: 5, title: "Health Canada Review", description: "Scientific review with possible questions. Screening + in-depth review phases.", duration: "Class II: 15–30 days; Class III: 60–75 days; Class IV: 75–90 days" },
      { step: 6, title: "Medical Device Licence Issued", description: "MDL issued with licence number. Device can be sold in Canada." },
    ],
    requiredForms: [
      { name: "Medical Device Licence (MDL) Application", description: "Standard application for Classes II–IV", mandatory: true },
      { name: "Medical Device Establishment Licence (MDEL)", description: "Required for importers, distributors, and Class I manufacturers", mandatory: true },
      { name: "MDSAP Certificate", description: "Mandatory QMS audit via MDSAP program", mandatory: true },
    ],
    timelines: { standardReview: "Class II: 15–30 days; Class III: 60–75 days; Class IV: 75–90 days", expeditedReview: "Priority review for breakthrough/urgent need devices", renewalPeriod: "Annual MDEL renewal required", notes: "Canada is a founding member of MDSAP — MDSAP audit is mandatory for all device manufacturers." },
    fees: [
      { category: "MDL Application (Class II)", amount: "CAD $480" },
      { category: "MDL Application (Class III)", amount: "CAD $6,985" },
      { category: "MDL Application (Class IV)", amount: "CAD $23,552" },
      { category: "MDEL Annual Fee", amount: "CAD $9,011" },
    ],
    localRequirements: [
      "MDSAP audit certificate is mandatory (no standalone ISO 13485 accepted)",
      "Bilingual labelling (English + French) required",
      "Canadian importer required for foreign manufacturers",
      "Mandatory problem reporting per Section 59–62 of MDR",
    ],
    tips: [
      "Get MDSAP-certified early — it's a prerequisite and recognized by multiple countries",
      "Health Canada review timelines are relatively fast compared to US/EU",
      "Bilingual (EN/FR) labelling is a hard requirement — plan from the start",
    ],
  },

  // ─── AUSTRALIA ───
  {
    countryCode: "AU", countryName: "Australia", flag: "🇦🇺", region: "Oceania",
    overview: "Australia's Therapeutic Goods Administration (TGA) regulates medical devices under the Therapeutic Goods Act 1989. The classification system aligns with the EU GHTF framework. Devices must be included in the Australian Register of Therapeutic Goods (ARTG) before supply.",
    regulatoryAuthority: { name: "Therapeutic Goods Administration", abbreviation: "TGA", website: "https://www.tga.gov.au", description: "TGA is Australia's regulatory authority for therapeutic goods including medical devices, medicines, biologicals and blood products." },
    classification: { system: "EU-aligned system (Class I, IIa, IIb, III, AIMD) plus IVD classes (1–4)",
      classes: [
        { name: "Class I", description: "Low risk — manufacturer self-assessment", examples: "Tongue depressors, non-sterile bandages" },
        { name: "Class IIa", description: "Low-medium risk — conformity assessment", examples: "Hearing aids, surgical drapes" },
        { name: "Class IIb", description: "Medium-high risk", examples: "Ventilators, blood bags" },
        { name: "Class III / AIMD", description: "High risk / Active Implantable", examples: "Pacemakers, joint replacements" },
      ],
    },
    keyLaws: [
      { name: "Therapeutic Goods Act 1989", description: "Primary legislation governing all therapeutic goods in Australia", year: "1989" },
      { name: "Therapeutic Goods (Medical Devices) Regulations 2002", description: "Specific medical device regulations including essential principles", year: "2002" },
    ],
    submissionFlow: [
      { step: 1, title: "Appoint Australian Sponsor", description: "A local Australian sponsor is required to include the device in the ARTG.", duration: "2–4 weeks" },
      { step: 2, title: "Device Classification", description: "Classify per TGA classification rules (aligned with GHTF/EU).", duration: "1–2 weeks" },
      { step: 3, title: "Conformity Assessment", description: "Obtain conformity assessment evidence (EU CE certificate accepted for certain pathways, or TGA assessment).", duration: "Variable" },
      { step: 4, title: "ARTG Application", description: "Submit application to include the device in the ARTG via TGA Business Services (TBS) portal.", duration: "1–2 weeks" },
      { step: 5, title: "TGA Review", description: "TGA performs assessment. May request additional information.", duration: "Class I: 20 days; Class IIa/IIb: 60–150 days; Class III: 175–255 days" },
      { step: 6, title: "ARTG Inclusion", description: "Device listed on the ARTG. Can be supplied in Australia." },
    ],
    requiredForms: [
      { name: "ARTG Application", description: "Application for inclusion in the Australian Register of Therapeutic Goods", mandatory: true },
      { name: "Australian Declaration of Conformity", description: "Declaration that device meets essential principles", mandatory: true },
      { name: "Technical Documentation / Design Dossier", description: "Complete technical file per TGA requirements", mandatory: true },
      { name: "EU CE Certificate (if applicable)", description: "TGA accepts EU CE certificates for certain assessment pathways", mandatory: false },
    ],
    timelines: { standardReview: "Class I: 20 business days; Class IIb/III: up to 255 business days", renewalPeriod: "ARTG inclusion is ongoing with annual charges", notes: "TGA participates in MDSAP. CE certificates can expedite TGA review." },
    fees: [
      { category: "ARTG Application (Class I)", amount: "AUD $1,290" },
      { category: "ARTG Application (Class IIa)", amount: "AUD $4,700" },
      { category: "ARTG Application (Class III)", amount: "AUD $15,800" },
      { category: "Annual ARTG Charge", amount: "AUD $1,490 per inclusion" },
    ],
    localRequirements: [
      "Australian Sponsor required for ARTG inclusion",
      "Essential Principles compliance mandatory (equivalent to EU General Safety and Performance Requirements)",
      "Adverse event reporting mandatory via TGA",
      "TGA accepts MDSAP audit reports",
    ],
    tips: [
      "If you have EU CE marking, use the Comparable Overseas Regulator pathway for faster TGA review",
      "TGA is an MDSAP participating authority — MDSAP certificate streamlines QMS auditing",
    ],
  },

  // ─── BRAZIL ───
  {
    countryCode: "BR", countryName: "Brazil", flag: "🇧🇷", region: "Americas",
    overview: "Brazil's National Health Surveillance Agency (ANVISA) regulates medical devices under federal law. Devices are classified into 4 risk classes (I–IV). Registration with ANVISA is mandatory, and a Brazilian Registration Holder (BRH) is required for imported devices.",
    regulatoryAuthority: { name: "Agência Nacional de Vigilância Sanitária", abbreviation: "ANVISA", website: "https://www.gov.br/anvisa", description: "ANVISA is the Brazilian regulatory agency for health products including medicines, medical devices, and diagnostics." },
    classification: { system: "4-class system (I–IV) aligned with GHTF principles",
      classes: [
        { name: "Class I", description: "Low risk — notification (cadastro)", examples: "Non-sterile surgical instruments" },
        { name: "Class II", description: "Medium-low risk — notification (cadastro)", examples: "Surgical gloves, syringes" },
        { name: "Class III", description: "Medium-high risk — registration (registro)", examples: "Orthopedic implants, hemodialysis equipment" },
        { name: "Class IV", description: "High risk — registration (registro)", examples: "Pacemakers, drug-eluting stents" },
      ],
    },
    keyLaws: [
      { name: "RDC 751/2022", description: "Current regulation for medical device registration and notification", year: "2022" },
      { name: "INMETRO Certification", description: "Mandatory certification for certain device categories by INMETRO" },
    ],
    submissionFlow: [
      { step: 1, title: "Appoint BRH", description: "Brazilian Registration Holder required for foreign manufacturers.", duration: "2–4 weeks" },
      { step: 2, title: "GMP Certification", description: "Manufacturing facility must obtain ANVISA GMP certificate (on-site inspection for Class III/IV).", duration: "6–18 months" },
      { step: 3, title: "INMETRO Certification", description: "If applicable, obtain INMETRO certification for electrical safety.", duration: "2–4 months" },
      { step: 4, title: "Submit Registration/Notification", description: "Cadastro (Class I/II) or Registro (Class III/IV) via ANVISA electronic portal.", duration: "2 weeks" },
      { step: 5, title: "ANVISA Review", description: "Technical review by ANVISA. May request additional information.", duration: "Cadastro: 60–90 days; Registro: 6–24 months" },
    ],
    requiredForms: [
      { name: "Cadastro (Notification)", description: "For Class I/II devices", mandatory: true },
      { name: "Registro (Registration)", description: "For Class III/IV devices — full dossier review", mandatory: true },
      { name: "CBPF (Certificate of Good Manufacturing Practices)", description: "ANVISA GMP certificate for the manufacturing facility", mandatory: true },
    ],
    timelines: { standardReview: "Cadastro: 60–90 days; Registro: 12–24 months", renewalPeriod: "10 years (previously 5 years)", notes: "ANVISA GMP inspection of foreign facilities can take 6–18 months to schedule." },
    fees: [
      { category: "Cadastro", amount: "BRL 3,000–8,000 (≈$600–$1,600)" },
      { category: "Registro", amount: "BRL 8,000–30,000 (≈$1,600–$6,000)" },
      { category: "GMP Inspection (Foreign)", amount: "BRL 40,000–80,000 (≈$8,000–$16,000)" },
    ],
    localRequirements: [
      "Brazilian Registration Holder (BRH) mandatory",
      "ANVISA GMP inspection of manufacturing site required (foreign and domestic)",
      "Portuguese-language labelling and IFU mandatory",
      "INMETRO certification for electrical/electronic devices",
      "Post-market reporting via NOTIVISA system",
    ],
    tips: [
      "Schedule ANVISA GMP inspection well in advance — international inspections have long lead times",
      "RDC 751/2022 simplified many requirements — ensure your agent uses the current regulation",
      "Portuguese translation must be certified — budget for professional translation services",
    ],
  },

  // ─── SAUDI ARABIA ───
  {
    countryCode: "SA", countryName: "Saudi Arabia", flag: "🇸🇦", region: "Middle East",
    overview: "The Saudi Food and Drug Authority (SFDA) regulates medical devices under the Medical Devices Interim Regulations. SFDA has implemented its own registration system (MDMA) and is transitioning from reliance on reference country approvals to independent review.",
    regulatoryAuthority: { name: "Saudi Food and Drug Authority", abbreviation: "SFDA", website: "https://www.sfda.gov.sa", description: "SFDA is responsible for the regulation of food, drugs, and medical devices in the Kingdom of Saudi Arabia." },
    classification: { system: "4-class system (I, IIa, IIb, III) aligned with EU system",
      classes: [
        { name: "Class I", description: "Low risk", examples: "Surgical instruments, hospital beds" },
        { name: "Class IIa", description: "Medium-low risk", examples: "Dental materials, hearing aids" },
        { name: "Class IIb", description: "Medium-high risk", examples: "Ventilators, infusion pumps" },
        { name: "Class III", description: "High risk", examples: "Heart valves, implantable devices" },
      ],
    },
    keyLaws: [
      { name: "Medical Devices Interim Regulations (MDS-IR)", description: "Current regulatory framework for medical devices", year: "2021" },
      { name: "SFDA Medical Device Marketing Authorization", description: "MDMA system for device registration" },
    ],
    submissionFlow: [
      { step: 1, title: "Appoint Saudi Authorized Representative", description: "Foreign manufacturers need a local authorized representative.", duration: "2–4 weeks" },
      { step: 2, title: "Establishment Listing", description: "Register manufacturing establishment with SFDA.", duration: "2–4 weeks" },
      { step: 3, title: "Product Registration (MDMA)", description: "Submit device marketing authorization application via SFDA online system.", duration: "1–2 weeks" },
      { step: 4, title: "SFDA Review", description: "SFDA reviews based on reference country approvals (US FDA, EU CE, Japan, etc.) and technical documentation.", duration: "2–6 months" },
      { step: 5, title: "Marketing Authorization Issued", description: "Device can be marketed in Saudi Arabia.", duration: "Upon approval" },
    ],
    requiredForms: [
      { name: "MDMA Application", description: "Marketing authorization application via SFDA system", mandatory: true },
      { name: "Reference Country Approval", description: "CE certificate, FDA clearance, or equivalent from recognized authority", mandatory: true },
      { name: "ISO 13485 Certificate", description: "QMS certification", mandatory: true },
    ],
    timelines: { standardReview: "2–6 months (with reference country approval)", renewalPeriod: "5 years" },
    fees: [
      { category: "MDMA Application", amount: "SAR 3,000–10,000 (≈$800–$2,700)" },
      { category: "Annual Listing Fee", amount: "SAR 2,000–5,000" },
    ],
    localRequirements: [
      "Saudi Authorized Representative required",
      "Arabic labelling mandatory",
      "Reference country approval (FDA/CE/PMDA) required",
      "SFDA post-market surveillance compliance",
    ],
    tips: [
      "Having FDA clearance or EU CE certificate significantly speeds up SFDA approval",
      "SFDA is moving toward more independent review — plan for longer timelines in the future",
      "Arabic labelling must be accurate and complete — not just a translation of critical information",
    ],
  },

  // ─── UAE ───
  {
    countryCode: "AE", countryName: "UAE", flag: "🇦🇪", region: "Middle East",
    overview: "The UAE Ministry of Health and Prevention (MOHAP) regulates medical devices. The Emirates Authority for Standardization and Metrology (ESMA) and MOHAP work together. Registration requires a local agent and acceptance of reference country approvals.",
    regulatoryAuthority: { name: "Ministry of Health and Prevention", abbreviation: "MOHAP", website: "https://www.mohap.gov.ae", description: "MOHAP oversees medical device registration and market surveillance in the UAE." },
    classification: { system: "Aligned with GHTF/EU classification",
      classes: [
        { name: "Class A", description: "Low risk", examples: "Basic surgical instruments" },
        { name: "Class B", description: "Medium risk", examples: "Syringes, dental equipment" },
        { name: "Class C", description: "Medium-high risk", examples: "Dialysis machines" },
        { name: "Class D", description: "High risk", examples: "Implantable devices" },
      ],
    },
    keyLaws: [
      { name: "Cabinet Resolution No. 2 of 2022", description: "Regulation on Medical Devices", year: "2022" },
      { name: "MOHAP Administrative Orders", description: "Detailed implementation guidelines" },
    ],
    submissionFlow: [
      { step: 1, title: "Appoint Local Agent", description: "Foreign manufacturers must designate a UAE-based authorized distributor/agent.", duration: "2–4 weeks" },
      { step: 2, title: "Product Registration", description: "Submit registration application via MOHAP online system with technical documentation.", duration: "1–2 weeks" },
      { step: 3, title: "MOHAP Review", description: "Review against reference country approval and technical documentation.", duration: "1–4 months" },
      { step: 4, title: "Registration Certificate Issued", description: "Marketing registration for UAE.", duration: "Upon approval" },
    ],
    requiredForms: [
      { name: "MOHAP Registration Application", description: "Via online portal", mandatory: true },
      { name: "CE Certificate / FDA Clearance", description: "Reference country marketing authorization", mandatory: true },
      { name: "Free Sale Certificate", description: "From country of origin", mandatory: true },
    ],
    timelines: { standardReview: "1–4 months", renewalPeriod: "3–5 years" },
    fees: [
      { category: "Registration Fee", amount: "AED 2,000–10,000 (≈$550–$2,700)" },
    ],
    localRequirements: [
      "UAE local agent/distributor required",
      "Arabic labelling recommended",
      "Reference country approval speeds registration",
      "Post-market surveillance required",
    ],
    tips: [
      "UAE registration is relatively straightforward with a CE or FDA approval in hand",
      "Consider the Dubai Health Authority (DHA) requirements if specifically targeting Dubai",
    ],
  },

  // ─── SINGAPORE ───
  {
    countryCode: "SG", countryName: "Singapore", flag: "🇸🇬", region: "Southeast Asia",
    overview: "Singapore's Health Sciences Authority (HSA) regulates medical devices under the Health Products Act. Singapore uses a 4-class risk-based system (A–D) and accepts reference agency approvals to expedite review. It's considered one of the faster-approval markets in Asia.",
    regulatoryAuthority: { name: "Health Sciences Authority", abbreviation: "HSA", website: "https://www.hsa.gov.sg", description: "HSA's Medical Device Branch oversees pre-market evaluation, post-market surveillance, and adverse event monitoring." },
    classification: { system: "4-class system (A–D)",
      classes: [
        { name: "Class A", description: "Low risk — dealer's licence + product listing", examples: "Tongue depressors, stethoscopes" },
        { name: "Class B", description: "Medium-low risk — registration", examples: "Hypodermic needles, surgical gloves" },
        { name: "Class C", description: "Medium-high risk — registration", examples: "Dialyzers, bone fixation plates" },
        { name: "Class D", description: "High risk — registration + full evaluation", examples: "Heart valves, IVD HIV test kits" },
      ],
    },
    keyLaws: [
      { name: "Health Products Act (Chapter 122D)", description: "Primary legislation for therapeutic products and medical devices", year: "2007" },
      { name: "Health Products (Medical Devices) Regulations 2010", description: "Specific medical device regulatory requirements", year: "2010" },
    ],
    submissionFlow: [
      { step: 1, title: "Appoint Local Responsible Person", description: "A Singapore-based company must be the registrant.", duration: "2–4 weeks" },
      { step: 2, title: "Device Classification", description: "Classify per HSA's GN-13 Guidance on Classification.", duration: "1 week" },
      { step: 3, title: "Registration Application", description: "Submit via MEDICS (Medical Device Information & Communication System) portal.", duration: "1–2 weeks" },
      { step: 4, title: "HSA Evaluation", description: "For Class C/D: Full Evaluation or Abridged Evaluation (if approved by reference agency: FDA, EU NB, Health Canada, TGA, PMDA).", duration: "Class B: 30 working days; Class C/D Full: 270 days; Abridged: 180 days" },
      { step: 5, title: "Registration Issued", description: "Device registered on SMDR (Singapore Medical Device Register)." },
    ],
    requiredForms: [
      { name: "MEDICS Registration Application", description: "Online submission via MEDICS portal", mandatory: true },
      { name: "STED (Summary Technical Documentation)", description: "Technical file in STED format", mandatory: true },
      { name: "Reference Agency Approval", description: "For abridged evaluation pathway", mandatory: false },
    ],
    timelines: { standardReview: "Class B: 30 working days; Class C/D Full: 270 working days; Abridged: 180 working days", renewalPeriod: "Registration valid for 5 years", notes: "Abridged evaluation (with reference agency approval) is significantly faster." },
    fees: [
      { category: "Class B Registration", amount: "SGD 400 (≈$300)" },
      { category: "Class C Registration", amount: "SGD 7,800 (≈$5,800)" },
      { category: "Class D Registration", amount: "SGD 12,800 (≈$9,500)" },
    ],
    localRequirements: [
      "Singapore-based registrant (local company) required",
      "Dealer's licence required to import/sell medical devices",
      "English labelling accepted (Singapore's official language)",
      "Adverse event reporting to HSA mandatory",
    ],
    tips: [
      "Use the abridged evaluation pathway if you have FDA, CE, TGA, Health Canada, or PMDA approval — saves 90 working days",
      "Singapore is a gateway to ASEAN markets — CSDT recognized here",
      "HSA's review is thorough but predictable — submit clean applications to avoid queries",
    ],
  },

  // ─── TAIWAN ───
  {
    countryCode: "TW", countryName: "Taiwan", flag: "🇹🇼", region: "Asia",
    overview: "Taiwan's Food and Drug Administration (TFDA) regulates medical devices under the Medical Devices Act enacted in 2021. The 3-class system requires registration for all devices marketed in Taiwan.",
    regulatoryAuthority: { name: "Taiwan Food and Drug Administration", abbreviation: "TFDA", website: "https://www.fda.gov.tw", description: "TFDA under the Ministry of Health and Welfare oversees medical device regulation in Taiwan." },
    classification: { system: "3-class system (I–III)",
      classes: [
        { name: "Class I", description: "Low risk — listing", examples: "Surgical instruments, medical furniture" },
        { name: "Class II", description: "Moderate risk — registration", examples: "Powered wheelchairs, blood pressure monitors" },
        { name: "Class III", description: "High risk — full registration", examples: "Coronary stents, pacemakers" },
      ],
    },
    keyLaws: [
      { name: "Medical Devices Act", description: "Standalone legislation specifically for medical devices (separated from Pharmaceutical Affairs Act)", year: "2021" },
    ],
    submissionFlow: [
      { step: 1, title: "Appoint Taiwan Authorized Representative", description: "Foreign manufacturers need a local representative.", duration: "2–4 weeks" },
      { step: 2, title: "Prepare Documentation", description: "Technical file including device description, testing data, clinical evidence.", duration: "2–4 months" },
      { step: 3, title: "Submit to TFDA", description: "Application via TFDA online system.", duration: "1–2 weeks" },
      { step: 4, title: "TFDA Review", description: "Technical review with possible queries.", duration: "Class I: 20–40 days; Class II: 40–80 days; Class III: 80–120 days" },
      { step: 5, title: "Licence Issued", description: "Marketing licence for Taiwan market." },
    ],
    requiredForms: [
      { name: "Registration Application", description: "Standard application form", mandatory: true },
      { name: "Technical Documentation", description: "Complete technical file", mandatory: true },
      { name: "Free Sale Certificate", description: "From country of origin", mandatory: true },
    ],
    timelines: { standardReview: "Class I: 20–40 days; Class II: 40–80 days; Class III: 80–120 days", renewalPeriod: "Licence validity varies" },
    fees: [
      { category: "Class I Listing", amount: "TWD 2,000–5,000 (≈$60–$150)" },
      { category: "Class II/III Registration", amount: "TWD 30,000–100,000 (≈$900–$3,000)" },
    ],
    localRequirements: [
      "Taiwan local representative mandatory",
      "Chinese (Traditional) labelling required",
      "TFDA accepts international test reports in many cases",
    ],
    tips: [
      "TFDA has relatively fast review times compared to other Asian markets",
      "The 2021 Medical Devices Act modernized the regulatory pathway — ensure compliance with current requirements",
    ],
  },

  // ─── MEXICO ───
  {
    countryCode: "MX", countryName: "Mexico", flag: "🇲🇽", region: "Americas",
    overview: "Mexico's Federal Commission for the Protection against Sanitary Risks (COFEPRIS) regulates medical devices. Classification follows 3 classes (I, II, III). Registration varies from notification to full premarket approval depending on risk class.",
    regulatoryAuthority: { name: "COFEPRIS", abbreviation: "COFEPRIS", website: "https://www.gob.mx/cofepris", description: "Federal Commission for the Protection against Sanitary Risk under the Ministry of Health." },
    classification: { system: "3-class system (I, II, III)",
      classes: [
        { name: "Class I", description: "Low risk — notification", examples: "Surgical instruments, hospital beds" },
        { name: "Class II", description: "Moderate risk — registration", examples: "Diagnostic equipment, imaging devices" },
        { name: "Class III", description: "High risk — full review", examples: "Implantable devices, life-support equipment" },
      ],
    },
    keyLaws: [
      { name: "General Health Law (Ley General de Salud)", description: "Primary health legislation", year: "1984" },
      { name: "Regulation of Health Supplies (Reglamento de Insumos para la Salud)", description: "Detailed regulations for medical devices" },
    ],
    submissionFlow: [
      { step: 1, title: "Appoint Mexican Legal Representative", description: "Foreign manufacturers need a Mexico-based legal representative.", duration: "2–4 weeks" },
      { step: 2, title: "Registration Application", description: "Submit via COFEPRIS online system.", duration: "1–2 weeks" },
      { step: 3, title: "COFEPRIS Review", description: "Technical evaluation including reference country approval review.", duration: "Class I: 20 days; Class II: 35 days; Class III: 60 days" },
    ],
    requiredForms: [
      { name: "COFEPRIS Registration Form", description: "Standard application", mandatory: true },
      { name: "Free Sale Certificate", description: "From country of origin with apostille", mandatory: true },
      { name: "GMP Certificate", description: "Quality system certification", mandatory: true },
    ],
    timelines: { standardReview: "Class I: 20 business days; Class II: 35 days; Class III: 60 days", renewalPeriod: "5 years" },
    fees: [
      { category: "Registration (Class I)", amount: "MXN 5,000–10,000 (≈$300–$600)" },
      { category: "Registration (Class III)", amount: "MXN 20,000–50,000 (≈$1,200–$3,000)" },
    ],
    localRequirements: [
      "Mexican legal representative required",
      "Spanish-language labelling mandatory",
      "NOM standards compliance where applicable",
      "Post-market adverse event reporting (tecnovigilancia)",
    ],
    tips: [
      "Having FDA clearance can expedite COFEPRIS review",
      "Professional Spanish translation is critical — regulatory terminology must be precise",
    ],
  },

  // ─── SOUTH AFRICA ───
  {
    countryCode: "ZA", countryName: "South Africa", flag: "🇿🇦", region: "Africa",
    overview: "South Africa's Health Products Regulatory Authority (SAHPRA) regulates medical devices under the Medicines and Related Substances Act. SAHPRA replaced the MCC and is implementing a new regulatory framework for medical devices with a risk-based classification system.",
    regulatoryAuthority: { name: "South African Health Products Regulatory Authority", abbreviation: "SAHPRA", website: "https://www.sahpra.org.za", description: "SAHPRA is the national regulatory authority for health products including medical devices in South Africa." },
    classification: { system: "4-class system (A, B, C, D) aligned with GHTF",
      classes: [
        { name: "Class A", description: "Low risk", examples: "Basic surgical instruments" },
        { name: "Class B", description: "Medium risk", examples: "Diagnostic equipment" },
        { name: "Class C", description: "Medium-high risk", examples: "Dialysis machines" },
        { name: "Class D", description: "High risk", examples: "Implantable devices, high-risk IVDs" },
      ],
    },
    keyLaws: [
      { name: "Medicines and Related Substances Act (Act 101 of 1965)", description: "Primary legislation governing health products", year: "1965" },
      { name: "SAHPRA Medical Device Regulations", description: "New regulations under implementation", year: "2022+" },
    ],
    submissionFlow: [
      { step: 1, title: "Establishment Listing", description: "Register the establishment with SAHPRA.", duration: "2–4 weeks" },
      { step: 2, title: "Device Listing/Registration", description: "Submit device notification (Class A/B) or registration (Class C/D) via SAHPRA online system.", duration: "1–2 weeks" },
      { step: 3, title: "SAHPRA Review", description: "Technical review against essential principles.", duration: "3–12 months" },
    ],
    requiredForms: [
      { name: "SAHPRA Registration Application", description: "Device registration form", mandatory: true },
      { name: "Technical Documentation", description: "STED-format technical file", mandatory: true },
      { name: "Free Sale Certificate", description: "From reference country", mandatory: true },
    ],
    timelines: { standardReview: "6–12 months (SAHPRA is building capacity)", renewalPeriod: "Not yet finalized" },
    fees: [
      { category: "Registration Application", amount: "ZAR 5,000–20,000 (≈$280–$1,100)" },
    ],
    localRequirements: [
      "Local authorized representative may be required",
      "English labelling accepted",
      "SAHPRA is still developing full regulatory framework — expect evolving requirements",
    ],
    tips: [
      "SAHPRA is in transition from old MCC system — stay updated on new requirements",
      "Having a CE or FDA approval helps but is not a substitute for SAHPRA registration",
      "Early engagement with SAHPRA is recommended given evolving regulatory landscape",
    ],
  },

  // ─── ISRAEL ───
  {
    countryCode: "IL", countryName: "Israel", flag: "🇮🇱", region: "Middle East",
    overview: "Israel's Ministry of Health (AMAR division) regulates medical devices. Israel heavily relies on reference country approvals (FDA, EU CE) to streamline its registration process.",
    regulatoryAuthority: { name: "Ministry of Health — AMAR Division", abbreviation: "AMAR", website: "https://www.health.gov.il", description: "AMAR (Administration of Medical Devices, Accessories and Radiation) regulates medical devices in Israel." },
    classification: { system: "Primarily relies on reference country classification",
      classes: [
        { name: "Group 1", description: "Devices with FDA 510(k) or CE marking — expedited", examples: "Most Class II devices" },
        { name: "Group 2", description: "Devices requiring additional Israeli review", examples: "Novel or high-risk devices" },
      ],
    },
    keyLaws: [
      { name: "Public Health Regulations (Medical Devices)", description: "Regulations governing import and marketing of medical devices", year: "Various" },
    ],
    submissionFlow: [
      { step: 1, title: "Appoint Israeli Importer", description: "A licensed Israeli importer is required.", duration: "2–4 weeks" },
      { step: 2, title: "Submit Registration", description: "Application via AMAR system with reference country approval.", duration: "1 week" },
      { step: 3, title: "AMAR Review", description: "Review of reference approval and Israeli-specific requirements.", duration: "1–6 months" },
    ],
    requiredForms: [
      { name: "AMAR Registration Form", description: "Standard registration application", mandatory: true },
      { name: "FDA Clearance / CE Certificate", description: "Reference country marketing authorization", mandatory: true },
      { name: "Free Sale Certificate", description: "From country of origin", mandatory: true },
    ],
    timelines: { standardReview: "1–6 months depending on device class and reference approval", renewalPeriod: "5 years" },
    fees: [
      { category: "Registration Fee", amount: "ILS 3,000–15,000 (≈$800–$4,000)" },
    ],
    localRequirements: [
      "Licensed Israeli importer required",
      "Hebrew labelling may be required for certain devices",
      "Reference country approval (FDA/CE) is the primary basis for approval",
    ],
    tips: [
      "FDA clearance or CE marking is essentially a prerequisite — obtain one of these first",
      "Israel has mutual recognition with several countries, speeding up the process",
    ],
  },

  // ─── SWITZERLAND ───
  {
    countryCode: "CH", countryName: "Switzerland", flag: "🇨🇭", region: "Europe",
    overview: "Switzerland's Swissmedic regulates medical devices. Following the EU MDR transition, Switzerland updated its Medical Devices Ordinance (MedDO) to align with EU MDR 2017/745. Switzerland has a Mutual Recognition Agreement (MRA) with the EU, though its status has been complicated by political developments.",
    regulatoryAuthority: { name: "Swissmedic", abbreviation: "Swissmedic", website: "https://www.swissmedic.ch", description: "Swiss Agency for Therapeutic Products — responsible for authorizing and supervising medical devices in Switzerland." },
    classification: { system: "Aligned with EU MDR classification (I, IIa, IIb, III)",
      classes: [
        { name: "Class I", description: "Low risk", examples: "Hospital beds, spectacles" },
        { name: "Class IIa", description: "Medium risk", examples: "Hearing aids" },
        { name: "Class IIb", description: "Medium-high risk", examples: "Ventilators" },
        { name: "Class III", description: "High risk", examples: "Heart valves" },
      ],
    },
    keyLaws: [
      { name: "Medical Devices Ordinance (MedDO)", description: "Swiss regulation aligned with EU MDR", year: "2020" },
      { name: "Therapeutic Products Act (TPA)", description: "Primary legislation", year: "2000" },
    ],
    submissionFlow: [
      { step: 1, title: "Appoint Swiss Authorized Representative", description: "Required for non-Swiss manufacturers.", duration: "2–4 weeks" },
      { step: 2, title: "Conformity Assessment", description: "EU CE certificate from a recognized EU Notified Body or Swiss Designated Conformity Assessment Body.", duration: "As per EU MDR" },
      { step: 3, title: "Registration with Swissmedic", description: "Register device and manufacturer in Swissmedic database.", duration: "2–4 weeks" },
    ],
    requiredForms: [
      { name: "Swissmedic Registration", description: "Online registration of device", mandatory: true },
      { name: "EU Declaration of Conformity", description: "Or Swiss Declaration of Conformity", mandatory: true },
      { name: "CE Certificate", description: "From EU NB or Swiss Designated Body", mandatory: true },
    ],
    timelines: { standardReview: "Registration: 2–4 weeks (if CE already obtained)", renewalPeriod: "Aligned with CE certificate validity" },
    fees: [
      { category: "Swissmedic Registration", amount: "CHF 300–2,000 (≈$340–$2,250)" },
    ],
    localRequirements: [
      "Swiss Authorized Representative required for foreign manufacturers",
      "Labelling in official Swiss languages (German, French, Italian) or English may be required",
      "MRA status with EU affects whether EU NB certificates are directly accepted",
    ],
    tips: [
      "If you already have EU CE marking, Swiss registration is relatively straightforward",
      "Monitor the EU-Switzerland MRA status — political developments may affect mutual recognition",
    ],
  },

  // Additional essential countries with condensed but useful entries

  {
    countryCode: "TR", countryName: "Turkey", flag: "🇹🇷", region: "Europe",
    overview: "Turkey's Turkish Medicines and Medical Devices Agency (TITCK) regulates medical devices. Turkey largely follows the EU MDR framework and requires CE marking. Local registration through the ÜTS (National Medical Device Information Bank) system is mandatory.",
    regulatoryAuthority: { name: "Turkish Medicines and Medical Devices Agency", abbreviation: "TITCK", website: "https://www.titck.gov.tr", description: "TITCK oversees the regulation and surveillance of medical devices in Turkey." },
    classification: { system: "Aligned with EU MDR (I, IIa, IIb, III)", classes: [
      { name: "Class I", description: "Low risk", examples: "Basic instruments" },
      { name: "Class IIa/IIb", description: "Medium risk", examples: "Diagnostic devices" },
      { name: "Class III", description: "High risk", examples: "Implantables" },
    ]},
    keyLaws: [{ name: "Medical Device Regulation (Turkey)", description: "Aligned with EU MDR 2017/745", year: "2021" }],
    submissionFlow: [
      { step: 1, title: "Obtain CE Marking", description: "CE marking is required for Turkey market entry.", duration: "Per EU MDR" },
      { step: 2, title: "Appoint Turkey Authorized Representative", description: "Foreign manufacturers need a local representative.", duration: "2–4 weeks" },
      { step: 3, title: "ÜTS Registration", description: "Register the device in Turkey's ÜTS database.", duration: "2–6 weeks" },
    ],
    requiredForms: [
      { name: "ÜTS Registration", description: "National device database registration", mandatory: true },
      { name: "CE Certificate", description: "Valid CE marking", mandatory: true },
    ],
    timelines: { standardReview: "2–6 weeks for ÜTS registration (after CE)", renewalPeriod: "Annual renewal" },
    fees: [{ category: "ÜTS Registration", amount: "TRY 5,000–20,000 (≈$150–$600)" }],
    localRequirements: ["Turkey Authorized Representative required", "Turkish-language labelling mandatory", "CE marking is prerequisite for market entry"],
    tips: ["Turkey is essentially a CE-mark dependent market — focus on EU MDR compliance first"],
  },

  {
    countryCode: "RU", countryName: "Russia", flag: "🇷🇺", region: "Europe",
    overview: "Russia regulates medical devices through Roszdravnadzor under Federal Law No. 323-FZ. Registration requires Russian testing and clinical evaluation. The EAEU (Eurasian Economic Union) regulatory framework is being adopted.",
    regulatoryAuthority: { name: "Federal Service for Surveillance in Healthcare", abbreviation: "Roszdravnadzor", website: "https://www.roszdravnadzor.gov.ru", description: "Roszdravnadzor oversees medical device registration and market surveillance in Russia." },
    classification: { system: "4-class system (1, 2a, 2b, 3) per EAEU framework", classes: [
      { name: "Class 1", description: "Low risk", examples: "Basic instruments" },
      { name: "Class 2a/2b", description: "Moderate risk", examples: "Diagnostic equipment" },
      { name: "Class 3", description: "High risk", examples: "Implantables, life-support" },
    ]},
    keyLaws: [
      { name: "Federal Law No. 323-FZ", description: "On Protection of Public Health", year: "2011" },
      { name: "EAEU Common Rules for Medical Devices", description: "Eurasian Economic Union harmonized regulations" },
    ],
    submissionFlow: [
      { step: 1, title: "Appoint Russian Authorized Representative", description: "Foreign manufacturers need a Russia-based representative.", duration: "2–4 weeks" },
      { step: 2, title: "Russian Testing", description: "Testing at Roszdravnadzor-accredited Russian labs.", duration: "3–12 months" },
      { step: 3, title: "Clinical Evaluation/Trials", description: "Clinical trials in Russia may be required for certain device classes.", duration: "6–18 months" },
      { step: 4, title: "Registration Application", description: "Submit via Roszdravnadzor online system.", duration: "6–12 months" },
    ],
    requiredForms: [
      { name: "Registration Dossier", description: "Complete technical file per Russian requirements", mandatory: true },
      { name: "Russian Test Reports", description: "From accredited Russian laboratories", mandatory: true },
    ],
    timelines: { standardReview: "12–24 months total", renewalPeriod: "Registration certificate validity varies (indefinite for some)" },
    fees: [{ category: "State Registration Fee", amount: "RUB 200,000–700,000 (≈$2,200–$7,500)" }],
    localRequirements: ["Russian Authorized Representative required", "Russian-language labelling mandatory", "Testing at Russian-accredited labs mandatory", "Clinical trials may be required in Russia"],
    tips: ["EAEU registration can provide access to Russia, Belarus, Kazakhstan, Armenia, and Kyrgyzstan simultaneously", "Russian testing requirements are separate from international standards — plan accordingly"],
  },

  {
    countryCode: "PK", countryName: "Pakistan", flag: "🇵🇰", region: "South Asia",
    overview: "Pakistan's Drug Regulatory Authority of Pakistan (DRAP) regulates medical devices under the DRAP Act 2012. The regulatory framework is developing, with increasing requirements for device registration.",
    regulatoryAuthority: { name: "Drug Regulatory Authority of Pakistan", abbreviation: "DRAP", website: "https://www.dfraps.gov.pk", description: "DRAP oversees the regulation of drugs and medical devices in Pakistan." },
    classification: { system: "Risk-based system being developed", classes: [
      { name: "Class A", description: "Low risk", examples: "Basic instruments" },
      { name: "Class B", description: "Moderate risk", examples: "Diagnostic devices" },
      { name: "Class C/D", description: "Higher risk", examples: "Implantables, IVDs" },
    ]},
    keyLaws: [{ name: "DRAP Act 2012", description: "Establishment of Drug Regulatory Authority with medical device powers", year: "2012" }],
    submissionFlow: [
      { step: 1, title: "Registration Application", description: "Submit to DRAP with technical documentation.", duration: "1–2 weeks" },
      { step: 2, title: "DRAP Review", description: "Assessment of device safety and quality.", duration: "3–12 months" },
    ],
    requiredForms: [
      { name: "DRAP Registration Form", description: "Standard application", mandatory: true },
      { name: "Free Sale Certificate", description: "From country of origin", mandatory: true },
      { name: "CE/FDA Approval", description: "Reference country marketing authorization", mandatory: true },
    ],
    timelines: { standardReview: "3–12 months", renewalPeriod: "5 years" },
    fees: [{ category: "Registration Fee", amount: "PKR 25,000–100,000 (≈$90–$360)" }],
    localRequirements: ["Local agent may be required", "English labelling generally accepted", "Reference country approval required"],
    tips: ["Pakistan's device regulatory framework is developing — stay current with DRAP updates", "Having WHO prequalification or CE/FDA approval significantly helps"],
  },

  {
    countryCode: "BD", countryName: "Bangladesh", flag: "🇧🇩", region: "South Asia",
    overview: "Bangladesh's Directorate General of Drug Administration (DGDA) is the regulatory authority. Medical device regulation is emerging, with the country developing a comprehensive framework.",
    regulatoryAuthority: { name: "Directorate General of Drug Administration", abbreviation: "DGDA", website: "https://www.dgda.gov.bd", description: "DGDA regulates pharmaceuticals and is extending its purview to medical devices." },
    classification: { system: "Framework under development", classes: [
      { name: "Low risk", description: "Basic devices", examples: "Instruments, consumables" },
      { name: "Higher risk", description: "Complex devices", examples: "Implants, diagnostics" },
    ]},
    keyLaws: [{ name: "Drug Act 1940 / Drug Control Ordinance 1982", description: "Primary legislation, being updated to cover medical devices", year: "1982" }],
    submissionFlow: [
      { step: 1, title: "Import Registration", description: "Submit import registration application to DGDA.", duration: "1–2 weeks" },
      { step: 2, title: "DGDA Review", description: "Assessment of documentation and reference approvals.", duration: "2–6 months" },
    ],
    requiredForms: [
      { name: "DGDA Import Registration", description: "Import licence application", mandatory: true },
      { name: "Free Sale Certificate", description: "From country of origin", mandatory: true },
    ],
    timelines: { standardReview: "2–6 months", renewalPeriod: "Annual" },
    fees: [{ category: "Registration Fee", amount: "BDT 10,000–50,000 (≈$90–$450)" }],
    localRequirements: ["Local importer required", "Reference country approval helpful", "English labelling generally accepted"],
    tips: ["Bangladesh's medical device regulation is in early stages — expect evolving requirements", "WHO prequalification is highly valued"],
  },

  {
    countryCode: "EG", countryName: "Egypt", flag: "🇪🇬", region: "Middle East",
    overview: "Egypt's Egyptian Drug Authority (EDA) regulates medical devices. The regulatory framework is becoming more structured with new requirements for device registration.",
    regulatoryAuthority: { name: "Egyptian Drug Authority", abbreviation: "EDA", website: "https://www.edaegypt.gov.eg", description: "EDA oversees drug and medical device regulation in Egypt." },
    classification: { system: "Risk-based classification aligned with GHTF", classes: [
      { name: "Class I", description: "Low risk", examples: "Basic instruments" },
      { name: "Class IIa/IIb", description: "Medium risk", examples: "Diagnostic devices" },
      { name: "Class III", description: "High risk", examples: "Implantables" },
    ]},
    keyLaws: [{ name: "Egyptian Drug Authority Law", description: "Legislation establishing EDA with medical device regulatory powers", year: "2019" }],
    submissionFlow: [
      { step: 1, title: "Appoint Egyptian Agent", description: "Local authorized representative required.", duration: "2–4 weeks" },
      { step: 2, title: "Registration Application", description: "Submit to EDA with documentation.", duration: "1–2 weeks" },
      { step: 3, title: "EDA Review", description: "Technical assessment.", duration: "3–12 months" },
    ],
    requiredForms: [
      { name: "EDA Registration Form", description: "Standard application", mandatory: true },
      { name: "CE Certificate / FDA Clearance", description: "Reference approval", mandatory: true },
      { name: "Free Sale Certificate", description: "From country of origin", mandatory: true },
    ],
    timelines: { standardReview: "3–12 months", renewalPeriod: "5 years" },
    fees: [{ category: "Registration Fee", amount: "EGP 5,000–50,000 (≈$100–$1,000)" }],
    localRequirements: ["Egyptian local agent required", "Arabic labelling mandatory", "Reference country approval required"],
    tips: ["Having CE or FDA approval is important for EDA registration", "Arabic translation must be high quality and accurate"],
  },

  {
    countryCode: "NG", countryName: "Nigeria", flag: "🇳🇬", region: "Africa",
    overview: "NAFDAC (National Agency for Food and Drug Administration and Control) regulates medical devices in Nigeria. The framework is developing with increasing emphasis on device quality and safety.",
    regulatoryAuthority: { name: "NAFDAC", abbreviation: "NAFDAC", website: "https://www.nafdac.gov.ng", description: "NAFDAC regulates food, drugs, medical devices, and other health products in Nigeria." },
    classification: { system: "Risk-based classification being implemented", classes: [
      { name: "Low risk", description: "Basic devices", examples: "Simple instruments" },
      { name: "Medium risk", description: "Moderate complexity", examples: "Diagnostic equipment" },
      { name: "High risk", description: "Complex devices", examples: "Implantables" },
    ]},
    keyLaws: [{ name: "NAFDAC Act", description: "Legislation establishing NAFDAC's regulatory authority" }],
    submissionFlow: [
      { step: 1, title: "Submit Registration", description: "Application to NAFDAC with documentation and reference approvals.", duration: "1–2 weeks" },
      { step: 2, title: "NAFDAC Review", description: "Technical and documentary assessment.", duration: "3–12 months" },
    ],
    requiredForms: [
      { name: "NAFDAC Registration Form", description: "Standard application", mandatory: true },
      { name: "Free Sale Certificate", description: "From country of origin", mandatory: true },
    ],
    timelines: { standardReview: "3–12 months", renewalPeriod: "5 years" },
    fees: [{ category: "Registration Fee", amount: "NGN 200,000–1,000,000 (≈$130–$650)" }],
    localRequirements: ["Local agent/distributor required", "English labelling accepted", "WHO prequalification highly valued"],
    tips: ["NAFDAC is increasingly active — engage early in the process", "WHO prequalification can significantly expedite approval"],
  },

  {
    countryCode: "KE", countryName: "Kenya", flag: "🇰🇪", region: "Africa",
    overview: "Kenya's Pharmacy and Poisons Board (PPB) regulates medical devices. Kenya is a key market in East Africa and is developing its regulatory framework aligned with WHO guidelines.",
    regulatoryAuthority: { name: "Pharmacy and Poisons Board", abbreviation: "PPB", website: "https://www.pharmacyboardkenya.org", description: "PPB oversees regulation of pharmaceuticals and medical devices in Kenya." },
    classification: { system: "Developing risk-based system", classes: [
      { name: "Low risk", description: "Basic devices", examples: "Consumables" },
      { name: "Higher risk", description: "Complex devices", examples: "Diagnostics, implants" },
    ]},
    keyLaws: [{ name: "Pharmacy and Poisons Act", description: "Primary legislation governing health products" }],
    submissionFlow: [
      { step: 1, title: "Submit Application to PPB", description: "Registration application with supporting documents.", duration: "1–2 weeks" },
      { step: 2, title: "PPB Review", description: "Assessment of safety and quality.", duration: "3–6 months" },
    ],
    requiredForms: [
      { name: "PPB Registration Form", description: "Standard application", mandatory: true },
      { name: "Free Sale Certificate", description: "From country of origin", mandatory: true },
    ],
    timelines: { standardReview: "3–6 months", renewalPeriod: "Annual" },
    fees: [{ category: "Registration Fee", amount: "KES 20,000–100,000 (≈$155–$775)" }],
    localRequirements: ["Local representative helpful", "English labelling accepted", "WHO prequalification valued"],
    tips: ["Kenya is a gateway to East African Community markets", "WHO prequalification is highly beneficial"],
  },

  {
    countryCode: "NZ", countryName: "New Zealand", flag: "🇳🇿", region: "Oceania",
    overview: "New Zealand's Medsafe (part of the Ministry of Health) regulates medical devices. NZ works closely with Australia's TGA and participates in the Trans-Tasman regulatory scheme.",
    regulatoryAuthority: { name: "Medsafe", abbreviation: "Medsafe", website: "https://www.medsafe.govt.nz", description: "Medsafe is New Zealand's medicines and medical devices safety authority." },
    classification: { system: "Aligned with GHTF/TGA classification", classes: [
      { name: "Class I", description: "Low risk", examples: "Bandages" },
      { name: "Class IIa/IIb", description: "Medium risk", examples: "Diagnostic devices" },
      { name: "Class III", description: "High risk", examples: "Implantables" },
    ]},
    keyLaws: [{ name: "Medicines Act 1981", description: "Primary legislation (medical devices provisions being updated)", year: "1981" }],
    submissionFlow: [
      { step: 1, title: "Sponsor Notification", description: "NZ sponsor must notify Medsafe of the device.", duration: "1–2 weeks" },
      { step: 2, title: "WAND Database Registration", description: "Register in the Web Assisted Notification of Devices database.", duration: "2–4 weeks" },
    ],
    requiredForms: [
      { name: "WAND Notification", description: "Online device notification", mandatory: true },
      { name: "Declaration of Conformity", description: "Manufacturer's declaration", mandatory: true },
    ],
    timelines: { standardReview: "2–4 weeks (notification-based system)", renewalPeriod: "Annual" },
    fees: [{ category: "WAND Notification", amount: "NZD 200–1,000 (≈$125–$625)" }],
    localRequirements: ["NZ sponsor required", "English labelling accepted", "Trans-Tasman cooperation with TGA"],
    tips: ["TGA approval can facilitate NZ market entry", "NZ is transitioning to a new Therapeutic Products Act — monitor changes"],
  },

  {
    countryCode: "TH", countryName: "Thailand", flag: "🇹🇭", region: "Southeast Asia",
    overview: "Thailand's Food and Drug Administration (Thai FDA) regulates medical devices under the Medical Device Act B.E. 2551 (2008). Devices are classified into 3 groups requiring varying levels of regulatory oversight.",
    regulatoryAuthority: { name: "Thai Food and Drug Administration", abbreviation: "Thai FDA", website: "https://www.fda.moph.go.th", description: "Thai FDA under the Ministry of Public Health regulates medical devices in Thailand." },
    classification: { system: "3-group system", classes: [
      { name: "Group 1", description: "General medical devices — notification", examples: "Surgical gloves, bandages" },
      { name: "Group 2", description: "Controlled medical devices — notification", examples: "Diagnostic kits, lenses" },
      { name: "Group 3", description: "Specially controlled — licence required", examples: "Implants, life-support, IVD HIV kits" },
    ]},
    keyLaws: [{ name: "Medical Device Act B.E. 2551", description: "Primary medical device legislation", year: "2008" }],
    submissionFlow: [
      { step: 1, title: "Appoint Thai Licence Holder", description: "Foreign manufacturers need a local licence holder/importer.", duration: "2–4 weeks" },
      { step: 2, title: "Thai FDA Submission", description: "Submit registration via Thai FDA system.", duration: "1–2 weeks" },
      { step: 3, title: "Thai FDA Review", description: "Assessment of technical and safety data.", duration: "Group 1/2: 30–60 days; Group 3: 6–12 months" },
    ],
    requiredForms: [
      { name: "Thai FDA Application Form", description: "Standard registration application", mandatory: true },
      { name: "Free Sale Certificate", description: "From country of origin with embassy attestation", mandatory: true },
    ],
    timelines: { standardReview: "Group 1/2: 30–60 days; Group 3: 6–12 months", renewalPeriod: "5 years" },
    fees: [{ category: "Registration Fee", amount: "THB 5,000–50,000 (≈$140–$1,400)" }],
    localRequirements: ["Thai local licence holder required", "Thai-language labelling mandatory", "ASEAN CSDT accepted for some product categories"],
    tips: ["Thailand accepts ASEAN Common Submission Dossier Template (CSDT) for certain devices", "Thai-language labelling is mandatory — professional translation required"],
  },

  {
    countryCode: "MY", countryName: "Malaysia", flag: "🇲🇾", region: "Southeast Asia",
    overview: "Malaysia's Medical Device Authority (MDA) regulates medical devices under the Medical Device Act 2012. Registration with MDA is mandatory before a device can be marketed.",
    regulatoryAuthority: { name: "Medical Device Authority", abbreviation: "MDA", website: "https://www.mda.gov.my", description: "MDA is Malaysia's sole regulatory authority for medical devices." },
    classification: { system: "4-class system (A, B, C, D)", classes: [
      { name: "Class A", description: "Low risk", examples: "Wheelchairs, tongue depressors" },
      { name: "Class B", description: "Medium-low risk", examples: "Surgical gloves, hearing aids" },
      { name: "Class C", description: "Medium-high risk", examples: "Ventilators, infusion pumps" },
      { name: "Class D", description: "High risk", examples: "Heart valves, HIV test kits" },
    ]},
    keyLaws: [{ name: "Medical Device Act 2012 (Act 737)", description: "Primary legislation for medical device regulation in Malaysia", year: "2012" }],
    submissionFlow: [
      { step: 1, title: "Appoint Malaysian Authorized Representative", description: "Required for foreign manufacturers.", duration: "2–4 weeks" },
      { step: 2, title: "Establishment Registration", description: "Register with MDA as device establishment.", duration: "2–4 weeks" },
      { step: 3, title: "Device Registration", description: "Submit registration via MDA online system.", duration: "1–2 weeks" },
      { step: 4, title: "MDA Review", description: "Technical assessment.", duration: "Class A: 30 days; Class B: 90 days; Class C/D: 180–270 days" },
    ],
    requiredForms: [
      { name: "MDA Registration Form", description: "Standard application via MeDC@St system", mandatory: true },
      { name: "CSDT (Common Submission Dossier Template)", description: "Technical documentation in ASEAN CSDT format", mandatory: true },
    ],
    timelines: { standardReview: "Class A: 30 days; Class B: 90 days; Class C/D: 180–270 days", renewalPeriod: "5 years" },
    fees: [{ category: "Registration (Class A)", amount: "MYR 200 (≈$45)" }, { category: "Registration (Class D)", amount: "MYR 5,000 (≈$1,100)" }],
    localRequirements: ["Malaysian Authorized Representative required", "English or Malay labelling", "ASEAN CSDT format for documentation"],
    tips: ["Malaysia is a key ASEAN market — use ASEAN CSDT format", "MDA registration is a good stepping stone for other ASEAN markets"],
  },

  {
    countryCode: "ID", countryName: "Indonesia", flag: "🇮🇩", region: "Southeast Asia",
    overview: "Indonesia's Ministry of Health regulates medical devices through the Directorate General of Pharmaceuticals and Medical Devices. Registration with the Ministry is mandatory.",
    regulatoryAuthority: { name: "Ministry of Health — Directorate of Medical Devices", abbreviation: "Kemenkes", website: "https://www.kemkes.go.id", description: "Indonesia's Ministry of Health oversees medical device regulation and registration." },
    classification: { system: "3-class risk-based system", classes: [
      { name: "Class A", description: "Low risk", examples: "Basic instruments" },
      { name: "Class B", description: "Medium risk", examples: "Diagnostic devices" },
      { name: "Class C", description: "High risk", examples: "Implantables" },
    ]},
    keyLaws: [{ name: "Regulation of the Minister of Health No. 62/2017", description: "Medical device distribution requirements", year: "2017" }],
    submissionFlow: [
      { step: 1, title: "Appoint Indonesian Distributor", description: "Licensed local distributor required.", duration: "2–4 weeks" },
      { step: 2, title: "Submit Registration", description: "Application via online system.", duration: "1–2 weeks" },
      { step: 3, title: "Ministry Review", description: "Technical assessment and document review.", duration: "3–12 months" },
    ],
    requiredForms: [
      { name: "Registration Application", description: "Standard form via online portal", mandatory: true },
      { name: "Free Sale Certificate", description: "From country of origin", mandatory: true },
    ],
    timelines: { standardReview: "3–12 months", renewalPeriod: "5 years" },
    fees: [{ category: "Registration Fee", amount: "IDR 5,000,000–30,000,000 (≈$320–$1,900)" }],
    localRequirements: ["Indonesian distributor required", "Bahasa Indonesia labelling mandatory", "SNI standards compliance where applicable"],
    tips: ["Indonesia is the largest ASEAN market — significant commercial opportunity", "Local language requirements are strict — invest in quality translation"],
  },

  {
    countryCode: "PH", countryName: "Philippines", flag: "🇵🇭", region: "Southeast Asia",
    overview: "The Philippines' FDA (Food and Drug Administration) regulates medical devices. The regulatory framework is developing and increasingly requires formal device registration.",
    regulatoryAuthority: { name: "Food and Drug Administration Philippines", abbreviation: "FDA PH", website: "https://www.fda.gov.ph", description: "Philippine FDA regulates food, drugs, cosmetics, and medical devices." },
    classification: { system: "ASEAN-aligned risk-based system", classes: [
      { name: "Class A", description: "Low risk", examples: "Simple instruments" },
      { name: "Class B/C", description: "Medium risk", examples: "Diagnostic devices" },
      { name: "Class D", description: "High risk", examples: "Implantables" },
    ]},
    keyLaws: [{ name: "Republic Act No. 9711 (FDA Act of 2009)", description: "Legislation establishing the Philippine FDA", year: "2009" }],
    submissionFlow: [
      { step: 1, title: "Appoint Filipino Trader", description: "Licensed local trader/distributor.", duration: "2–4 weeks" },
      { step: 2, title: "Registration Application", description: "Submit to Philippine FDA.", duration: "1–2 weeks" },
      { step: 3, title: "FDA Review", description: "Technical review.", duration: "3–12 months" },
    ],
    requiredForms: [
      { name: "Certificate of Product Registration (CPR)", description: "Registration application", mandatory: true },
      { name: "Free Sale Certificate", description: "From country of origin", mandatory: true },
    ],
    timelines: { standardReview: "3–12 months", renewalPeriod: "5 years" },
    fees: [{ category: "Registration", amount: "PHP 10,000–50,000 (≈$180–$900)" }],
    localRequirements: ["Licensed Filipino trader required", "English labelling accepted", "ASEAN CSDT recognized"],
    tips: ["The Philippines accepts ASEAN CSDT", "English labelling is accepted — one less translation requirement"],
  },

  {
    countryCode: "VN", countryName: "Vietnam", flag: "🇻🇳", region: "Southeast Asia",
    overview: "Vietnam's Ministry of Health regulates medical devices through the Department of Medical Equipment and Health Works. Registration is required for all medical devices.",
    regulatoryAuthority: { name: "Ministry of Health — Department of Medical Equipment", abbreviation: "MOH Vietnam", website: "https://moh.gov.vn", description: "Vietnam's MOH oversees medical device regulation and registration." },
    classification: { system: "4-class system (A, B, C, D) aligned with ASEAN", classes: [
      { name: "Class A", description: "Low risk", examples: "Basic instruments" },
      { name: "Class B", description: "Medium-low risk", examples: "Diagnostic equipment" },
      { name: "Class C", description: "Medium-high risk", examples: "Ventilators" },
      { name: "Class D", description: "High risk", examples: "Implantables" },
    ]},
    keyLaws: [{ name: "Decree 98/2021/ND-CP", description: "Medical device management regulations", year: "2021" }],
    submissionFlow: [
      { step: 1, title: "Appoint Vietnamese Importer", description: "Licensed local importer required.", duration: "2–4 weeks" },
      { step: 2, title: "Registration Application", description: "Submit to MOH.", duration: "1–2 weeks" },
      { step: 3, title: "MOH Review", description: "Technical assessment.", duration: "Class A/B: 1–3 months; Class C/D: 6–12 months" },
    ],
    requiredForms: [
      { name: "Registration Dossier", description: "Per Decree 98 requirements", mandatory: true },
      { name: "Free Sale Certificate", description: "From country of origin", mandatory: true },
    ],
    timelines: { standardReview: "Class A/B: 1–3 months; Class C/D: 6–12 months", renewalPeriod: "5 years" },
    fees: [{ category: "Registration Fee", amount: "VND 5,000,000–30,000,000 (≈$200–$1,200)" }],
    localRequirements: ["Vietnamese importer required", "Vietnamese-language labelling mandatory", "ASEAN CSDT format recognized"],
    tips: ["Vietnam is a fast-growing medical device market", "Decree 98/2021 modernized the regulatory framework — ensure compliance with current rules"],
  },

  {
    countryCode: "ASEAN", countryName: "ASEAN (CSDT)", flag: "🌏", region: "Southeast Asia",
    overview: "The ASEAN Medical Device Directive (AMDD) and Common Submission Dossier Template (CSDT) provide a harmonized framework for medical device regulation across ASEAN member states. While each country still has individual registration, CSDT standardizes documentation format.",
    regulatoryAuthority: { name: "ASEAN Medical Device Committee", abbreviation: "AMDC", website: "https://asean.org", description: "AMDC coordinates harmonization of medical device regulations across 10 ASEAN member states." },
    classification: { system: "4-class system (A, B, C, D) adopted by member states", classes: [
      { name: "Class A", description: "Low risk", examples: "Basic instruments" },
      { name: "Class B", description: "Medium-low risk", examples: "Diagnostic equipment" },
      { name: "Class C", description: "Medium-high risk", examples: "Ventilators" },
      { name: "Class D", description: "High risk", examples: "Implantables" },
    ]},
    keyLaws: [
      { name: "ASEAN Medical Device Directive (AMDD)", description: "Harmonized framework for medical device regulation across ASEAN" },
      { name: "ASEAN CSDT", description: "Common Submission Dossier Template for standardized documentation" },
    ],
    submissionFlow: [
      { step: 1, title: "Prepare CSDT Dossier", description: "Create documentation in ASEAN CSDT format — accepted by all member states.", duration: "2–4 months" },
      { step: 2, title: "Submit to Target Countries", description: "File registration individually in each ASEAN country using the CSDT.", duration: "Varies by country" },
    ],
    requiredForms: [
      { name: "ASEAN CSDT Dossier", description: "Harmonized documentation template accepted across ASEAN", mandatory: true },
      { name: "Individual Country Forms", description: "Country-specific registration forms still required", mandatory: true },
    ],
    timelines: { standardReview: "Varies by country (fastest: Singapore, Malaysia; slowest: Indonesia, Myanmar)", renewalPeriod: "Varies by country (typically 5 years)" },
    fees: [{ category: "Varies by country", amount: "See individual country entries" }],
    localRequirements: ["CSDT format standardizes documentation but each country has additional local requirements", "Local representatives needed in each country", "Language requirements vary by country"],
    tips: [
      "Prepare a single CSDT dossier and adapt for each country — significant time savings",
      "Start with Singapore or Malaysia (fastest reviewers) to build ASEAN market presence",
      "Plan for different labelling language requirements across ASEAN countries",
    ],
  },

  {
    countryCode: "AR", countryName: "Argentina", flag: "🇦🇷", region: "Americas",
    overview: "ANMAT (Administración Nacional de Medicamentos, Alimentos y Tecnología Médica) regulates medical devices in Argentina under Disposition 2318/2002 and related regulations.",
    regulatoryAuthority: { name: "ANMAT", abbreviation: "ANMAT", website: "https://www.argentina.gob.ar/anmat", description: "ANMAT is Argentina's regulatory authority for medicines, food, and medical technology." },
    classification: { system: "4-class system (I, II, III, IV)", classes: [
      { name: "Class I", description: "Low risk", examples: "Simple instruments" },
      { name: "Class II", description: "Medium-low risk", examples: "Surgical supplies" },
      { name: "Class III", description: "Medium-high risk", examples: "Implants" },
      { name: "Class IV", description: "High risk", examples: "Life-sustaining devices" },
    ]},
    keyLaws: [{ name: "Disposition 2318/2002", description: "Medical device regulation requirements" }],
    submissionFlow: [
      { step: 1, title: "Appoint Argentine Authorized Representative", description: "Local AR required.", duration: "2–4 weeks" },
      { step: 2, title: "Submit to ANMAT", description: "Registration application with documentation.", duration: "1–2 weeks" },
      { step: 3, title: "ANMAT Review", description: "Technical assessment.", duration: "6–18 months" },
    ],
    requiredForms: [
      { name: "ANMAT Registration Form", description: "Standard application", mandatory: true },
      { name: "Free Sale Certificate", description: "With apostille", mandatory: true },
    ],
    timelines: { standardReview: "6–18 months", renewalPeriod: "5 years" },
    fees: [{ category: "Registration Fee", amount: "ARS 50,000–200,000 (≈$50–$200)" }],
    localRequirements: ["Argentine authorized representative required", "Spanish labelling mandatory"],
    tips: ["ANMAT review times can be lengthy — plan accordingly", "MERCOSUR harmonization may benefit from Brazil/Argentina joint strategy"],
  },

  {
    countryCode: "CO", countryName: "Colombia", flag: "🇨🇴", region: "Americas",
    overview: "INVIMA (Instituto Nacional de Vigilancia de Medicamentos y Alimentos) regulates medical devices in Colombia.",
    regulatoryAuthority: { name: "INVIMA", abbreviation: "INVIMA", website: "https://www.invima.gov.co", description: "INVIMA oversees drug, food, and medical device regulation in Colombia." },
    classification: { system: "4-class system (I, IIa, IIb, III)", classes: [
      { name: "Class I", description: "Low risk", examples: "Basic instruments" },
      { name: "Class IIa/IIb", description: "Medium risk", examples: "Diagnostic devices" },
      { name: "Class III", description: "High risk", examples: "Implantables" },
    ]},
    keyLaws: [{ name: "Decree 4725 of 2005", description: "Medical device regulation", year: "2005" }],
    submissionFlow: [
      { step: 1, title: "Submit to INVIMA", description: "Registration application.", duration: "1–2 weeks" },
      { step: 2, title: "INVIMA Review", description: "Technical review.", duration: "3–12 months" },
    ],
    requiredForms: [
      { name: "INVIMA Registration Form", description: "Standard application", mandatory: true },
      { name: "Free Sale Certificate", description: "From country of origin with apostille", mandatory: true },
    ],
    timelines: { standardReview: "3–12 months", renewalPeriod: "10 years" },
    fees: [{ category: "Registration Fee", amount: "COP 2,000,000–10,000,000 (≈$500–$2,500)" }],
    localRequirements: ["Spanish labelling mandatory", "Local importer/distributor required"],
    tips: ["INVIMA has been improving processing times", "Colombia is part of the Pacific Alliance — monitor harmonization efforts"],
  },

  {
    countryCode: "CL", countryName: "Chile", flag: "🇨🇱", region: "Americas",
    overview: "ISP (Instituto de Salud Pública) regulates medical devices in Chile. The regulatory framework requires registration for most medical devices.",
    regulatoryAuthority: { name: "Instituto de Salud Pública", abbreviation: "ISP", website: "https://www.ispch.cl", description: "ISP is Chile's public health institute responsible for medical device regulation." },
    classification: { system: "Risk-based classification", classes: [
      { name: "Low risk", description: "Simple devices", examples: "Basic instruments" },
      { name: "Medium risk", description: "Moderate complexity", examples: "Diagnostic equipment" },
      { name: "High risk", description: "Complex devices", examples: "Implantables" },
    ]},
    keyLaws: [{ name: "Decreto 825", description: "Medical device registration requirements" }],
    submissionFlow: [
      { step: 1, title: "Submit to ISP", description: "Registration with technical documentation.", duration: "1–2 weeks" },
      { step: 2, title: "ISP Review", description: "Technical assessment.", duration: "3–6 months" },
    ],
    requiredForms: [
      { name: "ISP Registration Form", description: "Standard application", mandatory: true },
      { name: "Free Sale Certificate", description: "From country of origin", mandatory: true },
    ],
    timelines: { standardReview: "3–6 months", renewalPeriod: "5 years" },
    fees: [{ category: "Registration Fee", amount: "CLP 200,000–1,000,000 (≈$220–$1,100)" }],
    localRequirements: ["Spanish labelling mandatory", "Local representative required"],
    tips: ["Chile has relatively efficient registration processes for Latin America", "Part of Pacific Alliance — potential for harmonized submissions"],
  },
];
