import type { RegulatoryFramework } from "../types";

export const NG_FRAMEWORKS: RegulatoryFramework[] = [
  {
    id: "NG_NAFDAC",
    countryCode: "NG",
    countryName: "Nigeria",
    flag: "🇳🇬",
    authority: "NAFDAC",
    documentType: "Medical Device Registration",
    sections: [
      {
        id: "s1",
        title: "Administrative Information",
        description: "Applicant details, Nigerian agent, and device identification for NAFDAC registration",
        fields: [
          { id: "1.1", label: "Applicant (Manufacturer)", hint: "Legal manufacturer name, address, and contact details as they will appear on the NAFDAC medical device registration certificate" },
          { id: "1.2", label: "Nigerian Agent / Importer", hint: "NAFDAC-licensed Nigerian agent or importer with valid NAFDAC import permit and Corporate Affairs Commission (CAC) registration number" },
          { id: "1.3", label: "NAFDAC Registration Number", hint: "Existing NAFDAC registration number for renewal or variation; leave blank for new applications submitted via the NAFDAC ATRRS online portal" },
          { id: "1.4", label: "Device Name", hint: "Official device trade name as it will appear on the NAFDAC registration certificate, matching manufacturer labelling and marketing materials" },
          { id: "1.5", label: "NAFDAC Classification", hint: "Risk classification per NAFDAC classification rules: Class A (low), B (low-moderate), C (moderate-high), or D (high) aligned with IMDRF principles" },
        ],
      },
      {
        id: "s2",
        title: "Device Description",
        description: "Technical characterization and specifications for NAFDAC technical review",
        fields: [
          { id: "2.1", label: "Device Description", hint: "Detailed technical description including design, dimensions, weight, operating principles, and key performance characteristics per NAFDAC format", textarea: true },
          { id: "2.2", label: "Intended Use", hint: "Precise statement of intended medical purpose, target patient population, medical condition, clinical context, and intended user (professional or lay)", textarea: true },
          { id: "2.3", label: "Technical Specifications", hint: "Measurable performance specifications including dimensions, tolerances, electrical ratings (accounting for Nigerian 230V/50Hz mains), and output parameters" },
          { id: "2.4", label: "Materials & Composition", hint: "Complete materials list for patient-contacting and critical components with material grades, biological origin, and biocompatibility references", textarea: true },
          { id: "2.5", label: "Key Components", hint: "Critical subassemblies and functional components with part numbers, specifications, and quality-critical supplier information" },
          { id: "2.6", label: "Software Information", hint: "Software version, IEC 62304 safety class, SaMD classification, SOUP inventory, and cybersecurity considerations for software-containing devices", textarea: true },
        ],
      },
      {
        id: "s3",
        title: "Quality System",
        description: "Quality management system and GMP compliance documentation for NAFDAC",
        fields: [
          { id: "3.1", label: "ISO 13485 Certification", hint: "Current ISO 13485:2016 certificate with scope covering the registered device, issued by an accredited certification body with validity dates" },
          { id: "3.2", label: "GMP Compliance", hint: "Evidence of GMP compliance acceptable to NAFDAC, including facility inspection report or international GMP certification (MDSAP, EU NB audit)" },
          { id: "3.3", label: "Facility License", hint: "NAFDAC facility license or registration for the Nigerian agent's storage and distribution facility meeting NAFDAC premises requirements" },
          { id: "3.4", label: "QMS Documentation", hint: "Quality manual scope, key QMS procedures (design control, CAPA, complaint handling), and summary of most recent management review", textarea: true },
        ],
      },
      {
        id: "s4",
        title: "Testing & Performance",
        description: "Verification and validation testing per Nigerian and international standards",
        fields: [
          { id: "4.1", label: "NIS Standards", hint: "Applicable Nigerian Industrial Standards (NIS) issued by the Standards Organisation of Nigeria (SON) with conformity status and test evidence", textarea: true },
          { id: "4.2", label: "Performance Testing", hint: "Design verification test reports demonstrating the device meets all design output specifications under nominal and worst-case conditions", textarea: true },
          { id: "4.3", label: "Biocompatibility (ISO 10993)", hint: "Biological evaluation per ISO 10993-1:2018 with endpoint selection rationale, test reports from accredited laboratories for applicable endpoints", textarea: true },
          { id: "4.4", label: "Electrical Safety (IEC 60601)", hint: "IEC 60601-1 and applicable particular standards test reports from an accredited laboratory for electrically powered medical devices", textarea: true },
          { id: "4.5", label: "Sterilization Validation", hint: "Sterilization validation per ISO 11135, ISO 11137, or ISO 17665 with demonstrated SAL of 10⁻⁶ for devices supplied sterile" },
          { id: "4.6", label: "Stability / Shelf Life", hint: "Real-time and accelerated aging studies per ASTM F1980 considering Nigerian tropical climate conditions (Zone IVb) with packaging integrity testing" },
        ],
      },
      {
        id: "s5",
        title: "Clinical Evidence",
        description: "Clinical data supporting device safety and performance for NAFDAC review",
        fields: [
          { id: "5.1", label: "Clinical Evaluation Report", hint: "Systematic clinical evaluation demonstrating benefit-risk acceptability using MEDDEV 2.7/1 Rev 4 or equivalent methodology accepted by NAFDAC", textarea: true },
          { id: "5.2", label: "Clinical Data", hint: "Clinical investigation data per ISO 14155 (if conducted) or post-market clinical experience data supporting safety and performance claims", textarea: true },
        ],
      },
      {
        id: "s6",
        title: "Labelling",
        description: "English-language labelling and instructions for use per NAFDAC requirements",
        fields: [
          { id: "6.1", label: "Device Labels (English)", hint: "All device labels in English per NAFDAC labelling guidelines including device name, manufacturer, NAFDAC registration number, and batch/serial number" },
          { id: "6.2", label: "Instructions for Use", hint: "Complete IFU in English with indications, contraindications, warnings, precautions, operating instructions, maintenance, and disposal guidance", textarea: true },
          { id: "6.3", label: "Packaging Labels", hint: "Inner and outer packaging labels with storage conditions (tropical climate considerations), sterility indicators, and symbols per ISO 15223-1" },
          { id: "6.4", label: "NAFDAC-Specific Requirements", hint: "NAFDAC-mandated labelling elements including NAFDAC registration number, green/brown colour-coded NAFDAC label, and Nigerian importer identification" },
        ],
      },
      {
        id: "s7",
        title: "Manufacturing",
        description: "Manufacturing site information and production quality control",
        fields: [
          { id: "7.1", label: "Manufacturing Sites", hint: "Name, address, and regulatory status of all manufacturing, assembly, packaging, and sterilization facilities with scope of activities" },
          { id: "7.2", label: "Manufacturing Process", hint: "Process flow from raw materials to finished device release including critical steps, in-process controls, and special process validations", textarea: true },
          { id: "7.3", label: "Quality Control", hint: "Incoming, in-process, and final inspection/testing procedures with acceptance criteria, sampling plans, and measurement equipment calibration" },
        ],
      },
      {
        id: "s8",
        title: "Certificates & Post-Market",
        description: "Supporting certificates, post-market surveillance, and pharmacovigilance for NAFDAC",
        fields: [
          { id: "8.1", label: "Free Sale Certificate", hint: "Certificate of Free Sale from country of origin confirming the device is legally marketed, authenticated by the Nigerian embassy or apostilled" },
          { id: "8.2", label: "ISO 13485 Certificate", hint: "Current ISO 13485:2016 certificate copy with certification body accreditation details, scope statement, and validity dates" },
          { id: "8.3", label: "WHO Prequalification (if applicable)", hint: "WHO Prequalification listing or Expression of Interest status for devices in WHO priority categories (e.g., IVDs, reproductive health devices)" },
          { id: "8.4", label: "Foreign Regulatory Approvals", hint: "Summary of marketing authorizations in reference jurisdictions (FDA, EU, Japan, Canada, Australia, South Africa) with approval dates and scope", textarea: true },
          { id: "8.5", label: "Pharmacovigilance System", hint: "NAFDAC pharmacovigilance system registration including designated safety contact, Med Safety app reporting, and signal detection procedures", textarea: true },
          { id: "8.6", label: "Adverse Event Reporting", hint: "Procedure for reporting serious adverse events and field safety corrective actions to NAFDAC within mandated timelines per Nigerian regulations", textarea: true },
        ],
      },
    ],
  },
];
