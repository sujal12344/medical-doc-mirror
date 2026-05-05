import type { RegulatoryFramework } from "../types";

export const CO_FRAMEWORKS: RegulatoryFramework[] = [
  {
    id: "CO_INVIMA",
    countryCode: "CO",
    countryName: "Colombia",
    flag: "🇨🇴",
    authority: "INVIMA",
    documentType: "Registro Sanitario (Decreto 4725)",
    sections: [
      {
        id: "s1",
        title: "Administrative Information",
        description: "Applicant identification, legal representation, and device identification for INVIMA registration",
        fields: [
          { id: "1.1", label: "Applicant / Titleholder", hint: "Full legal name and NIT of the company applying for the Registro Sanitario, registered with the Colombian Chamber of Commerce" },
          { id: "1.2", label: "INVIMA Registration Number", hint: "Existing Registro Sanitario number if this is a renewal or modification; leave blank for new submissions under Decreto 4725" },
          { id: "1.3", label: "Legal Representative in Colombia", hint: "Name, cédula or passport number, and contact details of the authorized legal representative domiciled in Colombia" },
          { id: "1.4", label: "Device Commercial Name", hint: "Commercial trade name of the device as it will be marketed in Colombia, consistent across all submitted documentation" },
          { id: "1.5", label: "Risk Classification (Decreto 4725)", hint: "Device class per Decreto 4725 de 2005: Clase I (low), Clase IIa (moderate-low), Clase IIb (moderate-high), or Clase III (high risk)" },
        ],
      },
      {
        id: "s2",
        title: "Device Description",
        description: "Complete technical description including purpose, materials, software, and all variants",
        fields: [
          { id: "2.1", label: "Device Description", hint: "Detailed description of the device covering physical characteristics, dimensions, weight, and functional overview", textarea: true },
          { id: "2.2", label: "Intended Use / Medical Purpose", hint: "Specific clinical indication, target patient population, anatomical site, and conditions of use claimed for the Colombian market", textarea: true },
          { id: "2.3", label: "Technical Specifications", hint: "Key performance parameters, operating ranges, tolerances, electrical ratings, and measurable acceptance criteria", textarea: true },
          { id: "2.4", label: "Materials and Composition", hint: "All materials used in the device, particularly those in contact with the patient or bodily fluids, with biocompatibility references", textarea: true },
          { id: "2.5", label: "Components and Subassemblies", hint: "Breakdown of major components and subassemblies, identifying critical components and their functions within the device" },
          { id: "2.6", label: "Software Description", hint: "Software version, intended purpose, architecture overview, SaMD classification if applicable, and IEC 62304 lifecycle documentation", textarea: true },
          { id: "2.7", label: "Variants and Configurations", hint: "All models, sizes, and configurations covered under this single Registro Sanitario, with a comparison table of differences" },
        ],
      },
      {
        id: "s3",
        title: "Quality System",
        description: "Quality management system certification and GMP compliance documentation required by INVIMA",
        fields: [
          { id: "3.1", label: "ISO 13485 Certificate", hint: "Current ISO 13485 certificate with scope covering the device, issued by an accredited certification body, including expiry date" },
          { id: "3.2", label: "INVIMA GMP Certificate (CCAA)", hint: "Certificado de Capacidad de Almacenamiento y Acondicionamiento or BPE certificate issued by INVIMA after facility inspection" },
          { id: "3.3", label: "Quality System Documentation Summary", hint: "Overview of the QMS covering management responsibility, resource management, product realization, and measurement/analysis/improvement", textarea: true },
          { id: "3.4", label: "CAPA and Risk Management Procedures", hint: "Summary of corrective and preventive action procedures and risk management process per ISO 14971 integrated into the QMS", textarea: true },
        ],
      },
      {
        id: "s4",
        title: "Testing & Performance",
        description: "Standards compliance, performance data, biocompatibility, and validation studies",
        fields: [
          { id: "4.1", label: "Standards Applied", hint: "List all applicable NTC, ISO, IEC, and ASTM standards with edition/year, identifying which are harmonized under Decreto 4725", textarea: true },
          { id: "4.2", label: "Performance Testing Results", hint: "Summary of verification and validation testing demonstrating the device meets its specified performance requirements", textarea: true },
          { id: "4.3", label: "Biocompatibility (ISO 10993)", hint: "Biological evaluation plan and test results per ISO 10993 series based on device contact type (surface, external communicating, implant) and duration", textarea: true },
          { id: "4.4", label: "Sterilization Validation", hint: "Validation of the sterilization process (EtO, gamma, e-beam, steam) including SAL demonstration, bioburden testing, and parametric release criteria", textarea: true },
          { id: "4.5", label: "Shelf Life / Stability Studies", hint: "Real-time aging and/or accelerated aging data per ASTM F1980 supporting the labeled expiration date, including sterile barrier system integrity", textarea: true },
          { id: "4.6", label: "Electrical Safety Testing", hint: "Test reports per IEC 60601-1 and applicable particular standards covering basic safety and essential performance of electromedical equipment" },
        ],
      },
      {
        id: "s5",
        title: "Clinical Evidence",
        description: "Clinical evaluation and supporting clinical data for safety and efficacy demonstration",
        fields: [
          { id: "5.1", label: "Clinical Evaluation Report", hint: "Systematic review of clinical data (literature, clinical experience, clinical investigation) demonstrating benefit-risk acceptability", textarea: true },
          { id: "5.2", label: "Clinical Data Summary", hint: "Tabulated summary of all clinical evidence including study type, population, endpoints, results, and conclusions relevant to the device", textarea: true },
          { id: "5.3", label: "Literature Review", hint: "Systematic literature search strategy, databases used, search terms, inclusion/exclusion criteria, and critical appraisal of identified publications", textarea: true },
        ],
      },
      {
        id: "s6",
        title: "Labelling",
        description: "Labels, instructions for use, and packaging in Spanish per INVIMA requirements",
        fields: [
          { id: "6.1", label: "Device Labels (Spanish)", hint: "All product labels in Spanish including device name, manufacturer, lot/serial number, expiry date, storage conditions, and Registro Sanitario number" },
          { id: "6.2", label: "Instructions for Use (Spanish)", hint: "Complete IFU in Spanish covering intended purpose, contraindications, warnings, precautions, step-by-step operating instructions, and disposal", textarea: true },
          { id: "6.3", label: "Packaging Labels", hint: "Inner and outer packaging labels in Spanish with required symbols per ISO 15223-1 and INVIMA-mandated regulatory markings" },
          { id: "6.4", label: "INVIMA Labelling Requirements", hint: "Verification of compliance with Decreto 4725 labelling provisions including Registro Sanitario display, importation data, and advertencia statements" },
        ],
      },
      {
        id: "s7",
        title: "Manufacturing",
        description: "Manufacturing process details, facility information, and supply chain documentation",
        fields: [
          { id: "7.1", label: "Manufacturing Process Description", hint: "Detailed manufacturing process from raw material through final release, including critical steps, in-process testing, and quality control checkpoints", textarea: true },
          { id: "7.2", label: "Facility Addresses", hint: "Complete addresses of all manufacturing, assembly, and finishing sites including the responsible person at each location", textarea: true },
          { id: "7.3", label: "Contract Manufacturers", hint: "Names, addresses, and scope of work for any contract manufacturers or outsourced process providers used in device production" },
          { id: "7.4", label: "Sterilization Facilities", hint: "Name, address, and sterilization method for each sterilization facility, with evidence of facility validation and regulatory compliance" },
        ],
      },
      {
        id: "s8",
        title: "Certificates & Regulatory",
        description: "Regulatory certificates, foreign approvals, and post-market surveillance commitments",
        fields: [
          { id: "8.1", label: "Free Sale Certificate", hint: "Certificate of free sale from the country of origin, apostilled or legalized for Colombia, confirming unrestricted commercial distribution" },
          { id: "8.2", label: "ISO 13485 Certificate", hint: "Copy of valid ISO 13485 certificate with scope statement covering the specific device, from an IAF MLA signatory body" },
          { id: "8.3", label: "BPM Certificate", hint: "Buenas Prácticas de Manufactura certificate or equivalent GMP certificate from the manufacturing country's regulatory authority" },
          { id: "8.4", label: "Foreign Regulatory Approvals", hint: "Table of approvals from reference regulatory authorities (FDA, CE/EU, TGA, Health Canada, PMDA) with approval numbers and dates", textarea: true },
          { id: "8.5", label: "Post-Market Surveillance Plan", hint: "Tecnovigilancia plan describing complaint handling, trend analysis, periodic reporting to INVIMA, and field safety corrective actions per Resolución 4816", textarea: true },
        ],
      },
    ],
  },
];
