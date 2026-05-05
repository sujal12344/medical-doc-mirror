import type { RegulatoryFramework } from "../types";

const PH_FDA: RegulatoryFramework = {
  id: "PH_FDA",
  countryCode: "PH",
  countryName: "Philippines",
  flag: "🇵🇭",
  authority: "FDA Philippines",
  documentType: "Certificate of Product Registration (CPR)",
  sections: [
    {
      id: "administrative",
      title: "Administrative Information",
      description:
        "Applicant identification, LTO details, and device classification under the FDA Philippines' Administrative Order on Medical Devices and Republic Act No. 9711 (FDA Act of 2009).",
      fields: [
        {
          id: "applicant_name",
          label: "Applicant Name",
          hint: "Legal name of the Philippine entity applying for the Certificate of Product Registration (CPR). The applicant must hold a valid Licence to Operate (LTO) from FDA Philippines authorising the manufacture, import, distribution, or retail of medical devices.",
        },
        {
          id: "lto_holder",
          label: "LTO Holder Details",
          hint: "Licence to Operate (LTO) number, type (manufacturer, importer, distributor, retailer), and validity period. The LTO must be current and issued by FDA Philippines under RA 9711. For imported devices, the Philippine importer's LTO is required.",
        },
        {
          id: "fda_registration_number",
          label: "FDA Registration Number",
          hint: "For existing registrations, provide the CPR number or Notification reference number. For new applications, this will be assigned upon approval. FDA Philippines assigns unique registration numbers per the medical device registration system.",
        },
        {
          id: "device_name",
          label: "Device Name",
          hint: "Proprietary or trade name of the medical device as it will appear on the CPR. Must match the name on the device labelling and be consistent with the manufacturer's international product naming.",
        },
        {
          id: "risk_classification",
          label: "Risk Classification",
          hint: "FDA Philippines risk classification: Class A (low risk—notification), Class B (low-moderate risk—abbreviated registration), Class C (moderate-high risk—full registration), or Class D (high risk—full registration with enhanced review). Classification per ASEAN AMDD Medical Device Directive classification rules.",
        },
      ],
    },
    {
      id: "device_description",
      title: "Device Description",
      description:
        "Technical description of the device's design, intended use, specifications, and component details.",
      fields: [
        {
          id: "device_description_text",
          label: "Device Description",
          hint: "Comprehensive description of the medical device including physical design, dimensions, weight, operating mechanism, technological basis, and key features. Include annotated photographs, technical drawings, and schematic diagrams. Describe how the device differs from predicate or similar devices on the Philippine market.",
          textarea: true,
        },
        {
          id: "intended_use",
          label: "Intended Use",
          hint: "Statement of the device's intended medical purpose: target condition/disease, patient population (including age, weight ranges if relevant), anatomical site, clinical setting (hospital, clinic, home), and user profile (healthcare professional, lay user). Must align with the classification and labelling claims.",
          textarea: true,
        },
        {
          id: "specifications",
          label: "Technical Specifications",
          hint: "Detailed technical specifications: performance parameters, operating ranges, measurement accuracy/precision, power requirements, environmental conditions (temperature, humidity—consider tropical Philippine climate), dimensions, and weight. Present in tabular format.",
          textarea: true,
        },
        {
          id: "materials",
          label: "Materials of Construction",
          hint: "List of all materials used in device construction with emphasis on patient-contacting materials. Include material grade, reference standard (PNS, ISO, ASTM), and biocompatibility classification. Disclose natural rubber latex, DEHP, or other materials of concern.",
        },
        {
          id: "components",
          label: "Components & Sub-assemblies",
          hint: "Complete list of device components, sub-assemblies, and accessories with their functions. Provide a system block diagram for complex multi-component devices. Indicate components requiring separate registration with FDA Philippines.",
          textarea: true,
        },
        {
          id: "software",
          label: "Software Description",
          hint: "For software-containing devices or SaMD: software version, functions, IEC 62304 safety classification, operating platform, user interface, cybersecurity measures, and any AI/ML algorithms. FDA Philippines follows ASEAN AMDD guidance for software classification and SaMD.",
          textarea: true,
        },
        {
          id: "accessories",
          label: "Accessories & Ancillary Devices",
          hint: "List of all accessories, consumables, and ancillary equipment required for or compatible with the device. Indicate whether each accessory is included in this CPR or requires a separate registration with FDA Philippines.",
        },
        {
          id: "variants",
          label: "Device Variants & Models",
          hint: "All models, sizes, and configurations included in this CPR application. Provide a comparison matrix of differences. Variants must share the same intended use and fundamental technology. Significant differences may require separate CPR applications.",
          textarea: true,
        },
      ],
    },
    {
      id: "quality_system",
      title: "Quality Management System",
      description:
        "QMS evidence including ISO 13485 certification and Philippine GMP requirements.",
      fields: [
        {
          id: "iso_13485_certificate",
          label: "ISO 13485 Certificate",
          hint: "Current ISO 13485:2016 certificate issued by an accredited certification body (PAB-accredited or IAF MLA signatory). The scope must cover the device types in the CPR application. Required for Class C and Class D devices; recommended for Class B.",
        },
        {
          id: "philippine_gmp",
          label: "Philippine GMP Compliance",
          hint: "For domestic manufacturers: Certificate of Compliance with Philippine GMP for Medical Devices, issued by FDA Philippines following facility inspection. Based on ASEAN AMDD GMP requirements aligned with ISO 13485. For imported devices, the manufacturer's ISO 13485 certificate is accepted as GMP evidence.",
          textarea: true,
        },
        {
          id: "qms_documentation",
          label: "QMS Documentation Summary",
          hint: "High-level summary of the quality management system including quality policy, design controls, production controls, purchasing, CAPA procedures, complaint handling, and document control. FDA Philippines may request specific QMS procedures for Class C/D device evaluations.",
          textarea: true,
        },
      ],
    },
    {
      id: "testing_performance",
      title: "Testing & Performance",
      description:
        "Product testing evidence including PNS standards compliance, biocompatibility, and performance verification.",
      fields: [
        {
          id: "pns_standards",
          label: "Philippine National Standards (PNS)",
          hint: "List applicable Philippine National Standards (PNS) adopted from IEC/ISO standards (e.g., PNS IEC 60601-1 for electrical medical equipment). Include standard number, title, and compliance status. Testing by PAB-accredited or ISO 17025 accredited laboratories. FDA Philippines may require mandatory PNS certification for specific device categories.",
          textarea: true,
        },
        {
          id: "biocompatibility",
          label: "Biocompatibility Testing",
          hint: "Biological evaluation per ISO 10993-1 with endpoints appropriate to the device's body contact type and duration. Include material characterisation, biological evaluation plan, and test reports from ISO 17025 accredited laboratories. For implantable devices, a comprehensive battery of biocompatibility tests is expected.",
          textarea: true,
        },
        {
          id: "performance_testing",
          label: "Performance & Design Verification",
          hint: "Design verification and validation test reports demonstrating the device meets performance specifications. Include protocols, acceptance criteria, sample sizes with statistical rationale, test results, and conclusions. For IVDs: analytical performance (sensitivity, specificity, precision, linearity) and clinical performance data.",
          textarea: true,
        },
        {
          id: "electrical_safety",
          label: "Electrical Safety Testing",
          hint: "For electrically powered devices: test reports per IEC 60601-1 and applicable particular standards covering leakage currents, dielectric strength, earthing, mechanical strength, and temperature limits. Reports from accredited test laboratories.",
          textarea: true,
        },
        {
          id: "sterilization_validation",
          label: "Sterilization Validation",
          hint: "For sterile devices: sterilization validation per applicable ISO standards (11135, 11137, 17665). Include bioburden data, process definition, validation runs, SAL 10⁻⁶ demonstration, and routine monitoring procedures.",
          textarea: true,
        },
        {
          id: "stability_testing",
          label: "Stability & Shelf Life",
          hint: "Accelerated and/or real-time ageing studies supporting the claimed shelf life. Consider tropical climate conditions (30°C/75% RH per ASEAN Zone IVb). Include package integrity testing for sterile devices and functional performance verification after ageing.",
          textarea: true,
        },
        {
          id: "emc_testing",
          label: "EMC Testing",
          hint: "Electromagnetic compatibility test reports per IEC 60601-1-2 covering emissions and immunity. Specify the intended electromagnetic environment (professional healthcare facility, home use) and essential performance maintained during immunity testing.",
          textarea: true,
        },
        {
          id: "packaging_validation",
          label: "Packaging Validation",
          hint: "Packaging system validation per ISO 11607 for sterile devices. Include seal integrity testing, distribution simulation (ASTM D4169/ISTA protocols considering Philippine island-to-island logistics), and accelerated ageing of the sterile barrier system.",
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
          hint: "Complete risk management file per ISO 14971:2019 including risk management plan, hazard identification, risk estimation and evaluation, risk control measures, verification of control effectiveness, overall residual risk evaluation, and risk management report. Must cover the entire product lifecycle.",
          textarea: true,
        },
        {
          id: "risk_analysis_summary",
          label: "Risk Analysis Summary",
          hint: "Summary of identified hazards, hazardous situations, severity and probability estimates, risk levels before and after controls, and applied risk control measures. Include the risk acceptability matrix and document any benefit-risk analyses for residual risks in the ALARP region.",
          textarea: true,
        },
      ],
    },
    {
      id: "clinical_evidence",
      title: "Clinical Evidence",
      description:
        "Clinical evaluation and data supporting the device's safety and clinical performance.",
      fields: [
        {
          id: "clinical_evaluation",
          label: "Clinical Evaluation Report",
          hint: "Systematic clinical evaluation per MEDDEV 2.7/1 or IMDRF guidance. Required for Class C and Class D devices. The report must critically appraise available clinical data from literature, clinical investigations, and post-market experience, and conclude on the device's clinical safety, performance, and benefit-risk profile.",
          textarea: true,
        },
        {
          id: "clinical_data",
          label: "Clinical Investigation Data",
          hint: "Clinical study reports if investigations were conducted. Clinical trials in the Philippines require Single Joint Research Ethics Board (SJREB) or institutional ethics committee approval and must follow Philippine National Ethical Guidelines for Health and Health-Related Research (2017). Include study design, outcomes, adverse events, and analysis.",
          textarea: true,
        },
        {
          id: "literature_review",
          label: "Literature Review",
          hint: "Systematic literature review covering the device and equivalent devices. Document the search protocol (databases, keywords, date range), inclusion/exclusion criteria, critical appraisal methodology, and synthesis of clinical evidence supporting the device's safety and performance claims.",
          textarea: true,
        },
      ],
    },
    {
      id: "labelling",
      title: "Labelling",
      description:
        "Device labelling and instructions for use meeting FDA Philippines requirements including Filipino/English language obligations.",
      fields: [
        {
          id: "device_labels",
          label: "Device Labels",
          hint: "Artwork or specimens of all device labels. Labels must include: device name, manufacturer name and address, lot/serial number, manufacturing date, expiry date (if applicable), storage conditions, sterility marking (if applicable), and applicable warning symbols per ISO 15223-1. FDA Philippines may require labelling in Filipino and/or English.",
          textarea: true,
        },
        {
          id: "ifu",
          label: "Instructions for Use (IFU)",
          hint: "Complete IFU in English and/or Filipino as required by FDA Philippines. Must cover: intended use, indications, contraindications, warnings, precautions, directions for use, maintenance/calibration instructions, cleaning/sterilization (if reusable), disposal, and manufacturer contact details.",
          textarea: true,
        },
        {
          id: "packaging",
          label: "Packaging Information",
          hint: "Description and artwork of all packaging levels (primary, secondary, tertiary). Outer packaging must include FDA Philippines CPR number (once assigned), importer details for imported devices, storage condition symbols, and any required warnings or precautionary statements.",
        },
      ],
    },
    {
      id: "manufacturing",
      title: "Manufacturing",
      description:
        "Manufacturing site details, process overview, and quality control procedures.",
      fields: [
        {
          id: "manufacturing_sites",
          label: "Manufacturing Site(s)",
          hint: "Name, address, and role of each manufacturing facility (fabrication, assembly, sterilization, packaging, final release). Provide site-specific ISO 13485 certificates. For Philippine-based manufacturers, include the FDA Philippines LTO and GMP certificate.",
        },
        {
          id: "manufacturing_process",
          label: "Manufacturing Process Overview",
          hint: "Description of the manufacturing process from raw materials to finished device including process flow diagram, key manufacturing steps, critical process parameters, in-process controls, and special process validations. Identify outsourced processes.",
          textarea: true,
        },
        {
          id: "quality_control",
          label: "Quality Control Procedures",
          hint: "Summary of incoming inspection, in-process testing, and finished product testing. Include acceptance criteria, sampling plans, test methods, and the final product release process. Describe the authority and responsibilities of the quality control function.",
          textarea: true,
        },
      ],
    },
    {
      id: "certificates_postmarket",
      title: "Certificates & Post-Market Surveillance",
      description:
        "Regulatory certificates, CPR details, and post-market surveillance obligations for the Philippine market.",
      fields: [
        {
          id: "free_sale_certificate",
          label: "Certificate of Free Sale",
          hint: "Certificate of Free Sale from the country of manufacture, issued or authenticated by the regulatory authority. FDA Philippines may require consular authentication or apostille. The certificate must confirm the device is legally manufactured and marketed in the country of origin.",
        },
        {
          id: "iso_certificate",
          label: "ISO 13485 Certificate",
          hint: "Copy of the current ISO 13485:2016 certificate for the manufacturing site. Must be from an accredited certification body with scope covering the device types in the registration application.",
        },
        {
          id: "cpr_number",
          label: "CPR Number",
          hint: "Certificate of Product Registration (CPR) number assigned by FDA Philippines upon successful registration. For renewal applications, provide the existing CPR number and expiry date. The CPR is valid for 5 years and must be renewed before expiry.",
        },
        {
          id: "post_market_surveillance",
          label: "Post-Market Surveillance Plan",
          hint: "Description of the post-market surveillance system for the Philippine market including complaint handling, adverse event monitoring, periodic safety update reporting, and proactive surveillance activities. The LTO holder/local importer must maintain a PMS system accessible to FDA Philippines.",
          textarea: true,
        },
        {
          id: "adverse_event_reporting",
          label: "Adverse Event Reporting",
          hint: "Process for mandatory adverse event reporting to FDA Philippines. Serious adverse events (death, life-threatening situation, permanent impairment) must be reported within prescribed timelines per FDA Philippines' adverse event reporting guidelines. Include local vigilance contact and the reporting form/system used.",
          textarea: true,
        },
      ],
    },
  ],
};

export const PH_FRAMEWORKS: RegulatoryFramework[] = [PH_FDA];
