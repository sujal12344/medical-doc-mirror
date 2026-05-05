import type { RegulatoryFramework } from "../types";

export const CL_FRAMEWORKS: RegulatoryFramework[] = [
  {
    id: "CL_ISP",
    countryCode: "CL",
    countryName: "Chile",
    flag: "🇨🇱",
    authority: "ISP",
    documentType: "Medical Device Registration (DS 825)",
    sections: [
      {
        id: "s1",
        title: "Administrative Information",
        description: "Applicant details, authorized representation, and device identification for ISP registration",
        fields: [
          { id: "1.1", label: "Applicant / Manufacturer", hint: "Full legal name and RUT of the company applying for ISP registration, including registered business address in Chile or country of origin" },
          { id: "1.2", label: "ISP Registration Number", hint: "Existing ISP registro number if this is a renewal or modification; leave blank for initial device registration under DS 825" },
          { id: "1.3", label: "Authorized Representative in Chile", hint: "Name, RUT, and contact details of the authorized representative legally domiciled in Chile who acts on behalf of the foreign manufacturer" },
          { id: "1.4", label: "Device Commercial Name", hint: "Trade name of the device as it will be marketed in Chile, matching the name used on labelling and promotional materials" },
          { id: "1.5", label: "Risk Classification", hint: "Device risk class per DS 825: Clase I (bajo riesgo), Clase II (riesgo moderado), Clase III (alto riesgo), based on intended use and invasiveness" },
        ],
      },
      {
        id: "s2",
        title: "Device Description",
        description: "Complete technical description of the device including composition, software, and accessories",
        fields: [
          { id: "2.1", label: "Device Description", hint: "Comprehensive physical and functional description including form factor, dimensions, weight, and key design features", textarea: true },
          { id: "2.2", label: "Intended Use / Medical Purpose", hint: "Precise clinical indication, target population, anatomical site of application, and conditions of use as claimed for the Chilean market", textarea: true },
          { id: "2.3", label: "Composition / Materials", hint: "All materials used in the device, with emphasis on patient-contacting materials, and references to biological safety evaluations", textarea: true },
          { id: "2.4", label: "Technical Specifications", hint: "Measurable performance characteristics, operating parameters, environmental conditions for use, and critical tolerances", textarea: true },
          { id: "2.5", label: "Software Description", hint: "Software name, version, intended function, development lifecycle per IEC 62304, cybersecurity measures, and SaMD classification if standalone", textarea: true },
          { id: "2.6", label: "Accessories", hint: "All accessories, ancillary devices, and consumables required for device operation, with ISP registration status of each accessory" },
        ],
      },
      {
        id: "s3",
        title: "Quality System",
        description: "Quality management system certification and GMP compliance documentation",
        fields: [
          { id: "3.1", label: "ISO 13485 Certificate", hint: "Current ISO 13485 certificate issued by an accredited certification body, with scope covering the registered device and valid expiry date" },
          { id: "3.2", label: "GMP Compliance Documentation", hint: "Evidence of good manufacturing practice compliance, such as facility inspection reports, GMP certificates from national authorities, or WHO prequalification", textarea: true },
          { id: "3.3", label: "Quality Management System Overview", hint: "Summary of QMS processes including document control, purchasing controls, production controls, CAPA, internal audits, and management review", textarea: true },
        ],
      },
      {
        id: "s4",
        title: "Testing & Standards",
        description: "Applicable standards, performance verification, biocompatibility, sterilization, and safety testing",
        fields: [
          { id: "4.1", label: "Applicable Standards", hint: "List all NCh, ISO, IEC, and ASTM standards applied to the device with edition year and declaration of conformity status", textarea: true },
          { id: "4.2", label: "Performance Testing", hint: "Summary of bench and functional testing demonstrating the device meets its specified performance claims and design output requirements", textarea: true },
          { id: "4.3", label: "Biocompatibility Testing", hint: "Biological evaluation per ISO 10993 series based on nature and duration of body contact; include cytotoxicity, sensitization, and irritation results as applicable", textarea: true },
          { id: "4.4", label: "Sterilization Validation", hint: "Sterilization process validation (EtO per ISO 11135, radiation per ISO 11137, steam per ISO 17665) including sterility assurance level and residuals testing", textarea: true },
          { id: "4.5", label: "Electrical Safety Testing", hint: "Test results per IEC 60601-1 and relevant particular standards for electromedical equipment, covering leakage current, dielectric strength, and essential performance" },
          { id: "4.6", label: "Stability / Shelf Life Studies", hint: "Aging studies (real-time and/or accelerated per ASTM F1980) supporting the claimed shelf life, including sterile barrier integrity and functional performance over time", textarea: true },
        ],
      },
      {
        id: "s5",
        title: "Clinical Evidence",
        description: "Clinical evaluation and data supporting safety and performance for ISP review",
        fields: [
          { id: "5.1", label: "Clinical Evaluation Report", hint: "Systematic review and analysis of clinical data demonstrating that the device is safe and performs as intended under normal conditions of use", textarea: true },
          { id: "5.2", label: "Clinical Data Summary", hint: "Overview of all available clinical evidence including investigation results, post-market clinical follow-up, registry data, and published literature", textarea: true },
        ],
      },
      {
        id: "s6",
        title: "Labelling",
        description: "Labels, instructions for use, and packaging in Spanish per ISP regulatory requirements",
        fields: [
          { id: "6.1", label: "Device Labels (Spanish)", hint: "Product labels in Spanish including device name, manufacturer, lot/serial number, expiry date, storage conditions, and ISP registration number" },
          { id: "6.2", label: "Instructions for Use (IFU)", hint: "Complete IFU in Spanish with intended use, contraindications, warnings, precautions, step-by-step instructions, cleaning/maintenance, and disposal guidance", textarea: true },
          { id: "6.3", label: "Packaging Labels", hint: "Primary and secondary packaging labels in Spanish displaying required symbols per ISO 15223-1 and Chilean regulatory markings" },
          { id: "6.4", label: "ISP-Specific Labelling Requirements", hint: "Verification that labels comply with DS 825 provisions including ISP registro number display, importer information, and mandatory safety warnings in Spanish" },
        ],
      },
      {
        id: "s7",
        title: "Manufacturing",
        description: "Manufacturing site information, process overview, and quality control measures",
        fields: [
          { id: "7.1", label: "Manufacturing Sites", hint: "Full names and addresses of all manufacturing, assembly, sterilization, and final packaging sites, with the scope of activities at each facility", textarea: true },
          { id: "7.2", label: "Manufacturing Process Overview", hint: "Summary of the manufacturing process from raw material intake through finished product release, highlighting critical steps and control points", textarea: true },
          { id: "7.3", label: "Quality Control Procedures", hint: "Description of in-process and final quality control testing, sampling plans, acceptance criteria, and equipment calibration procedures", textarea: true },
        ],
      },
      {
        id: "s8",
        title: "Certificates & Post-Market",
        description: "Regulatory certificates, foreign approvals, and ongoing surveillance commitments",
        fields: [
          { id: "8.1", label: "Free Sale Certificate", hint: "Certificate of free sale from the country of manufacture, apostilled or legalized for use in Chile, confirming the device is freely marketed" },
          { id: "8.2", label: "ISO 13485 Certificate", hint: "Copy of the valid ISO 13485 certificate with scope statement covering the device, issued by an accredited body recognized by ISP" },
          { id: "8.3", label: "Foreign Regulatory Approvals", hint: "Summary of regulatory clearances/approvals from reference authorities (FDA, EU/CE, TGA, Health Canada, ANVISA) with dates and reference numbers", textarea: true },
          { id: "8.4", label: "Post-Market Surveillance Plan", hint: "Farmacovigilancia plan for medical devices describing complaint handling, adverse event reporting to ISP, trend analysis, and periodic safety reporting per DS 825", textarea: true },
        ],
      },
    ],
  },
];
