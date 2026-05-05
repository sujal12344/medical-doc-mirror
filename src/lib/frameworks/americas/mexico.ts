import type { RegulatoryFramework } from "../types";

export const MX_FRAMEWORKS: RegulatoryFramework[] = [
  {
    id: "MX_COFEPRIS",
    countryCode: "MX",
    countryName: "Mexico",
    flag: "🇲🇽",
    authority: "COFEPRIS",
    documentType: "Medical Device Registration",
    sections: [
      {
        id: "s1",
        title: "Administrative Information",
        description: "Applicant details, legal representation, and device classification",
        fields: [
          { id: "1.1", label: "Applicant / Registration Holder", hint: "Mexican legal entity (persona moral) or individual (persona física) holding the sanitary registration with RFC number" },
          { id: "1.2", label: "Legal Representative", hint: "Designated apoderado legal authorized to act before COFEPRIS with notarized power of attorney (poder notarial)" },
          { id: "1.3", label: "Sanitary Registration Number", hint: "Existing registro sanitario number if renewal or modification; leave blank for new (de novo) registration applications" },
          { id: "1.4", label: "Device Name", hint: "Generic and trade name(s) of the medical device as it will appear on the sanitary registration certificate" },
          { id: "1.5", label: "Device Classification", hint: "Risk classification: Class I (low risk), Class II (moderate risk), or Class III (high risk) per Mexican classification rules in NOM-241-SSA1" },
          { id: "1.6", label: "Contact Information", hint: "Primary regulatory contact in Mexico including phone, email, and physical address for COFEPRIS correspondence" },
        ],
      },
      {
        id: "s2",
        title: "Device Description",
        description: "Technical characterization and intended purpose of the device",
        fields: [
          { id: "2.1", label: "Device Description", hint: "Comprehensive technical description including design features, dimensions, weight, materials, and operational principles", textarea: true },
          { id: "2.2", label: "Intended Use / Intended Purpose", hint: "Precise statement of medical purpose, target patient population, anatomical site, clinical condition, and use environment", textarea: true },
          { id: "2.3", label: "Composition & Materials", hint: "Complete bill of materials for patient-contacting components with material specifications and biocompatibility classification", textarea: true },
          { id: "2.4", label: "Technical Specifications", hint: "Measurable performance parameters including electrical ratings, output specifications, accuracy, precision, and operating limits", textarea: true },
          { id: "2.5", label: "Software Description", hint: "Software version, intended functions, IEC 62304 safety classification, and standalone SaMD classification if applicable", textarea: true },
          { id: "2.6", label: "Variants & Accessories", hint: "All device models, sizes, and accessories included in the registration scope with configuration differences documented", textarea: true },
        ],
      },
      {
        id: "s3",
        title: "Quality Management System",
        description: "QMS certification and Mexican GMP compliance",
        fields: [
          { id: "3.1", label: "ISO 13485 Certificate", hint: "Current ISO 13485:2016 certificate from an IAF MLA-recognized accreditation body covering the device scope and manufacturing sites" },
          { id: "3.2", label: "GMP Compliance", hint: "Evidence of compliance with NOM-241-SSA1-2021 (Good Manufacturing Practices for medical devices) or equivalent international GMP" },
          { id: "3.3", label: "NOM Compliance Declaration", hint: "Declaration of conformity to applicable Normas Oficiales Mexicanas (NOMs) with specific NOM numbers and compliance evidence", textarea: true },
          { id: "3.4", label: "Quality System Procedures Overview", hint: "Summary of design controls, process validation, CAPA, supplier management, and production/process controls", textarea: true },
        ],
      },
      {
        id: "s4",
        title: "Testing & Performance",
        description: "Standards compliance, performance verification, and safety testing",
        fields: [
          { id: "4.1", label: "Applicable Standards", hint: "List of NOM, NMX, IEC, and ISO standards applied with test laboratory accreditation (EMA or ILAC) and compliance status", textarea: true },
          { id: "4.2", label: "Biocompatibility Testing", hint: "Biological evaluation per ISO 10993-1 with endpoint justification based on device contact type (surface, external, implant) and duration", textarea: true },
          { id: "4.3", label: "Performance Testing", hint: "Design verification test reports demonstrating device meets all design output specifications and performance claims", textarea: true },
          { id: "4.4", label: "Electrical Safety & EMC", hint: "Test reports per NOM-241-SSA1, IEC 60601-1, and IEC 60601-1-2 from EMA-accredited or ILAC-recognized laboratory", textarea: true },
          { id: "4.5", label: "Sterilization Validation", hint: "Sterilization process validation (ISO 11135, ISO 11137, or ISO 17665) with sterility assurance level and routine monitoring program", textarea: true },
          { id: "4.6", label: "Shelf Life & Packaging Validation", hint: "Accelerated and real-time aging per ASTM F1980 with package integrity testing per ASTM F2095 or ISO 11607-1", textarea: true },
        ],
      },
      {
        id: "s5",
        title: "Clinical Evidence",
        description: "Clinical data supporting device safety and effectiveness",
        fields: [
          { id: "5.1", label: "Clinical Evaluation Report", hint: "Systematic clinical evaluation demonstrating adequate clinical evidence for the intended use and risk classification", textarea: true },
          { id: "5.2", label: "Equivalence / Predicate Comparison", hint: "Substantial equivalence comparison to a legally marketed device addressing technical, biological, and clinical characteristics", textarea: true },
          { id: "5.3", label: "Clinical Investigation Data", hint: "If conducted: GCP-compliant clinical study per NOM-012-SSA3-2012 with COFEPRIS protocol approval, results, and conclusions", textarea: true },
          { id: "5.4", label: "Literature Review", hint: "Systematic literature search supporting safety and effectiveness with search strategy, database sources, and critical appraisal", textarea: true },
        ],
      },
      {
        id: "s6",
        title: "Labelling",
        description: "Spanish-language labelling and NOM labelling compliance",
        fields: [
          { id: "6.1", label: "Device Labels (Spanish)", hint: "All labels in Spanish per NOM-137-SSA1 including manufacturer name, device name, lot/serial, manufacture date, and expiry", textarea: true },
          { id: "6.2", label: "Instructions for Use (Spanish)", hint: "Complete IFU in Spanish with indications, contraindications, warnings, precautions, assembly, operation, and maintenance instructions", textarea: true },
          { id: "6.3", label: "Packaging Labels", hint: "Inner and outer packaging labels per NOM-137-SSA1 with storage conditions, quantity, sterilization method, and single-use designation" },
          { id: "6.4", label: "NOM Labelling Requirements", hint: "Specific compliance with applicable NOM labelling provisions including commercial information (NOM-050-SCFI) and health warnings", textarea: true },
          { id: "6.5", label: "Symbols & Pictograms", hint: "ISO 15223-1 symbols used on labelling with explanatory legend provided in Spanish for end users" },
        ],
      },
      {
        id: "s7",
        title: "Manufacturing Information",
        description: "Manufacturing processes, facilities, and quality control",
        fields: [
          { id: "7.1", label: "Manufacturing Process Overview", hint: "Process flow from raw material receipt through finished device release including critical parameters, in-process testing, and sterilization", textarea: true },
          { id: "7.2", label: "Manufacturing Facilities", hint: "Name, address, and scope of each facility (fabrication, assembly, sterilization, packaging) with NOM-241-SSA1 GMP status" },
          { id: "7.3", label: "Quality Control Procedures", hint: "Incoming inspection, in-process controls, and finished device testing procedures with acceptance criteria and sampling plans", textarea: true },
          { id: "7.4", label: "Contract Manufacturers", hint: "Names, addresses, and scope of outsourced manufacturing or sterilization activities with quality agreements in place" },
        ],
      },
      {
        id: "s8",
        title: "Certificates & Foreign Approvals",
        description: "Supporting certificates and international regulatory status",
        fields: [
          { id: "8.1", label: "Certificate of Free Sale", hint: "Government-issued certificate from country of origin confirming device is legally marketed, apostilled per Hague Convention" },
          { id: "8.2", label: "ISO 13485 Certificate", hint: "Current ISO 13485:2016 certificate with scope, sites covered, issuing body accreditation, and validity dates" },
          { id: "8.3", label: "Foreign Regulatory Approvals", hint: "Summary of regulatory clearances/approvals in reference countries (FDA, CE, Health Canada, TGA, PMDA) with approval dates and status", textarea: true },
          { id: "8.4", label: "NOM Certificates", hint: "Certificates of conformity to applicable NOMs issued by COFEPRIS-recognized conformity assessment bodies (organismos de certificación)" },
          { id: "8.5", label: "Third-Party Test Reports", hint: "Test reports from EMA-accredited or internationally recognized (ILAC MRA) laboratories supporting NOM and standard compliance" },
        ],
      },
      {
        id: "s9",
        title: "Post-Market Surveillance",
        description: "Tecnovigilancia and incident reporting obligations",
        fields: [
          { id: "9.1", label: "Tecnovigilancia Plan", hint: "Post-market surveillance plan per NOM-240-SSA1-2012 including reportable event definitions and COFEPRIS notification timelines", textarea: true },
          { id: "9.2", label: "Incident Reporting Procedures", hint: "Procedures for reporting adverse events and device malfunctions to COFEPRIS via the tecnovigilancia reporting system within mandatory timelines", textarea: true },
          { id: "9.3", label: "Complaint Handling", hint: "System for receiving, documenting, investigating, and trending user complaints with linkage to CAPA and tecnovigilancia reporting", textarea: true },
          { id: "9.4", label: "Field Safety Corrective Actions", hint: "Procedures for recalls, safety alerts, and field corrections including COFEPRIS notification requirements and effectiveness verification", textarea: true },
          { id: "9.5", label: "Periodic Safety Update Reports", hint: "Post-market periodic reports summarizing complaint trends, adverse events, and updated benefit-risk assessment submitted to COFEPRIS", textarea: true },
        ],
      },
    ],
  },
];
