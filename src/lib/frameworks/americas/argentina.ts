import type { RegulatoryFramework } from "../types";

export const AR_FRAMEWORKS: RegulatoryFramework[] = [
  {
    id: "AR_ANMAT",
    countryCode: "AR",
    countryName: "Argentina",
    flag: "🇦🇷",
    authority: "ANMAT",
    documentType: "Medical Device Registration (Disposición 2318)",
    sections: [
      {
        id: "s1",
        title: "Administrative Information",
        description: "Applicant details, legal representation, and device identification for ANMAT submission",
        fields: [
          { id: "1.1", label: "Applicant / Manufacturer Name", hint: "Full legal name of the company submitting the ANMAT registration application, as registered with Argentine authorities" },
          { id: "1.2", label: "Legal Representative in Argentina", hint: "Name and contact details of the authorized legal representative domiciled in Argentina per ANMAT requirements" },
          { id: "1.3", label: "ANMAT Registration Number", hint: "Existing PM (Producto Médico) number if renewing or modifying; leave blank for new applications" },
          { id: "1.4", label: "Device Commercial Name", hint: "Commercial trade name of the device as it will appear on the Argentine market" },
          { id: "1.5", label: "Device Name in Spanish", hint: "Official device denomination translated into Spanish, matching ANMAT nomenclature and GMDN coding" },
          { id: "1.6", label: "Risk Classification (ANMAT)", hint: "Device risk class per Disposición 2318/02: Clase I (low), Clase II (moderate-low), Clase III (moderate-high), or Clase IV (high)" },
        ],
      },
      {
        id: "s2",
        title: "Device Description",
        description: "Comprehensive technical description of the medical device including its purpose, composition, and variants",
        fields: [
          { id: "2.1", label: "Device Description", hint: "Detailed physical and functional description including dimensions, weight, materials, and mechanism of action", textarea: true },
          { id: "2.2", label: "Intended Use / Purpose", hint: "Specific medical indication, target patient population, anatomical site, and clinical context as claimed for Argentine registration", textarea: true },
          { id: "2.3", label: "Composition / Materials", hint: "All materials in contact with the patient or user, including biocompatibility classification of each material", textarea: true },
          { id: "2.4", label: "Technical Specifications", hint: "Key performance parameters, operating ranges (voltage, pressure, flow), tolerances, and acceptance criteria", textarea: true },
          { id: "2.5", label: "Principle of Operation", hint: "Scientific/engineering principle by which the device achieves its intended function (e.g., piezoelectric, electrochemical)", textarea: true },
          { id: "2.6", label: "Variants and Models", hint: "All sizes, configurations, and model numbers covered under this single ANMAT registration, with distinguishing characteristics" },
          { id: "2.7", label: "Accessories and Components", hint: "List all accessories, ancillary devices, and spare parts sold or supplied with the device, noting which are separately registered" },
          { id: "2.8", label: "Software Description", hint: "Software version, SOUP components, cybersecurity considerations, SaMD classification level if applicable per IEC 62304", textarea: true },
        ],
      },
      {
        id: "s3",
        title: "Classification",
        description: "Risk classification rationale per ANMAT Disposición 2318/02 rules",
        fields: [
          { id: "3.1", label: "Risk Classification (I/II/III/IV)", hint: "Assigned class under Disposición 2318/02 based on invasiveness, duration of contact, active/non-active, and body system" },
          { id: "3.2", label: "Classification Rule Applied", hint: "Specific classification rule number from Disposición 2318/02 Annex used to determine the risk class" },
          { id: "3.3", label: "Classification Justification", hint: "Detailed rationale explaining why the selected rule applies, referencing device characteristics such as duration of use, invasiveness, and energy source", textarea: true },
        ],
      },
      {
        id: "s4",
        title: "Quality System",
        description: "Quality management system documentation and GMP compliance per ANMAT requirements",
        fields: [
          { id: "4.1", label: "ISO 13485 Certificate", hint: "Current ISO 13485 certificate from an accredited notified body, including scope, certificate number, and expiry date" },
          { id: "4.2", label: "GMP Compliance (Disposición 3266)", hint: "Evidence of compliance with ANMAT GMP requirements per Disposición 3266/2013 or equivalent, including most recent audit date" },
          { id: "4.3", label: "Quality Manual Summary", hint: "Overview of the QMS covering design controls, document control, CAPA, supplier management, and management review processes", textarea: true },
          { id: "4.4", label: "Design & Development Controls", hint: "Summary of design control procedures including design input/output, verification, validation, and design transfer per ISO 13485 clause 7.3", textarea: true },
        ],
      },
      {
        id: "s5",
        title: "Testing & Validation",
        description: "Standards compliance, performance testing, and validation data per IRAM/ISO requirements",
        fields: [
          { id: "5.1", label: "Applicable Standards (IRAM/ISO)", hint: "List all IRAM, ISO, and IEC standards applied (e.g., IRAM 4220, ISO 14708, IEC 60601-1) with edition year and compliance status", textarea: true },
          { id: "5.2", label: "Performance Testing Results", hint: "Summary of bench testing demonstrating the device meets its design specifications and performance claims", textarea: true },
          { id: "5.3", label: "Biocompatibility Testing", hint: "Biological evaluation per ISO 10993 series: cytotoxicity, sensitization, irritation, and other endpoints based on contact type and duration", textarea: true },
          { id: "5.4", label: "Electrical Safety Testing", hint: "Test results per IEC 60601-1 (general safety) and applicable collateral/particular standards, including leakage currents and dielectric strength" },
          { id: "5.5", label: "Sterilization Validation", hint: "Validation of sterilization method (EtO per ISO 11135, radiation per ISO 11137, or steam per ISO 17665) including SAL, bioburden, and residuals", textarea: true },
          { id: "5.6", label: "Stability / Shelf Life Studies", hint: "Real-time and/or accelerated aging data per ASTM F1980 supporting the claimed shelf life, including packaging integrity testing", textarea: true },
        ],
      },
      {
        id: "s6",
        title: "Clinical Evidence",
        description: "Clinical evaluation and investigation data supporting safety and performance claims",
        fields: [
          { id: "6.1", label: "Clinical Evaluation Report", hint: "Systematic assessment of clinical data per MEDDEV 2.7/1 Rev 4 or equivalent, demonstrating benefit-risk acceptability for the Argentine population", textarea: true },
          { id: "6.2", label: "Literature Review", hint: "Comprehensive search strategy, databases queried, inclusion/exclusion criteria, and appraisal of published clinical evidence for equivalent devices", textarea: true },
          { id: "6.3", label: "Clinical Investigation Data", hint: "Summary of any prospective clinical investigations conducted, including study design, endpoints, sample size, results, and adverse events", textarea: true },
        ],
      },
      {
        id: "s7",
        title: "Labelling",
        description: "Labels, instructions for use, and packaging per ANMAT Spanish-language requirements",
        fields: [
          { id: "7.1", label: "Device Labels (Spanish)", hint: "All product labels translated into Spanish including device name, manufacturer, lot/serial, expiry, storage conditions, and ANMAT PM number" },
          { id: "7.2", label: "Instructions for Use (IFU)", hint: "Complete IFU in Spanish covering intended use, contraindications, warnings, precautions, operating instructions, maintenance, and disposal", textarea: true },
          { id: "7.3", label: "Packaging Labels", hint: "Outer and inner packaging labels in Spanish with ANMAT-required symbols per ISO 15223-1 and local regulatory markings" },
          { id: "7.4", label: "ANMAT Labelling Requirements Compliance", hint: "Checklist confirming compliance with Disposición 2318 labelling annexes including lot/batch identification, manufacture date, and expiry date" },
          { id: "7.5", label: "Lot / Serial Number Marking", hint: "Description of the lot numbering and serial numbering system, traceability methodology, and UDI compliance if applicable" },
        ],
      },
      {
        id: "s8",
        title: "Manufacturing",
        description: "Manufacturing process, facility details, and supply chain information",
        fields: [
          { id: "8.1", label: "Manufacturing Process Description", hint: "Step-by-step manufacturing process from raw material receipt through final packaging, including critical process parameters and in-process controls", textarea: true },
          { id: "8.2", label: "Manufacturing Facilities", hint: "Full addresses of all manufacturing and assembly sites, including any contract manufacturers, with roles and responsibilities for each site", textarea: true },
          { id: "8.3", label: "Key Suppliers / Critical Components", hint: "List of critical component suppliers, incoming inspection requirements, and supplier qualification procedures", textarea: true },
          { id: "8.4", label: "Sterilization Site", hint: "Name and address of the sterilization facility, sterilization method used, and evidence of facility qualification (e.g., ISO 11135/11137 compliance)" },
        ],
      },
      {
        id: "s9",
        title: "Certificates & Post-Market Surveillance",
        description: "Regulatory certificates, foreign approvals, and post-market vigilance commitments",
        fields: [
          { id: "9.1", label: "Free Sale Certificate", hint: "Certificate of free sale from the country of manufacture, apostilled or legalized for use in Argentina, dated within 12 months" },
          { id: "9.2", label: "ISO 13485 Certificate", hint: "Copy of current ISO 13485 certificate with scope covering the device, issued by an IAF-accredited certification body" },
          { id: "9.3", label: "Foreign Regulatory Approvals", hint: "Table of regulatory approvals from other countries (FDA 510(k)/PMA, CE Mark, TGA, Health Canada) with approval dates and reference numbers", textarea: true },
          { id: "9.4", label: "Vigilance Plan", hint: "Post-market vigilance plan describing trending, signal detection, periodic safety update reporting, and communication with ANMAT per Disposición 2318", textarea: true },
          { id: "9.5", label: "Adverse Event Reporting Procedures", hint: "Documented procedures for reporting serious incidents and field safety corrective actions to ANMAT within required timelines (72 hours for serious events)", textarea: true },
        ],
      },
    ],
  },
];
