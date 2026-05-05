import type { RegulatoryFramework } from "../types";

const ID_KEMENKES: RegulatoryFramework = {
  id: "ID_KEMENKES",
  countryCode: "ID",
  countryName: "Indonesia",
  flag: "🇮🇩",
  authority: "Kemenkes",
  documentType: "Medical Device Registration (AKL/AKD)",
  sections: [
    {
      id: "administrative",
      title: "Administrative Information",
      description:
        "Applicant identification, Indonesian distributor details, and device classification under Permenkes No. 62/2017 on Medical Device Marketing Authorisation.",
      fields: [
        {
          id: "applicant_name",
          label: "Applicant Name",
          hint: "Legal name of the applicant company. For domestic devices, the manufacturer holding a valid IPAK (Izin Produksi Alat Kesehatan). For imported devices, the Indonesian legal entity holding an import licence (Izin Penyalur Alat Kesehatan/IPAK Penyalur) who will serve as the marketing authorisation holder.",
        },
        {
          id: "indonesian_distributor",
          label: "Indonesian Distributor",
          hint: "Name and address of the appointed Indonesian distributor or import licence holder (penyalur alat kesehatan). Foreign manufacturers must have a contractual agreement with a licensed Indonesian distributor who assumes post-market responsibilities. Provide IPAK licence number.",
        },
        {
          id: "device_name_bahasa",
          label: "Device Name (Bahasa Indonesia)",
          hint: "Device name translated into Bahasa Indonesia as it will appear on the AKL/AKD certificate and product labelling for the Indonesian market. Must accurately represent the device function and type.",
        },
        {
          id: "ipak_holder",
          label: "IPAK Holder Details",
          hint: "Details of the Izin Produksi Alat Kesehatan (IPAK) holder: licence number, validity period, authorised scope of manufacturing or distribution. The IPAK must be current and issued by the Directorate General of Pharmaceutical and Medical Devices (Ditjen Farmalkes).",
        },
        {
          id: "risk_classification",
          label: "Risk Classification",
          hint: "Indonesian risk classification per Permenkes No. 62/2017: Kelas A (risiko rendah/low risk—AKL registration), Kelas B (risiko rendah-sedang/low-moderate—AKL), Kelas C (risiko sedang-tinggi/moderate-high—AKD with full pre-market evaluation), or Kelas D (risiko tinggi/high risk—AKD). Classification follows ASEAN AMDD/GHTF rules adapted to Indonesian regulation.",
        },
        {
          id: "device_name_english",
          label: "Device Name (English)",
          hint: "International device name in English as used in the manufacturer's global regulatory submissions and technical documentation. Must correspond to the Bahasa Indonesia name and be consistent with the labelling.",
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
          hint: "Comprehensive device description covering physical characteristics, dimensions, weight, design principles, and functional mechanisms. Include photographs, technical drawings, and schematic diagrams. Kemenkes may require description in both Bahasa Indonesia and English.",
          textarea: true,
        },
        {
          id: "intended_use",
          label: "Intended Use",
          hint: "Clear statement of the medical purpose, target patient population, clinical conditions addressed, anatomical site, and clinical setting. Must be consistent with the approved labelling and any promotional claims. Indonesian regulation requires intended use to align with the registered device classification.",
          textarea: true,
        },
        {
          id: "specifications",
          label: "Technical Specifications",
          hint: "Detailed performance specifications including operating parameters, accuracy, precision, measurement ranges, power requirements, environmental operating conditions (temperature, humidity), and critical dimensions. Present in tabular format with units per SI or Indonesian standard practice.",
          textarea: true,
        },
        {
          id: "materials",
          label: "Materials of Construction",
          hint: "Complete listing of materials in the device, particularly those with patient or user contact. Include material grades, specifications (referencing SNI, ISO, ASTM, or JIS standards), and biocompatibility status. For devices containing natural rubber latex, DEHP, or other materials of concern, specific disclosure is required.",
        },
        {
          id: "components",
          label: "Components & Sub-assemblies",
          hint: "Itemised list of all device components, sub-assemblies, and their functions. For multi-component systems, provide a system diagram showing interconnections. Identify components that are separately registered in Indonesia.",
          textarea: true,
        },
        {
          id: "software",
          label: "Software Description",
          hint: "For software-containing devices or SaMD: software version, intended functions, operating system requirements, IEC 62304 safety classification, user interface description, and data output formats. Include cybersecurity risk assessment and software architecture overview.",
          textarea: true,
        },
        {
          id: "accessories",
          label: "Accessories & Ancillary Devices",
          hint: "List of all accessories, consumables, and ancillary equipment supplied with or required for the device. Indicate which accessories are covered under this registration and which require separate AKL/AKD registration. Provide compatibility specifications and part numbers.",
        },
        {
          id: "variants",
          label: "Device Variants & Configurations",
          hint: "All models, sizes, and configurations included in this registration. Provide a comparison table of differences across variants. Variants must share the same intended use and fundamental technology to be grouped under a single AKL/AKD registration.",
          textarea: true,
        },
        {
          id: "sterilization",
          label: "Sterilization Method",
          hint: "If supplied sterile, specify the method (EtO, gamma, e-beam, steam) and SAL 10⁻⁶. Reference the applicable validation standard. If non-sterile, describe any user reprocessing or sterilization requirements and provide validated reprocessing instructions.",
        },
      ],
    },
    {
      id: "quality_system",
      title: "Quality Management System",
      description:
        "QMS evidence including ISO 13485 certification, CDAKB certificate, and Indonesian GMP compliance.",
      fields: [
        {
          id: "iso_13485_certificate",
          label: "ISO 13485 Certificate",
          hint: "Current ISO 13485:2016 certificate issued by an accredited certification body (KAN-accredited for domestic manufacturers, or IAF MLA signatory for foreign manufacturers). Certificate scope must cover the device types included in the AKL/AKD application.",
        },
        {
          id: "cdakb_certificate",
          label: "CDAKB Certificate",
          hint: "Cara Distribusi Alat Kesehatan yang Baik (CDAKB—Good Distribution Practice for Medical Devices) certificate issued by Kemenkes. Required for distributors/importers. Demonstrates compliance with Indonesian GDP requirements for storage, handling, transport, and traceability of medical devices.",
        },
        {
          id: "indonesian_gmp",
          label: "Indonesian GMP (CPAKB) Compliance",
          hint: "For domestic manufacturers: Cara Pembuatan Alat Kesehatan yang Baik (CPAKB—Good Manufacturing Practice for Medical Devices) certificate issued by Kemenkes following facility inspection. CPAKB requirements are based on ISO 13485 adapted to Indonesian regulatory context. For imported devices, ISO 13485 certification of the foreign manufacturing site is accepted.",
          textarea: true,
        },
      ],
    },
    {
      id: "testing",
      title: "Testing & Performance",
      description:
        "Product testing evidence including SNI standard compliance, biocompatibility, performance verification, and safety testing.",
      fields: [
        {
          id: "sni_standards",
          label: "SNI Standards Compliance",
          hint: "List applicable Standar Nasional Indonesia (SNI) standards and demonstrate compliance. Certain medical device categories require mandatory SNI certification (e.g., SNI IEC 60601-1 for electrical medical equipment). Include SNI certificate numbers where mandatory certification applies. Testing by BSN-accredited laboratories (KAN-accredited) is required.",
          textarea: true,
        },
        {
          id: "biocompatibility",
          label: "Biocompatibility Testing",
          hint: "Biological evaluation per ISO 10993-1 with appropriate testing endpoints based on device contact type and duration. Test reports must be from ISO 17025 accredited laboratories recognised by KAN or equivalent international accreditation bodies. Include material characterisation data and biological evaluation plan.",
          textarea: true,
        },
        {
          id: "performance_testing",
          label: "Performance Testing",
          hint: "Design verification and validation reports demonstrating the device meets its performance claims and specifications. Include protocols, acceptance criteria, sample sizes with statistical justification, test results, and conclusions. For IVD devices, analytical performance (sensitivity, specificity, CV%, linearity) and clinical performance data.",
          textarea: true,
        },
        {
          id: "electrical_safety",
          label: "Electrical Safety Testing",
          hint: "For electrically powered devices: test reports per IEC 60601-1 (or SNI equivalent) covering leakage currents, dielectric strength, earthing continuity, mechanical safety, and temperature limits. Testing must be performed by KAN-accredited or ILAC MRA-recognised laboratories. Include applicable particular standards (IEC 60601-2-xx).",
          textarea: true,
        },
        {
          id: "sterilization_validation",
          label: "Sterilization Validation",
          hint: "For sterile devices: complete sterilization validation per applicable ISO standards (11135 for EtO, 11137 for radiation, 17665 for moist heat). Include bioburden determination per ISO 11737-1, SAL 10⁻⁶ demonstration, routine monitoring parameters, and revalidation schedule.",
          textarea: true,
        },
        {
          id: "stability_testing",
          label: "Stability & Shelf Life Testing",
          hint: "Accelerated and/or real-time ageing data supporting the claimed shelf life. Include test conditions (temperature, humidity per tropical climate considerations relevant to Indonesia), sampling plan, acceptance criteria, tested parameters, and results. Sterile barrier integrity must be maintained throughout the shelf life.",
          textarea: true,
        },
        {
          id: "emc_testing",
          label: "Electromagnetic Compatibility (EMC)",
          hint: "EMC test reports per IEC 60601-1-2 or SNI equivalent covering emissions and immunity testing. Specify the intended electromagnetic environment, essential performance claims maintained during immunity testing, and any deviations from the standard with justification.",
          textarea: true,
        },
        {
          id: "packaging_validation",
          label: "Packaging Validation",
          hint: "Packaging validation per ISO 11607 for sterile devices. Include seal integrity, distribution simulation per ASTM D4169 or ISTA protocols (considering Indonesian archipelago logistics including maritime and air transport conditions), and accelerated ageing of the sterile barrier system.",
          textarea: true,
        },
      ],
    },
    {
      id: "clinical_evidence",
      title: "Clinical Evidence",
      description:
        "Clinical evaluation demonstrating the device's safety and effectiveness for the intended patient population.",
      fields: [
        {
          id: "clinical_evaluation",
          label: "Clinical Evaluation Report",
          hint: "Systematic clinical evaluation of the device's clinical safety and performance. Required for Kelas C and Kelas D (AKD) devices. The report must follow MEDDEV 2.7/1 or equivalent methodology, critically appraising all available clinical data and reaching conclusions on the benefit-risk balance.",
          textarea: true,
        },
        {
          id: "clinical_data",
          label: "Clinical Investigation Data",
          hint: "Clinical study reports or summaries if clinical investigations were conducted. Clinical investigations in Indonesia require approval from the Health Research Ethics Committee (KEPK) and registration with the Indonesian Clinical Trial Registry. Include study design, endpoints, demographics, results, adverse events, and statistical analysis.",
          textarea: true,
        },
        {
          id: "literature_review",
          label: "Literature Review",
          hint: "Systematic literature review covering the subject device and equivalent devices. Document search strategy, databases, keywords, date range, inclusion/exclusion criteria, and evidence synthesis. Include any published clinical experience from the Indonesian or Southeast Asian patient population where available.",
          textarea: true,
        },
      ],
    },
    {
      id: "risk_management",
      title: "Risk Management",
      description:
        "Risk management documentation per ISO 14971 covering the complete device lifecycle.",
      fields: [
        {
          id: "risk_management_file",
          label: "Risk Management File",
          hint: "Complete risk management file per ISO 14971:2019 including the risk management plan, hazard identification and analysis, risk evaluation against acceptability criteria, risk control measures, verification of control effectiveness, overall residual risk assessment, and risk management report.",
          textarea: true,
        },
        {
          id: "risk_analysis_summary",
          label: "Risk Analysis Summary",
          hint: "Summary table of identified hazards, hazardous situations, estimated severity and probability, risk levels (before and after controls), and applied risk control measures. Include the risk acceptability matrix and highlight any risks requiring benefit-risk justification through clinical evidence.",
          textarea: true,
        },
        {
          id: "risk_control_verification",
          label: "Risk Control Verification",
          hint: "Evidence that each risk control measure has been implemented and verified for effectiveness. Document the verification method (inspection, test, analysis), results, and confirmation that no new hazards are introduced. Include the overall residual risk evaluation and benefit-risk determination.",
          textarea: true,
        },
      ],
    },
    {
      id: "labelling",
      title: "Labelling",
      description:
        "Device labelling requirements including Bahasa Indonesia obligations and SNI marking per Indonesian regulations.",
      fields: [
        {
          id: "bahasa_labels",
          label: "Bahasa Indonesia Labels",
          hint: "Device labels must include Bahasa Indonesia text per Permenkes labelling requirements. Mandatory elements: device name in Bahasa, manufacturer name and country of origin, distributor/IPAK holder name and address, lot/serial number, manufacturing date, expiry date (if applicable), storage conditions, and 'Alat Kesehatan' marking.",
          textarea: true,
        },
        {
          id: "ifu",
          label: "Instructions for Use",
          hint: "Instructions for use provided in Bahasa Indonesia. Must include intended use, directions for use, contraindications, warnings, precautions, troubleshooting, maintenance, cleaning/disinfection instructions, and disposal guidance. For professional-use-only devices, this must be clearly stated.",
          textarea: true,
        },
        {
          id: "packaging",
          label: "Packaging & Outer Labels",
          hint: "Artwork or specimens of all packaging levels. Outer packaging must include Bahasa Indonesia text, AKL/AKD number (once assigned), distributor information, and import/domestic origin marking. Include storage condition symbols per ISO 15223-1.",
        },
        {
          id: "sni_marking",
          label: "SNI Marking",
          hint: "For devices subject to mandatory SNI certification: the SNI mark must be affixed to the product and/or packaging per BSN (Badan Standardisasi Nasional) requirements. Include the SNI number, certification body logo, and any additional markings required by the applicable SNI standard.",
        },
      ],
    },
    {
      id: "manufacturing",
      title: "Manufacturing",
      description:
        "Manufacturing facility details, process description, and quality control procedures.",
      fields: [
        {
          id: "manufacturing_sites",
          label: "Manufacturing Site(s)",
          hint: "Name, address, and role of each manufacturing site (fabrication, assembly, sterilization, final packaging/release). Provide site-specific ISO 13485 certificates and/or CPAKB certificates for domestic sites. Include any contract manufacturer details and scope of contracted activities.",
        },
        {
          id: "manufacturing_process",
          label: "Manufacturing Process Description",
          hint: "Overview of the manufacturing process from incoming raw materials to finished device release. Include process flow diagram, key manufacturing steps, critical process parameters, in-process controls, and validated special processes. Identify any processes outsourced to contract manufacturers.",
          textarea: true,
        },
        {
          id: "quality_control",
          label: "Quality Control Procedures",
          hint: "Summary of incoming inspection, in-process testing, and final product testing procedures. Include acceptance criteria, sampling plans, test methods, and equipment used. Describe the batch/lot release procedure and the role of the qualified person responsible for release.",
          textarea: true,
        },
      ],
    },
    {
      id: "certificates_postmarket",
      title: "Certificates & Post-Market Surveillance",
      description:
        "Regulatory certificates, AKL/AKD registration details, and post-market surveillance obligations for the Indonesian market.",
      fields: [
        {
          id: "free_sale_certificate",
          label: "Certificate of Free Sale",
          hint: "Certificate of Free Sale from the country of manufacture, legalised by the Indonesian Embassy or Consulate in the country of origin. The certificate must confirm the device is freely marketed and manufactured under GMP in the exporting country. Kemenkes requires legalisation for AKD applications.",
        },
        {
          id: "iso_certificate",
          label: "ISO 13485 Certificate",
          hint: "Copy of the manufacturing site's current ISO 13485:2016 certificate. For domestic manufacturers, KAN-accredited certification body preferred. Certificate must clearly state the scope covering the registered medical device types.",
        },
        {
          id: "akl_akd_number",
          label: "AKL/AKD Registration Number",
          hint: "For existing registrations: the AKL (Alat Kesehatan Luar/In-vitro Diagnostics or low-risk devices) or AKD (Alat Kesehatan Dalam—higher-risk devices requiring pre-market evaluation) registration number. For new applications, this will be assigned upon approval. Format: AKL/AKD XXXXXXXXXX.",
        },
        {
          id: "post_market_surveillance",
          label: "Post-Market Surveillance Plan",
          hint: "Description of the post-market surveillance system for the Indonesian market, including complaint handling, trend analysis, periodic safety update reports, and proactive monitoring activities. The Indonesian distributor (IPAK holder) must maintain a local PMS system and cooperate with Kemenkes inspections.",
          textarea: true,
        },
        {
          id: "adverse_event_reporting",
          label: "Adverse Event Reporting",
          hint: "Process for reporting adverse events and field safety corrective actions to Kemenkes/BPOM. Serious adverse events (death, serious injury, or significant public health threat) must be reported within the timelines prescribed by Indonesian regulation. Include the local vigilance contact person and reporting workflow.",
          textarea: true,
        },
      ],
    },
  ],
};

export const ID_FRAMEWORKS: RegulatoryFramework[] = [ID_KEMENKES];
