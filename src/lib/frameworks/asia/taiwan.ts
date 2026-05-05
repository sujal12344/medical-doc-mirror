import type { RegulatoryFramework } from "../types";

export const TW_FRAMEWORKS: RegulatoryFramework[] = [
  {
    id: "TW_TFDA", countryCode: "TW", countryName: "Taiwan", flag: "🇹🇼", authority: "TFDA", documentType: "Medical Device Registration",
    sections: [
      { id: "admin", title: "Administrative Information", description: "Applicant, license holder, and device identification", fields: [
        { id: "applicant", label: "Applicant Information", hint: "Foreign manufacturer name, address, and contact information" },
        { id: "tw_license_holder", label: "Taiwan License Holder", hint: "Taiwan-registered medical device dealer holding the import license" },
        { id: "device_name_cn", label: "Device Name (Chinese)", hint: "Traditional Chinese device name per TFDA naming conventions" },
        { id: "device_name_en", label: "Device Name (English)", hint: "Original English device name matching country of origin registration" },
        { id: "classification", label: "Classification (Class I/II/III)", hint: "Risk classification per TFDA Medical Devices Act (Class I, II, or III)" },
        { id: "tfda_reg_no", label: "TFDA Registration Number", hint: "Existing registration or license number if renewal or modification application" },
      ]},
      { id: "device_desc", title: "Device Description", description: "Technical description and intended use", fields: [
        { id: "description", label: "Device Description", hint: "Comprehensive device description including structure, composition, and working principle", textarea: true },
        { id: "intended_use", label: "Intended Use", hint: "Specific medical intended use, clinical indication, and target patient population", textarea: true },
        { id: "tech_specs", label: "Technical Specifications", hint: "Performance specifications, dimensions, power requirements, and operating parameters", textarea: true },
        { id: "materials", label: "Materials", hint: "All materials used including patient-contacting materials with grade and biocompatibility class", textarea: true },
        { id: "components", label: "Components", hint: "Component list with name, material, function, and critical dimensions", textarea: true },
        { id: "software", label: "Software", hint: "Software name, version, safety classification per IEC 62304, and intended function", textarea: true },
        { id: "accessories", label: "Accessories", hint: "All accessories, consumables, and companion devices required for use", textarea: true },
      ]},
      { id: "quality", title: "Quality System", description: "ISO 13485 and TFDA QSD compliance", fields: [
        { id: "iso_13485", label: "ISO 13485 Certificate", hint: "Current ISO 13485 QMS certificate from TAF or IAF MLA-accredited body" },
        { id: "gmp_qsd", label: "GMP QSD Compliance", hint: "Quality System Documentation (QSD) per TFDA GMP requirements" },
        { id: "tfda_gmp_audit", label: "TFDA GMP Audit Certificate", hint: "TFDA GMP audit certificate or accepted third-party QMS audit report" },
      ]},
      { id: "testing", title: "Testing & Standards", description: "Safety and performance testing per CNS and international standards", fields: [
        { id: "cns_standards", label: "CNS Standards Compliance", hint: "Testing per applicable Chinese National Standards (CNS) with conformity declaration", textarea: true },
        { id: "performance", label: "Performance Testing", hint: "Complete performance testing data demonstrating device claims", textarea: true },
        { id: "biocompat", label: "Biocompatibility", hint: "Biological evaluation per CNS 14393 (ISO 10993) with test reports", textarea: true },
        { id: "electrical_safety", label: "Electrical Safety", hint: "Electrical safety testing per CNS 14336 (IEC 60601) and applicable particular standards", textarea: true },
        { id: "emc", label: "EMC Testing", hint: "Electromagnetic compatibility per CNS 14336-1-2 (IEC 60601-1-2)", textarea: true },
        { id: "sterilization", label: "Sterilization Validation", hint: "Sterilization process validation per applicable CNS/ISO standards", textarea: true },
        { id: "stability", label: "Stability / Shelf Life", hint: "Accelerated and real-time aging data supporting claimed shelf life", textarea: true },
      ]},
      { id: "clinical", title: "Clinical Evidence", description: "Clinical evaluation and investigation data", fields: [
        { id: "clinical_eval", label: "Clinical Evaluation", hint: "Systematic clinical evaluation of available clinical evidence", textarea: true },
        { id: "clinical_trial", label: "Clinical Trial (per TFDA)", hint: "Clinical trial data per TFDA GCP and clinical trial regulations if required", textarea: true },
        { id: "literature", label: "Literature Review", hint: "Systematic literature review of equivalent device clinical data", textarea: true },
      ]},
      { id: "risk", title: "Risk Management", description: "Risk management per ISO 14971", fields: [
        { id: "risk_mgmt", label: "Risk Management (ISO 14971)", hint: "Complete risk management file per CNS 14971 (ISO 14971)", textarea: true },
        { id: "hazard_analysis", label: "Hazard Analysis", hint: "Systematic hazard identification and risk estimation for all hazard categories", textarea: true },
        { id: "risk_control", label: "Risk Control Measures", hint: "Risk control options analysis and implementation with effectiveness verification", textarea: true },
      ]},
      { id: "labeling", title: "Labelling", description: "Traditional Chinese labelling per TFDA requirements", fields: [
        { id: "labels_tw", label: "Chinese Traditional Labels", hint: "All labels in Traditional Chinese per TFDA Medical Devices Act labelling rules", textarea: true },
        { id: "ifu_tw", label: "Instructions for Use", hint: "Complete IFU in Traditional Chinese with indications, contraindications, and warnings", textarea: true },
        { id: "packaging", label: "Packaging", hint: "Primary and secondary packaging with all required labelling elements", textarea: true },
        { id: "tfda_labeling_req", label: "TFDA Labelling Requirements", hint: "TFDA-specific labelling requirements including import license number and dealer information" },
      ]},
      { id: "mfg", title: "Manufacturing", description: "Manufacturing sites and process information", fields: [
        { id: "mfg_sites", label: "Manufacturing Sites", hint: "All manufacturing, sterilization, and final release site details with addresses", textarea: true },
        { id: "process_overview", label: "Process Overview", hint: "Manufacturing process flow from raw materials to finished product packaging", textarea: true },
        { id: "quality_control", label: "Quality Control", hint: "In-process and final inspection procedures with acceptance criteria", textarea: true },
        { id: "special_processes", label: "Special Processes", hint: "Validated special processes (sterilization, welding, sealing) with validation status", textarea: true },
      ]},
      { id: "certs", title: "Certificates", description: "External regulatory certificates and approvals", fields: [
        { id: "free_sale", label: "Free Sale Certificate", hint: "Certificate of free sale from country of origin authenticated by TECO or BOCA" },
        { id: "iso_13485_cert", label: "ISO 13485 Certificate", hint: "ISO 13485 QMS certificate from accredited certification body" },
        { id: "foreign_approvals", label: "Foreign Regulatory Approvals", hint: "Registration status in US (FDA), EU (CE Mark), Japan (PMDA), and other markets", textarea: true },
        { id: "type_test", label: "Type Test Report", hint: "Test report from TFDA-recognized or TAF-accredited testing laboratory" },
      ]},
      { id: "postmarket", title: "Post-Market Surveillance", description: "Adverse event reporting and surveillance", fields: [
        { id: "adverse_reporting", label: "Adverse Event Reporting", hint: "Adverse event reporting procedures and timelines per TFDA Medical Devices Act", textarea: true },
        { id: "surveillance", label: "Post-Market Surveillance Plan", hint: "Systematic PMS plan including complaint handling and trend analysis", textarea: true },
        { id: "recall_plan", label: "Recall Plan", hint: "Product recall classification and corrective action procedures per TFDA regulations", textarea: true },
      ]},
      { id: "tw_specific", title: "Taiwan-Specific Requirements", description: "TFDA-specific regulatory documentation", fields: [
        { id: "power_of_attorney", label: "Power of Attorney", hint: "Notarized power of attorney from manufacturer to Taiwan license holder authenticated by TECO" },
        { id: "dealer_license", label: "Medical Device Dealer License", hint: "Taiwan medical device dealer license for the local license holder" },
        { id: "import_permit", label: "Import Permit Application", hint: "TFDA import permit application form with product classification justification" },
        { id: "tw_insurance", label: "Product Liability Insurance", hint: "Product liability insurance covering distribution in the Taiwan market" },
        { id: "boca_authentication", label: "BOCA/TECO Authentication", hint: "Bureau of Consular Affairs or TECO authentication of foreign documents" },
        { id: "tw_declaration", label: "Conformity Declaration", hint: "Manufacturer's declaration of conformity to TFDA technical requirements" },
      ]},
    ],
  },
];
