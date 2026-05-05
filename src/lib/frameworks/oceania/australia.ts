import type { RegulatoryFramework } from "../types";

const AU_TGA: RegulatoryFramework = {
  id: "AU_TGA",
  countryCode: "AU",
  countryName: "Australia",
  flag: "🇦🇺",
  authority: "TGA",
  documentType: "ARTG Inclusion Application",
  sections: [
    {
      id: "administrative",
      title: "Administrative Information",
      description:
        "Sponsor and device identification details required for ARTG inclusion under the Therapeutic Goods Act 1989 and TG(MD)R 2002.",
      fields: [
        {
          id: "australianSponsorName",
          label: "Australian Sponsor Name",
          hint: "Legal name of the Australian sponsor responsible for the device under s.41FN of the Therapeutic Goods Act 1989. The sponsor must be a resident of, or carry on business in, Australia. Must match the TGA eBS client account.",
        },
        {
          id: "tgaClientId",
          label: "TGA Client ID",
          hint: "Unique TGA client identifier assigned upon eBS registration. Required for all TGA submissions and ARTG inclusion applications. Verify the client ID is active and associated with current sponsor details.",
        },
        {
          id: "artgNumber",
          label: "ARTG Number",
          hint: "Australian Register of Therapeutic Goods number, if previously assigned. For new inclusions, leave blank; TGA assigns this upon successful inclusion. Format: ARTG XXXXXX.",
        },
        {
          id: "deviceName",
          label: "Device Name",
          hint: "The trade/proprietary name and model designation as it will appear on the ARTG. Must match labelling exactly. Include all variant names if multiple configurations are covered under one ARTG entry.",
        },
        {
          id: "gmdnCode",
          label: "GMDN Code",
          hint: "Global Medical Device Nomenclature code per ISO 15225. TGA uses GMDN for device categorisation. Select the most specific applicable GMDN term; TGA may query incorrect or overly broad codes.",
        },
        {
          id: "gmdnTerm",
          label: "GMDN Term",
          hint: "The GMDN preferred term corresponding to the selected code. This term appears on the public ARTG summary. Ensure alignment with the device's intended purpose and TGA's GMDN mapping guidance.",
        },
        {
          id: "sponsorAddress",
          label: "Sponsor Address",
          hint: "Full Australian business address of the sponsor. Must be a physical address in Australia (not a PO Box for primary registration). This address appears on the public ARTG listing.",
        },
        {
          id: "contactPerson",
          label: "Contact Person",
          hint: "Name, title, phone, and email of the primary regulatory affairs contact for this application. TGA communicates application queries to this person via the eBS portal.",
        },
      ],
    },
    {
      id: "device_description",
      title: "Device Description",
      description:
        "Comprehensive technical description of the medical device per TG(MD)R 2002 Schedule 1 Clause 1, including design, materials, and functional characteristics.",
      fields: [
        {
          id: "generalDescription",
          label: "General Description",
          hint: "Complete technical description of the device covering form factor, dimensions, weight, and operating principles. Reference TG(MD)R 2002 Schedule 1 Clause 1.1. Include product family scope if the application covers a group of devices.",
          textarea: true,
        },
        {
          id: "intendedPurpose",
          label: "Intended Purpose",
          hint: "Intended purpose as defined in s.41BF of the Therapeutic Goods Act 1989. State the specific medical purpose, target condition, and clinical context. Must be consistent with labelling, IFU, and clinical evidence.",
          textarea: true,
        },
        {
          id: "patientPopulation",
          label: "Patient Population",
          hint: "Target patient demographics including age groups (neonatal, paediatric, adult, geriatric), anatomical sites, and clinical conditions. Identify contraindicated populations. Consider Australian healthcare context and Indigenous health considerations where relevant.",
        },
        {
          id: "principlesOfOperation",
          label: "Principles of Operation",
          hint: "Scientific and engineering principles underlying device function. Distinguish between pharmacological, immunological, metabolic, and purely physical modes of action per TGA borderline guidance. Critical for classification under TG(MD)R 2002.",
          textarea: true,
        },
        {
          id: "materialsComposition",
          label: "Materials & Composition",
          hint: "Full bill of materials for patient-contacting and critical components. Identify biological materials (animal, human, microbial origin) per TG(MD)R Schedule 2A, CMR/SVHC substances, latex, DEHP, and nano-materials. Include material specifications and supplier details.",
          textarea: true,
        },
        {
          id: "components",
          label: "Components",
          hint: "Itemised list of all device components with part numbers, specifications, and suppliers. Identify critical components per ISO 13485 Clause 7.4. Include sub-assemblies and OEM components with their regulatory status.",
          textarea: true,
        },
        {
          id: "softwareInformation",
          label: "Software",
          hint: "Software version, architecture, classification (SaMD level per IMDRF N12), SOUP/OTS components, and cybersecurity posture. Reference IEC 62304 safety classification. TGA requires specific SaMD evidence per its Software Regulation guidance (v2.0).",
          textarea: true,
        },
        {
          id: "accessories",
          label: "Accessories",
          hint: "All accessories supplied with or intended for use with the device. State whether each accessory is separately included on the ARTG or covered under this application. Cross-reference ARTG entries for separately registered accessories.",
        },
        {
          id: "variantsConfigurations",
          label: "Variants & Configurations",
          hint: "All device variants, sizes, configurations, and model numbers covered under this ARTG inclusion. Justify grouping under a single application per TGA's device family/system guidance. Clearly delineate differences between variants.",
          textarea: true,
        },
        {
          id: "sterilizationMethod",
          label: "Sterilisation Method",
          hint: "Sterilisation method (EtO, gamma, e-beam, steam, aseptic processing) and sterility assurance level (SAL 10⁻⁶). For devices supplied sterile, reference validated sterilisation process per TGA Essential Principle 11 and relevant ISO standards (ISO 11135, 11137, 17665).",
        },
      ],
    },
    {
      id: "essential_principles",
      title: "Essential Principles Checklist",
      description:
        "Demonstration of conformity with Essential Principles of safety and performance per Schedule 1 of the TG(MD)R 2002, as required for ARTG inclusion.",
      fields: [
        {
          id: "epChecklist",
          label: "Essential Principles Checklist",
          hint: "Complete Essential Principles (EP) checklist per Schedule 1 of the TG(MD)R 2002. For each of the 14 general EPs and applicable specific EPs (15–23), state applicability, method of conformity assessment, standards applied, and evidence references. Use TGA's EP checklist template.",
          textarea: true,
        },
        {
          id: "epStandardsMapping",
          label: "Standards Mapping per Essential Principle",
          hint: "For each applicable Essential Principle, list the harmonised standard(s) applied (e.g., ISO 14971 for EP2, IEC 60601-1 for EP9). Identify any TGA-recognised standards used and whether presumption of conformity is claimed. Reference the TGA list of Australian designated standards.",
          textarea: true,
        },
        {
          id: "epEvidenceReferences",
          label: "Evidence References per Essential Principle",
          hint: "Cross-reference specific test reports, design outputs, clinical data, and risk management documents that demonstrate conformity with each applicable EP. Include document numbers, dates, and testing laboratory details.",
          textarea: true,
        },
        {
          id: "classificationRuleApplied",
          label: "Classification Rule Applied",
          hint: "The specific classification rule(s) from Schedule 2 of the TG(MD)R 2002 (Rules 1–14 for non-IVDs, Rules 1–7 for IVDs) used to determine device class (I, IIa, IIb, III, AIMD). Provide full classification justification including the implementing rule, duration of contact, invasiveness, and active device criteria applied.",
          textarea: true,
        },
      ],
    },
    {
      id: "risk_management",
      title: "Risk Management",
      description:
        "ISO 14971-compliant risk management documentation demonstrating systematic identification, evaluation, and control of device-related risks, per Essential Principle 2.",
      fields: [
        {
          id: "riskManagementPlan",
          label: "Risk Management Plan (ISO 14971)",
          hint: "Risk management plan per ISO 14971:2019 Clause 4.4, defining scope, risk acceptability criteria, verification activities, and lifecycle responsibilities. Must cover production and post-production phases. TGA expects alignment with Essential Principle 2 of Schedule 1 TG(MD)R 2002.",
          textarea: true,
        },
        {
          id: "hazardIdentification",
          label: "Hazard Identification",
          hint: "Systematic hazard identification using techniques such as FMEA, FTA, HAZOP, or PHA per ISO 14971 Clause 5.4. Consider all foreseeable hazards including use errors, environmental factors, and the Australian clinical environment. Reference ISO/TR 24971 guidance.",
          textarea: true,
        },
        {
          id: "riskEstimationEvaluation",
          label: "Risk Estimation & Evaluation",
          hint: "Risk estimation (severity × probability) and evaluation against acceptability criteria per ISO 14971 Clauses 5.5 and 6. Include risk matrix, rationale for probability estimates, and evaluation of each identified hazardous situation. Document any risks in the broadly acceptable or ALARP regions.",
          textarea: true,
        },
        {
          id: "riskControlMeasures",
          label: "Risk Control Measures",
          hint: "Risk control measures per ISO 14971 Clause 7, applied in priority order: inherent safety by design, protective measures, information for safety. Document implementation, verification of effectiveness, and assessment of any new risks introduced by control measures.",
          textarea: true,
        },
        {
          id: "overallResidualRisk",
          label: "Overall Residual Risk Evaluation",
          hint: "Evaluation of overall residual risk acceptability per ISO 14971 Clause 8. Consider aggregate and cumulative residual risk across all hazardous situations. Demonstrate that the overall residual risk is acceptable in the context of the device's clinical benefit. Include benefit-risk determination.",
          textarea: true,
        },
        {
          id: "riskManagementReport",
          label: "Risk Management Report",
          hint: "Risk management report per ISO 14971 Clause 9 confirming the risk management plan was appropriately implemented, overall residual risk is acceptable, and methods for production and post-production information collection are in place.",
          textarea: true,
        },
        {
          id: "postProductionRiskReview",
          label: "Production & Post-Production Risk Review",
          hint: "Process for collecting and reviewing production and post-production information per ISO 14971 Clause 10. Include review of complaints, adverse events reported to TGA, field performance data, and triggers for updating the risk management file. Address TGA post-market obligations under s.41MP.",
          textarea: true,
        },
      ],
    },
    {
      id: "verification_validation",
      title: "Verification & Validation",
      description:
        "Design verification and validation evidence demonstrating the device meets its design inputs and intended purpose, per Essential Principles and applicable Australian designated standards.",
      fields: [
        {
          id: "benchTesting",
          label: "Bench Testing",
          hint: "Performance bench testing per design specifications. Include test protocols, acceptance criteria derived from design inputs, results, and pass/fail determination. Testing must be conducted per ISO 13485 Clause 7.3.6 and relevant product-specific standards.",
          textarea: true,
        },
        {
          id: "analyticalPerformance",
          label: "Analytical Performance",
          hint: "Analytical performance data (sensitivity, specificity, precision, linearity, LOD/LOQ) for IVD devices, or equivalent performance characterisation for non-IVDs. Reference applicable TGA performance standards and Essential Principles 1 and 4.",
          textarea: true,
        },
        {
          id: "biocompatibility",
          label: "Biocompatibility (ISO 10993)",
          hint: "Biological evaluation per ISO 10993-1 risk-based framework. Include biological endpoint categorisation matrix, testing rationale, and test reports for applicable endpoints (cytotoxicity, sensitisation, irritation, systemic toxicity, etc.). TGA requires ISO 10993 compliance per Essential Principle 7.",
          textarea: true,
        },
        {
          id: "softwareValidation",
          label: "Software Validation (IEC 62304)",
          hint: "Software lifecycle documentation per IEC 62304, including software development plan, requirements, architecture, unit/integration/system testing, and release records. Validation must demonstrate fitness for intended purpose. Reference TGA SaMD regulatory guidance for standalone software.",
          textarea: true,
        },
        {
          id: "usability",
          label: "Usability Engineering (IEC 62366)",
          hint: "Usability engineering process per IEC 62366-1 including use specification, user interface evaluation, formative and summative usability testing. Address use-related risk analysis and demonstrate acceptable use-related residual risk. Consider Australian clinical environment and user profiles.",
          textarea: true,
        },
        {
          id: "electricalSafety",
          label: "Electrical Safety (IEC 60601-1)",
          hint: "Electrical safety testing per IEC 60601-1 (general) and applicable collateral and particular standards. Include test reports from an accredited laboratory (NATA-accredited preferred for Australian submissions). Address Essential Principle 9 (energy-related hazards).",
          textarea: true,
        },
        {
          id: "emc",
          label: "Electromagnetic Compatibility (IEC 60601-1-2)",
          hint: "EMC testing per IEC 60601-1-2:2014+A1:2020 including emissions, immunity, and essential performance maintenance during disturbances. Include EMC test plan reflecting intended use environment. TGA references ACMA requirements and Essential Principle 9.3.",
          textarea: true,
        },
        {
          id: "sterilizationValidation",
          label: "Sterilisation Validation",
          hint: "Sterilisation process validation per applicable ISO standards (ISO 11135 EtO, ISO 11137 radiation, ISO 17665 moist heat). Include bioburden determination (ISO 11737-1), SAL demonstration, parametric release justification if applicable. Required for Essential Principle 11.",
        },
        {
          id: "packagingValidation",
          label: "Packaging Validation",
          hint: "Sterile barrier system validation per ISO 11607-1/-2 including seal integrity, microbial barrier, package integrity after simulated transport (ISTA/ASTM D4169). Address packaging material biocompatibility and ageing.",
        },
        {
          id: "shelfLifeStudies",
          label: "Shelf Life / Stability Studies",
          hint: "Real-time and/or accelerated ageing studies per ASTM F1980 demonstrating device performance and sterile barrier integrity over the claimed shelf life. Include protocol, acceptance criteria, and results. TGA may query accelerated-only data for shelf life >2 years.",
        },
        {
          id: "transportTesting",
          label: "Transport Testing",
          hint: "Transport simulation testing per ISTA or ASTM D4169 demonstrating device and packaging integrity through anticipated distribution conditions. Include vibration, drop, compression, and atmospheric conditioning as applicable.",
        },
        {
          id: "simulatedUseTesting",
          label: "Simulated Use Testing",
          hint: "Simulated clinical use testing demonstrating the device performs as intended under conditions that replicate the actual use environment. Include test models, simulated anatomical conditions, and clinically relevant acceptance criteria.",
          textarea: true,
        },
      ],
    },
    {
      id: "clinical_evidence",
      title: "Clinical Evidence",
      description:
        "Clinical evidence supporting the device's safety and performance per Essential Principles 1–6 and TGA clinical evidence guidelines.",
      fields: [
        {
          id: "clinicalEvaluationPlan",
          label: "Clinical Evaluation Plan",
          hint: "Clinical evaluation plan defining scope, objectives, clinical data sources, appraisal methodology, and analysis plan. Per TGA's clinical evidence guidelines aligned with MEDDEV 2.7/1 Rev 4. Define the clinical evidence generation strategy and gap analysis.",
          textarea: true,
        },
        {
          id: "clinicalEvaluationReport",
          label: "Clinical Evaluation Report (CER)",
          hint: "Clinical Evaluation Report per TGA requirements and MEDDEV 2.7/1 Rev 4. Must critically evaluate all available clinical data (literature, clinical investigation, post-market data), demonstrate compliance with Essential Principles 1–6, and conclude on benefit-risk. TGA reviews CERs for higher-risk devices.",
          textarea: true,
        },
        {
          id: "clinicalDataAppraisal",
          label: "Clinical Data Appraisal",
          hint: "Systematic appraisal of clinical data quality per MEDDEV 2.7/1 Rev 4 Stages 1–4. Include data suitability assessment, methodological quality scoring, relevance weighting, and contribution to the overall clinical evidence base.",
          textarea: true,
        },
        {
          id: "literatureSearchProtocol",
          label: "Literature Search Protocol",
          hint: "Systematic literature search strategy including databases (PubMed, Embase, Cochrane), search terms, Boolean operators, inclusion/exclusion criteria, date ranges, and screening methodology. Must be reproducible and comprehensive per TGA expectations.",
          textarea: true,
        },
        {
          id: "equivalentDeviceJustification",
          label: "Equivalent Device Justification",
          hint: "Justification for claiming equivalence to a predicate/comparator device, addressing clinical, technical, and biological equivalence per MEDDEV 2.7/1 Rev 4. TGA requires manufacturer access to equivalent device technical documentation for higher-class devices.",
          textarea: true,
        },
        {
          id: "australianClinicalTrialData",
          label: "Australian Clinical Trial Data",
          hint: "Data from Australian clinical trials if applicable. Include CTN/CTX scheme notification details, ethics committee approval, ANZCTR registration, trial results, and statistical analysis. TGA may request Australian-specific clinical data for novel or high-risk devices.",
          textarea: true,
        },
        {
          id: "pmcfPlan",
          label: "Post-Market Clinical Follow-Up (PMCF) Plan",
          hint: "PMCF plan defining ongoing clinical data collection strategy post-ARTG inclusion. Include PMCF study protocols, registry participation, proactive literature surveillance, and milestones for CER updates. Aligned with MEDDEV 2.12/2 Rev 2 and TGA post-market requirements.",
          textarea: true,
        },
      ],
    },
    {
      id: "post_market_surveillance",
      title: "Post-Market Surveillance",
      description:
        "Post-market surveillance system per TGA requirements under Part 4-6 of the Therapeutic Goods Act 1989 and TGA PMS guidance.",
      fields: [
        {
          id: "pmsPlan",
          label: "PMS Plan",
          hint: "Post-market surveillance plan defining data sources (complaints, adverse events, literature, registry data), collection methods, analysis intervals, and escalation criteria. Must comply with TGA's PMS obligations for sponsors under the Therapeutic Goods Act 1989.",
          textarea: true,
        },
        {
          id: "adverseEventReporting",
          label: "Adverse Event Reporting to TGA",
          hint: "Procedures for mandatory adverse event reporting to TGA per s.41MP of the Therapeutic Goods Act 1989. Sponsors must report serious adverse events within 10 calendar days (48 hours for serious public health threats). Use TGA's Adverse Event Reporting system.",
        },
        {
          id: "recallProcedures",
          label: "Recall Procedures",
          hint: "Recall and product correction procedures per TGA Uniform Recall Procedure for Therapeutic Goods (URPTG). Include recall classification (Class I/II/III), notification to TGA, sponsor recall coordinator designation, distribution records, and effectiveness checks.",
          textarea: true,
        },
        {
          id: "correctiveActions",
          label: "Corrective Actions (CAPA)",
          hint: "CAPA system for investigating root causes of non-conformities, complaints, and adverse events. Include methodology for determining corrective actions, implementation verification, and effectiveness review. Must integrate with TGA reporting obligations.",
          textarea: true,
        },
        {
          id: "fieldSafetyCorrectiveActions",
          label: "Field Safety Corrective Actions (FSCA)",
          hint: "Procedures for implementing field safety corrective actions and issuing field safety notices. Include TGA notification requirements, communication to healthcare professionals and consumers, and coordination with international regulatory authorities for global FSCAs.",
          textarea: true,
        },
        {
          id: "periodicReports",
          label: "PSUR / Periodic Reports",
          hint: "Periodic Safety Update Reports or equivalent periodic summary reports as required by TGA. Include cumulative adverse event analysis, trend analysis, benefit-risk re-evaluation, and conclusions on whether the device continues to meet Essential Principles.",
          textarea: true,
        },
        {
          id: "trendReporting",
          label: "Trend Reporting",
          hint: "Systematic trend reporting for adverse events and complaints per TGA guidance. Sponsors must monitor for statistically significant increases in event frequency or severity, and report identified trends to TGA even if individual events were previously reported.",
          textarea: true,
        },
      ],
    },
    {
      id: "labelling",
      title: "Labelling & IFU",
      description:
        "Labelling requirements per TG(MD)R 2002 Schedule 1 Essential Principles 13 and associated TGA guidance on medical device labelling.",
      fields: [
        {
          id: "deviceLabels",
          label: "Device Labels",
          hint: "Device labels per TG(MD)R 2002 Schedule 1 Essential Principle 13.3. Include manufacturer name, device name, lot/serial number, expiry date, storage conditions, sterile status, single-use indication, and warnings. Labels must be in English for the Australian market.",
        },
        {
          id: "ifu",
          label: "Instructions for Use (IFU)",
          hint: "Instructions for use per Essential Principle 13.4 of Schedule 1 TG(MD)R 2002. Must include intended purpose, user instructions, contraindications, warnings, precautions, and performance specifications. Australian sponsor details must be included per s.41FN requirements.",
          textarea: true,
        },
        {
          id: "packaging",
          label: "Packaging Labelling",
          hint: "Outer and inner packaging labelling per TG(MD)R 2002 Schedule 1. Include device identification, quantity, sterile barrier indicators, storage conditions, and transport precautions. Must be in English with Australian sponsor address.",
        },
        {
          id: "australianAddress",
          label: "Australian Sponsor Address on Label",
          hint: "Australian sponsor's name and address must appear on the label or IFU per the Therapeutic Goods Act 1989. This is a mandatory requirement; the Australian sponsor takes regulatory responsibility for the device on the ARTG.",
        },
        {
          id: "udi",
          label: "Unique Device Identification (UDI)",
          hint: "UDI per TGA's UDI system requirements. Include UDI-DI and UDI-PI (lot, serial, expiry, manufacturing date) in both human-readable and AIDC (barcode/RFID) formats. TGA is implementing UDI aligned with IMDRF UDI guidance.",
        },
        {
          id: "symbolsStandards",
          label: "Symbols (ISO 15223)",
          hint: "Graphical symbols per ISO 15223-1 for medical device labelling. Include symbol reference chart mapping each symbol used to its ISO 15223-1 reference number and meaning. Ensure compliance with TGA labelling guidance on symbol use.",
        },
      ],
    },
    {
      id: "quality_system",
      title: "Quality Management System",
      description:
        "Quality management system evidence demonstrating conformity with ISO 13485 and applicable TGA conformity assessment requirements.",
      fields: [
        {
          id: "iso13485Certificate",
          label: "ISO 13485 Certificate",
          hint: "Current ISO 13485:2016 certificate issued by an accredited certification body (accredited to ISO/IEC 17021). Certificate scope must cover the device types included in the ARTG application. TGA accepts MDSAP audit reports as evidence of QMS conformity.",
        },
        {
          id: "conformityAssessmentProcedures",
          label: "Conformity Assessment Procedures",
          hint: "Conformity assessment procedures applied per Part 4, Division 2 of the TG(MD)R 2002. Identify the applicable conformity assessment pathway based on device classification: manufacturer self-assessment (Class I), Type Examination/QMS audit (Class IIa/IIb/III/AIMD).",
          textarea: true,
        },
        {
          id: "qmsScope",
          label: "QMS Scope",
          hint: "Scope of the quality management system including sites covered, processes (design, manufacturing, sterilisation, distribution), and product scope. Must demonstrate that all processes relevant to the device are within QMS scope per ISO 13485 Clause 4.2.2.",
        },
        {
          id: "mdsapAcceptance",
          label: "MDSAP Acceptance",
          hint: "Medical Device Single Audit Program (MDSAP) audit report, if applicable. TGA participates in MDSAP and accepts MDSAP audit reports as evidence of QMS conformity. Include the most recent MDSAP audit report and any non-conformity responses.",
        },
        {
          id: "ecCertificate",
          label: "EC/EU Certificate (if applicable)",
          hint: "EC or EU certificate issued by a Notified Body under MDD 93/42/EEC or EU MDR 2017/745, if available. TGA may consider EU conformity assessment evidence as part of the Australian application, particularly for devices with established EU market history.",
        },
      ],
    },
    {
      id: "certificates_regulatory",
      title: "Certificates & Regulatory Approvals",
      description:
        "Certificates, declarations of conformity, and foreign regulatory approvals supporting the ARTG inclusion application.",
      fields: [
        {
          id: "conformityAssessmentEvidence",
          label: "Conformity Assessment Evidence Path",
          hint: "Documentation of the conformity assessment pathway per TG(MD)R 2002 Part 4. For Class I: manufacturer self-declaration. For Class IIa and above: third-party conformity assessment evidence. Identify whether using EU CA evidence, TGA-accepted MDSAP, or direct TGA conformity assessment.",
          textarea: true,
        },
        {
          id: "euCertificate",
          label: "EC/EU Certificate (if applicable)",
          hint: "Valid EC certificate (MDD) or EU certificate (MDR) from a designated EU Notified Body. Include certificate number, scope, Notified Body identification, and expiry date. TGA recognises EU conformity assessment under specific pathways per TG(MD)R 2002.",
        },
        {
          id: "freeSaleCertificate",
          label: "Certificate of Free Sale",
          hint: "Certificate of Free Sale (CFS) issued by the regulatory authority of the country of manufacture or another reference market. Demonstrates the device is legally marketed in that jurisdiction. TGA may request CFS as supporting evidence for ARTG inclusion.",
        },
        {
          id: "manufacturerDeclarationOfConformity",
          label: "Manufacturer Declaration of Conformity",
          hint: "Manufacturer's formal declaration of conformity per TG(MD)R 2002 Schedule 3, affirming the device meets applicable Essential Principles. Must identify the device, applicable regulations, standards applied, and be signed by an authorised representative of the manufacturer.",
          textarea: true,
        },
        {
          id: "foreignRegulatoryApprovals",
          label: "Foreign Regulatory Approvals",
          hint: "Summary of regulatory approvals in other jurisdictions (FDA 510(k)/PMA, EU CE marking, Health Canada licence, PMDA approval). Include approval dates, regulatory class, and any conditions or restrictions. TGA considers international regulatory status as part of application assessment.",
          textarea: true,
        },
      ],
    },
  ],
};

export const AU_FRAMEWORKS: RegulatoryFramework[] = [AU_TGA];
