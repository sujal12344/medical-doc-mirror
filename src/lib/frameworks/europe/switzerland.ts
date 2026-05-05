import type { RegulatoryFramework } from "../types";

export const CH_FRAMEWORKS: RegulatoryFramework[] = [
  {
    id: "CH_SWISSMEDIC",
    countryCode: "CH",
    countryName: "Switzerland",
    flag: "🇨🇭",
    authority: "Swissmedic",
    documentType: "Conformity Assessment (MedDO)",
    sections: [
      {
        id: "s1",
        title: "Administrative Information",
        description: "Applicant details, Swiss representation, and regulatory identifiers",
        fields: [
          { id: "1.1", label: "Applicant / Manufacturer Name", hint: "Legal name of the entity responsible for placing the device on the Swiss market" },
          { id: "1.2", label: "Applicant Address", hint: "Full registered address including street, postal code, city, and country" },
          { id: "1.3", label: "Swiss Authorized Representative (CH-REP)", hint: "Name and address of the authorized representative domiciled in Switzerland per Art. 51 MedDO" },
          { id: "1.4", label: "Swissmedic Registration Number", hint: "Unique device listing number assigned by Swissmedic upon notification or application" },
          { id: "1.5", label: "Single Registration Number (SRN)", hint: "Manufacturer or CH-REP single registration number from the Swiss actor registration system" },
          { id: "1.6", label: "Basic UDI-DI", hint: "Basic UDI-DI issued per IMDRF UDI guidance, linking all device variants and configurations" },
        ],
      },
      {
        id: "s2",
        title: "Device Description",
        description: "Comprehensive device information including classification and technical characteristics",
        fields: [
          { id: "2.1", label: "Device Trade Name", hint: "Commercial name under which the device is marketed in Switzerland" },
          { id: "2.2", label: "Device Description", hint: "Detailed description of the device including technology, components, materials, and mechanism of action", textarea: true },
          { id: "2.3", label: "Intended Purpose", hint: "Specific medical intended purpose per MedDO Art. 2, including target patient population and medical condition", textarea: true },
          { id: "2.4", label: "Device Classification", hint: "Classification rule and resulting class (I, Im, Is, Ir, IIa, IIb, III) per Annex VIII of MedDO" },
          { id: "2.5", label: "Variants and Configurations", hint: "All device variants, sizes, configurations, and models covered under this submission", textarea: true },
          { id: "2.6", label: "Accessories", hint: "Accessories intended to be used with the device, including their regulatory status", textarea: true },
          { id: "2.7", label: "Software (SaMD/SiMD)", hint: "Software as or in a medical device: version, intended purpose, classification level, and algorithm description", textarea: true },
          { id: "2.8", label: "Materials in Contact with Body", hint: "List all materials contacting patient tissue or body fluids, including biocompatibility classification", textarea: true },
        ],
      },
      {
        id: "s3",
        title: "Essential Requirements",
        description: "Demonstration of compliance with general safety and performance requirements",
        fields: [
          { id: "3.1", label: "GSPR Checklist", hint: "Completed checklist of General Safety and Performance Requirements per Annex I MedDO with compliance method for each requirement", textarea: true },
          { id: "3.2", label: "Applied Harmonized Standards", hint: "List of harmonized European standards (EN ISO, EN IEC) applied with declaration of full or partial conformity", textarea: true },
          { id: "3.3", label: "Common Specifications Applied", hint: "Common specifications adopted by Swissmedic and applied to demonstrate conformity where no harmonized standard exists", textarea: true },
          { id: "3.4", label: "State-of-the-Art Justification", hint: "Justification where neither harmonized standards nor common specifications are applied, demonstrating equivalent safety", textarea: true },
        ],
      },
      {
        id: "s4",
        title: "Risk Management",
        description: "Risk management process and documentation per ISO 14971",
        fields: [
          { id: "4.1", label: "Risk Management Plan", hint: "Risk management plan per ISO 14971:2019 defining scope, risk acceptability criteria, and verification activities", textarea: true },
          { id: "4.2", label: "Hazard Analysis", hint: "Systematic identification of known and foreseeable hazards during normal use and reasonably foreseeable misuse", textarea: true },
          { id: "4.3", label: "Risk Control Measures", hint: "Risk control measures applied in order of priority: inherent safety, protective measures, information for safety", textarea: true },
          { id: "4.4", label: "Residual Risk Evaluation", hint: "Assessment of overall residual risk acceptability after all risk control measures, including benefit-risk analysis", textarea: true },
          { id: "4.5", label: "Risk Management Report", hint: "Summary report confirming risk management plan execution, all hazards addressed, and overall residual risk acceptable", textarea: true },
        ],
      },
      {
        id: "s5",
        title: "Design & Manufacturing",
        description: "Design history, manufacturing processes, and production site information",
        fields: [
          { id: "5.1", label: "Design Stages Documentation", hint: "Design and development stages from concept through transfer, including design inputs, outputs, reviews, and changes", textarea: true },
          { id: "5.2", label: "Manufacturing Process Description", hint: "Detailed manufacturing process flow including critical process parameters and in-process controls", textarea: true },
          { id: "5.3", label: "Manufacturing Site Information", hint: "All sites involved in manufacturing, assembly, sterilization, and final release with addresses and activities performed" },
          { id: "5.4", label: "Special Processes", hint: "Validated special processes (e.g., welding, soldering, injection molding) where output cannot be fully verified by inspection", textarea: true },
          { id: "5.5", label: "Sterilization Validation", hint: "Sterilization method (EtO, gamma, steam, etc.), validation per ISO 11135/11137/17665, SAL ≤10⁻⁶, and residual limits", textarea: true },
        ],
      },
      {
        id: "s6",
        title: "Verification & Validation",
        description: "Product testing, performance verification, and design validation evidence",
        fields: [
          { id: "6.1", label: "Bench Testing / Performance Verification", hint: "Engineering test protocols and reports demonstrating device meets design specifications and performance criteria", textarea: true },
          { id: "6.2", label: "Biocompatibility Evaluation", hint: "Biological evaluation per ISO 10993-1 including endpoint selection rationale, test results, and material characterization", textarea: true },
          { id: "6.3", label: "Software Verification & Validation (IEC 62304)", hint: "Software lifecycle documentation: architecture, unit/integration/system testing, anomaly management per IEC 62304 safety class", textarea: true },
          { id: "6.4", label: "Usability Engineering (IEC 62366-1)", hint: "Usability engineering file: use specification, formative studies, summative usability test with critical tasks pass criteria", textarea: true },
          { id: "6.5", label: "Electrical Safety & EMC", hint: "Test reports per IEC 60601-1 (safety), IEC 60601-1-2 (EMC) including immunity and emissions for intended environment", textarea: true },
          { id: "6.6", label: "Shelf Life / Stability Studies", hint: "Real-time and accelerated aging studies per ASTM F1980 with pass/fail acceptance criteria for critical attributes", textarea: true },
          { id: "6.7", label: "Packaging Validation", hint: "Sterile barrier system validation per ISO 11607-1/-2 including seal strength, integrity, and transport simulation testing", textarea: true },
        ],
      },
      {
        id: "s7",
        title: "Clinical Evaluation",
        description: "Clinical evidence supporting safety and performance for Swiss market",
        fields: [
          { id: "7.1", label: "Clinical Evaluation Report (CER)", hint: "CER per MedDO Annex XIV Part A and MEDDEV 2.7/1 rev 4, demonstrating sufficient clinical evidence for intended purpose", textarea: true },
          { id: "7.2", label: "Literature Review", hint: "Systematic literature review identifying relevant clinical data including search strategy, appraisal criteria, and analysis", textarea: true },
          { id: "7.3", label: "Clinical Investigation Summary", hint: "Summary of clinical investigations conducted per ISO 14155, including design, endpoints, results, and conclusions", textarea: true },
          { id: "7.4", label: "Post-Market Clinical Follow-up Plan", hint: "PMCF plan describing proactive data collection methods to confirm ongoing safety and performance throughout device life", textarea: true },
        ],
      },
      {
        id: "s8",
        title: "Post-Market Surveillance",
        description: "Ongoing surveillance, vigilance reporting, and corrective actions",
        fields: [
          { id: "8.1", label: "Post-Market Surveillance Plan", hint: "PMS plan per MedDO Art. 79 defining data sources, methods, indicators, and timelines for systematic data collection", textarea: true },
          { id: "8.2", label: "Vigilance Reporting Procedures", hint: "Process for reporting serious incidents to Swissmedic within required timelines (2–15 days depending on severity)", textarea: true },
          { id: "8.3", label: "Field Safety Corrective Actions (FSCA)", hint: "Procedures for implementing FSCAs including field safety notices, device recalls, and communication to Swiss authorities", textarea: true },
          { id: "8.4", label: "Periodic Safety Update Report (PSUR)", hint: "PSUR summarizing PMS data, trend analysis, benefit-risk conclusions, and any needed corrective/preventive actions", textarea: true },
        ],
      },
      {
        id: "s9",
        title: "Labelling & Instructions for Use",
        description: "Swiss-specific labelling, language requirements, and IFU content",
        fields: [
          { id: "9.1", label: "Device Labels", hint: "Labels per MedDO Annex I Chapter III including UDI carrier, CE-equivalent marking if applicable, and mandatory symbols per ISO 15223-1", textarea: true },
          { id: "9.2", label: "Instructions for Use (IFU)", hint: "IFU content per MedDO Annex I Section 23 covering indications, contraindications, warnings, and operating instructions", textarea: true },
          { id: "9.3", label: "Swiss Language Requirements", hint: "Labels and IFU provided in all three official languages: German (DE), French (FR), and Italian (IT) as required by MedDO" },
          { id: "9.4", label: "Swiss-Specific Marking Requirements", hint: "Swiss-specific requirements including CH-REP identification on labelling and any deviations from EU CE marking requirements" },
        ],
      },
      {
        id: "s10",
        title: "Quality Management System",
        description: "QMS certification, conformity assessment, and designated body involvement",
        fields: [
          { id: "10.1", label: "ISO 13485 Certificate", hint: "Valid ISO 13485 QMS certificate issued by accredited certification body covering design, manufacture, and servicing" },
          { id: "10.2", label: "Designated Body Certificate", hint: "Certificate from Swiss-recognized designated body for devices requiring third-party conformity assessment (Class Im and above)" },
          { id: "10.3", label: "Conformity Assessment Procedure", hint: "Applicable conformity assessment route per MedDO Annex IX–XI corresponding to device class and type", textarea: true },
        ],
      },
    ],
  },
];
