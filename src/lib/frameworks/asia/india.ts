import type { RegulatoryFramework } from "../types";

export const IN_FRAMEWORKS: RegulatoryFramework[] = [
  {
    id: "IN_DMF", countryCode: "IN", countryName: "India", flag: "🇮🇳", authority: "CDSCO", documentType: "Device Master File (IVD)", deviceType: "ivd",
    sections: [
      {
        id: "s1", title: "1.0 Executive Summary", description: "Product overview, regulatory status, marketing history", fields: [
          { id: "1.1a", label: "Product Name", hint: "Full commercial name of the IVD medical device" },
          { id: "1.1b", label: "Device Description", hint: "Brief description: purpose, technology, mechanism of action", textarea: true },
          { id: "1.1c", label: "Novel Features", hint: "Features vs CDSCO predicate — from predDevice.predicateBasis + subject/predicate comparison (Phase 1)", textarea: true },
          { id: "1.1d", label: "Claimed Shelf Life", hint: "e.g. 18 months from date of manufacture" },
          { id: "1.1e", label: "Risk Class", hint: "Class A / B / C / D" },
          { id: "1.1f", label: "Synopsis of Dossier", hint: "Brief overview of all sections submitted", textarea: true },
          { id: "1.2", label: "Regulatory Status in India", hint: "Yes — approved (name CDSCO predicate device) OR New device — from Phase 1 predicate pathway" },
          { id: "1.3", label: "Domestic Price", hint: "Price per unit in country of origin currency" },
          { id: "1.4", label: "Marketing History", hint: "Marketing history from first introduction", textarea: true },
          { id: "1.5", label: "Regulatory Approvals Table", hint: "Country | Indication | Shelf-Life | Risk Class | Date", textarea: true },
          { id: "1.6", label: "Pending Clearance Requests", hint: "Agency | Use | Status | Reason for rejection", textarea: true },
          { id: "1.7a", label: "Adverse Events Summary", hint: "Summary with frequency of occurrence", textarea: true },
          { id: "1.7b", label: "Field Safety Corrective Actions", hint: "Date | Reason | Countries | Action", textarea: true },
          { id: "1.7c", label: "Animal/Human Derived Materials", hint: "Animal fluids, tissues, human derivatives used in device", textarea: true },
          { id: "1.7d", label: "Microbial/Recombinant Materials", hint: "Microbial, recombinant proteins, antigens, antibodies used", textarea: true }
        ]
      },
      {
        id: "s2", title: "2.0 Description and specification, including variants and accessories of the in vitro diagnostic medical device.", description: "Technical details, components, specimen requirements", fields: [
          { id: "2.0", label: "Intended Use / Indications for Use", hint: "Full intended use and claims statement (CDSCO DMF §2; from Phase 1 registration)", textarea: true },
          { id: "2.1a", label: "What is Detected", hint: "Specific analyte, pathogen, antibody detected" },
          { id: "2.1b", label: "Device Function", hint: "Screening / Diagnostics / Monitoring" },
          { id: "2.1c", label: "Disorder/Condition Detected", hint: "Clinical disorder/condition the assay addresses (not the full intended-use statement — see field 2.0)", textarea: true },
          { id: "2.1d", label: "Automated or Manual", hint: "Automated / Semi-automated / Manual" },
          { id: "2.1e", label: "Qualitative or Quantitative", hint: "Qualitative / Semi-quantitative / Quantitative" },
          { id: "2.1f", label: "Specimen Type", hint: "Serum, Plasma, Whole Blood, etc." },
          { id: "2.1g", label: "Testing Population", hint: "Human / Animal / Both" },
          { id: "2.1h", label: "Intended User", hint: "Professional / Lay person" },
          { id: "2.1i", label: "Assay Principle", hint: "Technology and step-by-step mechanism", textarea: true },
          { id: "2.1j", label: "Components Description", hint: "Each component: name, ingredient, function", textarea: true },
          { id: "2.1k", label: "Specimen Collection Specs", hint: "Collection materials, volume, stability", textarea: true },
          { id: "2.1l", label: "Instrumentation", hint: "Instrument name, model, specifications", textarea: true },
          { id: "2.1m", label: "Software", hint: "Software name, version, function", textarea: true },
          { id: "2.1n", label: "Configurations/Variants", hint: "Pack sizes and variants available", textarea: true },
          { id: "2.1o", label: "Accessories", hint: "All accessories and companion devices", textarea: true },
          { id: "2.1p", label: "Dedicated Assay Procedure", hint: "Step-by-step assay workflow, controls and calculations", textarea: true },
          { id: "2.1q", label: "Instrument Compatibility Requirements", hint: "Compatible analyzers, readers, wavelength requirements", textarea: true },
          { id: "2.1s", label: "Previous Device Generations / Similar Devices", hint: "Reference to prior generations or similar marketed devices (manufacturer history)", textarea: true },
          { id: "2.2", label: "Clinical Performance (New Device)", hint: "Summary of clinical performance evaluation", textarea: true },
          { id: "2.3", label: "Adverse Events on Market (§2.3 I)", hint: "Summary of adverse events vs units placed on market (existing device)", textarea: true },
          { id: "2.4", label: "Predicate Device Comparison (§2.3 III)", hint: "Subject device (this product) vs CDSCO predicate — similarities, differences, equivalence conclusion; auto-filled from Product + predDevice", textarea: true },
          { id: "2.5", label: "External Conformity Certificates (§2.3 II)", hint: "ISO 13485, CE, WHO PQ, MDSAP, etc.", textarea: true },
        ]
      },
      {
        id: "s3", title: "3.0 Essential Principles Checklist", description: "Safety and performance compliance", fields: [
          { id: "3a", label: "EP Checklist", hint: "EP number | Relevant | Standard | Complies | Reference", textarea: true },
          { id: "3b", label: "Conformity Methods", hint: "Standards, reference methods, in-house methods", textarea: true },
          { id: "3c", label: "Evidence Reference Location", hint: "Reference to report, annexure, technical document", textarea: true },
        ]
      },
      {
        id: "s4", title: "4.0 Risk Analysis and Control Summary.", description: "Risk management per ISO 14971", fields: [
          { id: "4.upload", label: "Risk Management Report", hint: "Upload IFU file of device here to generate Risk Management Report table", textarea: true, allowUpload: true },
          { id: "4.summary", label: "Risk Management Summary", hint: "Narrative summary and explanation of the risk management activities and conclusions", textarea: true }
        ]
      },
      {
        id: "s5", title: "5.0 Design and Manufacturing Information", description: "Design, process, and manufacturing site information", fields: [
          { id: "5.0", label: "5.0 Design and Manufacturing Information (Essential Requirements Checklist Table)", hint: "Table fields: No, Essential Requirement, Applies (Yes/No/NA), Applicable Std /Procedure, Response", textarea: true },
          { id: "5.1", label: "5.1 Device Design", hint: "Description with Kit contents table", textarea: true },
          { id: "5.2", label: "5.2 Manufacturing Process", hint: "Description with a flow sheet diagram", textarea: true },
          { id: "5.3", label: "5.3 QC Flow Chart", hint: "QC flow chart", textarea: true },
          { id: "5.4", label: "5.4 Manufacturing Site", hint: "Manufacturing Site", textarea: true }
        ]
      },
      {
        id: "s6", title: "6.0 Product Validation and Verification", description: "Study protocols, results, and conclusions", fields: [
          { id: "6.1", label: "COA / Summary Information", hint: "Study protocol, results, conclusions", textarea: true },
          { id: "6.2", label: "Detailed Information", hint: "Complete study protocol and report", textarea: true },
          { id: "6.3", label: "Validation Protocol", hint: "Study design and acceptance criteria", textarea: true },
          { id: "6.4", label: "Validation Results", hint: "Summary of validation findings", textarea: true },
          { id: "6.5", label: "Validation Conclusion", hint: "Overall conclusion and compliance statement", textarea: true },
        ]
      },
      {
        id: "s7", title: "7.0 Analytical Studies", description: "Conformity demonstration studies", fields: [
          { id: "7", label: "Analytical Studies Overview", hint: "Studies demonstrating conformity", textarea: true },
          { id: "7.1", label: "Table 4. Precision Table", hint: "Precision study results — auto-generated from the batch upload above", textarea: true },
          { id: "7.2", label: "Table 5. Accuracy Table", hint: "Accuracy/method comparison study results — auto-generated from the batch upload above", textarea: true },
          { id: "7.3", label: "Table 6. Linearity Table", hint: "Linearity study results — auto-generated from the batch upload above", textarea: true }
        ]
      },
      {
        id: "s8", title: "8.0 Specimen Type", description: "Specimen Type", fields: [
          { id: "8.1", label: "Specimen Type", hint: "Type of specimen used in the study", textarea: true },
        ]
      },
      {
        id: "s9", title: "9.0 Analytical Performance Characteristics", description: "Accuracy, trueness, precision, repeatability, and reproducibility", fields: [
          { id: "9.1", label: "Reproducibility", hint: "Variability between days, runs, sites", textarea: true },
        ]
      },
      {
        id: "s10_sensitivity", title: "10.0 Analytical Sensitivity", description: "Analytical sensitivity / detection limit studies (LoB, LoD, LoQ)", fields: [
          { id: "10.0a", label: "Analytical Sensitivity Overview", hint: "Brief description of detection limit studies", textarea: true },
          { id: "10.1", label: "Analytical Sensitivity Study Table", hint: "Sensitivity study results — auto-generated from the batch upload in §7", textarea: true }
        ]
      },
      {
        id: "s11_specificity", title: "11.0 Analytical Specificity", description: "Analytical specificity studies: interfering substances and cross-reactivity", fields: [
          { id: "11.0a", label: "Analytical Specificity Overview", hint: "Brief description of interference and cross-reactivity studies", textarea: true },
          { id: "11.1", label: "Table 6: Analytical Specificity Study", hint: "Upload specificity study report to populate the interference table", textarea: true, allowUpload: true }
        ]
      },
      {
        id: "s12_traceability", title: "12.0 Metrological traceability of calibrator and control material values:", description: "Traceability chain of calibrators and controls per ISO 17511, ISO 18113, and ISO 13485", fields: [
          {
            id: "12.0a",
            label: "Table: Metrological Traceability Hierarchy",
            hint: "Auto-generated from Phase 1 IFU and product data. Click 'Run Auto-fill' to populate the traceability hierarchy table and regulatory narrative.",
            textarea: true
          }
        ]
      },
      {
        id: "s13_cutoff", title: "13.0 Definition of Assay Cut-off:", description: "Assay cut-off determination studies", fields: [
          { id: "14.0a", label: "Assay Cut-off Details", hint: "Clinical cut-off definition and justification", textarea: true }
        ]
      },
      {
        id: "s14_stability", title: "14.0 Stability (excluding specimen stability)", description: "Overview of reagent and kit stability studies", fields: [
          { id: "15.0a", label: "Stability Studies Overview", hint: "Summary of all stability studies conducted — auto-filled from Stability Reports section", textarea: true }
        ]
      },
      {
        id: "s16_shelf", title: "16.0 Claimed Shelf Life", description: "Shelf life stability studies (real-time and accelerated)", fields: [
          { id: "16.0a", label: "Claimed Shelf Life Data", hint: "Auto-filled from Accelerated Stability report in the Stability Reports section", textarea: true }
        ]
      },
      {
        id: "s17_inuse", title: "17.0 In-Use Stability", description: "Reconstituted/open-vial and on-board stability studies", fields: [
          { id: "17.0a", label: "In-Use / On-Board Stability Data", hint: "Auto-filled from In-Use Stability report in the Stability Reports section", textarea: true }
        ]
      },
      {
        id: "s18_shipping", title: "18.0 Shipping Stability", description: "Stability under simulated or real shipping stress conditions", fields: [
          { id: "18.0a", label: "Shipping / Transport Stability Data", hint: "Auto-filled from Shipping Stability report in the Stability Reports section", textarea: true }
        ]
      },
      {
        id: "s_stability_reports",
        title: "Stability Reports",
        description: "Full regulatory-grade stability study reports. Upload IFU and COA documents to auto-generate all three reports simultaneously.",
        fields: [
          {
            id: "sr_inuse",
            label: "In-Use Stability Study Report",
            hint: "Upload IFU + COA files to auto-generate. Follows EN ISO 23640 with sections: Objective, Storage Conditions, Testing Calendar, Product Description, Kit Content, Procedure, Study Results, Conclusion, Approval.",
            textarea: true,
            allowUpload: true
          },
          {
            id: "sr_accelerated",
            label: "Accelerated Stability Study Report",
            hint: "Upload IFU + COA files to auto-generate. Follows EN ISO 23640 with Arrhenius projection, 37°C storage, monthly intervals, and shelf life claim.",
            textarea: true,
            allowUpload: true
          },
          {
            id: "sr_shipping",
            label: "Shipping Stability Study Report",
            hint: "Upload IFU + COA files to auto-generate. Follows EN ISO 23640 and CLSI EP25-A with daily intervals over 7 days, transport simulation rationale.",
            textarea: true,
            allowUpload: true
          }
        ]
      },
      {
        id: "s19", title: "19.0 Clinical Evidence", description: "Clinical evaluation report", fields: [
          { id: "19", label: "Clinical Evidence", hint: "Conformity to essential principles", textarea: true }
        ]
      },
      {
        id: "s20", title: "20.0 Labelling", description: "Structured product label fields — upload label image to auto-populate via OCR", fields: [
          {
            id: "20.upload",
            label: "Upload Label Artwork (OCR Auto-Fill)",
            hint: "Upload the label artwork image or PDF. OCR will extract text fields and crop the company logo.",
            textarea: false,
            allowUpload: true
          },
          {
            id: "20.preview",
            label: "Label Mock-up Preview",
            hint: "Generated label artwork preview based on the fields below. Click Download .doc to export.",
            readonly: true
          },

          {
            id: "20.logo",
            label: "Company Logo",
            hint: "Company/brand logo image — will display as a preview",
            fieldType: "image",
            allowUpload: true
          },

          {
            id: "20.productName",
            label: "Product Name",
            hint: "Full commercial product name as printed on the label (e.g. Q-Line® Albumin)"
          },
          {
            id: "20.packSize",
            label: "Pack Size",
            hint: "Pack size / kit configuration as printed on the label (e.g. 2 x 50 mL)"
          },
          {
            id: "20.batchNo",
            label: "Batch No. [LOT]",
            hint: "Batch / lot number as printed on the label (e.g. ALB-2101-001)"
          },
          {
            id: "20.deviceType",
            label: "Device Type [IVD]",
            hint: "Regulatory device type symbol on label (e.g. IVD — In Vitro Diagnostic Medical Device)"
          },
          {
            id: "20.mfgDate",
            label: "Mfg. Date 🏭",
            hint: "Manufacturing date as printed on the label using the hourglass-filled symbol (e.g. July.2021)"
          },
          {
            id: "20.expDate",
            label: "Exp. Date ⌛",
            hint: "Expiry / use-by date as printed on the label using the hourglass symbol (e.g. July.2023)"
          },
          {
            id: "20.storage",
            label: "Storage Conditions 🌡️",
            hint: "Storage temperature / conditions printed on the label (e.g. Store at 15–30°C)"
          },
          {
            id: "20.mrp",
            label: "MRP (Maximum Retail Price)",
            hint: "Price as printed on the label (e.g. XXXX – Incl of taxes)"
          },
          {
            id: "20.manufacturer",
            label: "Manufacturer Name & Address",
            hint: "Full legal manufacturer name and registered address as printed on label",
            textarea: true
          }
        ]
      },
      {
        id: "s21", title: "21.0 Post Market Surveillance Data (Vigilance Reporting):", description: "Vigilance and CAPA", fields: [
          { id: "21", label: "Surveillance Data", hint: "Complaints received and CAPA taken", textarea: true }
        ]
      },
      {
        id: "s22", title: "22.0 Information Required to be submitted for the in-vitro diagnostic medical device.", description: "IVD-specific additional requirements", fields: [
          { id: "22.1", label: "Antigen/Antibody Details", hint: "Source, characterization, coating process", textarea: true },
          { id: "22.2", label: "Test Protocol", hint: "Specifications and method of testing", textarea: true },
          { id: "22.3", label: "NCA Evaluation Report", hint: "Evaluation by national control authority", textarea: true },
          { id: "22.4", label: "Batch Test Report", hint: "3+ consecutive batches", textarea: true },
          { id: "22.5", label: "Component Test Report", hint: "All components used in finished device", textarea: true },
          { id: "22.6", label: "Pack Size & Labelling", hint: "All pack sizes and labelling spec" },
          { id: "22.7", label: "Product Inserts (IFU)", hint: "Full IFU document", textarea: true },
          { id: "22.8", label: "Indian Lab Evaluation", hint: "Sensitivity/specificity by Indian lab", textarea: true },
          { id: "22.9", label: "Safety Data Sheet", hint: "Safe handling, material control, storage", textarea: true },
          { id: "22.10", label: "Quality Control Acceptance Criteria", hint: "Negative control, positive control and validity criteria", textarea: true },
          { id: "22.11", label: "Biological Source Materials", hint: "Animal, human, microbial or recombinant origin materials", textarea: true },
          { id: "22.13", label: "Calibrator Details", hint: "Reference materials and calibration hierarchy", textarea: true },
          { id: "22.14", label: "Control Material Details", hint: "Positive, negative and internal controls", textarea: true },
          { id: "22.12a", label: "Table 22.1. List Of Standards", hint: "Upload standards certificate or list to populate standards table", textarea: true, allowUpload: true }
        ]
      },
      {
        id: "s_coa", title: "COA Generation", description: "Upload Value Sheet for automatic COA generation", fields: [
          { id: "coa.upload", label: "Value Sheet", hint: "Upload Value Sheet to generate Certificate of Analysis", textarea: true, allowUpload: true }
        ]
      },
    ],
  },
  {
    id: "IN_DMF_MD", countryCode: "IN", countryName: "India", flag: "🇮🇳", authority: "CDSCO", documentType: "Device Master File (Medical Device)", deviceType: "medical-device",
    sections: [
      {
        id: "s1", title: "Executive Summary", description: "Product overview, regulatory status, marketing history", fields: [
          { id: "1.1a", label: "Product Name", hint: "Full commercial name of the medical device" },
          { id: "1.1b", label: "Device Description", hint: "Brief description of the device including purpose, technology, and mechanism of action", textarea: true },
          { id: "1.1c", label: "Novel Features", hint: "Features distinguishing this device from existing marketed devices", textarea: true },
          { id: "1.1d", label: "Claimed Shelf Life", hint: "Expected useful life e.g. 5 years from date of manufacture" },
          { id: "1.1e", label: "Risk Class", hint: "Class A / B / C / D per MDR 2017 classification rules" },
          { id: "1.1f", label: "Synopsis of Dossier", hint: "Brief overview of all sections submitted in the DMF", textarea: true },
          { id: "1.2", label: "Regulatory Status in India", hint: "Yes — approved (CDSCO predicate device name) OR New device — from Phase 1 predDevice" },
          { id: "1.3", label: "Domestic Price", hint: "Ex-factory price per unit in country of origin currency" },
          { id: "1.4", label: "Marketing History", hint: "Global marketing history from first commercial introduction", textarea: true },
          { id: "1.5", label: "Regulatory Approvals Table", hint: "Country | Intended Use | Risk Class | Approval Date | License Number", textarea: true },
          { id: "1.6", label: "Pending Clearance Requests", hint: "Regulatory Agency | Intended Use | Status | Reason for any rejection", textarea: true },
          { id: "1.7a", label: "Adverse Events Summary", hint: "Summary of all reported adverse events with frequency of occurrence", textarea: true },
          { id: "1.7b", label: "Field Safety Corrective Actions", hint: "Date | Reason | Affected Countries | Corrective Action taken", textarea: true },
        ]
      },
      {
        id: "s2", title: "Device Description", description: "Technical details, intended use, principle of operation", fields: [
          { id: "2.1", label: "Device Function", hint: "Primary therapeutic, diagnostic, or monitoring function of the device" },
          { id: "2.2", label: "Intended Use", hint: "Specific medical indication, patient population, and clinical setting", textarea: true },
          { id: "2.3", label: "Principle of Operation", hint: "Scientific and engineering principles underlying device function", textarea: true },
          { id: "2.4", label: "Technical Specifications", hint: "Dimensions, weight, power requirements, operating parameters", textarea: true },
          { id: "2.5", label: "Materials and Composition", hint: "All materials including patient-contacting materials with grade and source", textarea: true },
          { id: "2.6", label: "Components Description", hint: "Each component: name, material, function, and supplier", textarea: true },
          { id: "2.7", label: "Software", hint: "Software name, version, SOP level, intended function per IEC 62304", textarea: true },
          { id: "2.8", label: "Accessories", hint: "All accessories, companion devices, and consumables required", textarea: true },
          { id: "2.9", label: "Configurations/Variants", hint: "All models, sizes, configurations, and variants available", textarea: true },
          { id: "2.10", label: "Sterilization Method", hint: "Method of sterilization (EtO, gamma, steam, etc.) and validation reference" },
          { id: "2.11", label: "Biocompatibility Summary", hint: "Summary of biological evaluation per ISO 10993-1 risk assessment", textarea: true },
          { id: "2.12", label: "Shelf Life Basis", hint: "Basis for claimed shelf life including accelerated and real-time data references" },
          { id: "2.13", label: "Predicate Device Comparison (§2.3 III)", hint: "Subject device (this product) vs CDSCO predicate — similarities, differences, equivalence conclusion; auto-filled from Product + predDevice", textarea: true },
          { id: "2.14", label: "Previous Device Generations / Similar Devices", hint: "Prior generations or similar marketed devices from same manufacturer", textarea: true },
        ]
      },
      {
        id: "s3", title: "Essential Principles", description: "Safety and performance compliance per Schedule 3", fields: [
          { id: "3a", label: "EP Checklist", hint: "Essential Principle number | Applicable | Standard Used | Compliance Status | Evidence Reference", textarea: true },
          { id: "3b", label: "Conformity Methods", hint: "Methods used to demonstrate conformity: harmonized standards, common specifications, in-house methods", textarea: true },
          { id: "3c", label: "Applied Standards", hint: "List of all Indian and international standards applied with edition and date", textarea: true },
        ]
      },
      {
        id: "s4", title: "Risk Management", description: "Risk analysis and management per ISO 14971", fields: [
          { id: "4a", label: "Risk Analysis per ISO 14971", hint: "Complete risk analysis including intended use, foreseeable misuse, and hazardous situations", textarea: true },
          { id: "4b", label: "Hazard Analysis", hint: "Systematic identification of hazards: biological, mechanical, electrical, thermal, radiation", textarea: true },
          { id: "4c", label: "Risk Control Measures", hint: "Risk control options implemented: inherent safety, protective measures, information for safety", textarea: true },
          { id: "4d", label: "Residual Risk Evaluation", hint: "Overall residual risk assessment and benefit-risk analysis", textarea: true },
        ]
      },
      {
        id: "s5", title: "Design & Manufacturing", description: "Design history, manufacturing process, and site information", fields: [
          { id: "5.1", label: "Design Description", hint: "Detailed device design including engineering drawings and specifications", textarea: true },
          { id: "5.2", label: "Design History", hint: "Design and development planning, inputs, outputs, reviews, and transfers", textarea: true },
          { id: "5.3", label: "Manufacturing Process", hint: "Complete process flow: raw materials, assembly, testing, packaging, sterilization", textarea: true },
          { id: "5.4", label: "Manufacturing Sites", hint: "Name, address, and scope of each manufacturing and sterilization site", textarea: true },
          { id: "5.5", label: "Special Processes", hint: "Processes that cannot be fully verified by inspection (welding, sealing, sterilization)", textarea: true },
          { id: "5.6", label: "Process Validation", hint: "Validation protocols and reports for critical manufacturing processes", textarea: true },
        ]
      },
      {
        id: "s6", title: "Verification & Validation", description: "Design verification, validation, and performance testing", fields: [
          { id: "6.1", label: "Design Verification", hint: "Testing to confirm design outputs meet design input requirements", textarea: true },
          { id: "6.2", label: "Design Validation", hint: "Testing to confirm device meets user needs and intended uses under actual or simulated conditions", textarea: true },
          { id: "6.3", label: "Biocompatibility Testing (ISO 10993)", hint: "Biological evaluation results: cytotoxicity, sensitization, irritation, systemic toxicity", textarea: true },
          { id: "6.4", label: "Electrical Safety (IEC 60601)", hint: "Electrical safety testing results per IEC 60601-1 and relevant collateral/particular standards", textarea: true },
          { id: "6.5", label: "EMC Testing", hint: "Electromagnetic compatibility test results per IEC 60601-1-2", textarea: true },
          { id: "6.6", label: "Sterilization Validation", hint: "Sterilization process validation per ISO 11135/11137/17665 as applicable", textarea: true },
          { id: "6.7", label: "Packaging Validation", hint: "Sterile barrier system validation per ISO 11607 and transport simulation", textarea: true },
          { id: "6.8", label: "Shelf Life Testing", hint: "Real-time and accelerated aging data per ASTM F1980", textarea: true },
          { id: "6.9", label: "Software Validation", hint: "Software verification and validation per IEC 62304 including cybersecurity assessment", textarea: true },
        ]
      },
      {
        id: "s7", title: "Clinical Evidence", description: "Clinical evaluation and investigation data", fields: [
          { id: "7.1", label: "Clinical Evaluation Report", hint: "Systematic review of clinical data demonstrating safety and performance", textarea: true },
          { id: "7.2", label: "Clinical Investigation Summary", hint: "Summary of any clinical trials conducted with protocol and results", textarea: true },
          { id: "7.3", label: "Literature Review", hint: "Systematic literature review of equivalent or similar device clinical data", textarea: true },
          { id: "7.4", label: "Post-Market Clinical Data", hint: "Clinical data collected from post-market surveillance activities", textarea: true },
        ]
      },
      {
        id: "s8", title: "Labelling", description: "Structured product label fields — upload label image to auto-populate via OCR", fields: [
          {
            id: "8.upload",
            label: "Upload Label Artwork (OCR Auto-Fill)",
            hint: "Upload the label artwork image or PDF. OCR will extract text fields and crop the company logo.",
            textarea: false,
            allowUpload: true
          },
          {
            id: "8.logo",
            label: "Company Logo",
            hint: "Company/brand logo image — will display as a preview",
            fieldType: "image",
            allowUpload: true
          },
          {
            id: "8.symbols_upload",
            label: "Upload Symbols Sheet (Cropping)",
            hint: "Upload a symbols sheet image or PDF containing your official symbol graphics (LOT, MD, Mfg, Exp, Storage) to crop them for the Word template.",
            textarea: false,
            allowUpload: true
          },
          {
            id: "8.productName",
            label: "Product Name",
            hint: "Full commercial product name as printed on the label (e.g. Q-Line® Albumin)"
          },
          {
            id: "8.packSize",
            label: "Pack Size",
            hint: "Pack size / kit configuration as printed on the label (e.g. 2 x 50 mL)"
          },
          {
            id: "8.batchNo",
            label: "Batch No. [LOT]",
            hint: "Batch / lot number as printed on the label (e.g. ALB-2101-001)"
          },
          {
            id: "8.deviceType",
            label: "Device Type [MD]",
            hint: "Device type classification (e.g. medical device class, sterility status)"
          },
          {
            id: "8.mfgDate",
            label: "Mfg. Date 🏭",
            hint: "Manufacturing date as printed on the label using the hourglass-filled symbol"
          },
          {
            id: "8.expDate",
            label: "Exp. Date ⌛",
            hint: "Expiry / use-by date as printed on the label using the hourglass symbol"
          },
          {
            id: "8.storage",
            label: "Storage Conditions 🌡️",
            hint: "Storage temperature / conditions printed on the label"
          },
          {
            id: "8.mrp",
            label: "MRP (Maximum Retail Price)",
            hint: "Price as printed on the label (e.g. XXXX – Incl of taxes)"
          },
          {
            id: "8.manufacturer",
            label: "Manufacturer Name & Address",
            hint: "Full legal manufacturer name and registered address as printed on label (per MDR 2017 §10)",
            textarea: true
          },

          {
            id: "8.packaging",
            label: "Packaging Specifications",
            hint: "Packaging specifications and materials for all configurations",
            textarea: true
          },
          {
            id: "8.implantCard",
            label: "Implant Card",
            hint: "Patient implant card if applicable per MDR 2017 Schedule 5",
            textarea: true
          },
        ]
      },
      {
        id: "s9", title: "Post-Market Surveillance", description: "Surveillance plan, adverse event reporting, and corrective actions", fields: [
          { id: "9.1", label: "Surveillance Plan", hint: "Proactive post-market surveillance plan including data sources and analysis methods", textarea: true },
          { id: "9.2", label: "Adverse Event Reporting", hint: "Process for reporting serious adverse events to CDSCO within prescribed timelines", textarea: true },
          { id: "9.3", label: "CAPA", hint: "Corrective and preventive action procedures for identified device issues", textarea: true },
          { id: "9.4", label: "Field Safety Corrective Actions", hint: "Procedures for field safety notices, recalls, and corrective actions", textarea: true },
        ]
      },
      {
        id: "s10", title: "Additional Requirements", description: "CDSCO-specific regulatory certificates and licenses", fields: [
          { id: "10.1", label: "CDSCO Import License", hint: "Import license number and validity per Medical Device Rules 2017" },
          { id: "10.2", label: "Free Sale Certificate", hint: "Certificate of free sale from country of origin regulatory authority" },
          { id: "10.3", label: "ISO 13485 Certificate", hint: "Current ISO 13485 QMS certificate issued by accredited certification body" },
          { id: "10.5", label: "Wholesale License", hint: "Wholesale license details for Indian importer/distributor" },
          { id: "10.6", label: "Test Reports from Approved Labs", hint: "Test reports from CDSCO-recognized or NABL-accredited laboratories", textarea: true },
        ]
      },
      {
        id: "s_coa", title: "COA Generation", description: "Upload Value Sheet for automatic COA generation", fields: [
          { id: "coa.upload", label: "Value Sheet", hint: "Upload Value Sheet to generate Certificate of Analysis", textarea: true, allowUpload: true }
        ]
      },
    ],
  },
];
