import type { RegulatoryFramework } from "../types";

const NZ_MEDSAFE: RegulatoryFramework = {
  id: "NZ_MEDSAFE",
  countryCode: "NZ",
  countryName: "New Zealand",
  flag: "🇳🇿",
  authority: "Medsafe (WAND)",
  documentType: "WAND Notification / Consent",
  sections: [
    {
      id: "administrative",
      title: "Administrative Information",
      description:
        "Sponsor identification and device registration details for the WAND (Web Assisted Notification of Devices) database under the Medicines Act 1981 and anticipated Therapeutic Products Act.",
      fields: [
        {
          id: "nzSponsor",
          label: "New Zealand Sponsor",
          hint: "Legal name of the NZ-based sponsor responsible for the device. Under the Medicines Act 1981 and WAND requirements, a NZ sponsor must be a person or company resident or carrying on business in New Zealand. The sponsor is accountable for post-market obligations.",
        },
        {
          id: "wandNotificationNumber",
          label: "WAND Notification Number",
          hint: "Unique notification number assigned by the WAND database upon successful device notification. For new notifications, this is generated upon submission. Reference this number in all correspondence with Medsafe regarding the device.",
        },
        {
          id: "sponsorAddress",
          label: "Sponsor Address",
          hint: "Full New Zealand business address of the sponsor. Must be a physical address in New Zealand. This address is used for Medsafe communications and appears in the WAND database listing.",
        },
        {
          id: "deviceName",
          label: "Device Name",
          hint: "Trade/proprietary name and model designation as notified in WAND. Must match labelling and marketing materials used in New Zealand. Include all model variants covered under this notification.",
        },
        {
          id: "gmdnCode",
          label: "GMDN Code",
          hint: "Global Medical Device Nomenclature code per ISO 15225. WAND uses GMDN for device classification and categorisation. Select the most specific applicable GMDN code aligned with the device's intended purpose.",
        },
        {
          id: "deviceType",
          label: "Device Type",
          hint: "Device type category as defined by WAND classification (e.g., active implantable, active non-implantable, non-active implantable, non-active non-implantable, IVD). This determines the applicable WAND notification pathway and regulatory requirements.",
        },
      ],
    },
    {
      id: "device_description",
      title: "Device Description",
      description:
        "Technical description of the device, covering design characteristics, functional principles, and composition for WAND notification.",
      fields: [
        {
          id: "description",
          label: "Device Description",
          hint: "Complete technical description covering form factor, dimensions, weight, and functional features. Provide sufficient detail for Medsafe to assess the device category and applicable regulatory pathway. Reference applicable GMDN definition.",
          textarea: true,
        },
        {
          id: "intendedPurpose",
          label: "Intended Purpose",
          hint: "Specific medical purpose for which the device is intended, including target condition, clinical context, and user setting. Must be consistent with labelling and IFU. Medsafe assesses intended purpose to confirm correct WAND classification.",
          textarea: true,
        },
        {
          id: "patientPopulation",
          label: "Patient Population",
          hint: "Target patient demographics including age groups, anatomical sites, and clinical conditions. Identify contraindicated populations. Consider New Zealand healthcare context including DHB/Te Whatu Ora settings and Maori and Pacific health equity considerations.",
        },
        {
          id: "principlesOfOperation",
          label: "Principles of Operation",
          hint: "Scientific and engineering principles underlying device function and mechanism of action. Distinguish pharmacological, immunological, metabolic, and physical modes of action. This informs Medsafe's assessment of whether the product falls under medicine or device regulation.",
          textarea: true,
        },
        {
          id: "materials",
          label: "Materials",
          hint: "Materials of construction, particularly patient-contacting materials. Identify biological origin materials, latex, DEHP, CMR substances, and nano-materials. Provide material specifications for critical components.",
          textarea: true,
        },
        {
          id: "components",
          label: "Components",
          hint: "Itemised list of all device components with part numbers and specifications. Identify critical components, sub-assemblies, and OEM parts. Include supplier information for key components.",
          textarea: true,
        },
        {
          id: "software",
          label: "Software",
          hint: "Software identification including version, architecture, safety classification per IEC 62304, and SaMD classification per IMDRF framework. Medsafe follows IMDRF SaMD guidance for software-based devices. Include cybersecurity considerations.",
          textarea: true,
        },
        {
          id: "accessories",
          label: "Accessories",
          hint: "All accessories supplied with or intended for use with the device. Indicate whether each accessory requires separate WAND notification. Cross-reference WAND entries for separately notified accessories.",
        },
        {
          id: "variants",
          label: "Variants",
          hint: "All device variants, sizes, and configurations covered under this WAND notification. Justify grouping under a single notification and delineate differences between variants.",
          textarea: true,
        },
        {
          id: "sterilization",
          label: "Sterilisation",
          hint: "Sterilisation method and sterility assurance level for devices supplied sterile. Reference validated sterilisation process and applicable ISO standards (ISO 11135, 11137, 17665). State if device is supplied non-sterile.",
        },
      ],
    },
    {
      id: "classification",
      title: "Classification",
      description:
        "Device risk classification per WAND classification rules, which are closely aligned with the Australian TGA and GHTF/IMDRF classification frameworks.",
      fields: [
        {
          id: "riskClass",
          label: "Risk Classification",
          hint: "Device risk class per WAND classification: Class I (low risk), Class IIa (low-medium risk), Class IIb (medium-high risk), Class III (high risk), or AIMD. WAND classification rules are aligned with the Australian TG(MD)R 2002 classification system and GHTF Study Group 1 guidelines.",
        },
        {
          id: "classificationJustification",
          label: "Classification Justification",
          hint: "Detailed justification for the assigned risk class, addressing invasiveness, duration of contact, active/non-active status, and dependence of patient life on device. Consider all applicable WAND classification rules and select the highest class if multiple rules apply.",
          textarea: true,
        },
        {
          id: "classificationRuleNumber",
          label: "Applicable Classification Rule Number",
          hint: "The specific WAND classification rule number(s) applied to determine device class. WAND uses rules closely aligned with TGA/GHTF classification framework (Rules 1–14 for non-IVD, Rules 1–7 for IVD). State the implementing rule and sub-rule where applicable.",
        },
      ],
    },
    {
      id: "risk_management",
      title: "Risk Management",
      description:
        "Risk management documentation per ISO 14971, demonstrating systematic hazard identification and risk control for the device.",
      fields: [
        {
          id: "riskManagementProcess",
          label: "Risk Management Process (ISO 14971)",
          hint: "Risk management process per ISO 14971:2019 including risk management plan, scope, risk acceptability criteria, and lifecycle coverage. Medsafe expects ISO 14971-compliant risk management as foundational evidence for device safety.",
          textarea: true,
        },
        {
          id: "riskAnalysis",
          label: "Risk Analysis",
          hint: "Systematic risk analysis including hazard identification, hazardous situations, and risk estimation (severity × probability). Use techniques such as FMEA, FTA, or HAZOP per ISO 14971 Clause 5. Consider the NZ clinical environment and user populations.",
          textarea: true,
        },
        {
          id: "riskControl",
          label: "Risk Control",
          hint: "Risk control measures applied in priority order per ISO 14971 Clause 7: inherent safety by design, protective measures, information for safety. Document implementation, verification of effectiveness, and assessment of residual risk and any new risks from controls.",
          textarea: true,
        },
        {
          id: "residualRisk",
          label: "Residual Risk Evaluation",
          hint: "Individual and overall residual risk evaluation per ISO 14971 Clauses 7.4 and 8. Demonstrate that residual risks are acceptable considering the clinical benefit. Include benefit-risk determination and overall residual risk acceptability statement.",
          textarea: true,
        },
      ],
    },
    {
      id: "testing_validation",
      title: "Testing & Validation",
      description:
        "Verification and validation evidence demonstrating conformity with applicable standards and fitness for intended purpose.",
      fields: [
        {
          id: "applicableStandards",
          label: "Applicable Standards",
          hint: "List of all applicable international standards (ISO, IEC, EN) used to demonstrate safety and performance. Medsafe recognises internationally harmonised standards. Include standard number, edition, and scope of application to the device.",
          textarea: true,
        },
        {
          id: "performanceTesting",
          label: "Performance Testing",
          hint: "Design verification testing demonstrating the device meets performance specifications. Include test protocols, acceptance criteria, results, and pass/fail determination. Testing should be conducted per applicable product-specific standards.",
          textarea: true,
        },
        {
          id: "biocompatibility",
          label: "Biocompatibility (ISO 10993)",
          hint: "Biological evaluation per ISO 10993-1 risk-based approach. Include biological endpoint matrix based on device contact nature and duration, test rationale, and results for applicable endpoints. Required for all patient-contacting devices.",
          textarea: true,
        },
        {
          id: "electricalSafety",
          label: "Electrical Safety",
          hint: "Electrical safety testing per IEC 60601-1 and applicable collateral and particular standards for active devices. Include test reports from an accredited laboratory. Address NZ-specific electrical supply characteristics (230V/50Hz) where relevant.",
          textarea: true,
        },
        {
          id: "softwareValidation",
          label: "Software Validation",
          hint: "Software lifecycle evidence per IEC 62304 including development plan, requirements specification, architecture, verification testing, and validation. For SaMD, include clinical validation per IMDRF SaMD clinical evaluation guidance.",
          textarea: true,
        },
        {
          id: "sterilizationValidation",
          label: "Sterilisation Validation",
          hint: "Sterilisation process validation per applicable ISO standards (ISO 11135, 11137, 17665). Include bioburden data, SAL demonstration, and process characterisation. Required for all devices labelled as sterile.",
        },
        {
          id: "shelfLife",
          label: "Shelf Life Studies",
          hint: "Real-time and/or accelerated ageing studies per ASTM F1980 demonstrating device performance and packaging integrity over the claimed shelf life. Include protocol, acceptance criteria, and results.",
        },
        {
          id: "packagingValidation",
          label: "Packaging Validation",
          hint: "Sterile barrier system and packaging validation per ISO 11607-1/-2. Include seal integrity, microbial barrier, and simulated transport testing. Address packaging material compatibility and ageing.",
        },
      ],
    },
    {
      id: "clinical_evidence",
      title: "Clinical Evidence",
      description:
        "Clinical evidence supporting the device's safety and performance, per Medsafe requirements and international clinical evaluation standards.",
      fields: [
        {
          id: "clinicalEvaluationReport",
          label: "Clinical Evaluation Report",
          hint: "Clinical evaluation report per MEDDEV 2.7/1 Rev 4 or equivalent methodology. Must critically evaluate all available clinical data, demonstrate acceptable benefit-risk, and conclude on clinical safety and performance. Medsafe may request CERs for higher-risk devices.",
          textarea: true,
        },
        {
          id: "clinicalData",
          label: "Clinical Data",
          hint: "Summary of clinical data supporting device safety and performance, including clinical investigation results, published literature, and clinical experience data. Include data from NZ/Australian clinical trials registered on ANZCTR if applicable.",
          textarea: true,
        },
        {
          id: "literatureReview",
          label: "Literature Review",
          hint: "Systematic literature review including search strategy, databases searched, inclusion/exclusion criteria, and analysis of identified publications. Must be comprehensive and reproducible per MEDDEV 2.7/1 Rev 4 methodology.",
          textarea: true,
        },
        {
          id: "pmcfPlan",
          label: "Post-Market Clinical Follow-Up Plan",
          hint: "PMCF plan defining ongoing clinical data collection strategy post-market. Include PMCF study protocols, registry participation, literature surveillance, and CER update schedule. Aligned with MEDDEV 2.12/2 Rev 2.",
          textarea: true,
        },
        {
          id: "equivalentDeviceComparison",
          label: "Equivalent Device Comparison",
          hint: "Equivalence justification addressing clinical, technical, and biological equivalence to a comparator device per MEDDEV 2.7/1 Rev 4. Medsafe expects robust equivalence demonstration with access to comparator device data for higher-risk classifications.",
          textarea: true,
        },
      ],
    },
    {
      id: "post_market",
      title: "Post-Market Surveillance",
      description:
        "Post-market surveillance and vigilance obligations for medical devices marketed in New Zealand.",
      fields: [
        {
          id: "adverseEventReporting",
          label: "Adverse Event Reporting to Medsafe",
          hint: "Mandatory adverse event and incident reporting to Medsafe Centre for Adverse Reactions Monitoring (CARM). Sponsors must report serious adverse events and near-misses. Use Medsafe's online adverse event reporting form. Report within timeframes specified by Medsafe guidance.",
        },
        {
          id: "recallProcedures",
          label: "Recall Procedures",
          hint: "Product recall and corrective action procedures per Medsafe recall guidance. Include recall classification, notification to Medsafe, communication plan to affected healthcare facilities and DHBs/Te Whatu Ora, distribution trace-back, and effectiveness checks.",
          textarea: true,
        },
        {
          id: "complaintHandling",
          label: "Complaint Handling",
          hint: "Complaint handling system per ISO 13485 Clause 8.2.2. Include complaint receipt, investigation, trending, and regulatory reporting procedures. Complaints from NZ users must be assessed for adverse event reporting obligations to Medsafe.",
          textarea: true,
        },
        {
          id: "vigilance",
          label: "Vigilance System",
          hint: "Vigilance procedures for detecting, assessing, and reporting incidents and field safety corrective actions. Medsafe participates in IMDRF NCAR exchange. Include procedures for issuing field safety notices to NZ healthcare professionals.",
          textarea: true,
        },
        {
          id: "trendAnalysis",
          label: "Trend Analysis",
          hint: "Systematic trend analysis of complaints, adverse events, and performance data per ISO 13485 Clause 8.2.3. Monitor for statistically significant trends that may indicate emerging safety signals. Report identified trends to Medsafe.",
          textarea: true,
        },
      ],
    },
    {
      id: "labelling",
      title: "Labelling & IFU",
      description:
        "Labelling requirements for medical devices marketed in New Zealand, aligned with international labelling standards.",
      fields: [
        {
          id: "nzLabellingRequirements",
          label: "NZ Labelling Requirements",
          hint: "Device labels must comply with NZ regulatory requirements and include manufacturer name, device name, lot/serial number, expiry date, storage conditions, sterile status, and single-use indication. Labels must be in English for the NZ market.",
        },
        {
          id: "ifu",
          label: "Instructions for Use (IFU)",
          hint: "Instructions for use including intended purpose, user instructions, contraindications, warnings, precautions, and performance data. Must be in English and include NZ sponsor contact details. Follow ISO 15223-1 symbols and IEC 62366 usability principles.",
          textarea: true,
        },
        {
          id: "packaging",
          label: "Packaging Labelling",
          hint: "Outer and inner packaging labelling including device identification, quantity, sterile indicators, storage conditions, and transport precautions. Must include NZ sponsor name and address for traceability.",
        },
        {
          id: "nzSponsorAddress",
          label: "NZ Sponsor Address on Labelling",
          hint: "NZ sponsor's name and address must appear on the device labelling or IFU. This is a regulatory requirement ensuring a responsible NZ-based entity is identifiable for all marketed devices.",
        },
      ],
    },
    {
      id: "quality_certificates",
      title: "Quality System & Certificates",
      description:
        "Quality management system evidence and regulatory certificates supporting the WAND notification.",
      fields: [
        {
          id: "iso13485",
          label: "ISO 13485 Certificate",
          hint: "Current ISO 13485:2016 certificate from an accredited certification body. Certificate scope must cover the relevant device types. Medsafe accepts ISO 13485 as primary QMS evidence for medical device manufacturers.",
        },
        {
          id: "conformityAssessmentEvidence",
          label: "Conformity Assessment Evidence",
          hint: "Evidence of conformity assessment appropriate to the device risk class. For Class I: manufacturer self-declaration. For Class IIa and above: third-party conformity assessment evidence from a recognised body. Medsafe accepts multiple conformity assessment pathways.",
          textarea: true,
        },
        {
          id: "euCertificate",
          label: "EC/EU Certificate (if applicable)",
          hint: "Valid EC certificate (MDD 93/42/EEC) or EU certificate (MDR 2017/745) from a Notified Body. Medsafe recognises EU conformity assessment as part of the evidence base for WAND notification, particularly for higher-risk devices.",
        },
        {
          id: "freeSaleCertificate",
          label: "Certificate of Free Sale",
          hint: "Certificate of Free Sale from the country of manufacture or another reference regulatory authority. Demonstrates lawful marketing in another jurisdiction. Medsafe may request this as supporting evidence for WAND notification.",
        },
        {
          id: "tgaCertificateAcceptance",
          label: "TGA Certificate / ARTG Listing Acceptance",
          hint: "Evidence of TGA ARTG inclusion for the device, if applicable. Given the close alignment between NZ and Australian regulatory frameworks, Medsafe may accept TGA conformity assessment evidence and ARTG listing as supporting documentation for WAND notification.",
        },
        {
          id: "mdsap",
          label: "MDSAP Audit Report",
          hint: "Medical Device Single Audit Program (MDSAP) audit report, if available. While NZ is not currently an MDSAP participating authority, Medsafe may accept MDSAP reports as supplementary QMS evidence alongside ISO 13485 certification.",
        },
      ],
    },
  ],
};

export const NZ_FRAMEWORKS: RegulatoryFramework[] = [NZ_MEDSAFE];
