import type { RegulatoryFramework } from "../types";

const SG_HSA: RegulatoryFramework = {
  id: "SG_HSA",
  countryCode: "SG",
  countryName: "Singapore",
  flag: "🇸🇬",
  authority: "HSA",
  documentType: "Medical Device Registration",
  sections: [
    {
      id: "administrative",
      title: "Administrative Information",
      description:
        "Registrant identification, HSA listing details, and device classification under the Health Products Act and Health Products (Medical Devices) Regulations.",
      fields: [
        {
          id: "registrant_name",
          label: "Registrant Name",
          hint: "Legal name of the entity registering the device with HSA. The registrant must hold a valid Dealer's Licence (Manufacturer, Importer, or Wholesaler) issued under the Health Products Act (Cap. 122D).",
        },
        {
          id: "registrant_address",
          label: "Registrant Address",
          hint: "Registered business address in Singapore. Foreign manufacturers must appoint a local registrant holding a valid HSA Dealer's Licence to act on their behalf.",
        },
        {
          id: "hsa_product_listing_number",
          label: "HSA Product Listing Number",
          hint: "Unique listing number assigned by HSA upon successful registration (format: e.g., SIN-XXXXXXXXX). For new applications, leave blank; for variations or re-registrations, provide the existing listing number.",
        },
        {
          id: "device_name",
          label: "Device Name",
          hint: "Proprietary or trade name of the medical device as it will appear on the Singapore Register of Medical Devices (SRMD). Must match the labelling exactly.",
        },
        {
          id: "gmdn_code",
          label: "GMDN Code & Term",
          hint: "Global Medical Device Nomenclature (GMDN) preferred term code and name that best describes the device's intended purpose (e.g., 47250 – Implantable hip endoprosthesis). HSA uses GMDN for device categorisation.",
        },
        {
          id: "device_classification",
          label: "HSA Risk Classification",
          hint: "Classification under HSA's four-tier system: Class A (low risk, general controls), Class B (low-moderate risk), Class C (moderate-high risk), or Class D (high risk). Determined per the First Schedule of the Health Products (Medical Devices) Regulations using GHTF classification rules.",
        },
      ],
    },
    {
      id: "device_description",
      title: "Device Description",
      description:
        "Comprehensive technical description of the device including its design, materials, operating principles, and all configurations submitted for registration.",
      fields: [
        {
          id: "device_description_text",
          label: "Device Description",
          hint: "Detailed narrative describing the device's physical characteristics, dimensions, weight, design features, and how it differs from previous generations or competitor devices. Include diagrams or photographs where appropriate.",
          textarea: true,
        },
        {
          id: "intended_purpose",
          label: "Intended Purpose",
          hint: "The specific medical purpose for which the device is intended, including target patient population, medical condition or disease to be diagnosed/treated/monitored, anatomical site, and clinical context of use. Must align with the GMDN definition and product labelling.",
          textarea: true,
        },
        {
          id: "principles_of_operation",
          label: "Principles of Operation",
          hint: "Scientific and engineering principles underlying device function (e.g., piezoelectric transduction for ultrasound, impedance measurement for bioelectrical analysis). Include mode of action—whether the device achieves its principal intended action by pharmacological, immunological, metabolic, or physical means.",
          textarea: true,
        },
        {
          id: "materials",
          label: "Materials of Construction",
          hint: "Complete list of materials in contact with the patient or user, including material grade and specification (e.g., ASTM F136 Ti-6Al-4V ELI for orthopaedic implants, USP Class VI silicone). For combination products, identify drug or biologic constituents.",
        },
        {
          id: "components",
          label: "Components & Sub-assemblies",
          hint: "Itemised list of all device components, sub-assemblies, and their functions. For systems, describe each module and how they interconnect. Provide a block diagram for complex multi-component devices.",
          textarea: true,
        },
        {
          id: "software",
          label: "Software Description",
          hint: "If the device incorporates software or is software as a medical device (SaMD), provide: software version, level of concern (Minor/Moderate/Major per HSA guidance), operating system requirements, cybersecurity architecture, and IEC 62304 software safety classification (Class A/B/C).",
          textarea: true,
        },
        {
          id: "accessories",
          label: "Accessories & Ancillary Devices",
          hint: "List all accessories, consumables, and ancillary devices supplied with or required for the device's intended use. Indicate whether each accessory is separately registered with HSA or covered under this registration.",
        },
        {
          id: "variants",
          label: "Device Variants & Configurations",
          hint: "All models, sizes, configurations, and variants included in this registration application. Provide a comparison table showing differences across variants (e.g., dimensions, power ratings, features). Each variant must share the same intended purpose and fundamental technology.",
          textarea: true,
        },
        {
          id: "sterilization",
          label: "Sterilization Method",
          hint: "State whether the device is supplied sterile or non-sterile. If sterile, specify the sterilization method (EtO, gamma irradiation, e-beam, steam, VHP) and sterility assurance level (SAL 10⁻⁶). Reference applicable standard (e.g., ISO 11135, ISO 11137, ISO 17665).",
        },
      ],
    },
    {
      id: "essential_principles",
      title: "Essential Principles of Safety & Performance",
      description:
        "Demonstration of conformity with the Essential Principles of Safety and Performance as specified in the Second Schedule of the Health Products (Medical Devices) Regulations.",
      fields: [
        {
          id: "ep_checklist",
          label: "HSA Essential Principles Checklist",
          hint: "Complete the HSA Essential Principles checklist (based on IMDRF/GHTF EP). For each applicable principle, identify the requirement, state applicability, list the method of demonstration (standard, test, clinical data, risk analysis), and reference supporting documents. Non-applicable principles must be justified.",
          textarea: true,
        },
        {
          id: "applied_standards",
          label: "Applied Standards",
          hint: "List all international standards (ISO, IEC) applied to demonstrate conformity with essential principles. Include standard number, edition/year, and title (e.g., IEC 60601-1:2005+A1:2012, ISO 10993-1:2018). Justify any deviations or use of superseded editions.",
          textarea: true,
        },
        {
          id: "conformity_demonstration",
          label: "Conformity Assessment Evidence",
          hint: "Summary of evidence demonstrating conformity with each essential principle—test reports, certificates, design verification/validation records, risk management outputs, and clinical data. Cross-reference to specific documents in the submission dossier.",
          textarea: true,
        },
      ],
    },
    {
      id: "risk_management",
      title: "Risk Management",
      description:
        "Risk management documentation demonstrating a systematic process for hazard identification, risk estimation, risk evaluation, and risk control per ISO 14971.",
      fields: [
        {
          id: "risk_management_plan",
          label: "Risk Management Plan",
          hint: "Risk management plan per ISO 14971:2019 defining scope, risk acceptability criteria (severity/probability matrix), roles, and lifecycle activities. Include the criteria for determining when the overall residual risk is acceptable.",
          textarea: true,
        },
        {
          id: "risk_analysis",
          label: "Risk Analysis & Hazard Identification",
          hint: "Systematic identification of hazards associated with the device using techniques such as PHA, FTA, FMEA, or HAZOP. For each hazard, estimate severity and probability of harm, considering both normal use and foreseeable misuse scenarios.",
          textarea: true,
        },
        {
          id: "risk_evaluation_control",
          label: "Risk Evaluation & Control Measures",
          hint: "For each identified risk, document the evaluation against acceptability criteria and the risk control measures applied (inherent safety by design, protective measures, information for safety). Verify effectiveness of each control and ensure no new hazards are introduced.",
          textarea: true,
        },
        {
          id: "residual_risk",
          label: "Overall Residual Risk Evaluation",
          hint: "Assessment that the overall residual risk (considering all individual residual risks and their cumulative effect) is acceptable. Document the benefit-risk determination and any risk-benefit analysis per ISO 14971 Clause 8.",
          textarea: true,
        },
      ],
    },
    {
      id: "testing_performance",
      title: "Testing & Performance Verification",
      description:
        "Design verification and validation evidence including bench testing, biocompatibility assessment, electrical safety, EMC, software verification, and sterilization validation.",
      fields: [
        {
          id: "performance_standards",
          label: "Applicable Testing Standards",
          hint: "List all product-specific and horizontal testing standards applied (e.g., IEC 60601-1 for electrical medical equipment, IEC 60601-1-2 for EMC, ISO 81060-2 for non-invasive BP monitors). Include standard edition and any national deviations recognised by HSA.",
          textarea: true,
        },
        {
          id: "biocompatibility",
          label: "Biocompatibility Evaluation",
          hint: "Biological evaluation per ISO 10993-1 including material characterisation, categorisation by body contact type and duration (surface, external communicating, implant; limited/prolonged/permanent), and a biological evaluation plan. Provide test reports or rationale for endpoints: cytotoxicity, sensitisation, irritation, systemic toxicity, genotoxicity, implantation, haemocompatibility as applicable.",
          textarea: true,
        },
        {
          id: "performance_testing",
          label: "Performance & Bench Testing",
          hint: "Summaries of design verification tests demonstrating the device meets its design specifications. Include test protocols, acceptance criteria, sample sizes (with statistical rationale), results, and pass/fail determination. For in vitro diagnostic devices, provide analytical performance data (sensitivity, specificity, precision, linearity).",
          textarea: true,
        },
        {
          id: "electrical_safety",
          label: "Electrical Safety Testing",
          hint: "Test reports demonstrating compliance with IEC 60601-1 (general safety) and applicable collateral and particular standards. Cover earth leakage, enclosure leakage, patient leakage currents, dielectric strength, protective earthing, mechanical strength, and temperature limits. Reports must be from an accredited (ISO 17025) test laboratory.",
          textarea: true,
        },
        {
          id: "emc_testing",
          label: "Electromagnetic Compatibility (EMC)",
          hint: "EMC test reports per IEC 60601-1-2 covering emissions (radiated and conducted) and immunity (ESD, radiated RF, conducted RF, power frequency magnetic fields, voltage dips/interruptions). Include the intended electromagnetic environment (professional healthcare, home healthcare) and any essential performance claims maintained during immunity testing.",
          textarea: true,
        },
        {
          id: "software_verification",
          label: "Software Verification & Validation",
          hint: "For software-containing devices: software development lifecycle documentation per IEC 62304, including requirements specification, architecture, unit/integration/system test reports, traceability matrix, anomaly list, and cybersecurity risk assessment. For SaMD, provide clinical association and analytical/clinical validation evidence.",
          textarea: true,
        },
        {
          id: "sterilization_validation",
          label: "Sterilization Validation",
          hint: "Sterilization validation reports per applicable standard (ISO 11135 for EtO, ISO 11137 for radiation, ISO 17665 for moist heat). Include bioburden determination (ISO 11737-1), dose audit/verification results, parametric release criteria (if applicable), and evidence of SAL 10⁻⁶ achievement.",
          textarea: true,
        },
        {
          id: "stability_shelf_life",
          label: "Stability & Shelf Life Testing",
          hint: "Real-time and/or accelerated ageing studies demonstrating the device maintains safety and performance throughout its claimed shelf life. For sterile devices, include sterile barrier system integrity testing per ASTM F1980 or ISO 11607-1. State the validated shelf life period.",
          textarea: true,
        },
        {
          id: "packaging_validation",
          label: "Packaging Validation",
          hint: "Packaging system validation per ISO 11607 (for sterile medical devices) or equivalent. Include seal strength, peel testing, distribution simulation (ASTM D4169/ISTA), and integrity testing results. For non-sterile devices, demonstrate packaging protects the device during transport and storage.",
          textarea: true,
        },
      ],
    },
    {
      id: "clinical_evidence",
      title: "Clinical Evidence",
      description:
        "Clinical evaluation and supporting clinical data demonstrating that the device is safe and performs as intended when used on patients.",
      fields: [
        {
          id: "clinical_evaluation_report",
          label: "Clinical Evaluation Report",
          hint: "A systematic and planned clinical evaluation per MEDDEV 2.7/1 Rev 4 or IMDRF guidance. The report must critically evaluate available clinical data (from literature, clinical experience, and clinical investigations) and conclude on the device's clinical safety, performance, and benefit-risk profile.",
          textarea: true,
        },
        {
          id: "clinical_data",
          label: "Clinical Investigation Data",
          hint: "Summaries or full reports of clinical investigations conducted with the device, including study design, endpoints, patient demographics, results, adverse events, and statistical analysis. Investigations must comply with ISO 14155 and applicable ethical requirements (IRB/ethics committee approval).",
          textarea: true,
        },
        {
          id: "literature_review",
          label: "Literature Review",
          hint: "Systematic literature review covering the device and equivalent devices. Document the search strategy (databases, keywords, date range), inclusion/exclusion criteria, appraisal methodology, and a synthesis of clinical evidence extracted from identified publications.",
          textarea: true,
        },
        {
          id: "equivalence_justification",
          label: "Equivalence Justification",
          hint: "If relying on clinical data from an equivalent device, provide detailed comparison of technical (design, materials, specifications), biological (biocompatibility, contact), and clinical (intended purpose, clinical context, patient population) characteristics. Justify that differences do not adversely affect clinical safety or performance.",
          textarea: true,
        },
      ],
    },
    {
      id: "quality_system",
      title: "Quality Management System",
      description:
        "Evidence of an effective quality management system covering the design, manufacture, and servicing of the medical device.",
      fields: [
        {
          id: "iso_13485_certificate",
          label: "ISO 13485 Certificate",
          hint: "Current ISO 13485:2016 certificate issued by an accredited certification body (IAF MLA signatory). The certificate scope must cover the device type(s) included in the registration. Provide certificate number, certifying body, scope, and expiry date.",
        },
        {
          id: "mdsap_certificate",
          label: "MDSAP Certificate (if applicable)",
          hint: "Medical Device Single Audit Program certificate, if held. HSA recognises MDSAP audit reports as evidence of QMS compliance. Provide the MDSAP certificate and most recent audit report, noting any non-conformities and their resolution status.",
        },
        {
          id: "qms_documentation",
          label: "QMS Documentation Summary",
          hint: "High-level summary of the quality management system including quality manual scope, design and development procedures, production controls, purchasing controls, CAPA system, internal audit program, and management review process. HSA may request specific QMS procedures during evaluation.",
          textarea: true,
        },
      ],
    },
    {
      id: "labelling",
      title: "Labelling & Instructions for Use",
      description:
        "Device labelling, instructions for use, and packaging information meeting HSA requirements under the Health Products (Medical Devices) Regulations.",
      fields: [
        {
          id: "device_labels",
          label: "Device Labels",
          hint: "Artwork or specimens of all device labels (primary, secondary, shelf carton). Labels must include: device name, manufacturer name and address, batch/lot or serial number, manufacturing date, expiry date or use-by date (if applicable), 'STERILE' with sterilization method symbol (if applicable), and any relevant warning symbols per ISO 15223-1.",
          textarea: true,
        },
        {
          id: "ifu",
          label: "Instructions for Use (IFU)",
          hint: "Complete instructions for use in English (minimum). Must include: intended purpose, indications, contraindications, warnings, precautions, directions for use, maintenance/calibration instructions, disposal instructions, and manufacturer contact details. Shall comply with IEC 62366 usability requirements.",
          textarea: true,
        },
        {
          id: "packaging_labels",
          label: "Packaging Labels",
          hint: "Outer packaging labelling including shipping container labels, shelf carton labels, and any intermediate packaging. Must include UDI carrier (if applicable under HSA's UDI implementation timeline), storage conditions, and handling instructions.",
        },
        {
          id: "hsa_specific_labelling",
          label: "HSA-Specific Labelling Requirements",
          hint: "Verification that labelling meets HSA-specific requirements: Singapore registrant's name and local address must appear on the label or IFU; product listing number should be included once assigned; any HSA-mandated warnings or statements for the device classification must be present.",
        },
      ],
    },
    {
      id: "manufacturing",
      title: "Manufacturing Information",
      description:
        "Details of all manufacturing sites, processes, and key suppliers involved in the production of the medical device.",
      fields: [
        {
          id: "manufacturing_sites",
          label: "Manufacturing Site(s)",
          hint: "Name, address, and role of each manufacturing facility involved in device production (fabrication, assembly, sterilization, final release). Include site-specific ISO 13485 certificates or MDSAP certificates. For contract manufacturers, provide the legal agreement scope.",
        },
        {
          id: "manufacturing_process",
          label: "Manufacturing Process Overview",
          hint: "High-level description of the manufacturing process from raw materials to finished device, including key process steps (e.g., injection moulding, CNC machining, welding, coating, assembly, sterilization, packaging). Provide a process flow diagram.",
          textarea: true,
        },
        {
          id: "key_suppliers",
          label: "Key Suppliers & Critical Components",
          hint: "List of key suppliers providing critical raw materials, components, or services (e.g., sterilization, calibration) that directly affect device safety or performance. Include supplier qualification status and any alternative/secondary suppliers.",
          textarea: true,
        },
        {
          id: "special_processes",
          label: "Special Processes",
          hint: "Identification and validation status of special processes whose output cannot be fully verified by subsequent inspection or testing (e.g., sterilization, welding, soldering, heat treatment, coating, injection moulding). Reference validation protocols and reports.",
          textarea: true,
        },
      ],
    },
    {
      id: "postmarket_certificates",
      title: "Post-Market Surveillance & Certificates",
      description:
        "Post-market obligations, vigilance reporting to HSA, and regulatory certificates from other jurisdictions supporting the registration application.",
      fields: [
        {
          id: "adverse_event_reporting",
          label: "Adverse Event Reporting to HSA",
          hint: "Description of the manufacturer's and registrant's adverse event reporting process to HSA. Mandatory reporting of serious adverse events within prescribed timelines: death or serious deterioration within 10 calendar days, other reportable events within 30 days. Reference HSA's Guidance on Medical Device Adverse Event Reporting.",
          textarea: true,
        },
        {
          id: "fsca",
          label: "Field Safety Corrective Actions (FSCA)",
          hint: "Procedure for initiating and reporting field safety corrective actions (recalls, field corrections, safety alerts) to HSA. Include the FSCA notification process, communication plan to affected users, and effectiveness check procedures. HSA must be notified within prescribed timelines.",
          textarea: true,
        },
        {
          id: "free_sale_certificate",
          label: "Certificate of Free Sale",
          hint: "Certificate(s) of Free Sale (CFS) from the country of manufacture or reference market (e.g., CE Certificate, FDA clearance/approval letter). The CFS should confirm the device is legally marketed in the issuing country. HSA may accept regulatory approval letters from recognised reference regulators (FDA, EU NB, TGA, Health Canada).",
        },
        {
          id: "foreign_approvals",
          label: "Foreign Regulatory Approvals",
          hint: "Summary of regulatory approvals or clearances obtained in other jurisdictions, including approval date, status, and any conditions or restrictions. Note any rejections, withdrawals, or safety-related regulatory actions taken in any country.",
          textarea: true,
        },
      ],
    },
  ],
};

export const SG_FRAMEWORKS: RegulatoryFramework[] = [SG_HSA];
