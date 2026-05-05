import type { RegulatoryFramework } from "../types";

export const PK_FRAMEWORKS: RegulatoryFramework[] = [
  {
    id: "PK_DRAP",
    countryCode: "PK",
    countryName: "Pakistan",
    flag: "🇵🇰",
    authority: "DRAP",
    documentType: "Medical Device Registration",
    sections: [
      {
        id: "s1",
        title: "Administrative Information",
        description: "Applicant identity, DRAP registration credentials, and authorized local representation",
        fields: [
          { id: "1.1", label: "Applicant Name & Address", hint: "Full legal name and registered address of the manufacturer or applicant seeking DRAP medical device registration" },
          { id: "1.2", label: "DRAP Registration Number", hint: "Unique registration number assigned by the Drug Regulatory Authority of Pakistan for the establishment or prior submissions" },
          { id: "1.3", label: "Authorized Agent in Pakistan", hint: "Name and licence details of the Pakistan-based authorized agent responsible for regulatory liaison with DRAP" },
          { id: "1.4", label: "Device Trade Name", hint: "Proprietary or brand name under which the medical device will be marketed and registered in Pakistan" },
          { id: "1.5", label: "Device Classification (DRAP)", hint: "Risk-based classification per DRAP Medical Device Rules — Class A (lowest), B, C, or D (highest risk)" },
        ],
      },
      {
        id: "s2",
        title: "Device Description",
        description: "Technical characterization of the device including design, materials, and software",
        fields: [
          { id: "2.1", label: "General Description of Device", hint: "Comprehensive narrative of the device design, operating principle, and key functional characteristics", textarea: true },
          { id: "2.2", label: "Intended Use & Indications", hint: "Statement of intended medical purpose, target patient population, clinical indications, and contraindications", textarea: true },
          { id: "2.3", label: "Technical Specifications & Dimensions", hint: "Measurable parameters including physical dimensions, weight, electrical ratings, and performance specifications", textarea: true },
          { id: "2.4", label: "Materials & Composition", hint: "Complete list of materials used in device construction, including body-contacting materials with grade and supplier references" },
          { id: "2.5", label: "Components List", hint: "Itemized bill of components and sub-assemblies with part numbers, suppliers, and functional descriptions", textarea: true },
          { id: "2.6", label: "Software Description", hint: "Software architecture, version, level of concern, IEC 62304 lifecycle class, and cybersecurity considerations if applicable", textarea: true },
        ],
      },
      {
        id: "s3",
        title: "Quality Management System",
        description: "QMS certification, GMP compliance, and quality infrastructure documentation",
        fields: [
          { id: "3.1", label: "ISO 13485 Certificate Details", hint: "Certificate number, issuing notified body, scope of certification, and validity dates for the ISO 13485 QMS certificate" },
          { id: "3.2", label: "GMP Compliance Documentation", hint: "Summary of Good Manufacturing Practice compliance including facility audit findings and corrective actions taken", textarea: true },
          { id: "3.3", label: "Quality Manual Scope & Structure", hint: "Overview of the quality manual including QMS scope, process interactions, and exclusions with justification per ISO 13485", textarea: true },
          { id: "3.4", label: "Management Review & CAPA Procedures", hint: "Description of management review frequency, CAPA process workflow, root cause analysis methodology, and effectiveness checks", textarea: true },
        ],
      },
      {
        id: "s4",
        title: "Testing & Performance",
        description: "Verification and validation testing per applicable Pakistan Standards and international standards",
        fields: [
          { id: "4.1", label: "Applicable Standards (PS / ISO / IEC)", hint: "List of Pakistan Standards (PS), ISO, and IEC standards applied with declaration of full or partial conformity for each" },
          { id: "4.2", label: "Biocompatibility Evaluation (ISO 10993)", hint: "Biological evaluation per ISO 10993-1 with endpoint selection based on body contact type, duration, and tissue interaction", textarea: true },
          { id: "4.3", label: "Performance Testing & Bench Data", hint: "Design verification test reports demonstrating the device meets specified performance requirements under normal and worst-case conditions", textarea: true },
          { id: "4.4", label: "Electrical Safety Testing (IEC 60601)", hint: "IEC 60601-1 and applicable collateral and particular standards test results for electrically powered medical devices", textarea: true },
          { id: "4.5", label: "Sterilization Validation", hint: "Validation of sterilization process per ISO 11135, ISO 11137, or ISO 17665 with SAL demonstration and routine monitoring parameters", textarea: true },
          { id: "4.6", label: "Stability & Shelf Life Studies", hint: "Real-time and accelerated aging data per ASTM F1980 demonstrating device safety and performance throughout the claimed shelf life", textarea: true },
        ],
      },
      {
        id: "s5",
        title: "Clinical Evidence",
        description: "Clinical data demonstrating device safety and performance for the intended use",
        fields: [
          { id: "5.1", label: "Clinical Evaluation Report", hint: "Systematic assessment of clinical data establishing benefit-risk acceptability for the device's intended use in Pakistan", textarea: true },
          { id: "5.2", label: "Clinical Investigation Data Summary", hint: "Synopsis of clinical investigations conducted per ISO 14155 including study design, endpoints, results, and adverse events", textarea: true },
          { id: "5.3", label: "Literature Review & Clinical Experience", hint: "Structured literature search with appraisal of published clinical data and post-market clinical experience from equivalent devices", textarea: true },
        ],
      },
      {
        id: "s6",
        title: "Risk Management",
        description: "Comprehensive risk management activities per ISO 14971 throughout the device lifecycle",
        fields: [
          { id: "6.1", label: "Risk Management Plan (ISO 14971)", hint: "Documented plan defining scope, risk acceptability criteria, verification activities, and production and post-production monitoring", textarea: true },
          { id: "6.2", label: "Hazard Identification & Risk Estimation", hint: "Systematic identification of hazards using FMEA, FTA, or HAZOP with severity and probability estimation for each hazardous situation", textarea: true },
          { id: "6.3", label: "Risk Control Measures Implemented", hint: "Description of design, protective, and informational risk control measures with verification of effectiveness for each identified risk", textarea: true },
          { id: "6.4", label: "Residual Risk & Risk-Benefit Analysis", hint: "Evaluation of individual and overall residual risk acceptability with benefit-risk determination for the intended clinical use", textarea: true },
        ],
      },
      {
        id: "s7",
        title: "Labelling",
        description: "Device labelling, instructions for use, and DRAP-specific marking requirements",
        fields: [
          { id: "7.1", label: "Device Labels (English/Urdu)", hint: "Artwork and content of device labels in both English and Urdu per DRAP labelling requirements including symbols per ISO 15223-1" },
          { id: "7.2", label: "Instructions for Use", hint: "Complete IFU document covering setup, operation, maintenance, troubleshooting, and disposal in English and Urdu as required by DRAP", textarea: true },
          { id: "7.3", label: "Packaging & Outer Carton Labels", hint: "Outer packaging label artwork including trade name, manufacturer, batch/lot number, UDI, storage conditions, and expiry date" },
          { id: "7.4", label: "DRAP-Specific Labelling Requirements", hint: "Compliance with DRAP Medical Device Rules labelling provisions including registration number display and import licence reference" },
        ],
      },
      {
        id: "s8",
        title: "Certificates & Post-Market",
        description: "Regulatory certificates, foreign approvals, and post-market surveillance commitments",
        fields: [
          { id: "8.1", label: "Free Sale Certificate (Country of Origin)", hint: "Certificate of free sale issued by the regulatory authority of the country where the device is manufactured and marketed" },
          { id: "8.2", label: "ISO 13485 Certificate", hint: "Current ISO 13485 quality management system certificate covering the device manufacturing site and relevant processes" },
          { id: "8.3", label: "WHO Prequalification", hint: "WHO prequalification listing status if applicable, including PQ reference number and product category for eligible device types" },
          { id: "8.4", label: "Foreign Regulatory Approvals (FDA/CE/TGA)", hint: "Summary of approvals from US FDA, EU CE marking, TGA Australia, or other recognized authorities with clearance/approval numbers" },
          { id: "8.5", label: "Post-Market Surveillance Plan", hint: "Proactive and reactive PMS plan including complaint handling, trend analysis, PMCF activities, and periodic safety update reporting", textarea: true },
          { id: "8.6", label: "Adverse Event Reporting to DRAP", hint: "Procedures for mandatory reporting of adverse events and field safety corrective actions to DRAP within prescribed timelines", textarea: true },
        ],
      },
    ],
  },
];
