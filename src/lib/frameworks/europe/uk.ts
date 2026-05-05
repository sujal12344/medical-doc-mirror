import type { RegulatoryFramework } from "../types";

const UK_UKCA: RegulatoryFramework = {
  id: "UK_UKCA",
  countryCode: "GB",
  countryName: "United Kingdom",
  flag: "🇬🇧",
  authority: "MHRA",
  documentType: "UKCA Technical Documentation",
  sections: [
    {
      id: "device_description",
      title: "Device Description & Specification",
      description:
        "Complete device description per UK MDR 2002 Schedule 2, including identification, intended purpose, and technical specifications.",
      fields: [
        {
          id: "productTradeName",
          label: "Product / Trade Name",
          hint: "Official product name, trade names, and model numbers. Include catalogue references and any MHRA Device Registration numbers. Must match information on UKCA-marked labelling.",
        },
        {
          id: "udiDi",
          label: "UDI-DI (UK System)",
          hint: "Unique Device Identifier – Device Identifier per the UK UDI system. Include the issuing entity. The UK is implementing its own UDI database separate from EUDAMED. Check MHRA guidance for current UDI timelines.",
        },
        {
          id: "generalDescription",
          label: "General Description",
          hint: "Comprehensive technical description including form factor, dimensions, weight, materials, and key functional features. Reference applicable GMDN codes and MHRA product classification.",
          textarea: true,
        },
        {
          id: "intendedPurpose",
          label: "Intended Purpose",
          hint: "Intended purpose as defined in UK MDR 2002 Regulation 2: the use for which the device is intended according to the data supplied by the manufacturer on labelling, instructions for use, and promotional materials in the UK market.",
          textarea: true,
        },
        {
          id: "patientPopulation",
          label: "Patient Population",
          hint: "Target patient population including age groups, anatomical sites, and contraindicated populations. Address NHS patient demographics and any NICE guidance relevance where applicable.",
        },
        {
          id: "medicalConditions",
          label: "Medical Conditions / Indications",
          hint: "Clinical conditions, diseases, or disorders the device addresses. Include relevant ICD-10 codes and cross-reference with NHS clinical pathways and NICE clinical guidelines where applicable.",
          textarea: true,
        },
        {
          id: "principlesOfOperation",
          label: "Principles of Operation & Mode of Action",
          hint: "Scientific principles underlying device function and primary mode of action. Clearly distinguish pharmacological, immunological, or metabolic action if relevant to UK borderline classification decisions by MHRA.",
          textarea: true,
        },
        {
          id: "materialsComponents",
          label: "Materials & Key Components",
          hint: "Bill of materials for patient-contacting and critical components. Identify substances of concern including CMR substances, materials of animal origin (per TSE/BSE requirements), and compliance with UK REACH regulations.",
          textarea: true,
        },
        {
          id: "softwareInformation",
          label: "Software Identification",
          hint: "Software version, SOUP list, SaMD classification per IMDRF/MHRA Software as a Medical Device guidance. Include cybersecurity assessment per MHRA guidance on medical device cybersecurity and DTAC compliance if relevant to NHS deployment.",
          textarea: true,
        },
        {
          id: "accessoriesCombinations",
          label: "Accessories & Device Combinations",
          hint: "List all accessories and devices for combined use. Reference each accessory's UK regulatory status. Include any combination with medicinal products requiring MHRA borderline assessment.",
          textarea: true,
        },
      ],
    },
    {
      id: "uk_responsible_person",
      title: "UK Responsible Person & Manufacturer",
      description:
        "Identification of the manufacturer, UK Responsible Person, and MHRA registration details.",
      fields: [
        {
          id: "manufacturerDetails",
          label: "Manufacturer Name & Address",
          hint: "Legal manufacturer's registered business name, address, and contact details. For non-UK manufacturers, a UK Responsible Person must be appointed before placing devices on the GB market.",
        },
        {
          id: "ukResponsiblePerson",
          label: "UK Responsible Person (UKRP)",
          hint: "UK Responsible Person per the Medical Devices (Amendment etc.) (EU Exit) Regulations 2019. Required for non-UK manufacturers. Include UKRP name, UK address, and scope of mandate. Must be registered with MHRA.",
          textarea: true,
        },
        {
          id: "mhraRegistration",
          label: "MHRA Device Registration",
          hint: "Registration with MHRA per UK MDR 2002 as amended. All medical devices placed on the GB market must be registered with MHRA. Include registration number, device class, and date of registration. Separate registration required for Northern Ireland under the Windsor Framework.",
        },
        {
          id: "ukApprovedBodyBasic",
          label: "UK Approved Body (Overview)",
          hint: "UK Approved Body name and identification number, designated by the Secretary of State. Required for Class IIa, IIb, and Class III devices. List of designated UK Approved Bodies maintained by MHRA.",
        },
      ],
    },
    {
      id: "essential_requirements",
      title: "UKCA Essential Requirements",
      description:
        "Demonstration of compliance with UK Essential Requirements (ER) per UK MDR 2002 Schedule 1, aligned with Annex I.",
      fields: [
        {
          id: "erChecklist",
          label: "Essential Requirements Checklist",
          hint: "Complete checklist against UK MDR 2002 Schedule 1 Essential Requirements. For each ER: state applicability, identify UK Designated Standards (BS EN/ISO) or other standards applied, and reference evidence of compliance. Structured similarly to EU GSPRs but under UK legislation.",
          textarea: true,
        },
        {
          id: "designatedStandards",
          label: "UK Designated Standards",
          hint: "List UK Designated Standards (published by BSI/MHRA) applied for presumption of conformity. Include BS EN harmonised standard equivalents. Note any differences between UK designated standards and EU harmonised standards post-Brexit.",
          textarea: true,
        },
        {
          id: "complianceEvidence",
          label: "Compliance Evidence Summary",
          hint: "Summary matrix cross-referencing each Essential Requirement to the applied standard, test report, or design documentation providing objective evidence. Include gap analysis where designated standards do not fully cover ERs.",
          textarea: true,
        },
      ],
    },
    {
      id: "risk_management",
      title: "Risk Management",
      description:
        "Risk management process per ISO 14971:2019, meeting UK Essential Requirements for risk reduction.",
      fields: [
        {
          id: "riskManagementPlan",
          label: "Risk Management Plan",
          hint: "Risk management plan per ISO 14971:2019 defining scope, risk acceptability criteria, verification activities, and lifecycle review schedule. Address UK-specific post-market data sources including MHRA adverse incident reports and NHS safety alerts.",
          textarea: true,
        },
        {
          id: "hazardIdentification",
          label: "Hazard Identification & Analysis",
          hint: "Systematic hazard identification covering energy, biological, environmental, and use-related hazards. Include UK-specific considerations such as NHS clinical environment, UK electrical standards (BS 7671), and MHRA cybersecurity guidance.",
          textarea: true,
        },
        {
          id: "riskEstimationEvaluation",
          label: "Risk Estimation & Evaluation",
          hint: "Risk estimation and evaluation against defined acceptability criteria per ISO 14971 Sections 6–7. Include risk matrix, probability/severity justification, and ALARP (As Low As Reasonably Practicable) principle where applicable.",
          textarea: true,
        },
        {
          id: "riskControlMeasures",
          label: "Risk Control Measures",
          hint: "Risk control hierarchy per ISO 14971 Section 8: inherent safety by design, protective measures, and information for safety. Verify effectiveness of each control and evaluate any new risks introduced by controls.",
          textarea: true,
        },
        {
          id: "overallResidualRisk",
          label: "Overall Residual Risk Evaluation",
          hint: "Overall residual risk evaluation per ISO 14971 Section 9. Demonstrate residual risks are acceptable when weighed against clinical benefits. Consider cumulative risks and alignment with UK Essential Requirements on risk reduction.",
          textarea: true,
        },
        {
          id: "riskManagementReport",
          label: "Risk Management Report",
          hint: "Risk management report per ISO 14971 Section 10 confirming plan execution, residual risk acceptability, and post-production monitoring. Cross-reference clinical evaluation and UK PMS activities.",
          textarea: true,
        },
      ],
    },
    {
      id: "design_manufacturing",
      title: "Design & Manufacturing Information",
      description:
        "Design and manufacturing documentation supporting the UKCA technical file.",
      fields: [
        {
          id: "designDevelopment",
          label: "Design & Development Process",
          hint: "Design and development per ISO 13485 Section 7.3 including design inputs, outputs, reviews, verification, validation, and transfer. Include design plan per IEC 62304 for software-containing devices.",
          textarea: true,
        },
        {
          id: "designHistoryFile",
          label: "Design History File (DHF)",
          hint: "Summary of DHF demonstrating traceability from design inputs through verification/validation to design transfer. Include design change records and configuration management per ISO 13485:2016 Section 7.3.9.",
          textarea: true,
        },
        {
          id: "manufacturingProcess",
          label: "Manufacturing Process Overview",
          hint: "Manufacturing operations, process flow diagrams, critical process parameters, and in-process controls. Address any UK-specific GMP requirements and quality agreement provisions for contract manufacturers.",
          textarea: true,
        },
        {
          id: "productionSites",
          label: "Production & Sterilization Sites",
          hint: "All manufacturing, assembly, sterilization, and final release site addresses. Include site responsibilities and any contract manufacturing arrangements. UK Approved Bodies may audit non-UK production sites.",
          textarea: true,
        },
        {
          id: "processValidation",
          label: "Special Processes & Validation",
          hint: "Identification and validation of special processes (sterilization, welding, sealing, coating) per ISO 13485 Section 7.5.6. Include IQ/OQ/PQ records and ongoing process monitoring.",
          textarea: true,
        },
      ],
    },
    {
      id: "verification_validation",
      title: "Verification & Validation",
      description:
        "Pre-clinical testing and validation evidence demonstrating conformity with UK Essential Requirements.",
      fields: [
        {
          id: "benchTesting",
          label: "Bench Testing & Performance Verification",
          hint: "Physical, chemical, and mechanical bench tests per design specifications. Include test methods (BS EN/ISO standards), acceptance criteria, sample sizes, and results. Reference applicable UK Designated Standards.",
          textarea: true,
        },
        {
          id: "biocompatibility",
          label: "Biocompatibility Evaluation (ISO 10993)",
          hint: "Biological evaluation per ISO 10993-1:2018 including material characterization and testing strategy. Address cytotoxicity, sensitization, irritation, and other endpoints based on body contact and duration.",
          textarea: true,
        },
        {
          id: "softwareValidation",
          label: "Software Verification & Validation (IEC 62304)",
          hint: "Software lifecycle per IEC 62304:2006+A1:2015. Include safety classification, architecture documentation, testing at unit/integration/system levels, and requirements traceability. Address MHRA software guidance and DTAC if NHS-deployed.",
          textarea: true,
        },
        {
          id: "usabilityEngineering",
          label: "Usability Engineering (IEC 62366-1)",
          hint: "Usability process per IEC 62366-1:2015. Include use specification, formative and summative evaluations. Consider UK user population, NHS clinical workflows, and any UK-specific user training requirements.",
          textarea: true,
        },
        {
          id: "electricalSafety",
          label: "Electrical Safety & EMC",
          hint: "Electrical safety per BS EN 60601-1 and EMC per BS EN 60601-1-2 (or applicable IEC 61010 for laboratory devices). Include UK-specific power supply testing (230V/50Hz), BS 1363 plug compatibility, and NHS Estates EMC environment considerations.",
          textarea: true,
        },
        {
          id: "sterilizationValidation",
          label: "Sterilization Validation",
          hint: "Sterilization process validation per applicable standard (ISO 11135/11137/17665/14937). Include bioburden assessment per ISO 11737, SAL determination, and parametric release justification if used.",
          textarea: true,
        },
        {
          id: "packagingValidation",
          label: "Packaging & Shelf Life Validation",
          hint: "Packaging validation per ISO 11607 for sterile barrier systems. Shelf life substantiation via accelerated ageing (ASTM F1980) and real-time ageing. Include transport simulation per ASTM D4169/ISTA.",
          textarea: true,
        },
        {
          id: "environmentalTesting",
          label: "Environmental & Transport Testing",
          hint: "Environmental testing (temperature cycling, humidity, vibration, shock) and transport simulation. Demonstrate device meets specifications after worst-case distribution and storage conditions encountered in UK supply chain.",
          textarea: true,
        },
      ],
    },
    {
      id: "clinical_evaluation",
      title: "Clinical Evaluation",
      description:
        "Clinical evaluation per UK MDR 2002 requirements, following MEDDEV 2.7/1 Rev 4 methodology as adopted in UK guidance.",
      fields: [
        {
          id: "clinicalEvalPlan",
          label: "Clinical Evaluation Plan (CEP)",
          hint: "CEP defining scope, clinical background, equivalence rationale, data identification/appraisal/analysis methodology, and PMCF integration. MHRA recognises MEDDEV 2.7/1 Rev 4 methodology. Reference relevant NICE guidelines and NHS clinical pathways.",
          textarea: true,
        },
        {
          id: "clinicalEvalReport",
          label: "Clinical Evaluation Report (CER)",
          hint: "CER documenting clinical data appraisal, analysis, benefit-risk conclusions, and unresolved clinical questions. Must be kept up to date throughout device lifecycle. MHRA expects robust clinical evidence proportionate to device risk class.",
          textarea: true,
        },
        {
          id: "literatureSearch",
          label: "Literature Search Protocol & Results",
          hint: "Systematic literature search following MEDDEV 2.7/1 Rev 4 methodology. Include UK-relevant databases, NICE Evidence Search, and Cochrane Library. Provide PRISMA flow diagram and critical appraisal of identified publications.",
          textarea: true,
        },
        {
          id: "equivalenceJustification",
          label: "Equivalence Justification",
          hint: "Demonstration of equivalence across clinical, technical, and biological characteristics. Must demonstrate sufficient access to equivalent device data. MHRA applies the same stringent equivalence requirements as under MDR for higher-risk devices.",
          textarea: true,
        },
        {
          id: "clinicalInvestigations",
          label: "Clinical Investigation Summaries",
          hint: "Summaries of clinical investigations including study design, endpoints, results, and conclusions. UK clinical investigations require MHRA approval per UK MDR 2002 Part 8 and NHS Research Ethics Committee (REC) approval.",
          textarea: true,
        },
      ],
    },
    {
      id: "post_market_surveillance",
      title: "Post-Market Surveillance",
      description:
        "PMS system per UK MDR 2002 as amended, including vigilance reporting to MHRA.",
      fields: [
        {
          id: "pmsPlan",
          label: "PMS Plan",
          hint: "PMS plan covering systematic data collection from complaints, MHRA adverse incident reports, Yellow Card Scheme data, NHS safety alerts, literature, and clinical registries. Proportionate to device risk class.",
          textarea: true,
        },
        {
          id: "pmsReport",
          label: "PMS / Periodic Safety Update Report",
          hint: "PMS report summarising surveillance data, trend analysis, and corrective actions. For higher-risk devices, periodic safety update reporting as required by MHRA. Include metrics, thresholds for action, and effectiveness of corrective measures.",
          textarea: true,
        },
        {
          id: "pmcfPlan",
          label: "PMCF Plan",
          hint: "Post-market clinical follow-up plan defining objectives, methods, and milestones for ongoing clinical data collection. Include UK-specific data sources: NHS registries (e.g., NJR, NICOR), CPRD, and Hospital Episode Statistics (HES).",
          textarea: true,
        },
        {
          id: "pmcfReport",
          label: "PMCF Evaluation Report",
          hint: "PMCF evaluation report documenting activities, data analysis, and conclusions feeding into clinical evaluation, risk management, and PMS plan updates.",
          textarea: true,
        },
        {
          id: "vigilanceReporting",
          label: "MHRA Vigilance & Adverse Incident Reporting",
          hint: "Adverse incident reporting to MHRA per UK MDR 2002 Regulation 68: serious incidents within 10 working days (or 48 hours for imminent life-threatening risk). Include field safety corrective actions (FSCA), Medical Device Alerts (MDA), and trend reporting obligations.",
          textarea: true,
        },
      ],
    },
    {
      id: "labelling",
      title: "Labelling & Instructions for Use",
      description:
        "Device labelling requirements per UK MDR 2002 Schedule 1, using UKCA marking and UK-specific information.",
      fields: [
        {
          id: "labelContent",
          label: "Label Content & Artwork (UKCA)",
          hint: "Label per UK MDR 2002 Schedule 1: device name, manufacturer name and UK address (or UKRP address), lot/serial number, UDI, expiry, storage conditions, UKCA mark with Approved Body number (Class IIa/IIb/III), and applicable warnings. Include draft artwork with UKCA symbol per Regulation 2019/696.",
          textarea: true,
        },
        {
          id: "ifu",
          label: "Instructions for Use (IFU)",
          hint: "IFU per UK MDR 2002 Schedule 1 Part II including intended purpose, user profile, contraindications, warnings, installation/use instructions, residual risks, cleaning/sterilization procedures, and disposal. Must be in English for GB market. Include UKRP contact details.",
          textarea: true,
        },
        {
          id: "symbolsLabelling",
          label: "Symbols & UKCA Marking Requirements",
          hint: "Symbols per BS EN ISO 15223-1 and BS EN ISO 20417. UKCA mark must be at least 5mm (unless device is too small), visibly, legibly, and indelibly affixed. Note: CE marking alone is not accepted on the GB market (CE + UKCA dual marking permitted during transition).",
          textarea: true,
        },
        {
          id: "ukAddressRequirement",
          label: "UK Address on Labelling",
          hint: "UK MDR requires a UK address on the device label: either the manufacturer's UK address or the UK Responsible Person's address. This is a key difference from EU labelling requirements and enables UK market traceability.",
        },
      ],
    },
    {
      id: "quality_system",
      title: "Quality Management System",
      description:
        "QMS documentation supporting UKCA conformity assessment, typically based on ISO 13485:2016.",
      fields: [
        {
          id: "iso13485Certificate",
          label: "ISO 13485 Certificate",
          hint: "Current ISO 13485:2016 certificate from an accredited certification body. Include certificate scope, covered sites, and validity. MHRA and UK Approved Bodies expect an established QMS; ISO 13485 certification is the recognised benchmark.",
        },
        {
          id: "qmsScope",
          label: "QMS Scope & Processes",
          hint: "QMS scope covering all lifecycle phases: design, development, production, storage, distribution, installation, and servicing. Include process map, organisational chart with UK-based quality functions, and quality policy.",
          textarea: true,
        },
        {
          id: "documentControl",
          label: "Document & Record Control",
          hint: "Document control per ISO 13485 Section 4.2 including approval, revision control, distribution, and retention. Address UK data retention requirements and any GDPR/UK GDPR implications for clinical/patient data.",
          textarea: true,
        },
        {
          id: "capaSystem",
          label: "CAPA System",
          hint: "CAPA procedures per ISO 13485 Section 8.5.2–8.5.3. Include integration with MHRA vigilance data, Yellow Card reports, and NHS clinical incident data as CAPA inputs.",
          textarea: true,
        },
        {
          id: "managementReview",
          label: "Internal Audit & Management Review",
          hint: "Internal audit programme per ISO 13485 Section 8.2.4 and management review per Section 5.6. Include audit schedule, findings tracking, and management review outputs demonstrating continual suitability and effectiveness of the QMS.",
          textarea: true,
        },
      ],
    },
    {
      id: "uk_approved_body",
      title: "UK Approved Body",
      description:
        "UK Approved Body designation, conformity assessment route, and certification for UKCA marking.",
      fields: [
        {
          id: "approvedBodyDetails",
          label: "UK Approved Body Name & Number",
          hint: "Designated UK Approved Body name and identification number. UK Approved Bodies are designated by the Secretary of State and listed by MHRA. Confirm designation scope covers the device classification and intended conformity assessment route.",
        },
        {
          id: "conformityAssessmentRoute",
          label: "Conformity Assessment Route",
          hint: "Selected conformity assessment procedure under UK MDR 2002: full quality assurance (Schedule 3 Part II), EC type-examination (Schedule 3 Part III) + production verification or product quality assurance. Specify certificate type and scope.",
          textarea: true,
        },
        {
          id: "certificateDetails",
          label: "UK Approved Body Certificates",
          hint: "UK Approved Body certificates: UKCA type-examination certificate, UKCA quality system certificate, or UKCA design-examination certificate as applicable. Include certificate number, scope, conditions, and expiry date. Note: EU NB certificates are not valid for UKCA marking.",
        },
      ],
    },
    {
      id: "declaration_of_conformity",
      title: "UKCA Declaration of Conformity",
      description:
        "UKCA Declaration of Conformity per UK MDR 2002, enabling UKCA marking and GB market placement.",
      fields: [
        {
          id: "ukcaDoc",
          label: "UKCA Declaration of Conformity",
          hint: "UKCA Declaration of Conformity per UK MDR 2002 containing: manufacturer name/UK address, device identification including UDI, statement of conformity with UK Essential Requirements, UK Approved Body details (if applicable), conformity assessment procedure followed, date and authorised signatory. Separate from any EU Declaration of Conformity.",
          textarea: true,
        },
        {
          id: "ukcaMarkingDetails",
          label: "UKCA Marking & Classification",
          hint: "UKCA marking per UK MDR 2002 with Approved Body number for Class IIa/IIb/III. Include device classification per UK classification rules (mirroring MDR Annex VIII), rule applied, and justification. UKCA mark must comply with the UKCA marking regulations regarding size, proportions, and visibility.",
          textarea: true,
        },
      ],
    },
  ],
};

export const UK_FRAMEWORKS: RegulatoryFramework[] = [UK_UKCA];
