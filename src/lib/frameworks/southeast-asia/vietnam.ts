import type { RegulatoryFramework } from "../types";

const VN_MOH: RegulatoryFramework = {
  id: "VN_MOH",
  countryCode: "VN",
  countryName: "Vietnam",
  flag: "🇻🇳",
  authority: "MOH Vietnam",
  documentType: "Medical Device Registration Certificate",
  sections: [
    {
      id: "administrative",
      title: "Administrative Information",
      description:
        "Applicant identification, Vietnam representative details, and device classification under Decree 36/2016/ND-CP on Medical Device Management and Decree 169/2018/ND-CP amendments.",
      fields: [
        {
          id: "applicant_name",
          label: "Applicant Name",
          hint: "Legal name of the entity applying for the registration certificate. For domestic manufacturers, the Vietnamese company holding a manufacturing licence. For imported devices, the Vietnamese legal entity appointed as the registration holder—typically the importer or authorised representative.",
        },
        {
          id: "vietnam_representative",
          label: "Vietnam Authorised Representative",
          hint: "Details of the authorised representative in Vietnam (if applicant is a foreign manufacturer). The representative must be a Vietnamese legal entity with a valid business registration certificate and must be authorised in writing by the foreign manufacturer. Provide company name, address, business registration number, and contact details.",
        },
        {
          id: "registration_number",
          label: "Registration Number",
          hint: "For existing registrations, provide the current registration certificate number. For new applications, this will be assigned by MOH's Department of Medical Equipment and Health Works upon approval. Format varies by device class (e.g., classification-based numbering per Decree 36).",
        },
        {
          id: "device_name_vietnamese",
          label: "Device Name (Vietnamese)",
          hint: "Device name in Vietnamese as it will appear on the registration certificate and product labelling. Must accurately describe the device and follow MOH naming conventions. Vietnamese translation should be certified or prepared by the authorised representative.",
        },
        {
          id: "risk_classification",
          label: "Risk Classification (Decree 36)",
          hint: "Classification per Decree 36/2016/ND-CP: Class A (low risk—notification/self-declaration), Class B (moderate risk—registration dossier review), Class C (moderate-high risk—full evaluation), or Class D (high risk—full evaluation with enhanced scrutiny). Classification follows ASEAN AMDD rules as adopted in Vietnamese regulation.",
        },
      ],
    },
    {
      id: "device_description",
      title: "Device Description",
      description:
        "Technical description of the device including design characteristics, intended use, specifications, and material composition.",
      fields: [
        {
          id: "device_description_text",
          label: "Device Description",
          hint: "Comprehensive description of the device covering physical characteristics, dimensions, weight, design features, and operating principles. Include photographs, technical drawings, and diagrams. MOH may require a Vietnamese-language summary for the registration dossier.",
          textarea: true,
        },
        {
          id: "intended_use",
          label: "Intended Use",
          hint: "Clear statement of the device's intended medical purpose: target disease/condition, patient population, anatomical site, clinical setting, and user profile (healthcare professional or lay user). Must be consistent with labelling and classification. Vietnamese regulation requires the intended use to be specified in the registration dossier.",
          textarea: true,
        },
        {
          id: "specifications",
          label: "Technical Specifications",
          hint: "Detailed technical specifications including performance parameters, operating ranges, accuracy, precision, power requirements, and environmental operating conditions. Consider Vietnam's tropical climate conditions for storage and operating temperature/humidity ranges.",
          textarea: true,
        },
        {
          id: "materials",
          label: "Materials of Construction",
          hint: "List of all materials used in the device, particularly patient-contacting materials. Include material grades, specifications (referencing TCVN, ISO, or ASTM standards), and biocompatibility status. Disclose materials of concern (latex, DEHP, phthalates, heavy metals).",
        },
        {
          id: "components",
          label: "Components & Sub-assemblies",
          hint: "Complete list of device components, sub-assemblies, consumables, and their functions. For complex systems, provide a block diagram showing component relationships. Identify components that may require separate registration in Vietnam.",
          textarea: true,
        },
        {
          id: "software",
          label: "Software Description",
          hint: "For devices with embedded software or standalone SaMD: software version, intended functions, IEC 62304 safety classification, operating platform, cybersecurity measures, and user interface description. Vietnam follows ASEAN AMDD guidance for SaMD classification.",
          textarea: true,
        },
        {
          id: "accessories",
          label: "Accessories & Ancillary Devices",
          hint: "List of all accessories, consumables, and ancillary equipment required for or compatible with the device. Indicate which accessories are covered under this registration and which require separate registration with MOH Vietnam.",
        },
        {
          id: "variants",
          label: "Device Variants & Configurations",
          hint: "All models, sizes, and configurations included in this registration certificate application. Provide a comparison table showing differences. Variants must share the same intended use and fundamental technology per Vietnamese grouping principles.",
          textarea: true,
        },
      ],
    },
    {
      id: "quality_system",
      title: "Quality Management System",
      description:
        "QMS evidence including ISO 13485 certification, Vietnamese GMP compliance, and facility licensing.",
      fields: [
        {
          id: "iso_13485_certificate",
          label: "ISO 13485 Certificate",
          hint: "Current ISO 13485:2016 certificate issued by an accredited certification body (BoA-accredited or IAF MLA signatory). Certificate scope must cover the device types in the registration application. Required for Class B, C, and D devices per Decree 36.",
        },
        {
          id: "vietnamese_gmp",
          label: "Vietnamese GMP Compliance",
          hint: "For domestic manufacturers: evidence of compliance with Vietnamese GMP requirements as specified by MOH. GMP inspections are conducted by the Department of Medical Equipment and Health Works. For foreign manufacturers, the ISO 13485 certificate from the manufacturing site is accepted as GMP evidence.",
          textarea: true,
        },
        {
          id: "facility_licence",
          label: "Facility Licence / Business Registration",
          hint: "For Vietnamese manufacturers: the manufacturing facility licence or business registration certificate authorising medical device production. For importers: the import business registration and any specific medical device trading licences required under Decree 36. Provide licence/certificate number and validity period.",
        },
      ],
    },
    {
      id: "testing",
      title: "Testing & Performance",
      description:
        "Product testing evidence including TCVN standards compliance, biocompatibility, and performance verification.",
      fields: [
        {
          id: "tcvn_standards",
          label: "TCVN Standards Compliance",
          hint: "List applicable Vietnamese National Standards (Tiêu chuẩn Việt Nam—TCVN) and demonstrate compliance. Vietnam adopts IEC/ISO standards as TCVN (e.g., TCVN 7303-1 corresponding to IEC 60601-1). Include standard number, title, and compliance status. Testing by BoA-accredited or ISO 17025 accredited laboratories.",
          textarea: true,
        },
        {
          id: "biocompatibility",
          label: "Biocompatibility Testing",
          hint: "Biological evaluation per ISO 10993-1 with appropriate endpoints based on body contact type and duration. Include material characterisation, biological evaluation plan, and test reports. Reports from ISO 17025 accredited laboratories recognised internationally. For Class C/D devices, comprehensive biocompatibility data is expected.",
          textarea: true,
        },
        {
          id: "performance_testing",
          label: "Performance Testing",
          hint: "Design verification and validation reports demonstrating the device meets its specifications and intended use. Include test protocols, acceptance criteria, sample sizes, results, and conclusions. For IVDs: analytical performance (sensitivity, specificity, precision, linearity) and clinical evaluation data.",
          textarea: true,
        },
        {
          id: "electrical_safety",
          label: "Electrical Safety Testing",
          hint: "For electrically powered devices: test reports per IEC 60601-1 (or TCVN equivalent) and applicable particular standards. Cover leakage currents, dielectric strength, earthing continuity, mechanical safety, and temperature limits. Vietnam's electrical supply (220V/50Hz) should be considered in safety testing.",
          textarea: true,
        },
        {
          id: "sterilization_validation",
          label: "Sterilization Validation",
          hint: "For sterile devices: sterilization validation per applicable ISO standards (11135, 11137, 17665). Include bioburden determination, process definition, validation runs, SAL 10⁻⁶ demonstration, and routine monitoring parameters. Include environmental monitoring data for aseptic processing if applicable.",
          textarea: true,
        },
        {
          id: "stability_testing",
          label: "Stability & Shelf Life",
          hint: "Accelerated and/or real-time ageing studies supporting the claimed shelf life. Consider Vietnam's tropical climate conditions (Zone IVb: 30°C/75% RH) for stability testing. Include package integrity testing for sterile devices and functional performance after ageing.",
          textarea: true,
        },
        {
          id: "emc_testing",
          label: "EMC Testing",
          hint: "Electromagnetic compatibility test reports per IEC 60601-1-2 or TCVN equivalent covering emissions (radiated and conducted) and immunity (ESD, radiated RF, conducted RF, voltage dips). Specify the intended electromagnetic environment and essential performance claims.",
          textarea: true,
        },
        {
          id: "packaging_validation",
          label: "Packaging Validation",
          hint: "Packaging system validation per ISO 11607 for sterile devices including seal strength, distribution simulation (ASTM D4169/ISTA), and integrity testing. Consider Vietnam's diverse logistics infrastructure for distribution simulation conditions.",
          textarea: true,
        },
      ],
    },
    {
      id: "clinical_evidence",
      title: "Clinical Evidence",
      description:
        "Clinical evaluation and data supporting the device's clinical safety and performance.",
      fields: [
        {
          id: "clinical_evaluation",
          label: "Clinical Evaluation Report",
          hint: "Systematic clinical evaluation per MEDDEV 2.7/1 or IMDRF guidance. Required for Class C and Class D devices per Decree 36. The report must critically appraise clinical data from literature, investigations, and post-market experience, and demonstrate an acceptable benefit-risk profile.",
          textarea: true,
        },
        {
          id: "clinical_data",
          label: "Clinical Investigation Data",
          hint: "Clinical study reports if investigations were conducted. Clinical trials in Vietnam require approval from the Ethics Committee and MOH, and must comply with Vietnamese regulations on clinical trials of medical devices (Circular 44/2014/TT-BYT or its amendments). Include study design, endpoints, patient demographics, results, and adverse events.",
          textarea: true,
        },
        {
          id: "literature_review",
          label: "Literature Review",
          hint: "Systematic literature review with documented search strategy, databases queried, search terms, date ranges, inclusion/exclusion criteria, and critical appraisal of identified publications. Synthesise clinical evidence supporting the device's safety and performance claims.",
          textarea: true,
        },
      ],
    },
    {
      id: "risk_management",
      title: "Risk Management",
      description:
        "Risk management documentation per ISO 14971 demonstrating systematic hazard identification and risk control throughout the device lifecycle.",
      fields: [
        {
          id: "risk_management_file",
          label: "Risk Management File",
          hint: "Complete risk management file per ISO 14971:2019 including risk management plan, hazard identification, risk estimation and evaluation, risk control measures, verification of control effectiveness, overall residual risk evaluation, and risk management report.",
          textarea: true,
        },
        {
          id: "risk_analysis_summary",
          label: "Risk Analysis Summary",
          hint: "Summary of identified hazards, hazardous situations, severity and probability estimates, risk levels before and after controls, and applied risk control measures. Include risk acceptability matrix and document benefit-risk analyses for any residual risks in the ALARP region.",
          textarea: true,
        },
      ],
    },
    {
      id: "labelling",
      title: "Labelling",
      description:
        "Device labelling and instructions for use meeting Vietnamese regulatory requirements.",
      fields: [
        {
          id: "vietnamese_labels",
          label: "Vietnamese Language Labels",
          hint: "Device labels must include Vietnamese language text per Decree 36 and Circular 30/2015/TT-BYT on medical device labelling. Mandatory elements in Vietnamese: device name, manufacturer, country of origin, lot/batch number, manufacturing date, expiry date (if applicable), storage conditions, and 'Thiết bị y tế' (medical device) marking.",
          textarea: true,
        },
        {
          id: "ifu",
          label: "Instructions for Use (IFU)",
          hint: "Instructions for use in Vietnamese. Must include: intended use, directions for use, contraindications, warnings, precautions, maintenance instructions, cleaning/disinfection/sterilization (if reusable), disposal guidance, and manufacturer contact information. For devices intended for lay use, the IFU must use language accessible to non-professional users.",
          textarea: true,
        },
        {
          id: "packaging",
          label: "Packaging Information",
          hint: "Description and artwork of all packaging levels. Outer packaging must include Vietnamese-language labelling, importer/representative details, registration number (once assigned), storage condition symbols per ISO 15223-1, and handling instructions appropriate for tropical climate transport and storage conditions.",
        },
      ],
    },
    {
      id: "manufacturing",
      title: "Manufacturing",
      description:
        "Manufacturing site information, process details, and quality control procedures.",
      fields: [
        {
          id: "manufacturing_sites",
          label: "Manufacturing Site(s)",
          hint: "Name, address, and role of each manufacturing facility (fabrication, assembly, sterilization, final release). Provide site-specific ISO 13485 certificates. For Vietnamese manufacturing sites, include the MOH facility licence number. Identify contract manufacturers and their scope.",
        },
        {
          id: "manufacturing_process",
          label: "Manufacturing Process Overview",
          hint: "Description of the manufacturing process from raw materials to finished product including process flow diagram, key steps, critical process parameters, in-process controls, and special process validations. Identify any outsourced manufacturing steps.",
          textarea: true,
        },
        {
          id: "quality_control",
          label: "Quality Control Procedures",
          hint: "Summary of incoming inspection, in-process testing, and finished product testing procedures. Include acceptance criteria, sampling plans, test methods, and the final release procedure. Describe the role and authority of the quality control personnel.",
          textarea: true,
        },
      ],
    },
    {
      id: "certificates_postmarket",
      title: "Certificates & Post-Market Surveillance",
      description:
        "Regulatory certificates from other jurisdictions and post-market surveillance obligations for the Vietnamese market.",
      fields: [
        {
          id: "free_sale_certificate",
          label: "Certificate of Free Sale",
          hint: "Certificate of Free Sale from the country of manufacture, consularised by the Vietnamese Embassy or apostilled. The certificate must confirm the device is legally manufactured and freely marketed in the country of origin. MOH requires consular legalisation for registration dossiers of Class B, C, and D devices.",
        },
        {
          id: "iso_certificate",
          label: "ISO 13485 Certificate",
          hint: "Copy of the current ISO 13485:2016 certificate for each manufacturing site. Must be issued by an accredited certification body with scope covering the device types in the registration. Consularised copies may be required for Class C and D submissions.",
        },
        {
          id: "foreign_approvals",
          label: "Foreign Regulatory Approvals",
          hint: "Summary of regulatory approvals obtained in other countries, including approval date, authority, type of approval, and any conditions or restrictions. MOH considers prior approvals from reference regulators (US FDA, EU, TGA, PMDA, Health Canada). Disclose any rejections, suspensions, or safety-related actions in any jurisdiction.",
          textarea: true,
        },
        {
          id: "post_market_surveillance",
          label: "Post-Market Surveillance Plan",
          hint: "Description of the post-market surveillance system for Vietnam including complaint handling, adverse event monitoring, trend analysis, and periodic safety reporting. The Vietnamese representative/importer must maintain a local PMS system and cooperate with MOH inspections and information requests.",
          textarea: true,
        },
        {
          id: "adverse_event_reporting",
          label: "Adverse Event Reporting to MOH",
          hint: "Process for mandatory adverse event reporting to MOH per Decree 36 and implementing circulars. Serious incidents (death, serious health deterioration, public health threat) must be reported within prescribed timelines. Include local vigilance contact, reporting form/system, and escalation procedure for field safety corrective actions.",
          textarea: true,
        },
      ],
    },
  ],
};

export const VN_FRAMEWORKS: RegulatoryFramework[] = [VN_MOH];
