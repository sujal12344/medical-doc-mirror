import type { RegulatoryFramework } from "../types";

export const CA_FRAMEWORKS: RegulatoryFramework[] = [
  {
    id: "CA_MDL",
    countryCode: "CA",
    countryName: "Canada",
    flag: "🇨🇦",
    authority: "Health Canada",
    documentType: "Medical Device Licence Application",
    sections: [
      {
        id: "s1",
        title: "Administrative Information",
        description: "Applicant details, device identification, and licence class",
        fields: [
          { id: "1.1", label: "Applicant Name & Address", hint: "Legal name and full address of the Canadian licence holder or authorized representative" },
          { id: "1.2", label: "Establishment Licence Number", hint: "Medical Device Establishment Licence (MDEL) number issued under the Medical Devices Regulations" },
          { id: "1.3", label: "Device Name", hint: "Trade name, common/generic name, and model identifiers as they will appear on the licence" },
          { id: "1.4", label: "Licence Class", hint: "Medical device licence class: Class I (MDEL only), Class II, Class III, or Class IV per SOR/98-282 classification rules" },
          { id: "1.5", label: "MDEL Holder", hint: "Name and MDEL number of the importer or distributor responsible for the device in Canada" },
          { id: "1.6", label: "Device Identifier", hint: "Unique catalogue/model number distinguishing each device configuration within the licence application" },
          { id: "1.7", label: "Application Type", hint: "New licence, licence amendment, or licence renewal per Health Canada submission pathway" },
          { id: "1.8", label: "Regulatory Correspondence History", hint: "Previous Health Canada application numbers, screening deficiency responses, or pre-submission meeting references" },
        ],
      },
      {
        id: "s2",
        title: "Device Description",
        description: "Technical characterization and functional overview of the device",
        fields: [
          { id: "2.1", label: "Device Description", hint: "Comprehensive narrative describing design, size, physical properties, and functional characteristics", textarea: true },
          { id: "2.2", label: "Intended Use & Indications", hint: "Statement of intended purpose including target population, clinical condition, and anatomical site", textarea: true },
          { id: "2.3", label: "Materials of Construction", hint: "All patient-contacting and structural materials with specifications (e.g., 316L stainless steel, PTFE, silicone grade)", textarea: true },
          { id: "2.4", label: "Components & Accessories", hint: "List of all device components, sub-assemblies, and accessories with catalogue numbers", textarea: true },
          { id: "2.5", label: "Principle of Operation", hint: "Technical mechanism of action: energy source, detection method, therapeutic modality, or diagnostic principle", textarea: true },
          { id: "2.6", label: "Software Description", hint: "Software of Unknown Provenance (SOUP) list, SaMD classification per IMDRF, version control, and cybersecurity considerations", textarea: true },
        ],
      },
      {
        id: "s3",
        title: "Classification",
        description: "Device classification under the Medical Devices Regulations",
        fields: [
          { id: "3.1", label: "Classification Rules Applied", hint: "Specific classification rule(s) from Schedule 1 of the Medical Devices Regulations (SOR/98-282) used to determine the device class", textarea: true },
          { id: "3.2", label: "Special Access Authorization", hint: "If applicable, reference to Special Access Programme authorization for devices not yet licensed in Canada" },
          { id: "3.3", label: "Device Family Grouping Rationale", hint: "Justification for grouping multiple models/sizes under a single licence based on shared intended use and design" , textarea: true },
        ],
      },
      {
        id: "s4",
        title: "Risk Management",
        description: "Hazard analysis and risk control measures per ISO 14971",
        fields: [
          { id: "4.1", label: "Risk Management Plan", hint: "Summary of risk management plan per ISO 14971:2019 including scope, risk acceptability criteria, and verification activities", textarea: true },
          { id: "4.2", label: "Hazard Analysis", hint: "Systematic identification of hazards and hazardous situations during normal use and foreseeable misuse", textarea: true },
          { id: "4.3", label: "Risk Evaluation & Control", hint: "Risk estimation results (severity × probability), risk control measures applied, and residual risk assessment", textarea: true },
          { id: "4.4", label: "Benefit-Risk Analysis", hint: "Overall residual risk acceptability determination and benefit-risk comparison for the intended use", textarea: true },
          { id: "4.5", label: "Risk Management Report", hint: "Summary conclusions from the risk management report confirming all risks are acceptable or outweighed by benefits", textarea: true },
        ],
      },
      {
        id: "s5",
        title: "Standards & Testing",
        description: "Recognized standards compliance and performance verification",
        fields: [
          { id: "5.1", label: "Recognized Standards", hint: "List of Health Canada Recognized Standards applied (e.g., IEC 60601-1, ISO 10993 series) with declaration of conformity", textarea: true },
          { id: "5.2", label: "Performance Testing", hint: "Summary of bench testing demonstrating device meets performance specifications under intended conditions of use", textarea: true },
          { id: "5.3", label: "Biocompatibility Testing", hint: "Biological evaluation per ISO 10993-1 including cytotoxicity, sensitization, irritation, and systemic toxicity as applicable", textarea: true },
          { id: "5.4", label: "Electrical Safety & EMC", hint: "IEC 60601-1 (general safety), IEC 60601-1-2 (EMC), and applicable particular standards test reports", textarea: true },
          { id: "5.5", label: "Sterilization Validation", hint: "Sterilization method validation per ISO 11135 (EO), ISO 11137 (radiation), or ISO 17665 (moist heat) with SAL demonstration", textarea: true },
        ],
      },
      {
        id: "s6",
        title: "Clinical Evidence",
        description: "Clinical evaluation and investigation data supporting safety and effectiveness",
        fields: [
          { id: "6.1", label: "Clinical Evaluation Report", hint: "Systematic review of clinical data per MEDDEV 2.7/1 Rev 4 demonstrating safety and performance for intended use", textarea: true },
          { id: "6.2", label: "Literature Review", hint: "Appraisal of published clinical literature with search strategy, inclusion/exclusion criteria, and data extraction tables", textarea: true },
          { id: "6.3", label: "Clinical Investigation Summary", hint: "If conducted: study design, endpoints, sample size justification, results, and adverse events per ISO 14155", textarea: true },
          { id: "6.4", label: "Substantial Equivalence Comparison", hint: "Comparison to a legally marketed predicate device addressing technological characteristics, intended use, and clinical performance", textarea: true },
        ],
      },
      {
        id: "s7",
        title: "Quality Management System",
        description: "QMS certification and MDSAP compliance",
        fields: [
          { id: "7.1", label: "ISO 13485 Certificate", hint: "Current ISO 13485:2016 certificate from an accredited registrar covering the device scope and all manufacturing sites" },
          { id: "7.2", label: "MDSAP Certificate", hint: "Medical Device Single Audit Program certificate demonstrating compliance with Health Canada regulatory requirements" },
          { id: "7.3", label: "CMDCAS Certificate", hint: "Canadian Medical Devices Conformity Assessment System certificate (legacy) or MDSAP replacement documentation" },
          { id: "7.4", label: "Quality System Procedures Summary", hint: "Overview of QMS procedures covering design control, CAPA, supplier management, and production controls", textarea: true },
        ],
      },
      {
        id: "s8",
        title: "Labelling",
        description: "Bilingual labelling and instructions for use",
        fields: [
          { id: "8.1", label: "Device Labels (EN/FR)", hint: "All device labels in both English and French per Official Languages Act and CMDR labelling requirements", textarea: true },
          { id: "8.2", label: "Instructions for Use (EN/FR)", hint: "Complete bilingual IFU including indications, contraindications, warnings, precautions, and operating instructions", textarea: true },
          { id: "8.3", label: "Packaging & Outer Labels", hint: "Shipping labels, carton labels, and shelf-pack labels with UDI-DI, lot/serial number, and expiry date fields", textarea: true },
          { id: "8.4", label: "Symbols & Glossary", hint: "ISO 15223-1 symbols used on labelling with corresponding explanations provided to the user" },
          { id: "8.5", label: "UDI Compliance", hint: "Unique Device Identification per Health Canada UDI requirements including UDI-DI, UDI-PI, and GUDID database submission" },
        ],
      },
      {
        id: "s9",
        title: "Post-Market Surveillance",
        description: "Mandatory Problem Reporting, recalls, and corrective actions",
        fields: [
          { id: "9.1", label: "Mandatory Problem Reporting", hint: "Procedures for reporting incidents to Health Canada under Section 59 of the Medical Devices Regulations within required timelines", textarea: true },
          { id: "9.2", label: "Recall Procedures", hint: "Recall strategy and communication plan per Health Canada recall classification (Type I, II, III) and reporting obligations", textarea: true },
          { id: "9.3", label: "Corrective Actions", hint: "Field safety corrective action (FSCA) procedures including investigation, root cause analysis, and effectiveness checks", textarea: true },
          { id: "9.4", label: "Complaint Trending & Signal Detection", hint: "Statistical methods for monitoring complaint trends and identifying emerging safety signals from post-market data", textarea: true },
        ],
      },
      {
        id: "s10",
        title: "Manufacturing Information",
        description: "Manufacturing processes, facilities, and sterilization",
        fields: [
          { id: "10.1", label: "Manufacturing Process Overview", hint: "High-level process flow from raw materials through finished device including critical process parameters and in-process controls", textarea: true },
          { id: "10.2", label: "Manufacturing Facility", hint: "Site name, address, and scope of activities (fabrication, assembly, packaging, sterilization, final release) for each facility" },
          { id: "10.3", label: "Sterilization Validation", hint: "Terminal sterilization or aseptic processing validation including bioburden determination, dose audit, and routine monitoring", textarea: true },
          { id: "10.4", label: "Contract Manufacturers", hint: "Names and addresses of contract manufacturers and sterilizers with scope of outsourced activities" },
          { id: "10.5", label: "Environmental Controls", hint: "Cleanroom classifications, environmental monitoring, and controlled environment specifications for critical manufacturing steps" },
          { id: "10.6", label: "Process Validation Summary", hint: "Summary of validated processes (e.g., welding, sealing, molding) with IQ/OQ/PQ status and revalidation schedule", textarea: true },
        ],
      },
    ],
  },
];
