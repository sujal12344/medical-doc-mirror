import type { RegulatoryFramework } from "../types";

export const RU_FRAMEWORKS: RegulatoryFramework[] = [
  {
    id: "RU_ROSZDRAV",
    countryCode: "RU",
    countryName: "Russia",
    flag: "🇷🇺",
    authority: "Roszdravnadzor",
    documentType: "Registration Certificate (RC)",
    sections: [
      {
        id: "s1",
        title: "Administrative Information",
        description: "Applicant details, Russian representation, and registration identifiers",
        fields: [
          { id: "1.1", label: "Applicant / Manufacturer Name", hint: "Legal name of the foreign or domestic manufacturer applying for the Registration Certificate" },
          { id: "1.2", label: "Authorized Representative in Russia", hint: "Name and registered address of the entity authorized to act on behalf of the foreign manufacturer in the Russian Federation" },
          { id: "1.3", label: "Registration Certificate Number", hint: "Unique RC number issued by Roszdravnadzor upon successful registration (format: РЗН YYYY/NNNNN)" },
          { id: "1.4", label: "Device Name in Russian", hint: "Official device name in Russian language as it will appear on the Registration Certificate and in the state register" },
          { id: "1.5", label: "OKPD2 Code", hint: "Russian Classification of Products by Economic Activity (OKPD2) code corresponding to the device type" },
        ],
      },
      {
        id: "s2",
        title: "Device Description",
        description: "Device characteristics, classification, and technical specifications in Russian",
        fields: [
          { id: "2.1", label: "Device Description (Russian)", hint: "Detailed device description in Russian including operating principle, design features, and mechanism of action", textarea: true },
          { id: "2.2", label: "Intended Purpose", hint: "Specific intended medical purpose, target conditions, patient population, and clinical application in Russian", textarea: true },
          { id: "2.3", label: "Risk Classification", hint: "Risk class per Russian classification: Class 1 (low), Class 2a (medium-low), Class 2b (medium-high), Class 3 (high)" },
          { id: "2.4", label: "Technical Specifications", hint: "Key technical parameters, operating characteristics, performance specifications, and measurement ranges", textarea: true },
          { id: "2.5", label: "Composition and Materials", hint: "Complete list of materials and substances including those in contact with patient, with chemical composition and grade", textarea: true },
          { id: "2.6", label: "Software Description", hint: "Software version, functionality, platform requirements, data formats, and cybersecurity provisions if applicable", textarea: true },
        ],
      },
      {
        id: "s3",
        title: "Technical Documentation",
        description: "Technical conditions, design files, and manufacturing documentation",
        fields: [
          { id: "3.1", label: "Technical Conditions (TU)", hint: "Technical specifications document (Технические условия) defining device requirements, test methods, and acceptance criteria per GOST standards", textarea: true },
          { id: "3.2", label: "Design Documentation", hint: "Complete design documentation package including drawings, schematics, CAD files, and bill of materials per GOST 2.102", textarea: true },
          { id: "3.3", label: "Manufacturing Process Description", hint: "Detailed description of manufacturing processes, critical operations, in-process controls, and inspection procedures", textarea: true },
          { id: "3.4", label: "Maintenance and Service Manual", hint: "Maintenance schedules, service procedures, calibration requirements, and authorized service provider information in Russian", textarea: true },
        ],
      },
      {
        id: "s4",
        title: "Testing & Evaluation",
        description: "Technical testing, biological evaluation, and clinical trials per Russian requirements",
        fields: [
          { id: "4.1", label: "Applicable GOST Standards", hint: "List of GOST, GOST R, and GOST IEC standards applied to demonstrate safety and performance (e.g., GOST R IEC 60601-1)", textarea: true },
          { id: "4.2", label: "Technical Testing Protocol and Reports", hint: "Protocols and results of technical testing conducted by Roszdravnadzor-accredited Russian testing laboratories", textarea: true },
          { id: "4.3", label: "Toxicological Assessment", hint: "Toxicological evaluation of materials per Russian sanitary-epidemiological requirements including migration and extraction studies", textarea: true },
          { id: "4.4", label: "Biological Evaluation", hint: "Biocompatibility assessment per GOST ISO 10993 series including cytotoxicity, sensitization, irritation, and systemic toxicity", textarea: true },
          { id: "4.5", label: "Clinical Trials (Russian Requirements)", hint: "Clinical trial results from trials conducted per Russian Federal Law No. 323 at authorized Russian clinical sites with Roszdravnadzor approval", textarea: true },
          { id: "4.6", label: "Electrical Safety Testing", hint: "Electrical safety test reports per GOST IEC 60601-1 and applicable particular standards from accredited Russian laboratories", textarea: true },
          { id: "4.7", label: "EMC Testing", hint: "Electromagnetic compatibility test results per GOST IEC 60601-1-2 for the Russian electromagnetic environment", textarea: true },
        ],
      },
      {
        id: "s5",
        title: "Quality Management System",
        description: "QMS certification and Russian GMP compliance",
        fields: [
          { id: "5.1", label: "ISO 13485 Certificate", hint: "Valid ISO 13485 QMS certificate covering the design, development, production, and servicing of the medical device" },
          { id: "5.2", label: "Russian GMP Compliance", hint: "Evidence of compliance with Russian Good Manufacturing Practice requirements per Government Decree No. 1416", textarea: true },
          { id: "5.3", label: "Quality Management Documentation", hint: "Quality manual, SOPs for production and quality control, and evidence of management review and internal audits", textarea: true },
          { id: "5.4", label: "GMP Inspection Report", hint: "Results of Roszdravnadzor GMP inspection of manufacturing sites (required for Class 2b and Class 3 devices)", textarea: true },
        ],
      },
      {
        id: "s6",
        title: "Clinical Evidence",
        description: "Clinical trial results and evaluation for Russian registration",
        fields: [
          { id: "6.1", label: "Clinical Trial Results", hint: "Full clinical trial report from studies conducted at Roszdravnadzor-authorized Russian clinical institutions", textarea: true },
          { id: "6.2", label: "Clinical Evaluation Summary", hint: "Summary of all clinical evidence including literature data, clinical experience, and equivalence arguments", textarea: true },
          { id: "6.3", label: "Russian Clinical Site Information", hint: "Names and license numbers of Russian medical institutions where clinical trials were conducted with ethics committee approval references" },
          { id: "6.4", label: "Expert Panel Opinion", hint: "Expert opinion from Roszdravnadzor expert organization on the clinical data sufficiency and benefit-risk assessment", textarea: true },
        ],
      },
      {
        id: "s7",
        title: "Labelling & Instructions",
        description: "Russian language labelling, packaging, and EAEU marking requirements",
        fields: [
          { id: "7.1", label: "Labels in Russian", hint: "All device labels in Russian language per GOST requirements including device name, manufacturer, lot number, and expiry date", textarea: true },
          { id: "7.2", label: "Instructions for Use (Russian)", hint: "Complete IFU translated to Russian including intended purpose, contraindications, warnings, operating instructions, and disposal", textarea: true },
          { id: "7.3", label: "Packaging Requirements", hint: "Packaging specifications per GOST standards including primary, secondary, and transport packaging with storage condition markings" },
          { id: "7.4", label: "EAEU Marking (EAC Mark)", hint: "Eurasian Economic Union conformity mark (EAC) requirements for devices marketed across EAEU member states (Russia, Belarus, Kazakhstan, Armenia, Kyrgyzstan)" },
        ],
      },
      {
        id: "s8",
        title: "Certificates & Supporting Documents",
        description: "Test certificates, foreign approvals, and regulatory documentation",
        fields: [
          { id: "8.1", label: "Test Reports from Accredited Russian Labs", hint: "Technical test reports from laboratories accredited by Rosakkreditatsiya (Russian Federal Accreditation Service) per GOST requirements", textarea: true },
          { id: "8.2", label: "Free Sale Certificate", hint: "Certificate confirming the device is freely marketed in the country of origin, apostilled or consularized for Russian authorities" },
          { id: "8.3", label: "Foreign Regulatory Approvals", hint: "Copies of registration certificates or marketing authorizations from other regulatory authorities (FDA, CE, TGA, etc.)", textarea: true },
          { id: "8.4", label: "ISO 13485 and Other Certificates", hint: "Copies of valid ISO 13485, ISO 14001, and other relevant management system certificates with Russian translation" },
          { id: "8.5", label: "Power of Attorney", hint: "Notarized and apostilled power of attorney authorizing the Russian representative to act on behalf of the manufacturer" },
        ],
      },
      {
        id: "s9",
        title: "Post-Market Surveillance",
        description: "Pharmacovigilance, adverse event reporting, and EAEU post-market requirements",
        fields: [
          { id: "9.1", label: "Pharmacovigilance System", hint: "Description of the medical device vigilance system for monitoring safety in the Russian Federation and EAEU territory", textarea: true },
          { id: "9.2", label: "Adverse Event Reporting", hint: "Process for reporting adverse incidents to Roszdravnadzor including timelines (immediate for death/serious deterioration, 10 days otherwise)", textarea: true },
          { id: "9.3", label: "Post-Market Surveillance in EAEU", hint: "PMS activities coordinated across Eurasian Economic Union member states including mutual information exchange mechanisms", textarea: true },
          { id: "9.4", label: "Field Safety Corrective Actions", hint: "Procedures for recalls, safety alerts, and field corrections in the Russian market with notification to Roszdravnadzor", textarea: true },
          { id: "9.5", label: "Periodic Safety Reports", hint: "Periodic safety update reports summarizing post-market safety data, trend analysis, and benefit-risk re-evaluation", textarea: true },
        ],
      },
    ],
  },
];
