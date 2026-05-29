import type { RegulatoryFramework } from "../types";

const EU_MDR: RegulatoryFramework = {
  id: "EU_MDR",
  countryCode: "EU",
  countryName: "European Union",
  flag: "🇪🇺",
  authority: "MDR 2017/745",
  documentType: "Technical Documentation (Medical Device)",
  deviceType: "medical-device",
  sections: [
    {
      id: "device_description",
      title: "Device Description & Specification",
      description:
        "Complete device description per Annex II Section 1, including identification, intended purpose, and technical specifications.",
      fields: [
        {
          id: "productTradeName",
          label: "Product / Trade Name",
          hint: "Official product name and any trade names used in marketing. Include model numbers and catalogue references for all variants.",
        },
        {
          id: "udiDi",
          label: "UDI-DI",
          hint: "Unique Device Identifier – Device Identifier assigned per Article 27 and Annex VI Part C. Include the issuing entity (GS1, HIBCC, ICCBBA, or IFA).",
        },
        {
          id: "generalDescription",
          label: "General Description",
          hint: "Comprehensive technical description of the device including its form, size, weight, materials, and key functional features. Reference applicable GMDN and EMDN codes.",
          textarea: true,
        },
        {
          id: "intendedPurpose",
          label: "Intended Purpose",
          hint: "Intended purpose per Article 2(12): the use for which the device is intended according to the manufacturer's data on labelling, IFU, and promotional materials.",
          textarea: true,
        },
        {
          id: "patientPopulation",
          label: "Patient Population",
          hint: "Target patient population including age groups, anatomical sites, and any contraindicated populations. Specify paediatric or neonatal applicability per MDR Article 1(2).",
        },
        {
          id: "medicalConditions",
          label: "Medical Conditions / Indications",
          hint: "Clinical conditions, diseases, or disorders the device is intended to diagnose, prevent, monitor, treat, or alleviate. Include relevant ICD-10/ICD-11 codes where applicable.",
          textarea: true,
        },
        {
          id: "principlesOfOperation",
          label: "Principles of Operation & Mode of Action",
          hint: "Scientific principles underlying device function and its primary mode of action (physical, chemical, biological, mechanical). Distinguish pharmacological, immunological, or metabolic effects if relevant to borderline assessment per Article 1(6).",
          textarea: true,
        },
        {
          id: "materialsComponents",
          label: "Materials & Key Components",
          hint: "Bill of materials for patient-contacting and critical components. Identify substances of toxicological concern per Annex I Section 10.4, CMR/endocrine-disrupting substances, and materials of animal or human origin.",
          textarea: true,
        },
        {
          id: "softwareInformation",
          label: "Software Identification",
          hint: "Software of Unknown Provenance (SOUP) list, software version/build, SaMD classification per IMDRF guidance, and cybersecurity considerations per MDCG 2019-16. Include software architecture diagrams if applicable.",
          textarea: true,
        },
        {
          id: "accessoriesCombinations",
          label: "Accessories & Device Combinations",
          hint: "List all accessories per Article 2(2) and devices intended for combined use. Reference each accessory's regulatory status and UDI-DI. Include any medicinal product or human tissue combinations per Article 1(8)–(10).",
          textarea: true,
        },
      ],
    },
    {
      id: "manufacturer_info",
      title: "Manufacturer Information",
      description:
        "Identification of the manufacturer, Single Registration Number, EU Authorized Representative, and Notified Body.",
      fields: [
        {
          id: "manufacturerDetails",
          label: "Manufacturer Name & Address",
          hint: "Legal manufacturer per Article 2(30): registered business name, address, and contact details. Must match information on the device label per Annex I Section 23.2(a).",
        },
        {
          id: "srn",
          label: "Single Registration Number (SRN)",
          hint: "SRN obtained through EUDAMED registration per Article 31. Required for all economic operators before placing devices on the EU market.",
        },
        {
          id: "euAuthorizedRep",
          label: "EU Authorized Representative",
          hint: "Authorized representative per Article 11, mandated for non-EU manufacturers. Include name, address, SRN, and the written mandate scope. Must be established within the EU.",
          textarea: true,
        },
        {
          id: "notifiedBodyBasic",
          label: "Notified Body (Overview)",
          hint: "Notified Body name and four-digit identification number. Applicable for Class IIa, IIb, and III devices requiring conformity assessment per Articles 52–53.",
        },
      ],
    },
    {
      id: "gspr",
      title: "General Safety & Performance Requirements",
      description:
        "Systematic demonstration of compliance with Annex I General Safety and Performance Requirements (GSPRs).",
      fields: [
        {
          id: "gsprChecklist",
          label: "GSPR Compliance Checklist",
          hint: "Complete checklist per Annex II Section 4 addressing each GSPR in Annex I Chapters I–III. For each requirement: state applicability, identify applied harmonised standards (hEN) or common specifications (CS), and reference the evidence demonstrating compliance.",
          textarea: true,
        },
        {
          id: "harmonisedStandards",
          label: "Applied Harmonised Standards",
          hint: "List all harmonised standards (hENs) applied under MDR, citing specific edition and official OJEU reference. Include gap analysis where standards do not fully cover GSPRs. Reference the EU standardisation request M/575.",
          textarea: true,
        },
        {
          id: "commonSpecifications",
          label: "Common Specifications Applied",
          hint: "Identify any Common Specifications (CS) adopted per Article 9 that have been applied. Where CS are not followed, justify the alternative solution providing at least an equivalent safety and performance level.",
          textarea: true,
        },
      ],
    },
    {
      id: "design_manufacturing",
      title: "Design & Manufacturing Information",
      description:
        "Design and manufacturing processes per Annex II Section 3, including production sites and process validations.",
      fields: [
        {
          id: "designStages",
          label: "Design Stages & Development Phases",
          hint: "Overview of design and development phases following ISO 13485 Section 7.3. Include design inputs, outputs, reviews, and transfer milestones. Reference the design plan per IEC 62304 for software-containing devices.",
          textarea: true,
        },
        {
          id: "designHistoryFile",
          label: "Design History File (DHF)",
          hint: "Summary of the DHF contents demonstrating traceability from design inputs through verification/validation to design transfer. Include reference to design change records per ISO 13485:2016 Section 7.3.9.",
          textarea: true,
        },
        {
          id: "manufacturingProcess",
          label: "Manufacturing Process Overview",
          hint: "Description of manufacturing operations, process flow diagrams, critical process parameters, and in-process controls. Include manufacturing method validation per Annex IX Section 2.3.",
          textarea: true,
        },
        {
          id: "productionSites",
          label: "Production & Sterilization Sites",
          hint: "Addresses of all manufacturing, assembly, sterilization, and final release sites. Include site responsibilities and any contract manufacturing arrangements covered under the QMS.",
          textarea: true,
        },
        {
          id: "subcontractorsSuppliers",
          label: "Key Subcontractors & Suppliers",
          hint: "Critical suppliers and subcontractors per Article 10(9) including component/material supplied, qualification status, and quality agreements. Address supply chain controls per ISO 13485 Section 7.4.",
          textarea: true,
        },
        {
          id: "processValidation",
          label: "Special Processes & Validation",
          hint: "Identification and validation of special processes (e.g., sterilization, welding, sealing) per ISO 13485 Section 7.5.6. Include IQ/OQ/PQ protocols and acceptance criteria.",
          textarea: true,
        },
      ],
    },
    {
      id: "risk_management",
      title: "Risk Management",
      description:
        "Complete risk management process per ISO 14971:2019, addressing Annex I Chapter I requirements.",
      fields: [
        {
          id: "riskManagementPlan",
          label: "Risk Management Plan",
          hint: "Risk management plan per ISO 14971:2019 Section 4.4 defining scope, risk acceptability criteria, verification activities, and review schedule. Must cover the entire device lifecycle per Annex I Section 3.",
          textarea: true,
        },
        {
          id: "hazardIdentification",
          label: "Hazard Identification & Analysis",
          hint: "Systematic hazard identification per ISO 14971 Section 5 including energy hazards, biological, environmental, use-related, and cybersecurity threats. Reference hazard analysis techniques (FMEA, FTA, HAZOP, PHA).",
          textarea: true,
        },
        {
          id: "riskEstimationEvaluation",
          label: "Risk Estimation & Evaluation",
          hint: "Risk estimation (probability and severity) and evaluation against acceptability criteria per ISO 14971 Sections 6–7. Include risk matrix and justification for probability/severity assignments.",
          textarea: true,
        },
        {
          id: "riskControlMeasures",
          label: "Risk Control Measures",
          hint: "Risk control options per ISO 14971 Section 8 in priority order: inherently safe design, protective measures in the device, information for safety. Include verification of implementation and residual risk assessment.",
          textarea: true,
        },
        {
          id: "overallResidualRisk",
          label: "Overall Residual Risk Evaluation",
          hint: "Evaluation of overall residual risk acceptability per ISO 14971 Section 9. Consider cumulative effect of individual residual risks and benefit-risk balance per Annex I Section 8.",
          textarea: true,
        },
        {
          id: "riskManagementReport",
          label: "Risk Management Report",
          hint: "Summary risk management report per ISO 14971 Section 10 confirming: risk management plan executed, overall residual risk acceptable, production/post-production information collection planned. Cross-reference clinical evaluation and PMS activities.",
          textarea: true,
        },
      ],
    },
    {
      id: "benefit_risk",
      title: "Benefit-Risk Analysis",
      description:
        "Benefit-risk determination per Annex I Section 1 and 8, demonstrating acceptable risk-benefit ratio.",
      fields: [
        {
          id: "clinicalBenefits",
          label: "Clinical Benefits",
          hint: "Quantified clinical benefits per MDCG 2020-6 guidance. Include clinical outcomes, performance endpoints, and patient-relevant benefits. Distinguish direct benefits from indirect benefits.",
          textarea: true,
        },
        {
          id: "clinicalRisks",
          label: "Clinical Risks Summary",
          hint: "Summary of clinical risks identified through risk management and clinical evaluation. Include nature, probability, and extent of harm. Reference adverse event data from PMS and clinical investigations.",
          textarea: true,
        },
        {
          id: "benefitRiskDetermination",
          label: "Benefit-Risk Determination",
          hint: "Formal benefit-risk determination per Annex I Section 1: residual risks are acceptable when weighed against benefits and considering available alternative treatments. Include methodology and conclusion per MEDDEV 2.7/1 Rev 4 Section 8.",
          textarea: true,
        },
        {
          id: "stateOfTheArt",
          label: "State of the Art Review",
          hint: "Current state of the art in the relevant medical field per Annex I Section 1. Include current standard of care, alternative devices/treatments, and clinical guidelines. Demonstrate device meets or exceeds current benchmarks.",
          textarea: true,
        },
      ],
    },
    {
      id: "verification_validation",
      title: "Verification & Validation",
      description:
        "Pre-clinical testing and validation evidence per Annex II Section 6.1, demonstrating conformity with GSPRs.",
      fields: [
        {
          id: "benchTesting",
          label: "Bench Testing & Analytical Performance",
          hint: "Physical, chemical, and mechanical bench tests demonstrating device meets design specifications. Include test methods, acceptance criteria, sample sizes, and results per applicable standards.",
          textarea: true,
        },
        {
          id: "biocompatibility",
          label: "Biocompatibility Evaluation (ISO 10993)",
          hint: "Biological evaluation per ISO 10993-1:2018 including material characterization, toxicological risk assessment, and testing strategy. Address cytotoxicity, sensitization, irritation, systemic toxicity, genotoxicity, implantation, and haemocompatibility as applicable.",
          textarea: true,
        },
        {
          id: "softwareValidation",
          label: "Software Verification & Validation (IEC 62304)",
          hint: "Software lifecycle process per IEC 62304:2006+A1:2015 including software safety classification, architecture, unit/integration/system testing, and validation. Include traceability matrix from requirements to test cases.",
          textarea: true,
        },
        {
          id: "usabilityEngineering",
          label: "Usability Engineering (IEC 62366-1)",
          hint: "Usability engineering process per IEC 62366-1:2015. Include use specification, user interface evaluation, formative evaluations, and summative usability test (human factors validation). Address use errors and use-associated risks.",
          textarea: true,
        },
        {
          id: "electricalSafety",
          label: "Electrical Safety & EMC (IEC 60601 Series)",
          hint: "Electrical safety testing per IEC 60601-1:2005+A1+A2 and electromagnetic compatibility per IEC 60601-1-2:2014+A1. Include applicable particular standards (IEC 60601-2-XX). Address essential performance under fault and EMC conditions.",
          textarea: true,
        },
        {
          id: "sterilizationValidation",
          label: "Sterilization Validation",
          hint: "Sterilization process validation per ISO 11135 (EtO), ISO 11137 (radiation), ISO 17665 (moist heat), or ISO 14937 (other agents). Include SAL determination, bioburden per ISO 11737, and parametric release justification if applicable.",
          textarea: true,
        },
        {
          id: "packagingValidation",
          label: "Packaging & Sterile Barrier Validation",
          hint: "Packaging validation per ISO 11607-1/-2 for sterile barrier system. Include seal strength, microbial barrier, package integrity, accelerated and real-time ageing, and transit simulation per ASTM D4169 or ISTA protocols.",
          textarea: true,
        },
        {
          id: "shelfLifeStudies",
          label: "Shelf Life & Stability Studies",
          hint: "Accelerated ageing per ASTM F1980 and real-time ageing studies supporting claimed shelf life. Include material degradation assessment, functional performance after ageing, and sterile barrier integrity.",
          textarea: true,
        },
        {
          id: "transportSimulation",
          label: "Transport & Environmental Testing",
          hint: "Transport simulation testing per ASTM D4169/ISTA and environmental testing (temperature cycling, humidity, vibration, drop/shock). Demonstrate device meets specifications after worst-case transport and storage conditions.",
          textarea: true,
        },
      ],
    },
    {
      id: "clinical_evaluation",
      title: "Clinical Evaluation",
      description:
        "Clinical evaluation per Article 61 and Annex XIV, following MEDDEV 2.7/1 Rev 4 methodology.",
      fields: [
        {
          id: "clinicalEvalPlan",
          label: "Clinical Evaluation Plan (CEP)",
          hint: "CEP per MEDDEV 2.7/1 Rev 4 Section 7 defining scope, clinical background, device description, intended purpose, equivalence rationale, data identification/appraisal/analysis methodology, and PMCF integration.",
          textarea: true,
        },
        {
          id: "clinicalEvalReport",
          label: "Clinical Evaluation Report (CER)",
          hint: "CER per MEDDEV 2.7/1 Rev 4 and MDCG 2020-13 documenting: clinical data appraisal, analysis, and benefit-risk conclusions. Must be updated throughout device lifecycle. Class III and implantables require MDCG peer review format.",
          textarea: true,
        },
        {
          id: "literatureSearch",
          label: "Literature Search Protocol & Results",
          hint: "Systematic literature search per MEDDEV 2.7/1 Rev 4 Appendix A5–A8. Define databases (PubMed, Embase, Cochrane), search strings, inclusion/exclusion criteria, PRISMA flow diagram, and appraisal of identified publications.",
          textarea: true,
        },
        {
          id: "equivalenceJustification",
          label: "Equivalence Justification",
          hint: "Demonstration of equivalence per Article 61(5) and Annex XIV Section 3 across clinical, technical, and biological characteristics. Sufficient access to equivalent device data per Article 61(5) must be demonstrated. Class III/implantables face stricter requirements.",
          textarea: true,
        },
        {
          id: "clinicalInvestigations",
          label: "Clinical Investigation Summaries",
          hint: "Summaries of clinical investigations per Articles 62–82 and Annex XV. Include study design, endpoints, statistical analysis plan, results, and conclusions. Reference EUDAMED CIV-ID numbers and any ethics committee approvals.",
          textarea: true,
        },
      ],
    },
    {
      id: "post_market_surveillance",
      title: "Post-Market Surveillance",
      description:
        "PMS system per Articles 83–86 and Annex III, including PMCF activities.",
      fields: [
        {
          id: "pmsPlan",
          label: "PMS Plan",
          hint: "Post-market surveillance plan per Article 84 covering systematic data collection from complaints, vigilance, literature, registries, and other sources. Must be proportionate to risk class and device type.",
          textarea: true,
        },
        {
          id: "psurPmsr",
          label: "Periodic Safety Update Report / PMS Report",
          hint: "PSUR per Article 86 (Class IIa/IIb/III) or PMS Report per Article 85 (Class I). PSUR updated at least annually for Class III/implantables. Submit PSUR summary to EUDAMED.",
          textarea: true,
        },
        {
          id: "pmcfPlan",
          label: "PMCF Plan",
          hint: "Post-market clinical follow-up plan per Annex XIV Part B and MDCG 2020-7. Define PMCF objectives, methods (surveys, registries, studies), milestones, and rationale. Must be part of the clinical evaluation plan.",
          textarea: true,
        },
        {
          id: "pmcfReport",
          label: "PMCF Evaluation Report",
          hint: "PMCF evaluation report per MDCG 2020-8 documenting PMCF activities, data collected, analysis results, and conclusions feeding back into clinical evaluation, risk management, and PMS plan.",
          textarea: true,
        },
        {
          id: "vigilanceReporting",
          label: "Vigilance & Incident Reporting",
          hint: "Procedures for serious incident reporting per Article 87 (within 15 days, or 2/10 days for imminent threats/deaths), field safety corrective actions (FSCA), and field safety notices (FSN). Include trend reporting per Article 88.",
          textarea: true,
        },
      ],
    },
    {
      id: "labelling",
      title: "Labelling & Instructions for Use",
      description:
        "Device labelling requirements per Annex I Chapter III (Sections 23–23.4) and UDI requirements.",
      fields: [
        {
          id: "labelContent",
          label: "Label Content & Artwork",
          hint: "Label content per Annex I Section 23.2: device name, manufacturer, lot/serial number, UDI, expiry date, storage conditions, warnings, sterile status, single-use indication, CE mark with NB number. Include draft artwork and translations for target markets.",
          textarea: true,
        },
        {
          id: "ifu",
          label: "Instructions for Use (IFU)",
          hint: "IFU content per Annex I Section 23.4 including intended purpose, user profile, contraindications, warnings/precautions, installation/use instructions, residual risks, EMC guidance per IEC 60601-1-2, cleaning/disinfection/sterilization procedures, and disposal. Exempt from IFU only if safe use without instructions per Article 7(1).",
          textarea: true,
        },
        {
          id: "symbolsLabelling",
          label: "Symbols & Graphical Elements (ISO 15223-1)",
          hint: "Symbols used on labelling per ISO 15223-1:2021 and EN ISO 20417:2021. Include symbol title, reference number, and meaning. Address any non-standard symbols with usability validation.",
          textarea: true,
        },
        {
          id: "udiCarrier",
          label: "UDI Carrier (AIDC + HRI)",
          hint: "UDI carrier per Article 27 and Annex VI Part C: Automatic Identification and Data Capture (AIDC, e.g., GS1 barcode/DataMatrix) and Human Readable Interpretation (HRI) on the device label and all higher packaging levels.",
        },
      ],
    },
    {
      id: "qms",
      title: "Quality Management System",
      description:
        "QMS documentation per Article 10(9) and Annex IX, typically based on ISO 13485:2016.",
      fields: [
        {
          id: "iso13485Certificate",
          label: "ISO 13485 Certificate",
          hint: "Current ISO 13485:2016 certificate issued by an accredited certification body. Include certificate scope, sites covered, and validity dates. Note: ISO 13485 certification is not mandatory under MDR but is strongly recommended and expected by Notified Bodies.",
        },
        {
          id: "qmsScope",
          label: "QMS Scope & Processes",
          hint: "QMS scope covering design, development, production, storage, distribution, installation, and servicing as applicable. Include QMS process map, organizational chart, and quality policy per ISO 13485 Section 4.1–4.2.",
          textarea: true,
        },
        {
          id: "documentControl",
          label: "Document & Record Control",
          hint: "Document control procedures per ISO 13485 Section 4.2 including document approval, revision control, distribution, and retention. Include electronic QMS validation if applicable.",
          textarea: true,
        },
        {
          id: "capaSystem",
          label: "CAPA System",
          hint: "Corrective and preventive action procedures per ISO 13485 Section 8.5.2–8.5.3. Include CAPA triggers, root cause analysis methodology, effectiveness verification, and integration with PMS/vigilance data.",
          textarea: true,
        },
        {
          id: "internalAudit",
          label: "Internal Audit & Management Review",
          hint: "Internal audit programme per ISO 13485 Section 8.2.4 and management review per Section 5.6. Include audit schedule, findings, and management review outputs demonstrating continual improvement.",
          textarea: true,
        },
      ],
    },
    {
      id: "notified_body",
      title: "Notified Body Information",
      description:
        "Notified Body designation, conformity assessment route, and certification details.",
      fields: [
        {
          id: "notifiedBodyDetails",
          label: "Notified Body Name & Number",
          hint: "Designated Notified Body name, four-digit NB number (from NANDO database), and address. Confirm NB designation scope covers the device type and conformity assessment procedure.",
        },
        {
          id: "conformityAssessmentRoute",
          label: "Conformity Assessment Route & Certificate Scope",
          hint: "Selected conformity assessment procedure per Articles 52–53: Annex IX (QMS + Technical Documentation), Annex X (Type Examination) + Annex XI (Production QA/Product Verification). Specify certificate type (EU Technical Documentation Assessment Certificate, EU QMS Certificate, or EU Type-Examination Certificate).",
          textarea: true,
        },
      ],
    },
    {
      id: "declaration_of_conformity",
      title: "EU Declaration of Conformity",
      description:
        "EU Declaration of Conformity per Article 19 and Annex IV.",
      fields: [
        {
          id: "euDoc",
          label: "EU Declaration of Conformity (DoC)",
          hint: "EU DoC per Article 19 and Annex IV containing: manufacturer name/address, declaration issued under sole responsibility, device identification including UDI-DI, applicable GSPR references, NB details, conformity assessment procedure, date/place of issue, and authorized signatory.",
          textarea: true,
        },
        {
          id: "ceMarkingDetails",
          label: "CE Marking & Classification",
          hint: "CE marking per Article 20 with NB four-digit number (Class IIa/IIb/III). Include MDR device classification per Annex VIII Rule applied and justification. CE marking must be affixed visibly, legibly, and indelibly per Article 20(4).",
          textarea: true,
        },
      ],
    },
  ],
};

