import type { RegulatoryFramework } from "../types";

export const AE_FRAMEWORKS: RegulatoryFramework[] = [
  {
    id: "AE_MOHAP",
    countryCode: "AE",
    countryName: "UAE",
    flag: "🇦🇪",
    authority: "MOHAP",
    documentType: "Medical Device Registration",
    sections: [
      {
        id: "s1",
        title: "Administrative Information",
        description: "Applicant details, UAE representation, and trade licensing for MOHAP medical device registration",
        fields: [
          { id: "1.1", label: "Applicant (Registration Holder)", hint: "Legal entity name and address applying for MOHAP medical device registration, including Emirates ID or corporate registration details" },
          { id: "1.2", label: "UAE Authorized Representative", hint: "UAE-based authorized representative holding a valid MOHAP medical device establishment license and trade license to act on behalf of the foreign manufacturer" },
          { id: "1.3", label: "Trade License", hint: "Valid UAE trade license issued by the relevant emirate's Department of Economic Development (DED) permitting medical device import/distribution activities" },
          { id: "1.4", label: "Device Name (Arabic)", hint: "Official device name in Arabic as it will appear on MOHAP registration certificate and Arabic-language labelling" },
          { id: "1.5", label: "Device Name (English)", hint: "Official device name in English matching the manufacturer's marketing name with model numbers and catalogue references" },
          { id: "1.6", label: "MOHAP Classification", hint: "Risk classification per MOHAP classification rules: Class A, B, C, or D aligned with GHTF/IMDRF classification principles" },
          { id: "1.7", label: "Product Registration Number", hint: "Existing MOHAP product registration number for renewal or variation applications; leave blank for new submissions via MOHAP Tatmeen portal" },
        ],
      },
      {
        id: "s2",
        title: "Device Description",
        description: "Technical characterization and specifications of the medical device",
        fields: [
          { id: "2.1", label: "Device Description", hint: "Detailed technical description including design, dimensions, weight, operating principles, and performance characteristics per MOHAP submission requirements", textarea: true },
          { id: "2.2", label: "Intended Use", hint: "Precise statement of intended medical purpose, target patient population, medical condition, clinical context, and intended user (professional or lay)", textarea: true },
          { id: "2.3", label: "Technical Specifications", hint: "Measurable performance specifications including dimensions, tolerances, electrical ratings, output parameters, and operating ranges" },
          { id: "2.4", label: "Materials & Composition", hint: "Complete bill of materials for patient-contacting and critical components with material grades, biological origin, and substances of concern", textarea: true },
          { id: "2.5", label: "Key Components", hint: "List of critical subassemblies and functional components with part numbers, specifications, and supplier qualification status" },
          { id: "2.6", label: "Software Information", hint: "Software version, IEC 62304 lifecycle class, SaMD classification, SOUP list, cybersecurity risk assessment, and interoperability documentation", textarea: true },
          { id: "2.7", label: "Accessories", hint: "All accessories, ancillary devices, and consumables required for intended operation with individual regulatory status and compatibility" },
        ],
      },
      {
        id: "s3",
        title: "Essential Requirements",
        description: "Compliance with MOHAP essential requirements for medical device safety and performance",
        fields: [
          { id: "3.1", label: "MOHAP Essential Requirements Checklist", hint: "Clause-by-clause compliance checklist against MOHAP essential requirements (aligned with EU GSPR/GHTF essential principles) with evidence references for each", textarea: true },
          { id: "3.2", label: "Applied Standards", hint: "List of GSO, ISO, IEC, and EN harmonised standards applied with full designation, edition, and statement of conformity for each", textarea: true },
        ],
      },
      {
        id: "s4",
        title: "Risk Management",
        description: "Risk management documentation per ISO 14971 as required by MOHAP",
        fields: [
          { id: "4.1", label: "Risk Management File (ISO 14971)", hint: "Complete risk management file per ISO 14971:2019 including risk management plan, hazard analysis (FMEA/FTA), risk evaluation, risk control, and risk management report", textarea: true },
          { id: "4.2", label: "Risk-Benefit Analysis", hint: "Overall benefit-risk determination demonstrating residual risks are acceptable when weighed against the intended clinical benefits of the device", textarea: true },
        ],
      },
      {
        id: "s5",
        title: "Testing & Performance",
        description: "Verification and validation testing demonstrating device safety and performance",
        fields: [
          { id: "5.1", label: "Performance Testing Standards", hint: "Summary of applicable product-specific standards (ISO, IEC, GSO) used for design verification and validation with test laboratory accreditation details", textarea: true },
          { id: "5.2", label: "Biocompatibility (ISO 10993)", hint: "Biological evaluation per ISO 10993-1:2018 with endpoint selection rationale, test reports for cytotoxicity, sensitization, irritation, and other applicable endpoints", textarea: true },
          { id: "5.3", label: "Performance Test Reports", hint: "Design verification test reports demonstrating the device meets design output specifications under nominal and worst-case conditions", textarea: true },
          { id: "5.4", label: "Electrical Safety (IEC 60601)", hint: "IEC 60601-1 Ed. 3.2 and applicable particular standards test reports from an accredited laboratory for electrically powered devices", textarea: true },
          { id: "5.5", label: "Electromagnetic Compatibility (EMC)", hint: "IEC 60601-1-2 Ed. 4.1 EMC test report covering emissions and immunity for the intended electromagnetic environment", textarea: true },
          { id: "5.6", label: "Sterilization Validation", hint: "Sterilization validation per ISO 11135, ISO 11137, or ISO 17665 with demonstrated SAL of 10⁻⁶ for devices supplied sterile", textarea: true },
          { id: "5.7", label: "Stability / Shelf Life", hint: "Real-time and accelerated aging data per ASTM F1980 with sterile barrier integrity testing per ISO 11607 supporting claimed shelf life" },
        ],
      },
      {
        id: "s6",
        title: "Clinical Evidence",
        description: "Clinical data supporting safety and performance claims for MOHAP review",
        fields: [
          { id: "6.1", label: "Clinical Evaluation Report", hint: "Systematic clinical evaluation per MEDDEV 2.7/1 Rev 4 or MOHAP-accepted methodology demonstrating benefit-risk acceptability based on available clinical data", textarea: true },
          { id: "6.2", label: "Clinical Data", hint: "Clinical investigation data per ISO 14155 (if conducted) or clinical experience data from post-market sources supporting safety and performance", textarea: true },
          { id: "6.3", label: "Literature Review", hint: "Structured literature search with defined databases, search strategy, PICO criteria, critical appraisal, and data synthesis supporting clinical claims", textarea: true },
        ],
      },
      {
        id: "s7",
        title: "Quality System & Certificates",
        description: "QMS documentation, regulatory certificates, and GCC conformity requirements",
        fields: [
          { id: "7.1", label: "ISO 13485 Certificate", hint: "Current ISO 13485:2016 certificate with scope covering the registered device, issued by an IAF MLA signatory-accredited certification body with validity dates" },
          { id: "7.2", label: "CE Certificate", hint: "EC/EU Declaration of Conformity and Notified Body certificate under MDD 93/42/EEC or MDR 2017/745 — required for most MOHAP submissions" },
          { id: "7.3", label: "Free Sale Certificate", hint: "Certificate of Free Sale from country of origin confirming the device is legally marketed, authenticated/apostilled for UAE acceptance" },
          { id: "7.4", label: "ESMA Requirements", hint: "Emirates Authority for Standardization & Metrology (now MOIAT) conformity assessment requirements including UAE.S/GSO standards compliance", textarea: true },
          { id: "7.5", label: "GCC Conformity Certificate", hint: "Gulf Conformity Certificate (G-mark) for products within the scope of GCC technical regulations, issued by a GCC-recognized conformity assessment body" },
          { id: "7.6", label: "GMP / QMS Audit Report", hint: "Most recent QMS/GMP audit report (third-party surveillance or MDSAP) demonstrating ongoing compliance with ISO 13485 and applicable GMP requirements" },
        ],
      },
      {
        id: "s8",
        title: "Labelling",
        description: "Bilingual labelling and ECAS marking requirements per MOHAP and UAE regulations",
        fields: [
          { id: "8.1", label: "Arabic Labels", hint: "All device labels in Arabic per MOHAP labelling requirements including device name, manufacturer, and MOHAP registration number" },
          { id: "8.2", label: "English Labels", hint: "Device labels in English with manufacturer name, model/catalogue number, lot/serial number, manufacturing date, and expiry date" },
          { id: "8.3", label: "Instructions for Use (Bilingual)", hint: "Complete IFU in both Arabic and English with indications, contraindications, warnings, precautions, operating instructions, and maintenance procedures", textarea: true },
          { id: "8.4", label: "Packaging Labels", hint: "Inner and outer packaging labels in Arabic and English with storage conditions, sterility indicators, and symbols per ISO 15223-1" },
          { id: "8.5", label: "ECAS Marking", hint: "Emirates Conformity Assessment System (ECAS) mark application where applicable, demonstrating compliance with UAE technical regulations" },
        ],
      },
      {
        id: "s9",
        title: "Post-Market Surveillance",
        description: "Vigilance reporting and post-market obligations under MOHAP regulations",
        fields: [
          { id: "9.1", label: "Adverse Event Reporting", hint: "Procedure for reporting serious incidents and near-incidents to MOHAP vigilance system within mandated timelines (48 hours for death/serious threat, 10 days for others)", textarea: true },
          { id: "9.2", label: "Recall Procedures", hint: "Device recall initiation, classification, effectiveness checks, and MOHAP notification requirements including Tatmeen portal reporting" },
          { id: "9.3", label: "MOHAP Vigilance System", hint: "Registration with MOHAP post-market vigilance and surveillance system including designated safety officer contact details and reporting procedures", textarea: true },
          { id: "9.4", label: "Post-Market Surveillance Plan", hint: "Proactive PMS plan including complaint handling, trend analysis, periodic safety update reporting, and PMCF activities per MOHAP requirements", textarea: true },
        ],
      },
    ],
  },
];
