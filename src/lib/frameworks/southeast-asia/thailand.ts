import type { RegulatoryFramework } from "../types";

const TH_FDA: RegulatoryFramework = {
  id: "TH_FDA",
  countryCode: "TH",
  countryName: "Thailand",
  flag: "🇹🇭",
  authority: "Thai FDA",
  documentType: "Medical Device Registration",
  sections: [
    {
      id: "administrative",
      title: "Administrative Information",
      description:
        "Applicant identification, Thai FDA licence details, and device classification under the Medical Device Act B.E. 2551 (2008).",
      fields: [
        {
          id: "applicant_name",
          label: "Applicant Name",
          hint: "Legal name of the Thai entity applying for device registration. The applicant must hold a valid Medical Device Establishment Licence (Manufacturing or Import licence) issued by Thai FDA under the Medical Device Act B.E. 2551.",
        },
        {
          id: "thai_fda_license_number",
          label: "Thai FDA Establishment Licence Number",
          hint: "Licence number issued by Thai FDA authorising the applicant to manufacture or import medical devices. Format varies by licence type (สผ.xx/xxxx for manufacturing, สน.xx/xxxx for import). This licence must be current and not suspended.",
        },
        {
          id: "local_representative",
          label: "Local Authorised Representative",
          hint: "If the manufacturer is located outside Thailand, provide details of the Thai authorised representative or importer who holds the establishment licence and will act as the responsible party for regulatory communications with Thai FDA.",
        },
        {
          id: "device_name_thai",
          label: "Device Name (Thai)",
          hint: "Device name in Thai language as it will appear on the Thai FDA registration certificate and product labelling. The Thai name must accurately represent the device and conform to Thai FDA naming conventions.",
        },
        {
          id: "device_name_english",
          label: "Device Name (English)",
          hint: "Device name in English corresponding to the Thai name. Must match the name used in international regulatory submissions and manufacturer's documentation.",
        },
        {
          id: "risk_classification",
          label: "Risk Classification",
          hint: "Thai FDA risk classification: Group 1 (general medical devices, low risk—notification), Group 2 (controlled medical devices, moderate risk—notification with documentation), Group 3 (specially controlled medical devices, high risk—full registration with pre-market review). Classification per the Ministerial Notification on Medical Device Categories.",
        },
      ],
    },
    {
      id: "device_description",
      title: "Device Description",
      description:
        "Technical description of the device's design, intended use, specifications, and all components included in the registration.",
      fields: [
        {
          id: "device_description_text",
          label: "Device Description",
          hint: "Comprehensive description of the medical device including physical characteristics, dimensions, weight, design features, and operating principles. Include photographs, diagrams, and technical drawings. Thai FDA may require a Thai-language summary for Group 2 and Group 3 devices.",
          textarea: true,
        },
        {
          id: "intended_use",
          label: "Intended Use",
          hint: "Statement of the device's intended medical purpose including target disease/condition, patient population, body site, and clinical setting. Must be consistent with the labelling and promotional materials. Thai FDA reviews intended use claims for alignment with the registered classification.",
          textarea: true,
        },
        {
          id: "specifications",
          label: "Technical Specifications",
          hint: "Detailed technical specifications including performance parameters, operating ranges, accuracy, precision, power requirements, environmental operating conditions, and any critical dimensions. Present in tabular format where possible.",
          textarea: true,
        },
        {
          id: "materials",
          label: "Materials of Construction",
          hint: "List of all materials used in device construction, especially those in patient/user contact. Include material grades, specifications (e.g., ASTM, JIS, TIS standards), and biocompatibility classification. Thai FDA may require compliance with Thai Industrial Standards (TIS/มอก.) for specific materials.",
        },
        {
          id: "components",
          label: "Components & Accessories",
          hint: "Complete list of device components, sub-assemblies, consumables, and accessories. For each, provide description, function, material, and quantity. Indicate which items are included in the registration scope and which require separate registration.",
          textarea: true,
        },
        {
          id: "software",
          label: "Software Description",
          hint: "For devices incorporating software: software version/revision, intended functions, operating platform, level of concern, IEC 62304 classification, cybersecurity considerations, and any AI/ML algorithms. Software as a Medical Device (SaMD) may require separate classification assessment.",
          textarea: true,
        },
        {
          id: "accessories",
          label: "Accessories & Ancillary Devices",
          hint: "List of all accessories required for or compatible with the device. Specify whether each accessory is included in this registration or registered separately. Include part numbers and compatibility information.",
        },
        {
          id: "variants",
          label: "Device Variants & Configurations",
          hint: "All models, sizes, configurations, and product variants included in this registration. Provide a comparison table showing key differences across variants. All variants must share the same intended use and fundamental technology to be grouped under a single registration.",
          textarea: true,
        },
        {
          id: "sterilization",
          label: "Sterilization Method",
          hint: "If the device is supplied sterile, specify the sterilization method (EtO, gamma irradiation, e-beam, steam autoclave) and the sterility assurance level (SAL 10⁻⁶). Reference the applicable validation standard. If non-sterile, state this and describe any user reprocessing requirements.",
        },
      ],
    },
    {
      id: "quality_system",
      title: "Quality Management System",
      description:
        "Evidence of quality management system compliance including ISO 13485 certification and Thai GMP requirements.",
      fields: [
        {
          id: "iso_13485_certificate",
          label: "ISO 13485 Certificate",
          hint: "Current ISO 13485:2016 certificate from an accredited certification body. The scope must cover the device types being registered. Thai FDA requires this for Group 2 and Group 3 medical devices. Provide certificate number, certifying body, scope statement, issue and expiry dates.",
        },
        {
          id: "thai_gmp",
          label: "Thai GMP Compliance",
          hint: "For domestically manufactured devices, evidence of compliance with Thai GMP requirements per the Ministerial Notification on Medical Device Manufacturing Standards. Thai FDA may conduct facility inspections to verify GMP compliance. For imported devices, ISO 13485 certification from the manufacturing site is typically accepted.",
          textarea: true,
        },
        {
          id: "manufacturing_licence",
          label: "Manufacturing Establishment Licence",
          hint: "Copy of the manufacturer's establishment licence from the country of manufacture. For Thai manufacturers, the สผ. licence issued by Thai FDA. For foreign manufacturers, provide the local manufacturing licence or authorisation from the country of origin's regulatory authority.",
        },
      ],
    },
    {
      id: "testing",
      title: "Testing & Performance",
      description:
        "Product testing evidence including compliance with Thai Industrial Standards (TIS), biocompatibility, and performance testing.",
      fields: [
        {
          id: "tisi_standards",
          label: "Thai Industrial Standards (TIS/TISI)",
          hint: "List of applicable Thai Industrial Standards Institute (TISI/สมอ.) standards and demonstrate compliance. Thai FDA may require mandatory TIS certification for certain device categories (e.g., TIS 60601 for electrical medical equipment). Include TIS licence number if mandatory certification applies.",
          textarea: true,
        },
        {
          id: "biocompatibility",
          label: "Biocompatibility Testing",
          hint: "Biological evaluation per ISO 10993-1 appropriate for the device's body contact and duration. Include test reports for applicable endpoints (cytotoxicity, sensitisation, irritation, pyrogenicity, etc.). Reports must be from ISO 17025 accredited laboratories; Thai FDA may accept reports from laboratories accredited by ILAC MRA signatories.",
          textarea: true,
        },
        {
          id: "performance_testing",
          label: "Performance Testing",
          hint: "Design verification and validation test reports demonstrating the device meets its performance specifications and intended use. Include test protocols, acceptance criteria, sample sizes, results, and conclusions. For IVDs, provide analytical and clinical performance data.",
          textarea: true,
        },
        {
          id: "electrical_safety",
          label: "Electrical Safety Testing",
          hint: "For electrically powered devices, test reports demonstrating compliance with IEC 60601-1 (or TIS equivalent) and applicable particular standards. Cover leakage currents, dielectric strength, earthing, temperature limits, and mechanical safety. Reports from TISI-recognised or ISO 17025 accredited labs.",
          textarea: true,
        },
        {
          id: "sterilization_validation",
          label: "Sterilization Validation",
          hint: "For sterile devices: sterilization validation reports per applicable ISO standards (ISO 11135 for EtO, ISO 11137 for radiation, ISO 17665 for steam). Include bioburden data, SAL 10⁻⁶ demonstration, routine monitoring procedures, and parametric release criteria if applicable.",
          textarea: true,
        },
        {
          id: "stability_testing",
          label: "Stability & Shelf Life",
          hint: "Accelerated and/or real-time ageing study data supporting the claimed shelf life. Include test conditions, sampling plan, tested parameters, acceptance criteria, and results. For sterile devices, include package integrity testing throughout the claimed shelf life.",
          textarea: true,
        },
        {
          id: "emc_testing",
          label: "Electromagnetic Compatibility (EMC)",
          hint: "EMC test reports per IEC 60601-1-2 covering emissions (radiated and conducted) and immunity (ESD, radiated RF, conducted RF, power frequency magnetic fields, voltage dips/interruptions). Specify the intended electromagnetic environment and essential performance claims maintained during immunity testing.",
          textarea: true,
        },
        {
          id: "packaging_validation",
          label: "Packaging Validation",
          hint: "Packaging system validation per ISO 11607 (sterile devices) or equivalent. Include seal strength, distribution simulation testing (ASTM D4169/ISTA), and integrity testing. For tropical climate distribution in Thailand, consider humidity and temperature extremes during transport.",
          textarea: true,
        },
      ],
    },
    {
      id: "clinical_evidence",
      title: "Clinical Evidence",
      description:
        "Clinical evaluation and data supporting the device's safety and performance in the intended patient population.",
      fields: [
        {
          id: "clinical_evaluation",
          label: "Clinical Evaluation Report",
          hint: "Systematic clinical evaluation of available clinical data per MEDDEV 2.7/1 or equivalent methodology. The report should critically appraise clinical evidence from literature, clinical investigations, and post-market experience to demonstrate the device's clinical safety and performance. Required for Group 3 devices; may be requested for Group 2.",
          textarea: true,
        },
        {
          id: "clinical_data",
          label: "Clinical Investigation Data",
          hint: "Summaries or reports of clinical investigations/trials conducted with the device. Include study design, objectives, endpoints, patient population, results, adverse events, and statistical analysis. Clinical investigations conducted in Thailand must have Ethics Committee approval and compliance with the Thai Clinical Trial Registry.",
          textarea: true,
        },
        {
          id: "literature_review",
          label: "Literature Review",
          hint: "Systematic literature review covering the subject device and equivalent/similar devices. Document the search strategy (databases, keywords, date range), inclusion/exclusion criteria, appraisal methodology, and a synthesis of clinical evidence. Thai FDA may request Thai-language clinical experience data for devices used in the local population.",
          textarea: true,
        },
      ],
    },
    {
      id: "risk_management",
      title: "Risk Management",
      description:
        "Risk management process and documentation per ISO 14971 demonstrating systematic identification and control of device-related risks.",
      fields: [
        {
          id: "risk_management_file",
          label: "Risk Management File",
          hint: "Complete risk management file per ISO 14971:2019 including risk management plan, hazard identification, risk estimation and evaluation, risk control measures, verification of effectiveness, overall residual risk evaluation, and risk management report. Must address risks throughout the product lifecycle.",
          textarea: true,
        },
        {
          id: "risk_analysis",
          label: "Risk Analysis Summary",
          hint: "Summary of the risk analysis including identified hazards, hazardous situations, severity and probability estimates, initial and residual risk levels, and applied risk control measures. Present the risk assessment matrix and highlight any risks requiring clinical evidence for benefit-risk justification.",
          textarea: true,
        },
        {
          id: "risk_control_verification",
          label: "Risk Control Verification",
          hint: "Evidence that each risk control measure has been implemented and verified for effectiveness. Confirm that no new hazards are introduced by the control measures. Document the benefit-risk analysis for any residual risks in the ALARP (As Low As Reasonably Practicable) region.",
          textarea: true,
        },
      ],
    },
    {
      id: "labelling",
      title: "Labelling",
      description:
        "Device labelling and instructions for use meeting Thai FDA requirements including Thai language obligations.",
      fields: [
        {
          id: "thai_labels",
          label: "Thai Language Labels",
          hint: "Device labels must include Thai language text per Thai FDA requirements. Mandatory label elements in Thai: device name, manufacturer name, lot/serial number, manufacturing date, expiry date (if applicable), storage conditions, and any warnings. Labels must comply with the Ministerial Notification on Medical Device Labelling.",
          textarea: true,
        },
        {
          id: "ifu_thai",
          label: "Instructions for Use (Thai)",
          hint: "Instructions for use must be provided in Thai language for devices sold in Thailand. Cover intended use, directions for use, contraindications, warnings, precautions, maintenance instructions, and disposal. Thai FDA may require the full IFU in Thai or a Thai-language summary depending on device classification.",
          textarea: true,
        },
        {
          id: "packaging",
          label: "Packaging Information",
          hint: "Description and artwork of all packaging levels (primary, secondary, shipping). Packaging labels must include required Thai-language information. For sterile devices, include sterilization method symbols per ISO 15223-1 and sterile barrier system details.",
        },
      ],
    },
    {
      id: "manufacturing",
      title: "Manufacturing",
      description:
        "Manufacturing site information, production process details, and quality control procedures.",
      fields: [
        {
          id: "manufacturing_sites",
          label: "Manufacturing Site(s)",
          hint: "Name, address, and function of each manufacturing facility (fabrication, assembly, sterilization, packaging, final release). Provide site-specific ISO 13485 certificates. For Thai manufacturing sites, include the Thai FDA establishment licence number.",
        },
        {
          id: "process_overview",
          label: "Manufacturing Process Overview",
          hint: "Description of the manufacturing process from raw materials to finished device. Include a process flow diagram, key process parameters, in-process controls, and critical quality attributes. Identify validated special processes (sterilization, welding, sealing).",
          textarea: true,
        },
        {
          id: "quality_control",
          label: "Quality Control & Acceptance Criteria",
          hint: "Summary of quality control testing performed on incoming materials, in-process intermediates, and finished devices. Include acceptance criteria, sampling plans (with AQL where applicable), and test methods. Describe the final release procedure including review and approval responsibilities.",
          textarea: true,
        },
        {
          id: "key_suppliers",
          label: "Key Suppliers & Critical Components",
          hint: "List of key suppliers providing critical raw materials, components, or outsourced services (e.g., sterilization, testing) that directly affect device safety or performance. Include supplier qualification status, approved supplier list procedures, and any second-source arrangements.",
          textarea: true,
        },
        {
          id: "special_processes",
          label: "Special Processes",
          hint: "Identification and validation status of special processes whose output cannot be fully verified by subsequent inspection (e.g., sterilization, welding, sealing, heat treatment, injection moulding). Reference IQ/OQ/PQ validation reports and revalidation criteria.",
          textarea: true,
        },
      ],
    },
    {
      id: "certificates_postmarket",
      title: "Certificates & Post-Market Surveillance",
      description:
        "Regulatory certificates from other jurisdictions and post-market surveillance obligations for the Thai market.",
      fields: [
        {
          id: "free_sale_certificate",
          label: "Certificate of Free Sale",
          hint: "Certificate of Free Sale from the country of manufacture confirming the device is legally marketed. Must be issued or authenticated by the regulatory authority of the exporting country. Thai FDA may require notarised or embassy-legalised certificates for Group 3 devices.",
        },
        {
          id: "iso_certificate",
          label: "ISO 13485 Certificate",
          hint: "Copy of the current ISO 13485:2016 certificate for the manufacturing site. Must be from an accredited certification body with scope covering the registered device types. Include any audit findings or conditions.",
        },
        {
          id: "foreign_approvals",
          label: "Foreign Regulatory Approvals",
          hint: "Summary of regulatory approvals obtained in other countries including approval date, regulatory authority, approval type, and any conditions or restrictions. Disclose any rejections, suspensions, or withdrawals. Thai FDA considers prior approvals from reference authorities (FDA, EU, TGA, PMDA, Health Canada).",
          textarea: true,
        },
        {
          id: "adverse_event_reporting",
          label: "Adverse Event Reporting to Thai FDA",
          hint: "Description of the process for reporting adverse events and product problems to Thai FDA. Serious adverse events (death, life-threatening, hospitalisation) must be reported within 15 days; other reportable events within 30 days. Reference Thai FDA's Notification on Adverse Event Reporting for Medical Devices.",
          textarea: true,
        },
        {
          id: "post_market_surveillance",
          label: "Post-Market Surveillance Plan",
          hint: "Description of the post-market surveillance system for the Thai market including proactive and reactive surveillance activities, complaint handling, trend analysis, periodic safety update reporting, and integration with the manufacturer's global PMS system. The local licence holder must maintain PMS records accessible to Thai FDA during inspections.",
          textarea: true,
        },
        {
          id: "fsca_procedures",
          label: "Field Safety Corrective Action Procedures",
          hint: "Documented procedures for initiating and managing field safety corrective actions (recalls, corrections, safety alerts) in Thailand. Include notification to Thai FDA, communication plan for affected healthcare facilities, recall execution logistics, effectiveness checks, and closure reporting.",
          textarea: true,
        },
      ],
    },
  ],
};

export const TH_FRAMEWORKS: RegulatoryFramework[] = [TH_FDA];