const EU_IVDR: RegulatoryFramework = {
  id: "EU_IVDR",
  countryCode: "EU",
  countryName: "European Union",
  flag: "🇪🇺",
  authority: "IVDR 2017/746",
  documentType: "Technical Documentation (IVD)",
  deviceType: "ivd",
  sections: [
    {
      id: "device_description",
      title: "Device Description & Specification",
      description:
        "Complete IVD device description per Annex II Section 1, including analyte, specimen type, and testing context.",
      fields: [
        {
          id: "productTradeName",
          label: "Product / Trade Name",
          hint: "Official product name and any trade names used in marketing. Include catalogue/reference numbers for all kit configurations and individual reagent components.",
        },
        {
          id: "udiDi",
          label: "UDI-DI",
          hint: "Unique Device Identifier – Device Identifier per Article 24 and Annex VI Part C. Assign UDI-DI at the kit level and individual component level per IVDR requirements. Include issuing entity.",
        },
        {
          id: "generalDescription",
          label: "General Description",
          hint: "Technical description of the IVD device including measurement principle, assay methodology (e.g., immunoassay, PCR, lateral flow), reagent composition, calibrators, controls, and instrumentation requirements.",
          textarea: true,
        },
        {
          id: "analyteMeasurand",
          label: "Analyte / Measurand",
          hint: "Specific analyte(s) or measurand(s) detected or measured by the device (e.g., HbA1c, SARS-CoV-2 RNA, troponin I). Include CAS numbers for chemical analytes and gene/protein identifiers where applicable.",
        },
        {
          id: "specimenType",
          label: "Specimen Type",
          hint: "Specimen types validated for use (e.g., venous whole blood, serum, plasma [EDTA/citrate/heparin], urine, saliva, nasopharyngeal swab, CSF). Specify collection device requirements and pre-analytical conditions.",
          textarea: true,
        },
        {
          id: "intendedPurpose",
          label: "Intended Purpose",
          hint: "Intended purpose per Article 2(12): include the specific information to be provided (detection, confirmation, quantification), target disease/condition, target population, intended user (professional/self-testing), and testing environment.",
          textarea: true,
        },
        {
          id: "testingPopulation",
          label: "Testing Population",
          hint: "Define the intended testing population: symptomatic/asymptomatic, prevalence setting (screening vs. diagnostic), age/sex considerations, and any exclusions. Address the clinical context of testing (first-line, confirmatory, monitoring).",
          textarea: true,
        },
        {
          id: "resultType",
          label: "Result Type (Qualitative / Quantitative)",
          hint: "Specify whether the device provides qualitative (positive/negative/invalid), semi-quantitative, or quantitative results. Include measurement units (SI preferred), reportable range, and result interpretation criteria.",
        },
        {
          id: "testingSetting",
          label: "Testing Setting (Professional / Self-Testing / Near-Patient)",
          hint: "Intended testing environment: professional laboratory, point-of-care (POC), near-patient testing, or self-testing (lay user) per Article 2(4)–(5). Self-testing IVDs have specific requirements under Annex IX Chapter III Section 5.7.",
        },
      ],
    },
    {
      id: "classification",
      title: "IVD Classification",
      description:
        "Risk-based classification per Annex VIII, replacing the previous list-based approach of Directive 98/79/EC.",
      fields: [
        {
          id: "ivdClass",
          label: "IVD Classification (Class A / B / C / D)",
          hint: "Risk-based classification per Annex VIII: Class A (low individual/low public health risk), Class B (moderate individual/low public health), Class C (high individual/moderate public health), Class D (high individual/high public health, e.g., blood-borne infections, life-threatening transmissible agents).",
        },
        {
          id: "classificationRule",
          label: "Classification Rule Applied",
          hint: "Specific classification rule from Annex VIII (Rules 1–7) applied with justification. Address implementing rules per Section 2 (e.g., Rule 1 for self-testing, Rule 3 for blood-borne infections, Rule 5 for companion diagnostics, Rule 6 for reagents/instruments, Rule 7 for controls/calibrators).",
          textarea: true,
        },
        {
          id: "classificationJustification",
          label: "Classification Justification",
          hint: "Rationale for the selected classification rule and class, addressing any ambiguities. Reference MDCG guidance documents (e.g., MDCG 2020-16) on IVDR classification. Include reasoning for any borderline or novel device classifications.",
          textarea: true,
        },
      ],
    },
    {
      id: "manufacturer_info",
      title: "Manufacturer Information",
      description:
        "Identification of the manufacturer, SRN, EU Authorized Representative, and Notified Body.",
      fields: [
        {
          id: "manufacturerDetails",
          label: "Manufacturer Name & Address",
          hint: "Legal manufacturer per Article 2(23): registered business name, address, and contact details. Must match device labelling per Annex I Section 20.2.",
        },
        {
          id: "srn",
          label: "Single Registration Number (SRN)",
          hint: "SRN obtained through EUDAMED registration per Article 28. Required for all economic operators before placing IVD devices on the EU market.",
        },
        {
          id: "euAuthorizedRep",
          label: "EU Authorized Representative",
          hint: "Authorized representative per Article 11, mandated for non-EU manufacturers. Include name, address, SRN, and written mandate scope. Must be established within the EU.",
          textarea: true,
        },
        {
          id: "notifiedBodyBasic",
          label: "Notified Body (Overview)",
          hint: "Notified Body name and four-digit identification number. Required for Class B (selected routes), Class C, and Class D devices per Article 48. Class A devices may self-declare conformity.",
        },
      ],
    },
    {
      id: "gspr_ivd",
      title: "General Safety & Performance Requirements (IVD)",
      description:
        "Demonstration of compliance with Annex I GSPRs specific to in vitro diagnostic medical devices.",
      fields: [
        {
          id: "gsprChecklist",
          label: "GSPR Compliance Checklist (IVD)",
          hint: "Complete checklist per Annex II Section 4 addressing each applicable GSPR in Annex I Chapters I–III. For IVDs, particular attention to Section 16 (devices for self-testing/near-patient), Section 17 (devices containing biological substances), and Section 18 (construction and environmental properties).",
          textarea: true,
        },
        {
          id: "harmonisedStandards",
          label: "Applied Harmonised Standards",
          hint: "Harmonised standards applied under IVDR, citing edition and OJEU reference. Include EN 13612 (performance evaluation), EN 13640 (stability testing), ISO 18113 (labelling), ISO 23640 (stability testing), and other IVD-specific hENs.",
          textarea: true,
        },
        {
          id: "commonSpecifications",
          label: "Common Specifications Applied",
          hint: "Common Specifications (CS) per Article 9 are particularly critical for Class D IVDs where mandatory. Identify all applied CS, any deviations, and justification that the alternative provides equivalent or higher safety/performance.",
          textarea: true,
        },
      ],
    },
    {
      id: "design_manufacturing",
      title: "Design & Manufacturing Information",
      description:
        "Design and manufacturing processes per Annex II Section 3, including reagent production and quality controls.",
      fields: [
        {
          id: "designDevelopment",
          label: "Design & Development Process",
          hint: "Design and development phases per ISO 13485 Section 7.3, adapted for IVD reagent/instrument development. Include assay design rationale, antibody/primer selection, formulation development, and design transfer criteria.",
          textarea: true,
        },
        {
          id: "designHistoryFile",
          label: "Design History File (DHF)",
          hint: "DHF contents demonstrating traceability from design inputs (clinical need, performance targets) through design verification and validation to design transfer. Include records of design reviews and change control.",
          textarea: true,
        },
        {
          id: "manufacturingProcess",
          label: "Manufacturing Process Overview",
          hint: "IVD-specific manufacturing including reagent formulation, filling, lyophilization, labelling, kit assembly, and final release testing. Include process flow diagrams, critical parameters, and QC release specifications.",
          textarea: true,
        },
        {
          id: "productionSites",
          label: "Production Sites & Facilities",
          hint: "Addresses of all manufacturing, formulation, filling, and final release sites. Include facility classifications (cleanroom grades if applicable), environmental monitoring, and contract manufacturer details.",
          textarea: true,
        },
        {
          id: "processValidation",
          label: "Process Validation & QC",
          hint: "Validation of critical manufacturing processes (mixing, dispensing, lyophilization, sealing). Include in-process controls, final release testing (functional performance, potency, sterility if applicable), and lot-to-lot consistency data.",
          textarea: true,
        },
      ],
    },
    {
      id: "risk_management",
      title: "Risk Management",
      description:
        "Risk management per ISO 14971:2019, adapted for IVD-specific hazards and clinical impact of erroneous results.",
      fields: [
        {
          id: "riskManagementPlan",
          label: "Risk Management Plan",
          hint: "Risk management plan per ISO 14971:2019 adapted for IVDs. Address risks from erroneous results (false positives/negatives), specimen mix-up, interfering substances, and instrument malfunctions. Define risk acceptability criteria.",
          textarea: true,
        },
        {
          id: "hazardIdentification",
          label: "Hazard Identification & Analysis",
          hint: "IVD-specific hazards: biological hazards from specimens, chemical hazards from reagents, erroneous results leading to misdiagnosis/mistreatment, cross-contamination, software errors, user errors (especially self-testing), and cybersecurity risks for connected devices.",
          textarea: true,
        },
        {
          id: "riskEstimationEvaluation",
          label: "Risk Estimation & Evaluation",
          hint: "Risk estimation considering clinical severity of erroneous results in the intended clinical context. False-negative for screening of serious disease vs. monitoring of well-controlled condition carry different severity. Include risk matrix with IVD-specific examples.",
          textarea: true,
        },
        {
          id: "riskControlMeasures",
          label: "Risk Control Measures",
          hint: "Risk controls for IVDs: built-in QC (internal controls, procedural controls), sample adequacy checks, interference warnings, result flagging algorithms, confirmatory testing recommendations, and information for safety in IFU.",
          textarea: true,
        },
        {
          id: "overallResidualRisk",
          label: "Overall Residual Risk Evaluation",
          hint: "Overall residual risk assessment considering cumulative risk from all failure modes. For IVDs, address the impact of residual analytical and clinical performance limitations on patient safety and public health outcomes.",
          textarea: true,
        },
        {
          id: "riskManagementReport",
          label: "Risk Management Report",
          hint: "Summary report per ISO 14971 Section 10 confirming plan execution, residual risk acceptability, and post-production monitoring planned. Cross-reference performance evaluation and PMS/PMPF activities.",
          textarea: true,
        },
      ],
    },
    {
      id: "analytical_performance",
      title: "Analytical Performance Studies",
      description:
        "Analytical performance evaluation per Annex I Section 9.1(a) demonstrating technical capabilities of the IVD device.",
      fields: [
        {
          id: "analyticalSensitivity",
          label: "Analytical Sensitivity",
          hint: "Analytical sensitivity: the lowest amount of analyte reliably detected. For qualitative assays, determine as limit of detection (LoD) per CLSI EP17. For quantitative assays, report as lower limit of quantification with CV profile.",
          textarea: true,
        },
        {
          id: "analyticalSpecificity",
          label: "Analytical Specificity",
          hint: "Analytical specificity: ability to detect only the intended analyte. Include cross-reactivity testing against related organisms/analytes, interfering substance evaluation per CLSI EP07, and assessment of non-specific binding or matrix effects.",
          textarea: true,
        },
        {
          id: "truenessAccuracy",
          label: "Trueness / Accuracy",
          hint: "Trueness (bias) assessment per CLSI EP15 or ISO 5725. Compare results against reference measurement procedures, certified reference materials (CRMs), or established comparator methods. Report bias at clinically relevant concentration levels.",
          textarea: true,
        },
        {
          id: "precision",
          label: "Precision (Repeatability & Reproducibility)",
          hint: "Precision evaluation per CLSI EP05 or ISO 5725: repeatability (within-run), intermediate precision (within-laboratory, between-day/operator/instrument), and reproducibility (between-laboratory). Report as SD and CV% at multiple concentration levels.",
          textarea: true,
        },
        {
          id: "lobLodLoq",
          label: "LoB / LoD / LoQ",
          hint: "Limit of Blank (LoB), Limit of Detection (LoD), and Limit of Quantification (LoQ) per CLSI EP17 and EP17-A2. Use appropriate blank samples and low-level positive samples. Report with 95% confidence. Critical for Class C/D screening assays.",
          textarea: true,
        },
        {
          id: "measuringRange",
          label: "Measuring Range & Linearity",
          hint: "Measuring range (analytical measurement range, AMR) and clinically reportable range (CRR) per CLSI EP06. Include linearity assessment across the claimed range, polynomial regression if needed, and auto-dilution protocol validation.",
          textarea: true,
        },
        {
          id: "hookEffect",
          label: "Hook Effect (High-Dose)",
          hint: "Prozone/hook effect evaluation at clinically encountered high concentrations per CLSI EP34. Critical for immunoassays (sandwich format). Determine the concentration at which signal suppression occurs and define safeguards (e.g., auto-dilution, flagging).",
          textarea: true,
        },
        {
          id: "interferingSubstances",
          label: "Interfering Substances",
          hint: "Interference testing per CLSI EP07 with commonly encountered endogenous interferents (haemolysis, icterus, lipaemia, biotin, rheumatoid factor, HAMA) and exogenous substances (common drugs, anticoagulants). Report interference thresholds.",
          textarea: true,
        },
        {
          id: "crossReactivity",
          label: "Cross-Reactivity",
          hint: "Cross-reactivity panel for qualitative/semi-quantitative assays: test against phylogenetically or structurally related organisms/analytes. For infectious disease IVDs, test against organisms with similar clinical presentation. Report as positive/negative at defined concentrations.",
          textarea: true,
        },
        {
          id: "specimenStability",
          label: "Specimen Stability",
          hint: "Stability of the analyte in intended specimen types under defined storage conditions (room temperature, refrigerated, frozen, freeze-thaw cycles). Per CLSI EP25 and ISO 23640. Report maximum allowable storage time for each condition.",
          textarea: true,
        },
        {
          id: "reagentStability",
          label: "Reagent & Calibration Stability",
          hint: "Claimed shelf life of reagents (unopened and in-use/on-board) and calibration stability. Include real-time and accelerated stability data per ISO 23640. Address open-vial stability, reconstituted reagent stability, and calibration frequency.",
          textarea: true,
        },
      ],
    },
    {
      id: "clinical_performance",
      title: "Clinical Performance Studies",
      description:
        "Clinical performance evaluation per Annex I Section 9.1(b) and Article 56, demonstrating diagnostic accuracy in the intended population.",
      fields: [
        {
          id: "clinicalPerformanceStudies",
          label: "Clinical Performance Study Design",
          hint: "Clinical performance study design per Annex XIII Part A Section 2: prospective or retrospective, sample size justification (per CLSI EP12 or statistical power calculation), subject enrollment criteria, specimen collection protocol, and reference standard/comparator method.",
          textarea: true,
        },
        {
          id: "diagnosticSensitivitySpecificity",
          label: "Diagnostic Sensitivity & Specificity",
          hint: "Clinical/diagnostic sensitivity (positive percent agreement, PPA) and specificity (negative percent agreement, NPA) with 95% confidence intervals. Calculate against a clinically validated reference standard. Report stratified by relevant subgroups (age, disease stage, specimen type).",
          textarea: true,
        },
        {
          id: "ppvNpv",
          label: "Positive & Negative Predictive Values",
          hint: "Positive Predictive Value (PPV) and Negative Predictive Value (NPV) calculated at the prevalence relevant to the intended testing population. Provide PPV/NPV across a range of prevalence settings if the device targets multiple clinical contexts.",
          textarea: true,
        },
        {
          id: "likelihoodRatios",
          label: "Likelihood Ratios & ROC Analysis",
          hint: "Positive and negative likelihood ratios (LR+, LR–) and, for quantitative assays, Receiver Operating Characteristic (ROC) curve analysis with area under the curve (AUC). Include cut-off optimization and clinical decision point analysis.",
          textarea: true,
        },
        {
          id: "scientificValidity",
          label: "Scientific Validity of the Biomarker",
          hint: "Evidence of scientific validity per Annex XIII Part A Section 1: established association between the analyte/biomarker and the clinical condition or physiological state. Include peer-reviewed literature, clinical guidelines, and reference to established biomarker databases.",
          textarea: true,
        },
      ],
    },
    {
      id: "verification_validation",
      title: "Verification & Validation",
      description:
        "Additional pre-market testing and validation specific to IVD devices per Annex II Section 6.1.",
      fields: [
        {
          id: "softwareValidation",
          label: "Software Verification & Validation",
          hint: "Software lifecycle per IEC 62304 including algorithm validation, data integrity, results calculation verification, connectivity/LIS interface testing, and cybersecurity assessment. Address SaMD classification per IMDRF if the software independently provides diagnostic information.",
          textarea: true,
        },
        {
          id: "usabilityEngineering",
          label: "Usability Engineering (IEC 62366-1)",
          hint: "Usability evaluation per IEC 62366-1. Particularly critical for self-testing and near-patient IVDs: lay user studies, comprehension testing of IFU, sample collection procedure validation, result interpretation studies, and summative usability test.",
          textarea: true,
        },
        {
          id: "electricalSafetyEmc",
          label: "Electrical Safety & EMC",
          hint: "For IVD instruments: electrical safety per IEC 61010-1 (laboratory equipment) or IEC 60601-1 (if patient-connected), EMC per IEC 61326-2-6 (IVD equipment). Include essential performance verification under EMC conditions.",
          textarea: true,
        },
        {
          id: "biocompatibility",
          label: "Biocompatibility (If Applicable)",
          hint: "Biological evaluation per ISO 10993-1 for IVD components contacting patients (e.g., lancets, capillary blood collection devices). Address specimen collection accessories supplied with or recommended for the IVD system.",
          textarea: true,
        },
        {
          id: "transportStability",
          label: "Transport & Storage Stability",
          hint: "Transport simulation (ISTA/ASTM D4169) and stability under intended storage conditions. For temperature-sensitive reagents, validate cold chain requirements and temperature excursion tolerance. Include packaging validation per ISO 11607 if sterile components.",
          textarea: true,
        },
      ],
    },
    {
      id: "clinical_evidence",
      title: "Clinical Evidence & Performance Evaluation Report",
      description:
        "Performance evaluation documentation per Article 56 and Annex XIII, providing the clinical evidence basis.",
      fields: [
        {
          id: "performanceEvalPlan",
          label: "Performance Evaluation Plan",
          hint: "Performance evaluation plan per Annex XIII Part A defining: scope, performance claims, study designs for analytical and clinical performance, scientific validity evidence, literature search strategy, and PMPF integration.",
          textarea: true,
        },
        {
          id: "performanceEvalReport",
          label: "Performance Evaluation Report",
          hint: "Performance evaluation report per Article 56(1) and MDCG 2022-2 summarizing all performance evidence: scientific validity, analytical performance, and clinical performance. Must be continuously updated throughout the device lifecycle.",
          textarea: true,
        },
        {
          id: "clinicalEvidenceSummary",
          label: "Summary of Safety & Performance (SSP)",
          hint: "Summary of Safety and Performance (SSP) per Article 29 for Class C and D IVDs. Publicly available document in EUDAMED including intended purpose, device description, performance summary, residual risks, and benefit-risk conclusions.",
          textarea: true,
        },
      ],
    },
    {
      id: "pms_pmpf",
      title: "Post-Market Surveillance & PMPF",
      description:
        "PMS system per Articles 78–82 and Annex III, including Post-Market Performance Follow-up (PMPF) activities.",
      fields: [
        {
          id: "pmsPlan",
          label: "PMS Plan",
          hint: "PMS plan per Article 79 covering systematic data collection: customer complaints, external quality assessment (EQA/proficiency testing) results, literature monitoring, field safety actions, and user feedback. Proportionate to risk class.",
          textarea: true,
        },
        {
          id: "psurPmsr",
          label: "PSUR / PMS Report",
          hint: "PSUR per Article 81 (Class C/D) or PMS Report per Article 80 (Class A/B). PSUR updated at least annually for Class D. Include trend analysis of performance data, complaint analysis, and corrective action effectiveness.",
          textarea: true,
        },
        {
          id: "pmpfPlan",
          label: "PMPF Plan (Post-Market Performance Follow-up)",
          hint: "Post-Market Performance Follow-up plan per Annex XIII Part B. IVD-equivalent of PMCF: ongoing collection of clinical performance data, EQA programme participation, real-world diagnostic accuracy monitoring, and method comparison updates.",
          textarea: true,
        },
        {
          id: "pmpfReport",
          label: "PMPF Evaluation Report",
          hint: "PMPF evaluation report documenting activities completed, performance data collected, analysis results, and conclusions. Feed findings back into performance evaluation report, risk management, and PMS plan.",
          textarea: true,
        },
        {
          id: "vigilanceReporting",
          label: "Vigilance & Incident Reporting",
          hint: "Serious incident reporting per Article 82 (within 15 days, or 2/10 days for imminent threats/deaths). For IVDs, address erroneous results that led to patient harm, systematic misdiagnosis, and field safety corrective actions (FSCA). Include trend reporting.",
          textarea: true,
        },
      ],
    },
    {
      id: "labelling",
      title: "Labelling & Instructions for Use",
      description:
        "IVD device labelling per Annex I Chapter III (Sections 20–20.5) including self-testing specific requirements.",
      fields: [
        {
          id: "labelContent",
          label: "Label Content & Artwork",
          hint: "Label content per Annex I Section 20.2: device name, analyte, intended purpose, lot number, expiry date, storage conditions, specimen type, manufacturer, UDI, CE mark, IVD symbol, and warnings. Include outer packaging, immediate container, and component-level labelling.",
          textarea: true,
        },
        {
          id: "ifu",
          label: "Instructions for Use (IFU)",
          hint: "IFU per Annex I Section 20.4 including: assay principle, specimen requirements, reagent preparation, procedural steps, quality control instructions, result interpretation (including limitations), expected values, performance characteristics summary, and references. Self-testing IFUs require lay-language and pictorial aids.",
          textarea: true,
        },
        {
          id: "symbolsLabelling",
          label: "Symbols (ISO 15223-1 & IVD-Specific)",
          hint: "Symbols per ISO 15223-1:2021, EN ISO 18113 series (IVD-specific labelling), and ISO 20417. Include IVD symbol, self-testing symbol if applicable, temperature limits, and any non-standard symbols validated through usability testing.",
          textarea: true,
        },
        {
          id: "udiCarrier",
          label: "UDI Carrier (AIDC + HRI)",
          hint: "UDI carrier per Article 24 and Annex VI Part C on device label and all higher packaging levels. For multi-component kits, apply UDI-DI at kit level and consider component-level UDI per MDCG guidance.",
        },
      ],
    },
    {
      id: "declaration_of_conformity",
      title: "EU Declaration of Conformity",
      description:
        "EU Declaration of Conformity per Article 17 and Annex IV, enabling CE marking and EU market placement for IVD devices.",
      fields: [
        {
          id: "euDoc",
          label: "EU Declaration of Conformity (DoC)",
          hint: "EU DoC per Article 17 and Annex IV containing: manufacturer name/address, device identification including UDI-DI, statement of conformity with applicable GSPRs, Notified Body details (Class B/C/D), conformity assessment procedure, date/place of issue, and authorized signatory.",
          textarea: true,
        },
        {
          id: "ceMarkingDetails",
          label: "CE Marking & IVD Classification",
          hint: "CE marking per Article 18 with Notified Body four-digit number (Class B with NB involvement, Class C, Class D). Include IVDR classification per Annex VIII rule applied and justification. Class A self-declares without NB involvement. CE marking affixed visibly, legibly, and indelibly.",
          textarea: true,
        },
      ],
    },
  ],
};

export const EU_FRAMEWORKS: RegulatoryFramework[] = [EU_MDR, EU_IVDR];
