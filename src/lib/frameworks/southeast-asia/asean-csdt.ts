import type { RegulatoryFramework } from "../types";

const ASEAN_CSDT: RegulatoryFramework = {
  id: "ASEAN_CSDT",
  countryCode: "ASEAN",
  countryName: "ASEAN",
  flag: "🌏",
  authority: "AMDD",
  documentType: "CSDT Registration Dossier",
  sections: [
    {
      id: "administrative",
      title: "Administrative Information",
      description:
        "Product owner identification, authorised representative details, and device classification per the ASEAN Medical Device Directive (AMDD) and CSDT Chapter 1 requirements.",
      fields: [
        {
          id: "product_owner",
          label: "Product Owner",
          hint: "Legal name and address of the product owner (typically the manufacturer or legal manufacturer) as defined in the AMDD. The product owner is the entity taking responsibility for the design, manufacture, and safety of the medical device. Provide company registration number and contact details.",
        },
        {
          id: "authorised_representative",
          label: "Authorised Representative",
          hint: "Details of the authorised representative in the target ASEAN member state. Each ASEAN country may require a local authorised representative or registration holder. Provide name, address, licence/registration number in the target country, and scope of authorisation from the product owner.",
        },
        {
          id: "device_name",
          label: "Device Name",
          hint: "Proprietary or trade name of the medical device. The CSDT requires the device name to be consistent across the dossier and match the labelling. For submissions to multiple ASEAN member states, ensure the name is acceptable in each target market.",
        },
        {
          id: "risk_classification",
          label: "AMDD Risk Classification",
          hint: "Classification per AMDD classification rules based on GHTF/IMDRF principles: Class A (low risk), Class B (low-moderate risk), Class C (moderate-high risk), or Class D (high risk). Classification is determined by the device's intended purpose, body contact, duration of use, and active/non-active nature. Provide the specific classification rule(s) applied.",
        },
        {
          id: "gmdn_code",
          label: "GMDN Code & Term",
          hint: "Global Medical Device Nomenclature (GMDN) preferred term code and name. AMDD uses GMDN as the standardised nomenclature across ASEAN member states. Select the GMDN term that most accurately describes the device's intended purpose.",
        },
      ],
    },
    {
      id: "device_description",
      title: "Device Description",
      description:
        "Comprehensive technical description of the device per CSDT Chapter 2, covering design, function, materials, and all configurations in the submission.",
      fields: [
        {
          id: "device_description_text",
          label: "Device Description",
          hint: "Detailed narrative covering the device's physical characteristics, dimensions, weight, design features, technological basis, and generation/version history. Include annotated photographs, engineering drawings, and schematic diagrams. The description must be sufficient for a regulatory reviewer unfamiliar with the device to understand its design and function.",
          textarea: true,
        },
        {
          id: "intended_purpose",
          label: "Intended Purpose",
          hint: "The specific medical purpose for which the device is intended, including target medical condition, patient population, anatomical site, clinical context, and user profile. The intended purpose as stated in the CSDT determines the applicable classification rules and must be consistent across all ASEAN member state submissions.",
          textarea: true,
        },
        {
          id: "principles_of_operation",
          label: "Principles of Operation",
          hint: "Scientific and engineering principles underlying the device's function. Describe whether the device achieves its intended action by physical, chemical, pharmacological, immunological, or metabolic means. For active devices, describe the energy source and transduction mechanism. For IVDs, describe the analytical principle (e.g., immunoassay, PCR, electrochemical).",
          textarea: true,
        },
        {
          id: "materials",
          label: "Materials of Construction",
          hint: "Complete list of materials, with emphasis on patient/user-contacting materials. Include material grade, specification standard (ISO, ASTM), and biocompatibility status. For combination products, identify drug or biological constituents. Disclose materials of concern (latex, DEHP, phthalates, bisphenol A, heavy metals).",
        },
        {
          id: "components",
          label: "Components & Sub-assemblies",
          hint: "Itemised list of all components, sub-assemblies, and their functions. For multi-component systems, provide a system architecture diagram showing interconnections and data flows. Identify components from third-party OEM suppliers and any components with separate regulatory status.",
          textarea: true,
        },
        {
          id: "software",
          label: "Software Description",
          hint: "For software-containing devices or standalone SaMD: software version, architecture overview, intended functions, IEC 62304 safety classification (Class A/B/C), operating platform requirements, user interface, cybersecurity architecture (per IMDRF cybersecurity guidance), and any AI/ML algorithms with their training data and performance characteristics.",
          textarea: true,
        },
        {
          id: "accessories",
          label: "Accessories & Ancillary Devices",
          hint: "List of all accessories, consumables, and ancillary devices required for or compatible with the device. Indicate regulatory status of each accessory (included in this CSDT or separately registered). Provide compatibility requirements and any restrictions on use with third-party accessories.",
        },
        {
          id: "variants",
          label: "Device Variants & Configurations",
          hint: "All models, sizes, and configurations included in this submission. Provide a comparison table detailing differences across variants (dimensions, features, performance specifications). All variants must share the same intended purpose and fundamental scientific technology per AMDD grouping principles.",
          textarea: true,
        },
        {
          id: "sterilization",
          label: "Sterilization Method",
          hint: "Indicate whether the device is supplied sterile or non-sterile. If sterile: sterilization method (EtO, gamma, e-beam, steam, VHP, aseptic processing), SAL (10⁻⁶), applicable validation standard (ISO 11135, 11137, 17665), and whether the device is intended for re-sterilization by the user.",
        },
      ],
    },
    {
      id: "essential_principles",
      title: "Essential Principles of Safety & Performance",
      description:
        "Demonstration of conformity with AMDD Essential Principles per CSDT Chapter 3, based on GHTF/IMDRF Essential Principles guidance.",
      fields: [
        {
          id: "ep_checklist",
          label: "AMDD Essential Principles Checklist",
          hint: "Complete the AMDD Essential Principles checklist covering all General Requirements (safety, acceptable risk, design for patient safety, shelf life, transport/storage) and Specific Requirements (chemical/biological/physical properties, infection control, energy, diagnostic devices, radiation). For each principle: state applicability, method of demonstration, and cross-reference to supporting evidence in the dossier.",
          textarea: true,
        },
        {
          id: "applied_standards",
          label: "Applied Standards",
          hint: "Comprehensive list of international standards (ISO, IEC) applied to demonstrate conformity with essential principles. Include standard number, edition/year, and full title. Identify any standards used that are not the most current edition and justify their continued applicability. Map each standard to the essential principle(s) it addresses.",
          textarea: true,
        },
        {
          id: "conformity_demonstration",
          label: "Conformity Demonstration Summary",
          hint: "Summary of the evidence demonstrating conformity with each applicable essential principle. Evidence types include: test reports, design verification/validation records, risk management outputs, clinical evaluation, literature review, certificates, and declarations. Provide document cross-references enabling the reviewer to locate specific evidence.",
          textarea: true,
        },
      ],
    },
    {
      id: "risk_management",
      title: "Risk Management",
      description:
        "Risk management documentation per CSDT Chapter 4, demonstrating a systematic process conforming to ISO 14971 throughout the device lifecycle.",
      fields: [
        {
          id: "risk_management_plan",
          label: "Risk Management Plan",
          hint: "Risk management plan per ISO 14971:2019 specifying scope, roles and responsibilities, risk acceptability criteria (severity/probability matrix with defined thresholds), activities for each lifecycle phase, and the criteria for evaluating overall residual risk acceptability.",
          textarea: true,
        },
        {
          id: "hazard_identification",
          label: "Hazard Identification",
          hint: "Systematic hazard identification using recognised techniques (PHA, FTA, FMEA, HAZOP, ETA). Cover hazards from: intended use and foreseeable misuse; energy hazards (electrical, thermal, mechanical, radiation); biological and chemical hazards; hazards from software, data, and cybersecurity; hazards from environmental and use conditions; and hazards from manufacturing variability.",
          textarea: true,
        },
        {
          id: "risk_control",
          label: "Risk Control Measures",
          hint: "For each unacceptable risk: document the risk control option(s) applied following the priority hierarchy—(1) inherently safe design, (2) protective measures in the device or manufacturing process, (3) information for safety (warnings, instructions). Verify each control's implementation and effectiveness. Confirm no new hazards are introduced by controls.",
          textarea: true,
        },
        {
          id: "residual_risk_evaluation",
          label: "Residual Risk & Benefit-Risk Assessment",
          hint: "Individual residual risk assessment for each identified hazard after controls. Overall residual risk evaluation considering cumulative effects of all residual risks. Where individual residual risks are in the ALARP region, document the benefit-risk analysis per ISO 14971 Clause 7. Conclude with risk management report confirming plan execution and overall acceptability.",
          textarea: true,
        },
      ],
    },
    {
      id: "quality_system",
      title: "Quality Management System",
      description:
        "QMS documentation per CSDT Chapter 5, demonstrating an effective quality system for design, manufacture, and post-market activities.",
      fields: [
        {
          id: "iso_13485_certificate",
          label: "ISO 13485 Certificate",
          hint: "Current ISO 13485:2016 certificate from a certification body accredited by an IAF MLA signatory. The scope must explicitly cover the medical device types in the CSDT. AMDD recognises MDSAP audits. Provide certificate number, certifying body name, scope statement, issue date, and expiry date.",
        },
        {
          id: "qms_scope",
          label: "QMS Scope & Processes",
          hint: "Description of the QMS scope, key processes, and their interactions. Include design and development controls, production and process controls, purchasing and supplier management, corrective and preventive action (CAPA), complaint handling, and document/record control. Identify any QMS processes that are outsourced.",
          textarea: true,
        },
        {
          id: "management_review",
          label: "Management Review Summary",
          hint: "Summary of the most recent management review demonstrating top management commitment and QMS effectiveness. Include review inputs (audit results, CAPA status, complaint trends, post-market data, regulatory changes) and outputs (improvement actions, resource allocation decisions). Management review per ISO 13485 Clause 5.6.",
          textarea: true,
        },
        {
          id: "capa",
          label: "CAPA System",
          hint: "Description of the corrective and preventive action (CAPA) system per ISO 13485 Clause 8.5. Include procedures for identifying non-conformities, investigating root causes, determining corrective/preventive actions, implementing and verifying effectiveness, and escalation to regulatory reporting when CAPA reveals reportable events.",
          textarea: true,
        },
      ],
    },
    {
      id: "verification_validation",
      title: "Verification & Validation",
      description:
        "Design verification and validation evidence per CSDT Chapter 6, covering all testing necessary to demonstrate the device meets its design inputs and intended use.",
      fields: [
        {
          id: "performance_testing",
          label: "Performance & Bench Testing",
          hint: "Design verification test reports demonstrating the device meets its design specifications. Include test protocols with acceptance criteria derived from design inputs, sample sizes with statistical justification (confidence/reliability), detailed results, and pass/fail conclusions. For IVDs: analytical performance including sensitivity, specificity, precision (repeatability, reproducibility), linearity, measuring range, and interfering substances.",
          textarea: true,
        },
        {
          id: "biocompatibility",
          label: "Biocompatibility Evaluation",
          hint: "Biological evaluation per ISO 10993-1 including material characterisation, categorisation by body contact (surface, external communicating, implant) and duration (limited ≤24h, prolonged >24h–30d, permanent >30d), biological evaluation plan, and test reports for applicable endpoints. Include chemical characterisation per ISO 10993-18 and toxicological risk assessment per ISO 10993-17.",
          textarea: true,
        },
        {
          id: "electrical_safety",
          label: "Electrical Safety & Particular Standards",
          hint: "Test reports per IEC 60601-1 (general safety and essential performance) and applicable collateral standards (e.g., IEC 60601-1-2 EMC, IEC 60601-1-6 usability, IEC 60601-1-8 alarms, IEC 60601-1-11 home healthcare) and particular standards (IEC 60601-2-xx). Reports from ISO 17025 accredited laboratories.",
          textarea: true,
        },
        {
          id: "emc_testing",
          label: "EMC Testing",
          hint: "Electromagnetic compatibility test reports per IEC 60601-1-2 covering emissions (radiated, conducted, harmonics, flicker) and immunity (ESD, radiated RF, conducted RF, power frequency magnetic field, voltage dips/interruptions, surges). Specify intended electromagnetic environment and essential performance maintained during immunity tests.",
          textarea: true,
        },
        {
          id: "software_validation",
          label: "Software Verification & Validation",
          hint: "Software lifecycle documentation per IEC 62304: requirements specification, software architecture, detailed design, unit/integration/system testing, traceability matrix (requirements → design → tests → results), anomaly/bug list and resolution status, and cybersecurity testing. For SaMD: clinical association evidence, analytical validation, and clinical validation per IMDRF SaMD guidance.",
          textarea: true,
        },
        {
          id: "sterilization_validation",
          label: "Sterilization Validation",
          hint: "Sterilization validation reports per applicable standard: ISO 11135 (EtO), ISO 11137 (radiation), ISO 17665 (moist heat), ISO 14937 (other agents). Include bioburden determination (ISO 11737-1), sterilization process definition, IQ/OQ/PQ, dose/cycle establishment, SAL 10⁻⁶ demonstration, routine monitoring parameters, and revalidation criteria.",
          textarea: true,
        },
        {
          id: "stability_testing",
          label: "Stability & Shelf Life Studies",
          hint: "Real-time and/or accelerated ageing studies per ASTM F1980 or equivalent. Use ASEAN Zone IVb conditions (30°C/75% RH) for tropical climate applicability. Test parameters include device performance, material degradation, sterile barrier integrity (for sterile devices per ISO 11607), and packaging integrity. State validated shelf life period.",
          textarea: true,
        },
        {
          id: "packaging_validation",
          label: "Packaging System Validation",
          hint: "Packaging validation per ISO 11607-1/-2 for sterile medical devices. Include seal strength testing, peel testing, dye penetration or bubble leak testing, distribution simulation (ASTM D4169 or ISTA protocols), and accelerated/real-time ageing of the package. For non-sterile devices, demonstrate packaging protects the device during distribution.",
          textarea: true,
        },
      ],
    },
    {
      id: "clinical_evidence",
      title: "Clinical Evidence",
      description:
        "Clinical evaluation per CSDT Chapter 7, demonstrating the device's clinical safety, performance, and benefit-risk acceptability through systematic appraisal of clinical data.",
      fields: [
        {
          id: "clinical_evaluation_report",
          label: "Clinical Evaluation Report (CER)",
          hint: "Systematic clinical evaluation per MEDDEV 2.7/1 Rev 4 or IMDRF clinical evaluation guidance. The CER must: define the evaluation scope and plan, identify and appraise all relevant clinical data (literature, clinical investigations, post-market experience), address each intended purpose claim, evaluate known risks and side effects, and reach a conclusion on clinical safety, performance, and benefit-risk.",
          textarea: true,
        },
        {
          id: "clinical_investigation_data",
          label: "Clinical Investigation Data",
          hint: "Full clinical study reports or summaries per ISO 14155. Include study design (RCT, single-arm, registry), primary and secondary endpoints, sample size calculation, patient demographics, efficacy results, safety results (adverse events, device deficiencies), statistical analysis, and conclusions. Investigations must have ethics committee approval.",
          textarea: true,
        },
        {
          id: "literature_review",
          label: "Literature Review",
          hint: "Systematic literature review following MEDDEV 2.7/1 Rev 4 methodology. Document the search protocol (databases: PubMed, Embase, Cochrane; keywords; date range; inclusion/exclusion criteria), search results (PRISMA flow diagram), data extraction, critical appraisal of each study, and evidence synthesis.",
          textarea: true,
        },
        {
          id: "equivalence_justification",
          label: "Equivalence Justification",
          hint: "If relying on clinical data from an equivalent device: detailed comparison of technical characteristics (design, specifications, materials, manufacturing), biological characteristics (biocompatibility), and clinical characteristics (intended purpose, patient population, clinical context, body site). Demonstrate that any differences do not negatively affect safety or clinical performance.",
          textarea: true,
        },
        {
          id: "pmcf",
          label: "Post-Market Clinical Follow-up (PMCF)",
          hint: "PMCF plan and any available PMCF evaluation reports. The PMCF plan should specify objectives, methods (clinical investigations, registries, surveys, literature monitoring), milestones, and evaluation schedule. For devices with limited pre-market clinical data, describe how residual clinical questions will be addressed through PMCF.",
          textarea: true,
        },
      ],
    },
    {
      id: "post_market_surveillance",
      title: "Post-Market Surveillance",
      description:
        "Post-market surveillance system per CSDT Chapter 8, covering vigilance, field safety actions, and systematic monitoring of device performance.",
      fields: [
        {
          id: "pms_plan",
          label: "Post-Market Surveillance Plan",
          hint: "Documented PMS plan describing the systematic process for collecting, analysing, and acting on post-market data. Include: data sources (complaints, adverse events, literature, registries, sales data), analysis methods, escalation criteria, review frequency, and integration with risk management and clinical evaluation updates.",
          textarea: true,
        },
        {
          id: "adverse_event_reporting",
          label: "Adverse Event Reporting",
          hint: "Process for identifying, evaluating, and reporting adverse events to relevant ASEAN member state regulators. Each member state has specific reporting timelines and forms. Describe the internal assessment process for determining reportability, causal relationship analysis, and the mechanism for submitting reports to each target country's national regulatory authority.",
          textarea: true,
        },
        {
          id: "fsca",
          label: "Field Safety Corrective Actions (FSCA)",
          hint: "Procedures for initiating FSCAs including recalls, corrections, and safety notices. Describe notification procedures to each ASEAN member state regulator, communication plans for affected healthcare facilities and patients, implementation tracking, and effectiveness verification. Include FSCA classification criteria and decision tree.",
          textarea: true,
        },
        {
          id: "recall_procedures",
          label: "Recall Procedures",
          hint: "Documented recall procedure including recall initiation criteria, classification (health hazard evaluation), notification to regulatory authorities in each ASEAN member state, communication strategy (healthcare professionals, patients, distributors), recall execution logistics, effectiveness checks, and recall termination/closure reporting.",
          textarea: true,
        },
        {
          id: "trend_reporting",
          label: "Trend Reporting & Analysis",
          hint: "Process for systematic trend analysis of adverse events, complaints, and device deficiencies. Include statistical methods for detecting signals, thresholds for escalation (e.g., significant increase in event rate), and procedures for submitting trend reports to regulators when patterns suggest a previously unidentified risk or increase in known risk frequency.",
          textarea: true,
        },
      ],
    },
    {
      id: "labelling",
      title: "Labelling & Instructions for Use",
      description:
        "Device labelling per CSDT Chapter 9, meeting AMDD harmonised labelling requirements and accommodating individual member state language and format obligations.",
      fields: [
        {
          id: "device_labels",
          label: "Device Labels",
          hint: "Artwork or specimens of all device labels (device, sterile barrier, shelf carton). Must include: device name, product owner/manufacturer name and address, model/catalogue number, batch/lot or serial number, manufacturing date, expiry date/use-by date (if applicable), sterilization symbol (if applicable), and ISO 15223-1 graphical symbols. Labels should be adaptable for local language requirements of each ASEAN member state.",
          textarea: true,
        },
        {
          id: "ifu",
          label: "Instructions for Use (IFU)",
          hint: "Complete IFU content meeting AMDD requirements. Include: intended purpose, indications for use, contraindications, warnings and precautions, directions for use (pre-use preparation, operating procedures, post-use actions), maintenance/calibration, cleaning/disinfection/sterilization (reusable devices), troubleshooting, disposal, and manufacturer contact. Must comply with IEC 62366-1 usability engineering and be translatable to local languages.",
          textarea: true,
        },
        {
          id: "packaging",
          label: "Packaging Labels",
          hint: "Outer packaging and shipping container labelling. Include storage condition symbols (temperature, humidity, light sensitivity), handling symbols (fragile, keep dry, this side up), UDI carrier (if applicable), and sufficient space for local-language regulatory markings (registration numbers, importer details) required by individual ASEAN member states.",
        },
        {
          id: "asean_specific_requirements",
          label: "ASEAN-Specific Labelling Requirements",
          hint: "Summary of labelling adaptations required for each target ASEAN member state: local language translations, local representative/importer details on label, national registration number placement, country-specific warning statements, and any member-state-mandated symbols or markings not covered by ISO 15223-1.",
          textarea: true,
        },
        {
          id: "udi",
          label: "Unique Device Identification (UDI)",
          hint: "UDI implementation status and plan. Include: UDI issuing agency (GS1, HIBCC, ICCBBA), device identifier (DI), production identifier (PI) elements (lot, serial, expiry, manufacturing date), UDI carrier format (AIDC barcode + HRI), and UDI database submission status. Note that ASEAN member states are at varying stages of UDI implementation.",
        },
      ],
    },
    {
      id: "certificates",
      title: "Certificates & Regulatory Approvals",
      description:
        "Regulatory certificates and foreign approval evidence per CSDT Chapter 10, supporting the ASEAN registration application.",
      fields: [
        {
          id: "free_sale_certificate",
          label: "Certificate of Free Sale",
          hint: "Certificate(s) of Free Sale from the country of manufacture or reference market, issued by the competent regulatory authority. The CFS must confirm the device is legally manufactured and freely marketed. AMDD recommends CFS from at least one founding regulatory authority. Authentication requirements (apostille, consularisation) vary by ASEAN member state.",
        },
        {
          id: "iso_13485_certificate",
          label: "ISO 13485 Certificate",
          hint: "Current ISO 13485:2016 certificate for each manufacturing site involved in the production of the device. Must be from a certification body accredited by an IAF MLA signatory. Include certificate number, certifying body, scope, issue date, and expiry date. MDSAP certificates are also accepted by AMDD.",
        },
        {
          id: "conformity_assessment",
          label: "Conformity Assessment Evidence",
          hint: "Summary of conformity assessment procedures applied, including: self-declaration of conformity (Class A), type examination certificates, QMS audit certificates, and design examination certificates as applicable to the device classification. Reference the specific AMDD conformity assessment routes used.",
          textarea: true,
        },
        {
          id: "foreign_approvals",
          label: "Foreign Regulatory Approvals",
          hint: "Summary of regulatory approvals from non-ASEAN jurisdictions: US FDA (510(k)/PMA), EU CE marking (Notified Body certificate), TGA (ARTG inclusion), Health Canada (MDL), PMDA (Japan), and others. Include approval date, type, conditions, and current status. Disclose any rejections, withdrawals, suspensions, or safety-related regulatory actions worldwide.",
          textarea: true,
        },
      ],
    },
  ],
};

export const ASEAN_FRAMEWORKS: RegulatoryFramework[] = [ASEAN_CSDT];
