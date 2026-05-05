import type { RegulatoryFramework } from "../types";

export const BD_FRAMEWORKS: RegulatoryFramework[] = [
  {
    id: "BD_DGDA",
    countryCode: "BD",
    countryName: "Bangladesh",
    flag: "🇧🇩",
    authority: "DGDA",
    documentType: "Medical Device Registration",
    sections: [
      {
        id: "s1",
        title: "Administrative Information",
        description: "Applicant identity, DGDA credentials, and local authorized representation",
        fields: [
          { id: "1.1", label: "Applicant/Importer Name & Address", hint: "Full legal name and registered address of the importer or local manufacturer applying for DGDA medical device registration" },
          { id: "1.2", label: "DGDA Registration Number", hint: "Unique registration or licence number issued by the Directorate General of Drug Administration for the establishment" },
          { id: "1.3", label: "Local Authorized Representative", hint: "Name and contact details of the Bangladesh-based authorized representative responsible for regulatory communications with DGDA" },
          { id: "1.4", label: "Device Name (English/Bengali)", hint: "Official device name in both English and Bengali as it will appear on the DGDA registration certificate and labelling" },
        ],
      },
      {
        id: "s2",
        title: "Device Description",
        description: "Technical characterization including design, materials, and classification",
        fields: [
          { id: "2.1", label: "General Description", hint: "Comprehensive narrative of the device design, operating principle, key functional characteristics, and intended environment of use", textarea: true },
          { id: "2.2", label: "Intended Purpose & Indications", hint: "Statement of intended medical purpose, target patient population, clinical indications, and conditions of use", textarea: true },
          { id: "2.3", label: "Technical Specifications", hint: "Measurable parameters including physical dimensions, weight, electrical ratings, output specifications, and performance tolerances", textarea: true },
          { id: "2.4", label: "Materials & Composition", hint: "Complete list of materials used in device construction including body-contacting materials with grade and biocompatibility references" },
          { id: "2.5", label: "Classification per DGDA Rules", hint: "Risk-based classification assigned per DGDA medical device classification guidance aligned with IMDRF categorization principles" },
        ],
      },
      {
        id: "s3",
        title: "Quality Management System",
        description: "QMS certification evidence and quality system documentation for DGDA review",
        fields: [
          { id: "3.1", label: "ISO 13485 Certificate Details", hint: "Certificate number, issuing certification body, scope of certification, manufacturing sites covered, and validity dates" },
          { id: "3.2", label: "GMP Compliance Evidence", hint: "Summary of Good Manufacturing Practice compliance including latest audit report findings, observations, and corrective actions", textarea: true },
          { id: "3.3", label: "Quality System Documentation Summary", hint: "Overview of quality management system scope, key processes, document control, design controls, and production controls", textarea: true },
        ],
      },
      {
        id: "s4",
        title: "Testing & Performance",
        description: "Verification and validation testing per Bangladesh Standards and international standards",
        fields: [
          { id: "4.1", label: "Applicable Standards (BDS/ISO/IEC)", hint: "List of Bangladesh Standards (BDS), ISO, and IEC standards applied with declaration of full or partial conformity for each" },
          { id: "4.2", label: "Biocompatibility Evaluation", hint: "Biological evaluation per ISO 10993-1 with endpoint selection rationale based on body contact nature, duration, and frequency", textarea: true },
          { id: "4.3", label: "Performance Testing Data", hint: "Design verification and validation test reports demonstrating the device meets specified performance requirements and design outputs", textarea: true },
          { id: "4.4", label: "Electrical Safety (If Applicable)", hint: "IEC 60601-1 and applicable collateral/particular standard test results for electrically powered medical devices and EMC per IEC 60601-1-2", textarea: true },
          { id: "4.5", label: "Sterilization & Stability Studies", hint: "Sterilization validation per ISO 11135/11137/17665 and shelf life studies per ASTM F1980 with sterile barrier integrity testing", textarea: true },
        ],
      },
      {
        id: "s5",
        title: "Clinical Evidence",
        description: "Clinical data supporting device safety and performance for DGDA evaluation",
        fields: [
          { id: "5.1", label: "Clinical Evaluation Report", hint: "Systematic assessment of clinical data establishing benefit-risk acceptability for the device's intended use in Bangladesh", textarea: true },
          { id: "5.2", label: "Clinical Data Summary", hint: "Synopsis of clinical investigations per ISO 14155 or equivalent including study design, patient demographics, outcomes, and adverse events", textarea: true },
          { id: "5.3", label: "Literature Review", hint: "Structured literature search across medical databases with critical appraisal of published clinical evidence for the device or equivalents", textarea: true },
        ],
      },
      {
        id: "s6",
        title: "Risk Management",
        description: "Risk management activities per ISO 14971 throughout the product lifecycle",
        fields: [
          { id: "6.1", label: "Risk Management per ISO 14971", hint: "Documented risk management plan defining scope, risk acceptability criteria, verification activities, and review milestones per ISO 14971", textarea: true },
          { id: "6.2", label: "Hazard Analysis & Risk Control", hint: "Systematic hazard identification using FMEA or FTA with risk estimation, evaluation against acceptability criteria, and control measures", textarea: true },
          { id: "6.3", label: "Residual Risk Evaluation", hint: "Assessment of individual and overall residual risk after implementation of control measures with benefit-risk determination", textarea: true },
        ],
      },
      {
        id: "s7",
        title: "Labelling",
        description: "Device labelling, instructions for use, and DGDA-specific marking requirements",
        fields: [
          { id: "7.1", label: "Device Labels (English/Bengali)", hint: "Artwork and content of device labels in both English and Bengali per DGDA requirements including symbols per ISO 15223-1" },
          { id: "7.2", label: "Instructions for Use", hint: "Complete IFU document covering setup, operation, maintenance, troubleshooting, and disposal in English and Bengali as required", textarea: true },
          { id: "7.3", label: "Packaging Labels", hint: "Outer packaging label artwork including device name, manufacturer, batch/lot number, storage conditions, expiry date, and UDI" },
          { id: "7.4", label: "DGDA-Specific Marking Requirements", hint: "Compliance with DGDA labelling provisions including registration number display, import licence reference, and local representative details" },
        ],
      },
      {
        id: "s8",
        title: "Certificates & Post-Market",
        description: "Regulatory certificates, foreign approvals, and post-market surveillance obligations",
        fields: [
          { id: "8.1", label: "Free Sale Certificate", hint: "Certificate of free sale issued by the regulatory authority of the country of origin confirming the device is legally marketed there" },
          { id: "8.2", label: "ISO 13485 Certificate", hint: "Current ISO 13485 quality management system certificate covering the manufacturing site and processes relevant to the device" },
          { id: "8.3", label: "Foreign Regulatory Approvals", hint: "Summary of approvals from recognized authorities such as US FDA, EU CE marking, TGA, or Health Canada with reference numbers", textarea: true },
          { id: "8.4", label: "Post-Market Surveillance Plan", hint: "Proactive and reactive PMS plan including complaint handling, trend analysis, periodic safety update reports, and PMCF if applicable", textarea: true },
          { id: "8.5", label: "Adverse Event Reporting to DGDA", hint: "Procedures for mandatory reporting of serious adverse events and field safety corrective actions to DGDA within required timelines", textarea: true },
        ],
      },
    ],
  },
];
