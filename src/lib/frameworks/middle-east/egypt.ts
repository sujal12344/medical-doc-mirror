import type { RegulatoryFramework } from "../types";

export const EG_FRAMEWORKS: RegulatoryFramework[] = [
  {
    id: "EG_EDA",
    countryCode: "EG",
    countryName: "Egypt",
    flag: "🇪🇬",
    authority: "EDA",
    documentType: "Medical Device Registration",
    sections: [
      {
        id: "s1",
        title: "Administrative Information",
        description: "Applicant identification, Egyptian agent, and device listing for EDA registration",
        fields: [
          { id: "1.1", label: "Applicant (Manufacturer)", hint: "Legal manufacturer name, address, and contact details as they will appear on the EDA registration certificate" },
          { id: "1.2", label: "Egyptian Agent / Importer", hint: "Egyptian commercial agent or authorized importer licensed by the Egyptian Drug Authority (EDA) to import and distribute the medical device" },
          { id: "1.3", label: "EDA Registration Number", hint: "Existing EDA medical device registration number for renewal or variation; leave blank for new applications submitted to the EDA medical devices sector" },
          { id: "1.4", label: "Device Name (Arabic)", hint: "Official device name in Arabic as required by EDA for registration certificate and Arabic-language labelling in the Egyptian market" },
          { id: "1.5", label: "Device Name (English)", hint: "Official device name in English matching the manufacturer's marketing name, model numbers, and catalogue references" },
          { id: "1.6", label: "EDA Classification", hint: "Risk classification per EDA classification rules: Class I, IIa, IIb, or III aligned with GHTF/IMDRF principles and Egyptian medical device regulations" },
        ],
      },
      {
        id: "s2",
        title: "Device Description",
        description: "Technical characterization and specifications for EDA technical review",
        fields: [
          { id: "2.1", label: "Device Description", hint: "Detailed technical description including design, dimensions, weight, operating principles, and functional characteristics per EDA submission format", textarea: true },
          { id: "2.2", label: "Intended Use", hint: "Precise statement of intended medical purpose, target patient population, medical condition, clinical context, and intended user profile", textarea: true },
          { id: "2.3", label: "Technical Specifications", hint: "Measurable performance specifications including dimensions, tolerances, electrical ratings, output parameters, and operating/storage conditions" },
          { id: "2.4", label: "Materials & Composition", hint: "Complete materials list for patient-contacting and critical components with material grades, biological origin, and biocompatibility classification", textarea: true },
          { id: "2.5", label: "Key Components", hint: "Critical subassemblies and functional components with part numbers, specifications, and quality-critical designations" },
          { id: "2.6", label: "Software Information", hint: "Software version, IEC 62304 safety class, SaMD classification, SOUP inventory, and cybersecurity considerations for software-containing devices", textarea: true },
        ],
      },
      {
        id: "s3",
        title: "Quality System",
        description: "Quality management system documentation and GMP compliance for EDA",
        fields: [
          { id: "3.1", label: "ISO 13485 Certification", hint: "Current ISO 13485:2016 certificate with scope covering the registered device, issued by an accredited certification body with validity dates" },
          { id: "3.2", label: "EDA GMP Compliance", hint: "Evidence of GMP compliance acceptable to EDA, including facility inspection report or recognition of international GMP certifications (MDSAP, EU NB audit)" },
          { id: "3.3", label: "Facility Inspection", hint: "EDA or recognized third-party facility inspection report for manufacturing sites, including corrective action status for any observations", textarea: true },
          { id: "3.4", label: "QMS Scope & Procedures", hint: "Quality manual scope, key QMS procedures (design control, CAPA, complaint handling, supplier management), and management review summary", textarea: true },
        ],
      },
      {
        id: "s4",
        title: "Testing & Performance",
        description: "Verification and validation testing per Egyptian and international standards",
        fields: [
          { id: "4.1", label: "Egyptian Standards (ES)", hint: "Applicable Egyptian Standards (ES) issued by the Egyptian Organization for Standardization (EOS) with conformity status and test evidence", textarea: true },
          { id: "4.2", label: "Biocompatibility (ISO 10993)", hint: "Biological evaluation per ISO 10993-1:2018 with endpoint selection rationale, test reports from accredited laboratories for applicable endpoints", textarea: true },
          { id: "4.3", label: "Performance Testing", hint: "Design verification test reports demonstrating the device meets all design output specifications under nominal and worst-case conditions", textarea: true },
          { id: "4.4", label: "Electrical Safety (IEC 60601)", hint: "IEC 60601-1 and applicable particular standards test reports from an accredited laboratory for electrically powered medical devices", textarea: true },
          { id: "4.5", label: "Sterilization Validation", hint: "Sterilization validation per ISO 11135 (EtO), ISO 11137 (radiation), or ISO 17665 (steam) with demonstrated SAL of 10⁻⁶ for sterile devices" },
          { id: "4.6", label: "Stability / Shelf Life", hint: "Real-time and accelerated aging studies per ASTM F1980 with packaging integrity testing per ISO 11607 supporting claimed shelf life" },
        ],
      },
      {
        id: "s5",
        title: "Clinical Evidence",
        description: "Clinical data supporting device safety and performance for EDA review",
        fields: [
          { id: "5.1", label: "Clinical Evaluation Report", hint: "Systematic clinical evaluation demonstrating benefit-risk acceptability, using MEDDEV 2.7/1 Rev 4 or equivalent methodology accepted by EDA", textarea: true },
          { id: "5.2", label: "Clinical Data", hint: "Clinical investigation data per ISO 14155 (if conducted) or post-market clinical experience data supporting safety and performance claims", textarea: true },
        ],
      },
      {
        id: "s6",
        title: "Labelling",
        description: "Bilingual labelling and instructions for use per EDA requirements",
        fields: [
          { id: "6.1", label: "Arabic Labels", hint: "All device labels in Arabic per EDA labelling requirements including device name, manufacturer, Egyptian agent, and EDA registration number" },
          { id: "6.2", label: "English Labels", hint: "Device labels in English with manufacturer name, model/catalogue number, lot/serial number, manufacturing date, and expiry date" },
          { id: "6.3", label: "Instructions for Use", hint: "Complete IFU in Arabic and English with indications, contraindications, warnings, precautions, operating instructions, and maintenance", textarea: true },
          { id: "6.4", label: "Packaging Labels", hint: "Inner and outer packaging labels in Arabic and English with storage conditions, sterility indicators, and symbols per ISO 15223-1" },
          { id: "6.5", label: "EDA-Specific Requirements", hint: "EDA-mandated labelling elements including registration number placement, Arabic text formatting, and Egyptian import sticker requirements" },
        ],
      },
      {
        id: "s7",
        title: "Manufacturing",
        description: "Manufacturing site information and production quality control",
        fields: [
          { id: "7.1", label: "Manufacturing Sites", hint: "Name, address, and regulatory status of all manufacturing, assembly, packaging, and sterilization facilities with scope of activities" },
          { id: "7.2", label: "Manufacturing Process Overview", hint: "Process flow from raw materials to finished device release including critical process steps, in-process controls, and validated processes", textarea: true },
          { id: "7.3", label: "Quality Control", hint: "Incoming, in-process, and final inspection/testing procedures with acceptance criteria, sampling plans, and measurement equipment calibration" },
        ],
      },
      {
        id: "s8",
        title: "Certificates & Post-Market",
        description: "Supporting certificates, post-market surveillance, and vigilance reporting to EDA",
        fields: [
          { id: "8.1", label: "Free Sale Certificate", hint: "Certificate of Free Sale from country of origin confirming the device is legally marketed, authenticated by the Egyptian embassy or apostilled" },
          { id: "8.2", label: "CE / FDA Certificate", hint: "EC/EU Declaration of Conformity with NB certificate or FDA 510(k)/PMA clearance letter — EDA accepts devices with prior CE or FDA approval" },
          { id: "8.3", label: "ISO 13485 Certificate", hint: "Current ISO 13485:2016 certificate copy with certification body accreditation, scope statement, and validity dates" },
          { id: "8.4", label: "Egyptian Laboratory Testing", hint: "Test reports from EDA-recognized Egyptian laboratories (e.g., National Institute of Standards) if required for specific device categories" },
          { id: "8.5", label: "Post-Market Surveillance Plan", hint: "Post-market surveillance plan including complaint handling, trend analysis, and periodic safety reporting to EDA", textarea: true },
          { id: "8.6", label: "Adverse Event Reporting", hint: "Procedure for reporting serious incidents and field safety corrective actions to EDA within mandated timelines per Egyptian medical device regulations", textarea: true },
        ],
      },
    ],
  },
];
