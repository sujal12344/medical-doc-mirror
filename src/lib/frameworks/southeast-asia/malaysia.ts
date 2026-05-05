import type { RegulatoryFramework } from "../types";

const MY_MDA: RegulatoryFramework = {
  id: "MY_MDA",
  countryCode: "MY",
  countryName: "Malaysia",
  flag: "🇲🇾",
  authority: "MDA",
  documentType: "Medical Device Registration",
  sections: [
    {
      id: "administrative",
      title: "Administrative Information",
      description:
        "Applicant identification, establishment licence details, and device classification under the Medical Device Act 2012 (Act 737) and Medical Device Regulations 2012.",
      fields: [
        {
          id: "applicant_name",
          label: "Applicant Name",
          hint: "Legal name of the Malaysian entity applying for device registration. The applicant must hold a valid Establishment Licence issued by the Medical Device Authority (MDA) under the Medical Device Act 2012. For imported devices, the importer or authorised representative must hold the establishment licence.",
        },
        {
          id: "establishment_licence",
          label: "Establishment Licence Number",
          hint: "MDA Establishment Licence number authorising the applicant to manufacture, import, or distribute medical devices in Malaysia. The licence is issued per Part III of the Medical Device Act 2012 and must be valid at the time of application. Provide licence number, class, and expiry date.",
        },
        {
          id: "authorised_representative",
          label: "Authorised Representative",
          hint: "For foreign manufacturers: details of the Malaysian authorised representative (AR) appointed under the Medical Device Regulations 2012. The AR must be a person residing in Malaysia or a company incorporated in Malaysia, responsible for liaising with MDA on behalf of the manufacturer.",
        },
        {
          id: "device_name",
          label: "Device Name",
          hint: "Proprietary or trade name of the medical device as it will appear on the Malaysian Medical Device Register. Must match the labelling and be consistent with the name used in international regulatory submissions.",
        },
        {
          id: "risk_classification",
          label: "MDA Risk Classification",
          hint: "Classification under MDA's four-tier system per the First Schedule of the Medical Device Regulations 2012: Class A (low risk), Class B (low-moderate risk), Class C (moderate-high risk), or Class D (high risk). Classification follows GHTF/IMDRF classification rules adapted to Malaysian regulation. Self-classification by the manufacturer subject to MDA verification.",
        },
        {
          id: "gmdn_code",
          label: "GMDN Code & Descriptor",
          hint: "Global Medical Device Nomenclature (GMDN) code and preferred term that best describes the device. MDA uses GMDN for device categorisation and for verifying classification consistency across the Malaysian Medical Device Register.",
        },
      ],
    },
    {
      id: "device_description",
      title: "Device Description",
      description:
        "Technical description of the device including design, intended use, materials, and all variants covered by the registration.",
      fields: [
        {
          id: "device_description_text",
          label: "Device Description",
          hint: "Detailed narrative description of the medical device covering physical characteristics, design features, dimensions, weight, operating principles, and technological basis. Include annotated photographs, technical drawings, and system block diagrams for complex devices.",
          textarea: true,
        },
        {
          id: "intended_use",
          label: "Intended Use / Purpose",
          hint: "Clear statement of the device's intended medical purpose including target medical condition, patient population, anatomical site, clinical setting, and whether the device is for professional or lay use. The intended use determines the applicable classification rule and must align with all labelling and promotional materials.",
          textarea: true,
        },
        {
          id: "materials",
          label: "Materials of Construction",
          hint: "Comprehensive list of materials used in the device, with emphasis on patient-contacting materials. Provide material grade, specification (MS, ISO, ASTM standards), and biocompatibility status. Disclose the presence of natural rubber latex, DEHP, phthalates, or other materials of concern per MDA guidance.",
        },
        {
          id: "components",
          label: "Components & Sub-assemblies",
          hint: "Itemised bill of materials listing all components, sub-assemblies, and their functions. For systems, provide a block diagram. Identify separately registered components and any third-party OEM components. Include part numbers and version identifiers.",
          textarea: true,
        },
        {
          id: "software",
          label: "Software Description",
          hint: "For devices incorporating software or standalone SaMD: software version, intended functions, IEC 62304 safety classification (Class A/B/C), level of concern, operating system/platform, user interface description, cybersecurity measures, and any AI/ML components. MDA follows IMDRF SaMD guidance for classification.",
          textarea: true,
        },
        {
          id: "accessories",
          label: "Accessories",
          hint: "List of all accessories, consumables, and ancillary equipment required for or compatible with the device. Indicate whether each accessory is included in this registration or separately registered with MDA. Provide compatibility specifications.",
        },
        {
          id: "variants",
          label: "Device Variants & Models",
          hint: "All models, sizes, configurations, and variants included in this registration. Provide a comparison matrix showing differences across variants. All variants must share the same intended purpose and fundamental scientific technology. Significant differences may require separate registrations.",
          textarea: true,
        },
      ],
    },
    {
      id: "quality_system",
      title: "Quality Management System",
      description:
        "QMS evidence including ISO 13485 certification, MDSAP recognition, and MDA conformity assessment audit results.",
      fields: [
        {
          id: "iso_13485_certificate",
          label: "ISO 13485 Certificate",
          hint: "Current ISO 13485:2016 certificate issued by a certification body accredited by an IAF MLA signatory or recognised by MDA. The scope must cover the medical device types included in the registration application. MDA may require the certificate to be issued by a Malaysian-accredited (DSM) or MDSAP-recognised body.",
        },
        {
          id: "mdsap_certificate",
          label: "MDSAP Certificate (if applicable)",
          hint: "Medical Device Single Audit Program certificate, if held. MDA is an MDSAP affiliate member and may accept MDSAP audit reports as evidence of QMS compliance in lieu of separate MDA audit. Provide MDSAP certificate, audit report, and status of any non-conformities.",
        },
        {
          id: "mda_qms_audit",
          label: "MDA QMS Conformity Assessment",
          hint: "Results of MDA's conformity assessment audit (CAB audit) of the manufacturer's quality management system. For Class C and Class D devices, MDA may conduct or require a third-party QMS audit. Include audit report, findings, corrective actions taken, and current compliance status.",
          textarea: true,
        },
      ],
    },
    {
      id: "testing",
      title: "Testing & Performance",
      description:
        "Product testing evidence including Malaysian Standards (MS/IEC), biocompatibility, performance verification, and safety testing.",
      fields: [
        {
          id: "ms_iec_standards",
          label: "Malaysian/IEC Standards Compliance",
          hint: "List of applicable Malaysian Standards (MS) and IEC/ISO standards. Malaysia adopts IEC standards as MS (e.g., MS IEC 60601-1 for electrical medical equipment). Include standard number, edition, title, and compliance status. Testing by DSM-accredited (SAMM) or ISO 17025 accredited laboratories preferred.",
          textarea: true,
        },
        {
          id: "biocompatibility",
          label: "Biocompatibility Evaluation",
          hint: "Biological evaluation per ISO 10993-1 with endpoints determined by body contact category and duration. Include material characterisation, biological evaluation plan, and test reports for applicable endpoints (cytotoxicity, sensitisation, irritation, systemic toxicity, genotoxicity, implantation, haemocompatibility). Reports from ISO 17025 accredited laboratories.",
          textarea: true,
        },
        {
          id: "performance_testing",
          label: "Performance & Design Verification Testing",
          hint: "Summaries of design verification and validation tests demonstrating the device meets its specifications and intended use. Include test protocols, acceptance criteria, sample sizes (statistically justified), results, and pass/fail determinations. For IVDs, provide analytical performance (sensitivity, specificity, precision, accuracy, linearity) and clinical performance data.",
          textarea: true,
        },
        {
          id: "electrical_safety",
          label: "Electrical Safety Testing",
          hint: "Test reports per MS IEC 60601-1 (or IEC 60601-1) and applicable particular standards for electrically powered devices. Cover leakage currents, dielectric strength, protective earthing, mechanical strength, temperature limits, and fire hazards. Reports from SAMM-accredited or ILAC MRA-recognised laboratories.",
          textarea: true,
        },
        {
          id: "emc_testing",
          label: "EMC Testing",
          hint: "Electromagnetic compatibility test reports per MS IEC 60601-1-2 or IEC 60601-1-2 covering emissions (radiated, conducted) and immunity (ESD, radiated RF, conducted RF, surges, voltage dips). State the intended electromagnetic environment and essential performance maintained during immunity testing.",
          textarea: true,
        },
        {
          id: "sterilization_validation",
          label: "Sterilization Validation",
          hint: "Sterilization validation reports per applicable ISO standards (ISO 11135, ISO 11137, ISO 17665) for sterile devices. Include bioburden determination (ISO 11737-1), sterilization process definition, validation runs, SAL 10⁻⁶ demonstration, and routine monitoring parameters.",
          textarea: true,
        },
        {
          id: "stability_testing",
          label: "Stability & Shelf Life",
          hint: "Real-time and/or accelerated ageing study data supporting the claimed shelf life. Consider tropical climate conditions relevant to Malaysia (30°C/75% RH as baseline per ASEAN stability guidelines). Include package integrity testing for sterile devices and degradation analysis.",
          textarea: true,
        },
        {
          id: "packaging_validation",
          label: "Packaging Validation",
          hint: "Packaging system validation per ISO 11607 for sterile medical devices. Include seal strength, peel testing, distribution simulation (ASTM D4169/ISTA), and package integrity testing. For non-sterile devices, demonstrate packaging adequately protects the device during transport and storage in tropical conditions.",
          textarea: true,
        },
        {
          id: "software_verification",
          label: "Software Verification & Validation",
          hint: "For software-containing devices: software lifecycle documentation per IEC 62304 including requirements specification, architecture design, verification testing (unit, integration, system), traceability matrix, known anomaly list with risk assessment, and cybersecurity validation. For SaMD, include clinical performance validation evidence.",
          textarea: true,
        },
      ],
    },
    {
      id: "clinical_evidence",
      title: "Clinical Evidence",
      description:
        "Clinical evaluation and supporting clinical data demonstrating the device's clinical safety and performance.",
      fields: [
        {
          id: "clinical_evaluation",
          label: "Clinical Evaluation Report",
          hint: "Systematic clinical evaluation per MEDDEV 2.7/1 Rev 4 or IMDRF guidance. Required for Class C and Class D devices, recommended for Class B. The report must critically appraise all available clinical data and conclude on clinical safety, performance, and the benefit-risk profile. Include PMCF plan if applicable.",
          textarea: true,
        },
        {
          id: "clinical_data",
          label: "Clinical Investigation Data",
          hint: "Clinical study reports or summaries if clinical investigations were conducted. Investigations in Malaysia require approval from the Medical Research Ethics Committee (MREC) and must comply with Malaysian Guidelines for Good Clinical Practice (GCP). Include study design, endpoints, demographics, results, and adverse events.",
          textarea: true,
        },
        {
          id: "literature_review",
          label: "Literature Review",
          hint: "Systematic literature search and review following a defined protocol. Document databases searched, keywords, date ranges, inclusion/exclusion criteria, and data extraction methodology. Provide a critical appraisal of the identified publications and synthesis of clinical evidence.",
          textarea: true,
        },
      ],
    },
    {
      id: "risk_management",
      title: "Risk Management",
      description:
        "Risk management documentation per ISO 14971 and supporting risk analysis techniques including FMEA.",
      fields: [
        {
          id: "risk_management_file",
          label: "Risk Management File (ISO 14971)",
          hint: "Complete risk management file per ISO 14971:2019 including risk management plan, systematic hazard identification, risk estimation and evaluation, risk control measures, verification of effectiveness, evaluation of overall residual risk, and production/post-production risk management activities.",
          textarea: true,
        },
        {
          id: "fmea",
          label: "Failure Mode and Effects Analysis (FMEA)",
          hint: "Design FMEA and/or process FMEA documenting potential failure modes, their effects, severity, occurrence probability, detectability, and Risk Priority Numbers (RPNs). Include recommended actions for high-RPN items and verification of corrective action effectiveness. Use as input to the ISO 14971 risk management process.",
          textarea: true,
        },
        {
          id: "residual_risk",
          label: "Residual Risk & Benefit-Risk Evaluation",
          hint: "Assessment of individual and overall residual risk after all controls are applied. For risks in the ALARP zone, provide a documented benefit-risk analysis. Conclude with a risk management report confirming the overall residual risk is acceptable per the criteria defined in the risk management plan.",
          textarea: true,
        },
      ],
    },
    {
      id: "labelling",
      title: "Labelling",
      description:
        "Device labelling and instructions for use meeting MDA requirements including Malay and English language obligations.",
      fields: [
        {
          id: "device_labels",
          label: "Device Labels",
          hint: "Artwork or specimens of all device labels. Labels must include: device name, manufacturer name and address, batch/lot or serial number, manufacturing date, expiry date (if applicable), storage conditions, 'STERILE' marking with method symbol (if applicable), and any warnings. MDA requires labels in Bahasa Malaysia and/or English.",
          textarea: true,
        },
        {
          id: "ifu",
          label: "Instructions for Use (IFU)",
          hint: "Complete IFU in Bahasa Malaysia and English. Must include: intended purpose, indications, contraindications, warnings and precautions, directions for use, cleaning/disinfection/sterilization instructions (if reusable), maintenance, troubleshooting, and manufacturer contact information. Compliance with usability principles per IEC 62366.",
          textarea: true,
        },
        {
          id: "packaging_labels",
          label: "Packaging Labels",
          hint: "Outer packaging and shipping container labelling. Must include MDA registration number (once assigned), importer/AR details for imported devices, storage condition symbols per ISO 15223-1, and handling instructions. Bilingual (Bahasa Malaysia and English) where required by MDA.",
        },
      ],
    },
    {
      id: "manufacturing",
      title: "Manufacturing",
      description:
        "Manufacturing site details, process description, quality control, and special process validation.",
      fields: [
        {
          id: "manufacturing_sites",
          label: "Manufacturing Site(s)",
          hint: "Name, address, and role of each manufacturing facility involved in the production of the device. Provide site-specific ISO 13485 certificates. For Malaysian manufacturing sites, include the MDA establishment licence number. Identify contract manufacturers and the scope of contracted work.",
        },
        {
          id: "manufacturing_process",
          label: "Manufacturing Process Overview",
          hint: "Description of the manufacturing process from raw materials to finished product including key manufacturing steps, critical process parameters, in-process controls, and process flow diagram. Identify special processes and their validation status.",
          textarea: true,
        },
        {
          id: "quality_control",
          label: "Quality Control & Testing",
          hint: "Summary of incoming material inspection, in-process testing, and finished product testing procedures. Include acceptance criteria, sampling plans (AQL-based where applicable), test methods, and equipment. Describe the release procedure and role of the person responsible for release.",
          textarea: true,
        },
        {
          id: "special_processes",
          label: "Special Processes Validation",
          hint: "Identification and validation status of special processes whose output cannot be fully verified by subsequent inspection (e.g., sterilization, welding, sealing, coating, injection moulding). Reference IQ/OQ/PQ validation protocols and reports. Include revalidation criteria and schedule.",
          textarea: true,
        },
      ],
    },
    {
      id: "certificates_postmarket",
      title: "Certificates & Post-Market Surveillance",
      description:
        "Regulatory certificates, conformity assessment evidence, and post-market surveillance obligations for the Malaysian market.",
      fields: [
        {
          id: "free_sale_certificate",
          label: "Certificate of Free Sale",
          hint: "Certificate of Free Sale from the country of manufacture or a reference market, issued by the competent regulatory authority. MDA recognises approvals from reference regulators (US FDA, EU Notified Bodies, TGA, Health Canada, PMDA). The certificate should confirm the device is legally marketed in the issuing country.",
        },
        {
          id: "iso_certificate",
          label: "ISO 13485 Certificate",
          hint: "Copy of the current ISO 13485:2016 certificate for each manufacturing site. Must be issued by an accredited certification body with scope explicitly covering the device types in the registration. Provide certificate number, scope, issue date, and expiry date.",
        },
        {
          id: "conformity_assessment",
          label: "Conformity Assessment Evidence",
          hint: "Summary of conformity assessment procedures applied per the Third Schedule of the Medical Device Regulations 2012. For Class A: declaration of conformity. For Class B: type examination or QMS audit. For Class C/D: type examination and QMS audit. Include all CAB (Conformity Assessment Body) reports and certificates.",
          textarea: true,
        },
        {
          id: "adverse_event_reporting",
          label: "Adverse Event Reporting to MDA",
          hint: "Process for mandatory reporting of adverse events to MDA's National Medical Device Adverse Event Reporting System (MADERS). Serious events (death or serious deterioration in health) must be reported within 10 working days; other reportable events within 30 working days. Include local vigilance contact and escalation procedures.",
          textarea: true,
        },
        {
          id: "recall_procedures",
          label: "Recall & FSCA Procedures",
          hint: "Documented procedures for product recalls and field safety corrective actions in Malaysia. Include recall classification criteria (Class I/II/III), notification to MDA, communication plan to affected healthcare facilities, effectiveness check methodology, and recall completion reporting requirements.",
          textarea: true,
        },
      ],
    },
  ],
};

export const MY_FRAMEWORKS: RegulatoryFramework[] = [MY_MDA];
