import type { RegulatoryFramework } from "../types";

const US_510K: RegulatoryFramework = {
  id: "US_510K",
  countryCode: "US",
  countryName: "United States",
  flag: "🇺🇸",
  authority: "510(k) Premarket Notification (FDA CDRH)",
  documentType: "510(k) Premarket Notification",
  sections: [
    {
      id: "cover_letter",
      title: "Cover Letter & Transmittal",
      description:
        "Formal cover letter transmitting the 510(k) submission to FDA CDRH, identifying the submission type and requesting clearance.",
      fields: [
        {
          id: "cover_letter_text",
          label: "Cover Letter",
          hint: "Formal letter addressed to the Document Control Center (DCC), CDRH, identifying the device name, applicant, submission type (Traditional, Special, or Abbreviated 510(k)), and requesting FDA clearance under Section 510(k) of the FD&C Act.",
          textarea: true,
        },
        {
          id: "contact_person",
          label: "Contact Person",
          hint: "Name, title, phone, fax, and email of the person FDA should contact regarding this submission. This person must be authorized to communicate on behalf of the applicant.",
        },
        {
          id: "submission_type",
          label: "Submission Type",
          hint: "Specify Traditional 510(k), Special 510(k), or Abbreviated 510(k). Special 510(k) is appropriate for modifications to own legally marketed device; Abbreviated relies on FDA guidance documents or special controls.",
        },
        {
          id: "review_panel",
          label: "FDA Review Panel",
          hint: "The advisory committee review panel responsible for the device type (e.g., Orthopedic, Cardiovascular, General Hospital, Clinical Chemistry). Refer to 21 CFR 862–892 for panel assignments.",
        },
        {
          id: "requested_classification",
          label: "Requested Device Classification",
          hint: "The classification (Class I or Class II) being requested for the device. 510(k) submissions are typically for Class II devices, though some Class I devices with reserved 510(k) requirements also apply.",
        },
      ],
    },
    {
      id: "administrative",
      title: "Administrative Information",
      description:
        "Applicant and device identification details required by 21 CFR 807 Subpart E for FDA administrative processing.",
      fields: [
        {
          id: "applicant_name",
          label: "Applicant / Submitter Name",
          hint: "Legal name of the establishment submitting the 510(k). Must match the name on the FDA Establishment Registration. If using a U.S. Agent for a foreign submitter, provide both the foreign establishment and U.S. Agent names.",
        },
        {
          id: "applicant_address",
          label: "Applicant Address",
          hint: "Complete street address, city, state/province, postal code, and country of the submitting establishment. Must match the FDA Establishment Registration address.",
        },
        {
          id: "establishment_registration",
          label: "Establishment Registration & Listing Numbers",
          hint: "FDA Establishment Registration Number (FEI) and Device Listing Number per 21 CFR 807. Foreign establishments must also provide their U.S. Agent information. If not yet registered, indicate 'pending' with expected registration date.",
        },
        {
          id: "device_trade_name",
          label: "Device Trade / Proprietary Name",
          hint: "The commercial or proprietary name under which the device will be marketed (e.g., 'AccuPulse CO2 Laser System'). This name will appear on the 510(k) clearance letter.",
        },
        {
          id: "common_name",
          label: "Common / Usual Name",
          hint: "The generic or common name for the device type as recognized by FDA (e.g., 'carbon dioxide surgical laser'). Should align with the classification regulation name in 21 CFR.",
        },
        {
          id: "product_code",
          label: "FDA Product Code",
          hint: "Three-letter FDA product code identifying the device type (e.g., 'GEX' for CO2 surgical laser, 'DQO' for powered wheelchair). Look up in the FDA Product Classification Database.",
        },
        {
          id: "regulation_number",
          label: "21 CFR Regulation Number",
          hint: "The specific Code of Federal Regulations citation classifying the device (e.g., '21 CFR 878.4810' for laser surgical instrument). This determines applicable special controls and classification panel.",
        },
      ],
    },
    {
      id: "truthful_accurate",
      title: "Truthful & Accurate Statement",
      description:
        "Mandatory declaration under 21 CFR 807.87(k) that all information submitted is truthful, accurate, and no material fact has been omitted.",
      fields: [
        {
          id: "certification_statement",
          label: "Certification of Truthfulness",
          hint: "Include the following statement verbatim or equivalent: 'I certify that, in my capacity as (title) of (company), I believe to the best of my knowledge, that all data and information submitted in the premarket notification are truthful and accurate and that no material fact has been omitted.' Per 21 CFR 807.87(k).",
          textarea: true,
        },
        {
          id: "authorized_representative",
          label: "Authorized Representative Signature",
          hint: "Printed name, title, and signature of the responsible individual with authority to bind the applicant. This person attests to the completeness and accuracy of the entire 510(k) submission.",
        },
        {
          id: "signature_date",
          label: "Date of Certification",
          hint: "Date the Truthful & Accurate statement was signed. Must be no earlier than the completion date of the submission and before the submission date to FDA.",
        },
      ],
    },
    {
      id: "indications_for_use",
      title: "Indications for Use Statement",
      description:
        "FDA Form 3881 — Indications for Use statement defining the medical conditions, patient populations, and use scenarios for the device.",
      fields: [
        {
          id: "indications_statement",
          label: "Indications for Use (FDA Form 3881)",
          hint: "Complete, concise statement of the specific medical conditions, diseases, or purposes for which the device is intended. Must align with the labelling and be specific enough to define the clinical scope (e.g., 'The XYZ System is indicated for percutaneous transluminal angioplasty of de novo or restenotic lesions in native coronary arteries in patients with symptomatic ischemic heart disease').",
          textarea: true,
        },
        {
          id: "target_population",
          label: "Target Patient Population",
          hint: "Describe the intended patient population including age range, condition severity, and any inclusion/exclusion criteria. Specify if the device is intended for pediatric, adult, or geriatric use, and note any contraindicated populations.",
        },
        {
          id: "use_environment",
          label: "Intended Use Environment",
          hint: "Specify the clinical setting(s) where the device is intended to be used (e.g., hospital operating room, physician's office, clinical laboratory, home use, emergency department). This impacts required testing and labelling.",
        },
        {
          id: "prescription_otc",
          label: "Prescription (Rx) or Over-the-Counter (OTC)",
          hint: "Indicate whether the device is restricted to sale by or on the order of a licensed practitioner (Rx) per 21 CFR 801.109, or available over-the-counter (OTC). This determination affects labelling requirements and user-facing documentation.",
        },
      ],
    },
    {
      id: "device_description",
      title: "Device Description",
      description:
        "Comprehensive technical description of the device per 21 CFR 807.87(e), covering physical characteristics, principles of operation, materials, and components.",
      fields: [
        {
          id: "physical_description",
          label: "Physical Description & Principle of Operation",
          hint: "Detailed narrative describing the device's physical appearance, size, shape, and fundamental operating principle. Include photographs, engineering drawings, or CAD renderings. Explain the scientific/engineering basis of how the device achieves its intended purpose.",
          textarea: true,
        },
        {
          id: "technical_specifications",
          label: "Technical Specifications",
          hint: "Quantitative performance specifications such as power output, frequency, flow rate, accuracy, precision, resolution, measurement range, operating temperature range, and any other critical functional parameters with their tolerances.",
          textarea: true,
        },
        {
          id: "materials_composition",
          label: "Materials of Construction",
          hint: "Complete list of materials in patient-contacting and non-patient-contacting components, including material grades, specifications (e.g., ASTM F138 for surgical stainless steel, ISO 5832-3 for wrought titanium alloy), and any coatings, surface treatments, or drug/biologic components.",
          textarea: true,
        },
        {
          id: "dimensions_weight",
          label: "Dimensions & Weight",
          hint: "Physical dimensions (length, width, height, diameter as applicable) and weight of the device and major subassemblies. Include dimensional tolerances for critical features. Provide both metric and imperial units where appropriate.",
        },
        {
          id: "components_accessories",
          label: "Components, Accessories & Variants",
          hint: "Identify all components, accessories, and model variants included in this submission. For each, specify whether it is reusable or single-use, sold separately or bundled, and whether any accessories have their own 510(k) clearances. Include a system diagram if applicable.",
          textarea: true,
        },
        {
          id: "software_overview",
          label: "Software / Firmware Overview",
          hint: "If the device contains software or firmware: identify the software version, programming language, operating system/platform, and role of software in device function (controls device operation, provides clinical decision support, displays data only, etc.). Reference the full Software Documentation section.",
        },
        {
          id: "energy_source",
          label: "Power Source & Energy Type",
          hint: "Describe the energy source (AC mains, battery, pneumatic, hydraulic, manual) and any energy delivered to the patient (e.g., RF energy, laser energy, electrical stimulation, ultrasound). Include energy parameters, safety cutoffs, and grounding type if electrically powered.",
        },
      ],
    },
    {
      id: "substantial_equivalence",
      title: "Substantial Equivalence Comparison",
      description:
        "Side-by-side comparison with the predicate device demonstrating substantial equivalence per Section 513(i) of the FD&C Act, addressing intended use, technological characteristics, and performance.",
      fields: [
        {
          id: "predicate_device_name",
          label: "Predicate Device Identification",
          hint: "Trade name, manufacturer, and 510(k) number (e.g., K123456) of the primary predicate device. If using multiple predicates (split predicate approach), identify each and justify why a split predicate is appropriate.",
        },
        {
          id: "predicate_510k_number",
          label: "Predicate 510(k) / De Novo Number",
          hint: "The specific 510(k) clearance number (K-number) or De Novo authorization number (DEN-number) of the predicate device. Verify this number in the FDA 510(k) Premarket Notification database.",
        },
        {
          id: "comparison_table",
          label: "Feature-by-Feature Comparison Table",
          hint: "Detailed side-by-side comparison table addressing: intended use, indications for use, device design, materials, energy source, technological features, performance specifications, biocompatibility, sterilization, and labelling. For each feature, indicate whether the subject and predicate are identical, similar, or different, with justification for any differences.",
          textarea: true,
        },
        {
          id: "technological_characteristics",
          label: "Technological Characteristics Comparison",
          hint: "Detailed analysis of whether the subject device has the same technological characteristics as the predicate. If different technological characteristics exist, explain why they do not raise new questions of safety and effectiveness. Address materials, design, energy type, and software differences.",
          textarea: true,
        },
        {
          id: "performance_comparison",
          label: "Performance Data Comparison",
          hint: "Summary of non-clinical and clinical performance data demonstrating that any differences in technological characteristics do not adversely affect safety or effectiveness. Reference specific test results that support equivalence claims.",
          textarea: true,
        },
        {
          id: "new_technology_justification",
          label: "New Technology Justification",
          hint: "If the subject device uses different technological characteristics from the predicate, provide scientific rationale and data demonstrating that these differences do not raise different questions of safety and effectiveness. Include bench, animal, or clinical data as appropriate.",
          textarea: true,
        },
      ],
    },
    {
      id: "standards_testing",
      title: "Standards & Declarations of Conformity",
      description:
        "Identification of recognized consensus standards applied, with declarations of conformity and test report summaries per 21 CFR 807.87(l).",
      fields: [
        {
          id: "consensus_standards",
          label: "Applicable Recognized Consensus Standards",
          hint: "List all FDA-recognized consensus standards applied to the device (e.g., IEC 60601-1:2005+A1+A2, ISO 14971:2019, IEC 62304:2006+A1, ISO 10993-1:2018). Use the FDA Recognized Consensus Standards Database to identify currently recognized editions.",
          textarea: true,
        },
        {
          id: "declarations_of_conformity",
          label: "Declarations of Conformity",
          hint: "For each standard claimed, provide a formal declaration of conformity stating the device conforms to the standard. If using an Abbreviated 510(k), these declarations can substitute for detailed test data. Include the standard number, edition, and any clauses excluded with justification.",
          textarea: true,
        },
        {
          id: "test_reports_summary",
          label: "Summary of Test Reports",
          hint: "Brief summary of test reports supporting each declaration of conformity. Include test laboratory name and accreditation (e.g., NVLAP, A2LA), test dates, and overall pass/fail results. Full test reports should be available upon FDA request.",
          textarea: true,
        },
        {
          id: "standards_deviations",
          label: "Deviations from Standards",
          hint: "Document any clauses or requirements of recognized standards that were not met, with detailed justification for each deviation. Explain alternative approaches used and how they provide equivalent or better assurance of safety and performance.",
          textarea: true,
        },
      ],
    },
    {
      id: "biocompatibility",
      title: "Biocompatibility",
      description:
        "Biological evaluation of device materials per ISO 10993-1 and FDA guidance on biocompatibility testing, based on patient contact nature and duration.",
      fields: [
        {
          id: "biocompat_evaluation_plan",
          label: "Biocompatibility Evaluation Plan",
          hint: "ISO 10993-1 based evaluation plan identifying device categorization by nature of body contact (surface, external communicating, implant) and contact duration (limited <24h, prolonged 24h–30d, permanent >30d). Include a biological endpoint matrix identifying required tests.",
          textarea: true,
        },
        {
          id: "material_characterization",
          label: "Material Characterization",
          hint: "Chemical characterization of all patient-contacting materials per ISO 10993-18, including extractables and leachables analysis, material specifications, and supplier certificates of analysis. Identify any materials with known biocompatibility history.",
          textarea: true,
        },
        {
          id: "cytotoxicity_testing",
          label: "Cytotoxicity Testing",
          hint: "Results of in vitro cytotoxicity testing per ISO 10993-5 (e.g., MEM elution, direct contact, or agar diffusion method). Report cell line used (typically L-929 mouse fibroblasts), extract conditions, and quantitative/qualitative results with reactivity grade.",
        },
        {
          id: "sensitization_testing",
          label: "Sensitization Testing",
          hint: "Results of delayed-type hypersensitivity testing per ISO 10993-10 (e.g., Guinea Pig Maximization Test (GPMT) per Magnusson-Kligman, or murine Local Lymph Node Assay (LLNA)). Report method, number of animals, scoring criteria, and sensitization rate.",
        },
        {
          id: "irritation_testing",
          label: "Irritation / Intracutaneous Reactivity Testing",
          hint: "Results of irritation or intracutaneous reactivity testing per ISO 10993-10 and ISO 10993-23. Report test method (intracutaneous injection in rabbits, or in vitro reconstructed tissue model), extract vehicle, scoring system, and primary irritation index.",
        },
        {
          id: "additional_biocompat",
          label: "Additional Biocompatibility Endpoints",
          hint: "Results of additional biological tests as required by the ISO 10993-1 endpoint matrix: systemic toxicity (ISO 10993-11), genotoxicity (ISO 10993-3), hemocompatibility (ISO 10993-4), implantation (ISO 10993-6), chronic toxicity, or carcinogenicity as applicable to the device contact category.",
          textarea: true,
        },
      ],
    },
    {
      id: "performance_testing",
      title: "Performance Testing",
      description:
        "Non-clinical bench testing, analytical performance studies, and simulated use testing demonstrating the device meets design specifications and performs safely.",
      fields: [
        {
          id: "bench_testing",
          label: "Bench Testing / Mechanical Performance",
          hint: "Summary of bench tests evaluating mechanical performance: tensile/compressive/fatigue strength, durability/wear, dimensional stability, burst pressure, flow rates, leak testing, or other performance characteristics relevant to the device type. Include test methods, sample sizes, acceptance criteria, and results.",
          textarea: true,
        },
        {
          id: "analytical_performance",
          label: "Analytical / Functional Performance",
          hint: "For diagnostic devices: accuracy, precision (repeatability/reproducibility), linearity, analytical sensitivity, analytical specificity, measuring range, and interference/cross-reactivity studies. For therapeutic devices: dose accuracy, output consistency, calibration verification, and stability of critical parameters.",
          textarea: true,
        },
        {
          id: "simulated_use_testing",
          label: "Simulated Use Testing",
          hint: "Testing that simulates clinical use conditions, including anatomical models, cadaveric studies, or bench models replicating worst-case clinical scenarios. Describe the test model, use conditions simulated, endpoints measured, sample size rationale, and results compared to acceptance criteria.",
          textarea: true,
        },
        {
          id: "worst_case_testing",
          label: "Worst-Case Scenario Testing",
          hint: "Identification and testing of worst-case conditions for device performance, including maximum stress, extreme environmental conditions, maximum use cycles, smallest/largest device sizes, and most challenging clinical anatomies. Justify worst-case parameter selection.",
          textarea: true,
        },
        {
          id: "design_verification",
          label: "Design Verification Summary",
          hint: "Summary of design verification activities per 21 CFR 820.30(f), confirming design outputs meet design input requirements through inspection, analysis, or testing. Include a traceability matrix linking design inputs to verification test results.",
          textarea: true,
        },
        {
          id: "design_validation",
          label: "Design Validation Summary",
          hint: "Summary of design validation per 21 CFR 820.30(g), demonstrating the device conforms to defined user needs and intended uses. Include clinical simulations, usability studies (IEC 62366-1), and any clinical data confirming the device performs as intended in its target use environment.",
          textarea: true,
        },
      ],
    },
    {
      id: "sterilization_shelf_life",
      title: "Sterilization & Shelf Life",
      description:
        "Sterilization validation, sterility assurance, packaging integrity, and shelf life determination for devices provided sterile or with limited shelf life.",
      fields: [
        {
          id: "sterilization_method",
          label: "Sterilization Method & Validation",
          hint: "Describe the terminal sterilization method (EO, gamma/e-beam radiation, steam, VHP, etc.) or aseptic processing. Provide validation per applicable standards: ISO 11135 (EO), ISO 11137 (radiation), ISO 17665 (steam). Include SAL (Sterility Assurance Level, typically 10⁻⁶), cycle parameters, and biological indicator results.",
          textarea: true,
        },
        {
          id: "eo_residuals",
          label: "EO Residuals / Sterilant Residues",
          hint: "For EO-sterilized devices: residual ethylene oxide and ethylene chlorohydrin levels per ISO 10993-7, with allowable limits based on device contact category. Report dissipation/aeration validation results and compliance with 24-hour and 30-day dose limits.",
        },
        {
          id: "bioburden_testing",
          label: "Bioburden & Pyrogen Testing",
          hint: "Pre-sterilization bioburden determination per ISO 11737-1, including sample preparation, recovery efficiency, and bioburden levels. Endotoxin testing per ISO 11737-2 or USP <85> LAL test. Report bioburden limits used for sterilization dose establishment.",
        },
        {
          id: "shelf_life_testing",
          label: "Shelf Life / Aging Studies",
          hint: "Accelerated aging study per ASTM F1980 (using Arrhenius relationship with Q₁₀ factor, typically at 55°C or 60°C) supporting the claimed shelf life. Include real-time aging data if available. Test sterile barrier integrity, device functionality, and material properties at end of claimed shelf life.",
          textarea: true,
        },
        {
          id: "package_testing",
          label: "Package Integrity & Distribution Testing",
          hint: "Sterile barrier system validation per ISO 11607-1/-2, including seal strength (ASTM F88), burst testing (ASTM F2054/F2095), dye penetration (ASTM F1929), visual inspection, and distribution simulation (ASTM D4169 or ISTA protocols). Report package integrity after simulated transit conditions.",
          textarea: true,
        },
      ],
    },
    {
      id: "software_documentation",
      title: "Software Documentation",
      description:
        "Software documentation per FDA guidance 'Content of Premarket Submissions for Device Software Functions' and IEC 62304, scaled to the software's risk level.",
      fields: [
        {
          id: "software_level_of_concern",
          label: "Level of Concern / Risk Category",
          hint: "Determine the Level of Concern (Major, Moderate, Minor) per FDA software guidance based on potential harm from software failure. Alternatively, classify software safety class per IEC 62304 (Class A, B, or C). Provide rationale for the determination, considering severity of hazards if software fails or malfunctions.",
        },
        {
          id: "software_description",
          label: "Software Description Document",
          hint: "Overview of the software including: intended use, device functions controlled by software, software development environment (languages, tools, compilers), hardware platform, operating system, third-party software (SOUP/OTS), communication protocols, cybersecurity architecture, and user interface description.",
          textarea: true,
        },
        {
          id: "hazard_analysis",
          label: "Software Hazard Analysis",
          hint: "Device-level and software-level hazard analysis identifying potential causes of harm related to software, including software defects, use errors in software UI, cybersecurity vulnerabilities, and interoperability failures. Include severity, probability, risk level, and mitigations per ISO 14971.",
          textarea: true,
        },
        {
          id: "software_requirements_architecture",
          label: "Software Requirements & Architecture",
          hint: "Software Requirements Specification (SRS) identifying all functional, performance, interface, and safety requirements. Software architecture design chart showing major modules/subsystems, data flows, state diagrams, and interfaces. Required for Moderate and Major Level of Concern.",
          textarea: true,
        },
        {
          id: "software_testing",
          label: "Software Verification & Validation",
          hint: "Summary of software V&V activities: unit testing, integration testing, system testing, and regression testing. Include test protocols, pass/fail criteria, test coverage metrics, and summary of results. For Major Level of Concern, include traceability from requirements through design to test cases. List all unresolved software anomalies with risk assessment.",
          textarea: true,
        },
      ],
    },
    {
      id: "labelling",
      title: "Labelling",
      description:
        "Complete device labelling per 21 CFR 801 (general), 21 CFR 809 (IVDs), and any applicable special controls or guidance-specific labelling requirements.",
      fields: [
        {
          id: "device_labels",
          label: "Device Labels (Inner & Outer)",
          hint: "Final artwork or draft labels affixed to the device and its immediate container, including: device name, manufacturer name and address, model/catalog number, lot/serial number, UDI (per 21 CFR 830), any required cautionary statements, Rx symbol if prescription device, and applicable symbols per ISO 15223-1.",
        },
        {
          id: "instructions_for_use",
          label: "Instructions for Use (IFU)",
          hint: "Complete Instructions for Use / User Manual including: indications, contraindications, warnings, precautions, adverse events, device description, setup/installation, operating instructions, maintenance/cleaning/reprocessing, troubleshooting, technical specifications, EMC declarations, and warranty. Must comply with 21 CFR 801.5 and applicable guidance.",
          textarea: true,
        },
        {
          id: "package_insert",
          label: "Package Insert / Physician Labelling",
          hint: "If applicable, the physician-directed package insert summarizing clinical information, dosing/programming guidance, implant card, patient information, and MRI safety information (MR Safe, MR Conditional, or MR Unsafe per ASTM F2503).",
          textarea: true,
        },
        {
          id: "promotional_materials",
          label: "Promotional & Marketing Materials",
          hint: "Any promotional materials or advertisements that will be disseminated at or shortly after clearance. Per 21 CFR 807.87(e), labelling includes all labels and other written, printed, or graphic matter accompanying the device. Ensure claims are consistent with cleared indications for use.",
          textarea: true,
        },
      ],
    },
  ],
};

const US_PMA: RegulatoryFramework = {
  id: "US_PMA",
  countryCode: "US",
  countryName: "United States",
  flag: "🇺🇸",
  authority: "Premarket Approval Application (FDA CDRH)",
  documentType: "Premarket Approval Application (PMA)",
  sections: [
    {
      id: "cover_letter",
      title: "Cover Letter & Transmittal",
      description:
        "Formal transmittal letter for the PMA application submitted to FDA CDRH, identifying the device and requesting approval under Section 515 of the FD&C Act.",
      fields: [
        {
          id: "cover_letter_text",
          label: "Cover Letter",
          hint: "Formal letter addressed to the Director, Division of Industry and Consumer Education (DICE), CDRH, identifying the device, applicant, and requesting premarket approval under Section 515 of the FD&C Act. Reference the PMA application contents and any pre-submission meeting agreements (Q-Sub number).",
          textarea: true,
        },
        {
          id: "contact_person",
          label: "Contact Person",
          hint: "Name, title, phone, and email of the primary regulatory contact for the PMA. This person serves as the liaison between the applicant and FDA review team throughout the PMA review process.",
        },
        {
          id: "presubmission_reference",
          label: "Pre-Submission / Q-Sub Reference",
          hint: "Reference number(s) of any Pre-Submission (Pre-Sub) meetings, Q-Submissions, or prior FDA interactions related to this PMA (e.g., Q######). Summarize key FDA feedback and agreements that shaped the PMA submission strategy.",
        },
        {
          id: "user_fee_payment",
          label: "User Fee Information",
          hint: "MDUFA (Medical Device User Fee Amendments) payment confirmation. Provide the payment identification number and amount paid. PMA applications require a user fee unless a small business exemption or waiver applies per 21 CFR 814.20.",
        },
      ],
    },
    {
      id: "administrative",
      title: "Administrative Information",
      description:
        "Applicant, device, and regulatory identification information required per 21 CFR 814.20(b) for PMA administrative processing.",
      fields: [
        {
          id: "applicant_name",
          label: "Applicant Name & Legal Status",
          hint: "Legal name and organizational form (corporation, partnership, etc.) of the PMA applicant. Must be the entity that will hold the PMA approval and be responsible for manufacturing and distributing the device.",
        },
        {
          id: "applicant_address",
          label: "Applicant Address",
          hint: "Complete address of the applicant's principal place of business, including street address, city, state, zip code, and country. Include all manufacturing site addresses if different from the principal office.",
        },
        {
          id: "establishment_registration",
          label: "Establishment Registration & Device Listing",
          hint: "FDA Establishment Registration Number (FEI) and Device Listing Number per 21 CFR 807. Include FEI numbers for all manufacturing, sterilization, and testing facilities involved in device production.",
        },
        {
          id: "device_trade_name",
          label: "Device Trade Name",
          hint: "The proprietary or trade name under which the device will be commercially distributed. This name will appear on the PMA approval order.",
        },
        {
          id: "common_name",
          label: "Common / Classification Name",
          hint: "The generic or common name of the device as established by FDA nomenclature or the classification regulation (e.g., 'Endosseous dental implant' per 21 CFR 872.3640).",
        },
        {
          id: "product_code",
          label: "FDA Product Code",
          hint: "Three-letter FDA product code identifying the generic device type. For Class III devices, this code links to the applicable classification regulation and any existing classification panel recommendation.",
        },
        {
          id: "regulation_number",
          label: "Classification Regulation Number",
          hint: "21 CFR classification regulation number for the device (e.g., '21 CFR 870.3610' for coronary vascular graft prosthesis). For preamendment devices not yet classified, reference the Federal Register notice or indicate the device's classification status.",
        },
      ],
    },
    {
      id: "indications_for_use",
      title: "Indications for Use",
      description:
        "Comprehensive statement of intended use and indications for use, defining the clinical scope of the PMA approval.",
      fields: [
        {
          id: "indications_statement",
          label: "Indications for Use Statement",
          hint: "Detailed statement of the specific diseases, conditions, or clinical purposes the device is intended to diagnose, treat, cure, mitigate, or prevent. Must be supported by clinical data in the PMA. This statement defines the scope of the approved labelling.",
          textarea: true,
        },
        {
          id: "target_population",
          label: "Target Patient Population",
          hint: "Detailed description of the intended patient population including age range, disease severity, anatomical criteria, and clinical inclusion/exclusion criteria as studied in the pivotal clinical trial. Specify any subpopulations with differential benefit/risk profiles.",
          textarea: true,
        },
        {
          id: "contraindications",
          label: "Contraindications",
          hint: "Specific conditions, patient populations, or clinical scenarios where the device should NOT be used due to unacceptable risk. Must be consistent with clinical trial exclusion criteria and identified risks from the risk analysis.",
          textarea: true,
        },
        {
          id: "use_environment",
          label: "Intended Use Environment & User Profile",
          hint: "Clinical settings where the device will be used (e.g., cardiac catheterization lab, surgical suite) and qualifications/training required of intended users (e.g., board-certified interventional cardiologist, certified sonographer).",
        },
        {
          id: "prescription_status",
          label: "Prescription / Restricted Device Status",
          hint: "Confirm prescription (Rx) status per 21 CFR 801.109. For restricted devices, specify the restrictions on sale, distribution, or use per Section 515(d)(1)(B)(ii) of the FD&C Act.",
        },
      ],
    },
    {
      id: "device_description",
      title: "Device Description",
      description:
        "Complete technical description of the device per 21 CFR 814.20(b)(3), including engineering drawings, materials, components, principles of operation, and manufacturing specifications.",
      fields: [
        {
          id: "physical_description",
          label: "Physical Description & Operating Principles",
          hint: "Detailed narrative of the device's physical construction, mechanism of action, and scientific principles underlying its operation. Include annotated photographs, engineering drawings (with GD&T per ASME Y14.5), exploded view diagrams, and schematic diagrams as applicable.",
          textarea: true,
        },
        {
          id: "technical_specifications",
          label: "Technical / Performance Specifications",
          hint: "Complete list of critical performance specifications with nominal values and acceptance tolerances. Include all specifications verified during design verification and those monitored during manufacturing. Organize by functional subsystem.",
          textarea: true,
        },
        {
          id: "materials_composition",
          label: "Materials of Construction",
          hint: "Comprehensive materials list for all components, specifying material trade name, manufacturer, grade/specification (ASTM, ISO, or proprietary), and lot traceability. For patient-contacting materials, include biocompatibility classification per ISO 10993-1.",
          textarea: true,
        },
        {
          id: "components_bom",
          label: "Bill of Materials / Component List",
          hint: "Complete bill of materials (BOM) identifying all components, subassemblies, and raw materials. Include part numbers, descriptions, materials, suppliers, and whether components are custom or commercial off-the-shelf (COTS). Flag any components that are themselves regulated medical devices.",
          textarea: true,
        },
        {
          id: "software_firmware",
          label: "Software / Firmware Description",
          hint: "Description of all software and firmware included in the device, including version numbers, functions performed, development environment, operating system, third-party libraries (SOUP), communication interfaces, cybersecurity controls, and software safety classification per IEC 62304.",
          textarea: true,
        },
        {
          id: "accessories_ancillary",
          label: "Accessories & Ancillary Devices",
          hint: "Description of all accessories, ancillary devices, and companion devices used with the PMA device. Specify whether each has its own regulatory clearance/approval, and how interoperability and compatibility are assured.",
          textarea: true,
        },
        {
          id: "device_variants",
          label: "Device Models, Sizes & Configurations",
          hint: "Complete listing of all device models, sizes, configurations, and options included in the PMA. Provide a matrix showing how testing coverage (bench, biocompatibility, clinical) applies across the device family. Justify testing of representative worst-case configurations.",
          textarea: true,
        },
      ],
    },
    {
      id: "standards_testing",
      title: "Standards & Conformance",
      description:
        "Recognized consensus standards applied to the device and declarations of conformity per 21 CFR 814.20(b)(6).",
      fields: [
        {
          id: "consensus_standards",
          label: "Applicable Consensus Standards",
          hint: "List all FDA-recognized consensus standards applied, with edition/version numbers (e.g., ISO 14971:2019, IEC 60601-1 Ed. 3.2, ISO 10993-1:2018). Include both horizontal (general safety) and vertical (device-specific) standards. Reference the FDA Recognized Consensus Standards Database.",
          textarea: true,
        },
        {
          id: "declarations_of_conformity",
          label: "Declarations of Conformity & Test Summaries",
          hint: "Formal declarations of conformity for each standard, including the scope of application, any exclusions with justification, and summary of test results. Include testing laboratory identification and accreditation status.",
          textarea: true,
        },
        {
          id: "guidance_documents",
          label: "Applicable FDA Guidance Documents",
          hint: "List all FDA guidance documents followed in preparing the PMA, including device-specific guidance, general PMA guidance, and testing guidance documents. Note any deviations from guidance recommendations with justification.",
          textarea: true,
        },
        {
          id: "electrical_safety_emc",
          label: "Electrical Safety & EMC Testing",
          hint: "For electrically powered devices: complete IEC 60601-1 (general safety and essential performance) and IEC 60601-1-2 (EMC) test results. Include applied parts classification, means of protection against electric shock, immunity and emissions test results, essential performance verification during EMC testing, and risk assessment for electromagnetic disturbances.",
          textarea: true,
        },
      ],
    },
    {
      id: "biocompatibility",
      title: "Biocompatibility",
      description:
        "Comprehensive biological evaluation per ISO 10993-1 and FDA biocompatibility guidance, with complete test reports for all applicable biological endpoints.",
      fields: [
        {
          id: "biocompat_evaluation_plan",
          label: "Biological Evaluation Plan",
          hint: "ISO 10993-1 based evaluation plan with device categorization (nature/duration of body contact), biological endpoint selection matrix, and rationale for test selection. Include a gap analysis against any previous biocompatibility data if applicable.",
          textarea: true,
        },
        {
          id: "material_characterization",
          label: "Chemical Characterization",
          hint: "Complete chemical characterization per ISO 10993-18 including: material composition, extractables/leachables analysis with analytical methods (GC-MS, LC-MS, ICP-MS), toxicological risk assessment of extracted chemicals, and comparison to tolerable intake/contact limits.",
          textarea: true,
        },
        {
          id: "cytotoxicity",
          label: "Cytotoxicity",
          hint: "Complete test report for in vitro cytotoxicity per ISO 10993-5. Include test method (MEM elution, direct contact, or agar overlay), cell line, extraction conditions, positive/negative controls, quantitative results, and grade/pass/fail determination.",
        },
        {
          id: "sensitization",
          label: "Sensitization",
          hint: "Complete test report for sensitization per ISO 10993-10. Include method (GPMT or LLNA), animal numbers, induction/challenge protocol, scoring criteria, individual animal results, and statistical analysis of sensitization incidence.",
        },
        {
          id: "irritation_reactivity",
          label: "Irritation / Intracutaneous Reactivity",
          hint: "Complete test report per ISO 10993-10/23. Include method, extraction vehicle (polar and non-polar), injection/application sites, observation intervals, individual animal scores, primary irritation index calculation, and pass/fail determination.",
        },
        {
          id: "systemic_toxicity",
          label: "Systemic Toxicity (Acute & Chronic)",
          hint: "Test reports for acute systemic toxicity (ISO 10993-11, single dose in mice or rats) and subchronic/chronic systemic toxicity if device contact exceeds 30 days. Include route of administration, dose levels, observation parameters (body weight, clinical signs, hematology, clinical chemistry, histopathology), and NOAEL determination.",
          textarea: true,
        },
        {
          id: "genotoxicity",
          label: "Genotoxicity",
          hint: "Battery of genotoxicity tests per ISO 10993-3: bacterial reverse mutation assay (Ames test), in vitro mammalian chromosomal aberration or mouse lymphoma assay, and in vivo micronucleus test if needed. Report methods, strains, metabolic activation, dose levels, and mutagenicity/clastogenicity results.",
          textarea: true,
        },
        {
          id: "hemocompatibility",
          label: "Hemocompatibility",
          hint: "For blood-contacting devices: hemolysis testing (ISO 10993-4, ASTM F756), complement activation, thrombogenicity, coagulation, and platelet/leukocyte assessment as applicable. Include direct and indirect contact methods, hemolytic index calculation, and comparison to acceptance criteria.",
          textarea: true,
        },
        {
          id: "implantation_testing",
          label: "Implantation Testing",
          hint: "For implantable devices: implantation study per ISO 10993-6 in appropriate animal model. Include implant site, animal species, implant duration (matching intended clinical use), gross pathology, histopathological evaluation with semi-quantitative scoring, and comparison to negative control materials.",
          textarea: true,
        },
      ],
    },
    {
      id: "nonclinical_studies",
      title: "Non-Clinical Laboratory Studies",
      description:
        "Complete non-clinical bench and animal testing per 21 CFR 814.20(b)(6), including performance testing, biocompatibility, sterilization validation, and shelf life studies.",
      fields: [
        {
          id: "bench_testing",
          label: "Bench / Mechanical Performance Testing",
          hint: "Comprehensive bench testing results including: static and dynamic mechanical testing, fatigue testing (per ASTM or device-specific standards), durability, wear, corrosion resistance, dimensional verification, functional testing, and any device-specific performance tests required by FDA guidance. Include test methods, sample sizes with statistical justification, acceptance criteria, and results with statistical analysis.",
          textarea: true,
        },
        {
          id: "animal_studies",
          label: "Animal Studies",
          hint: "For devices requiring animal data: complete GLP-compliant (21 CFR 58) animal study reports. Include protocol, IACUC approval, animal model justification, study design, endpoints, follow-up duration, individual animal data, gross/histopathological results, statistical analysis, and conclusions regarding safety and performance.",
          textarea: true,
        },
        {
          id: "simulated_use",
          label: "Simulated Use & Cadaveric Testing",
          hint: "Testing in anatomical models, phantoms, or cadavers simulating clinical use. Include model description and clinical relevance, procedures performed, outcomes measured, operator feedback, and how results support clinical safety and effectiveness claims.",
          textarea: true,
        },
        {
          id: "worst_case_analysis",
          label: "Worst-Case Analysis & Testing",
          hint: "Systematic identification of worst-case conditions (device sizes, patient anatomy, operator technique, environmental conditions) with testing under these conditions. Include rationale for worst-case selection, test matrices, and results demonstrating acceptable performance under worst-case scenarios.",
          textarea: true,
        },
        {
          id: "usability_human_factors",
          label: "Human Factors / Usability Engineering",
          hint: "Usability engineering file per IEC 62366-1 and FDA HFE guidance, including use-related risk analysis, critical tasks identification, formative usability studies, and summative (validation) human factors study. Report task completion rates, use errors, close calls, and residual use-related risks.",
          textarea: true,
        },
      ],
    },
    {
      id: "sterilization",
      title: "Sterilization & Shelf Life",
      description:
        "Sterilization process validation, sterility assurance, and shelf life/packaging validation for the device.",
      fields: [
        {
          id: "sterilization_method",
          label: "Sterilization Method & Process Validation",
          hint: "Complete sterilization process description and validation per applicable standard (ISO 11135 for EO, ISO 11137 for radiation, ISO 17665 for steam). Include process parameters, half-cycle or overkill approach, biological indicator results, parametric release criteria, and SAL demonstration (10⁻⁶).",
          textarea: true,
        },
        {
          id: "sterilant_residuals",
          label: "Sterilant Residual Analysis",
          hint: "For EO sterilization: EO and ECH residual levels per ISO 10993-7 at multiple time points during aeration. For other methods: analysis of any process residuals. Include patient exposure calculations, comparison to allowable limits, and worst-case product/process configuration.",
        },
        {
          id: "bioburden_endotoxin",
          label: "Bioburden & Endotoxin Testing",
          hint: "Product bioburden testing per ISO 11737-1, endotoxin testing per ISO 11737-2 / USP <85>. Include sample preparation method validation, recovery efficiency, bioburden results supporting sterilization dose/cycle, and endotoxin levels compared to applicable limits.",
        },
        {
          id: "shelf_life",
          label: "Shelf Life Determination",
          hint: "Accelerated aging per ASTM F1980 and real-time aging data supporting claimed shelf life. Test endpoints: sterile barrier integrity (per ISO 11607), device performance/functionality, material degradation, and visual inspection. Include aging conditions, Q₁₀ factor justification, and analysis of results at each time point.",
          textarea: true,
        },
        {
          id: "package_validation",
          label: "Packaging System Validation",
          hint: "Sterile barrier system design, process validation (ISO 11607-2), and performance testing (ISO 11607-1). Include seal strength (ASTM F88), burst/creep (ASTM F2054/F2095), dye penetration (ASTM F1929), distribution simulation (ASTM D4169 / ISTA), and whole package integrity testing.",
          textarea: true,
        },
      ],
    },
    {
      id: "software_documentation",
      title: "Software Documentation",
      description:
        "Complete software documentation per FDA premarket software guidance and IEC 62304, commensurate with the software safety classification and level of concern.",
      fields: [
        {
          id: "level_of_concern",
          label: "Level of Concern Determination",
          hint: "Determination of Major, Moderate, or Minor Level of Concern with detailed rationale. Alternatively, IEC 62304 software safety classification (Class A, B, or C). For PMA devices, most software-controlled Class III devices will be Major Level of Concern / Class C.",
        },
        {
          id: "software_description",
          label: "Software Description & Architecture",
          hint: "Comprehensive software description including: purpose, development environment, programming languages, hardware platform, OS, SOUP/OTS components, data flow diagrams, software architecture chart showing all modules and interfaces, state transition diagrams, and cybersecurity architecture.",
          textarea: true,
        },
        {
          id: "software_requirements",
          label: "Software Requirements Specification (SRS)",
          hint: "Complete SRS documenting all functional, performance, interface, design, safety, and security requirements for the software. Each requirement must be uniquely identified, testable, and traceable to system-level requirements and design inputs.",
          textarea: true,
        },
        {
          id: "hazard_analysis",
          label: "Software Hazard Analysis & Risk Table",
          hint: "Complete software-related hazard analysis identifying all reasonably foreseeable software failure modes, their causes, severity, probability of occurrence, and implemented risk controls. Include software FMEA and/or FTA results, and traceability to ISO 14971 risk management file.",
          textarea: true,
        },
        {
          id: "software_verification_validation",
          label: "Software V&V & Traceability",
          hint: "Complete software verification (unit, integration, system testing) and validation results with full requirements traceability matrix (requirements → design → code → test cases → test results). Include test coverage metrics, defect summary, regression test results, and list of all unresolved anomalies with risk assessment.",
          textarea: true,
        },
        {
          id: "revision_history_soup",
          label: "Revision History & SOUP Documentation",
          hint: "Software revision history documenting all versions and changes. SOUP (Software of Unknown Provenance) / OTS (Off-The-Shelf) component list with: name, version, manufacturer, intended use, anomaly lists, functional/performance requirements, and risk assessment for each SOUP item per IEC 62304.",
          textarea: true,
        },
        {
          id: "cybersecurity",
          label: "Cybersecurity Documentation",
          hint: "Cybersecurity risk assessment per FDA premarket cybersecurity guidance. Include threat modeling, security architecture, vulnerability analysis, software bill of materials (SBOM), security controls (authentication, encryption, access control, audit logging), penetration testing results, and plan for postmarket cybersecurity management.",
          textarea: true,
        },
      ],
    },
    {
      id: "clinical_investigations",
      title: "Clinical Investigations",
      description:
        "Complete clinical study data per 21 CFR 814.20(b)(6)(ii), including pivotal clinical trial results supporting the safety and effectiveness of the device.",
      fields: [
        {
          id: "ide_information",
          label: "IDE Number & History",
          hint: "Investigational Device Exemption (IDE) number(s) under which clinical studies were conducted (e.g., G######). Include IDE approval date, all supplements, and FDA correspondence. Reference 21 CFR 812 requirements for significant risk device studies.",
        },
        {
          id: "clinical_protocol",
          label: "Clinical Study Protocol",
          hint: "Complete clinical investigation protocol(s) including: study objectives, primary and secondary endpoints, study design (randomized, controlled, blinded), sample size calculation with statistical power analysis, inclusion/exclusion criteria, study procedures, follow-up schedule, statistical analysis plan, and stopping rules.",
          textarea: true,
        },
        {
          id: "irb_informed_consent",
          label: "IRB Approvals & Informed Consent",
          hint: "List of all IRBs/Ethics Committees that approved the study with approval dates. Summary of the informed consent process and a copy of the informed consent form. Compliance with 21 CFR 50 (informed consent) and 21 CFR 56 (IRBs).",
          textarea: true,
        },
        {
          id: "clinical_results",
          label: "Clinical Study Results",
          hint: "Complete clinical study results including: patient demographics, enrollment/disposition (CONSORT diagram), primary endpoint analysis with statistical results (p-values, confidence intervals), secondary endpoint results, subgroup analyses, Bayesian analyses if applicable, and investigator-level site data.",
          textarea: true,
        },
        {
          id: "adverse_events",
          label: "Adverse Events & Complications",
          hint: "Complete adverse event tabulation including: event description, severity (mild/moderate/severe), seriousness (SAE criteria per 21 CFR 812.150), relatedness to device/procedure, outcome/resolution, Kaplan-Meier freedom-from-event analysis, and comparison to control group or objective performance criteria (OPC).",
          textarea: true,
        },
        {
          id: "clinical_literature",
          label: "Clinical Literature Review",
          hint: "Systematic review of published clinical literature supporting the device technology, including literature search methodology (databases, search terms, inclusion/exclusion criteria), critical appraisal of studies, and synthesis of evidence regarding safety and effectiveness of the technology.",
          textarea: true,
        },
      ],
    },
    {
      id: "risk_management",
      title: "Risk Management",
      description:
        "Complete risk management file per ISO 14971:2019, documenting the risk management process applied throughout the device lifecycle.",
      fields: [
        {
          id: "risk_management_plan",
          label: "Risk Management Plan",
          hint: "Risk management plan per ISO 14971 Clause 4.4, defining: scope, risk acceptability criteria (severity/probability matrix with ALARP principle), roles and responsibilities, risk management activities throughout the product lifecycle, and criteria for overall residual risk acceptability.",
          textarea: true,
        },
        {
          id: "risk_analysis",
          label: "Risk Analysis (Hazard Identification)",
          hint: "Systematic hazard identification and risk estimation using FMEA, FTA, HAZOP, or other methods. Include: identified hazards, hazardous situations, foreseeable sequences of events, harms, severity and probability estimation, and initial risk levels for all identified risks.",
          textarea: true,
        },
        {
          id: "risk_controls",
          label: "Risk Evaluation & Control Measures",
          hint: "Risk evaluation against acceptability criteria and implementation of risk control measures following the priority hierarchy: inherently safe design, protective measures in device or manufacturing, information for safety (labelling). Include verification of risk control effectiveness and confirmation that no new risks are introduced.",
          textarea: true,
        },
        {
          id: "residual_risk",
          label: "Overall Residual Risk Evaluation",
          hint: "Evaluation of overall residual risk considering all individual residual risks in aggregate per ISO 14971 Clause 8. Demonstrate that the overall residual risk is acceptable when weighed against the intended clinical benefits. Include benefit-risk analysis methodology and conclusions.",
          textarea: true,
        },
        {
          id: "risk_management_report",
          label: "Risk Management Report",
          hint: "Final risk management report per ISO 14971 Clause 9, confirming: the risk management plan was appropriately implemented, overall residual risk is acceptable, appropriate methods are in place for production and post-production information collection, and the risk management file is complete.",
          textarea: true,
        },
      ],
    },
    {
      id: "manufacturing",
      title: "Manufacturing Information",
      description:
        "Detailed manufacturing information per 21 CFR 814.20(b)(4), including facility details, process descriptions, quality system, and process validation.",
      fields: [
        {
          id: "facility_information",
          label: "Manufacturing Facility Information",
          hint: "Complete identification of all manufacturing, assembly, sterilization, testing, and packaging facilities. Include facility name, address, FEI number, and description of operations performed at each site. Note any contract manufacturers and their qualifications.",
          textarea: true,
        },
        {
          id: "process_description",
          label: "Manufacturing Process Description",
          hint: "Detailed description of the manufacturing process from raw material receipt through finished device release, including process flow diagrams, critical process steps, in-process controls, inspection/test points, and acceptance criteria. Identify special processes requiring validation.",
          textarea: true,
        },
        {
          id: "quality_system",
          label: "Quality System Information",
          hint: "Overview of the Quality Management System per 21 CFR 820 (Quality System Regulation). Address: management responsibility, design controls, document controls, purchasing controls, production and process controls, CAPA, labelling controls, device history record, and complaint handling.",
          textarea: true,
        },
        {
          id: "process_validation",
          label: "Manufacturing Process Validation",
          hint: "Summary of process validation activities for special processes (sterilization, welding, sealing, coating, etc.) per 21 CFR 820.75. Include IQ/OQ/PQ protocols, validation parameters, acceptance criteria, and results demonstrating processes consistently produce output meeting specifications.",
          textarea: true,
        },
        {
          id: "supplier_controls",
          label: "Supplier Quality & Controls",
          hint: "Description of supplier qualification and management program, including critical component/material suppliers, supplier audit schedule, incoming inspection procedures, and supplier agreements ensuring traceability and quality of purchased components.",
          textarea: true,
        },
      ],
    },
    {
      id: "labelling",
      title: "Labelling",
      description:
        "Complete proposed labelling per 21 CFR 814.20(b)(10), reviewed for consistency with clinical data and approved indications.",
      fields: [
        {
          id: "device_labels",
          label: "Device & Package Labels",
          hint: "Final label artwork for device label, immediate container, outer carton, and shelf pack. Include device name, manufacturer, model/catalog/lot/serial numbers, UDI barcode, sterilization indicators, Rx symbol, and all required symbols per ISO 15223-1 and 21 CFR 801.",
        },
        {
          id: "instructions_for_use",
          label: "Instructions for Use (IFU)",
          hint: "Complete IFU including: approved indications, contraindications, warnings (including boxed warnings if applicable), precautions, adverse events (with rates from clinical data), device description, patient selection, procedural instructions, post-procedure care, troubleshooting, and technical specifications.",
          textarea: true,
        },
        {
          id: "patient_labelling",
          label: "Patient Labelling / Implant Card",
          hint: "Patient-directed information materials, patient implant card (for implantable devices per 21 CFR 801.57), and medication guide if applicable. Written at appropriate health literacy level. Include device identification information patients should retain for future medical encounters.",
          textarea: true,
        },
        {
          id: "physician_labelling",
          label: "Physician / Professional Labelling",
          hint: "Healthcare professional-directed labelling including surgical technique guide, programming manual, dosing guide, or other professional-use information. Clinical results summary consistent with the approved PMA clinical data and FDA-approved labelling language.",
          textarea: true,
        },
      ],
    },
    {
      id: "postmarket",
      title: "Post-Market Requirements",
      description:
        "Post-approval study commitments, periodic reporting requirements, and post-market surveillance obligations under PMA conditions of approval.",
      fields: [
        {
          id: "postapproval_study",
          label: "Post-Approval Study Plan",
          hint: "Protocol for FDA-required post-approval study (PAS) per 21 CFR 814.82(a)(2), if applicable. Include study objectives, design, endpoints, sample size, enrollment timeline, follow-up duration (typically 5–10 years), and interim analysis schedule. Address any conditions of approval requiring postmarket data collection.",
          textarea: true,
        },
        {
          id: "periodic_reports",
          label: "Periodic Reporting Commitment",
          hint: "Plan for PMA annual reports per 21 CFR 814.84, including: number of devices distributed, adverse event summary and analysis, changes reported under PMA supplements, updated bibliography of published literature, and status of any post-approval studies or ongoing clinical investigations.",
          textarea: true,
        },
        {
          id: "complaint_mdr",
          label: "Complaint Handling & MDR Plan",
          hint: "Description of the complaint handling system per 21 CFR 820.198 and Medical Device Reporting (MDR) procedures per 21 CFR 803. Include timelines for death/serious injury reports (30-day/5-day), malfunction reports, and trending analysis methodology.",
          textarea: true,
        },
        {
          id: "environmental_assessment",
          label: "Environmental Assessment",
          hint: "Environmental assessment (EA) per 21 CFR 25.40 or claim of categorical exclusion per 21 CFR 25.34. If EA is required, address environmental impact of device manufacturing, use, and disposal. Most PMA devices qualify for categorical exclusion — cite the specific exclusion category.",
          textarea: true,
        },
      ],
    },
  ],
};

const US_DENOVO: RegulatoryFramework = {
  id: "US_DENOVO",
  countryCode: "US",
  countryName: "United States",
  flag: "🇺🇸",
  authority: "De Novo Classification Request (FDA CDRH)",
  documentType: "De Novo Classification Request",
  sections: [
    {
      id: "cover_letter",
      title: "Cover Letter & Transmittal",
      description:
        "Formal cover letter for the De Novo classification request submitted under Section 513(f)(2) of the FD&C Act.",
      fields: [
        {
          id: "cover_letter_text",
          label: "Cover Letter",
          hint: "Formal letter addressed to CDRH identifying the device and requesting De Novo classification under Section 513(f)(2) of the FD&C Act. Reference any prior 510(k) NSE (Not Substantially Equivalent) determination if this is a post-NSE De Novo, or indicate if this is a direct De Novo request.",
          textarea: true,
        },
        {
          id: "contact_person",
          label: "Contact Person",
          hint: "Name, title, phone, and email of the primary regulatory contact for the De Novo request. Include mailing address for correspondence.",
        },
        {
          id: "presubmission_reference",
          label: "Pre-Submission Reference",
          hint: "Reference number(s) of any Pre-Submission (Q-Sub) meetings with FDA related to this De Novo request. Summarize key FDA feedback regarding the classification rationale, proposed special controls, and testing strategy.",
        },
        {
          id: "prior_510k_reference",
          label: "Prior 510(k) NSE Determination",
          hint: "If this De Novo follows a 510(k) Not Substantially Equivalent (NSE) determination, provide the 510(k) number and NSE decision date. If this is a direct De Novo request (no prior 510(k)), state that no predicate device exists and a direct De Novo is being requested per the 2012 FDASIA amendments.",
        },
      ],
    },
    {
      id: "administrative",
      title: "Administrative Information",
      description:
        "Applicant and device identification information for the De Novo classification request.",
      fields: [
        {
          id: "applicant_name",
          label: "Applicant / Requester Name",
          hint: "Legal name of the entity requesting De Novo classification. This entity will be the first to market the device and will be identified in the De Novo authorization (DEN number).",
        },
        {
          id: "applicant_address",
          label: "Applicant Address",
          hint: "Complete business address of the requester, including street, city, state, zip, and country. Include all manufacturing facility addresses if different from principal office.",
        },
        {
          id: "establishment_registration",
          label: "Establishment Registration & Listing",
          hint: "FDA Establishment Registration Number (FEI) and Device Listing Number, or indicate if registration/listing is pending approval of the De Novo request.",
        },
        {
          id: "device_name",
          label: "Device Trade & Common Name",
          hint: "Proprietary/trade name and proposed common/generic name for the device. The common name should be descriptive of the device type and may become the basis for a new device classification regulation.",
        },
        {
          id: "proposed_product_code",
          label: "Proposed Product Code & Regulation",
          hint: "Since De Novo creates a new classification, a new product code will be assigned by FDA. Suggest the most appropriate existing classification panel and regulation section. Identify the closest existing product codes for reference.",
        },
        {
          id: "proposed_classification",
          label: "Proposed Device Classification",
          hint: "Indicate whether Class I or Class II classification is being requested (most De Novo devices are classified into Class II with special controls). Provide rationale for why the proposed classification with general controls (and special controls if Class II) provides reasonable assurance of safety and effectiveness.",
          textarea: true,
        },
      ],
    },
    {
      id: "indications_for_use",
      title: "Indications for Use",
      description:
        "Statement of intended use and indications for use that will define the scope of the new device classification.",
      fields: [
        {
          id: "indications_statement",
          label: "Indications for Use",
          hint: "Detailed statement of intended medical use, specific diseases/conditions, and clinical purposes. This will become the basis of the new classification regulation's intended use statement. Must be specific and supported by available evidence.",
          textarea: true,
        },
        {
          id: "target_population",
          label: "Target Patient Population",
          hint: "Intended patient population including demographics, clinical characteristics, and any limitations. Specify pediatric applicability. This defines the population scope of the new classification.",
        },
        {
          id: "use_environment",
          label: "Intended Use Environment",
          hint: "Clinical settings where the device is intended to be used (e.g., clinical laboratory, point-of-care, home use). Include intended user qualifications (healthcare professional, trained lay user, patient self-use).",
        },
        {
          id: "prescription_otc",
          label: "Prescription or OTC Determination",
          hint: "Whether the device should be restricted to prescription use (Rx) or available over-the-counter (OTC). Provide rationale based on the training/expertise needed for safe and effective use.",
        },
      ],
    },
    {
      id: "device_description",
      title: "Device Description",
      description:
        "Complete technical description of the novel device, establishing the device type for the new classification.",
      fields: [
        {
          id: "physical_description",
          label: "Physical Description & Operating Principle",
          hint: "Comprehensive description of the device's physical construction, mechanism of action, and scientific principle of operation. This description helps define the scope of the new device type classification for future 510(k) submissions referencing this De Novo.",
          textarea: true,
        },
        {
          id: "technical_specifications",
          label: "Technical Specifications",
          hint: "Key performance specifications with values and tolerances. Identify which specifications are critical to the device's safety and effectiveness and should be addressed by special controls.",
          textarea: true,
        },
        {
          id: "materials",
          label: "Materials of Construction",
          hint: "All materials used in device construction, with particular attention to patient-contacting materials. Include material specifications and any novel or non-standard materials that distinguish this device type.",
          textarea: true,
        },
        {
          id: "components_software",
          label: "Components & Software",
          hint: "Key components, subassemblies, and accessories. If the device includes software, describe software functions, safety classification per IEC 62304, and role of software in achieving the intended use. Identify any AI/ML components.",
          textarea: true,
        },
        {
          id: "novel_features",
          label: "Novel Technological Features",
          hint: "Detailed description of the novel or unique technological features that distinguish this device from existing classified device types. Explain why these features prevent classification through the 510(k) pathway and necessitate a new classification.",
          textarea: true,
        },
        {
          id: "device_variants",
          label: "Device Models & Configurations",
          hint: "All models, sizes, and configurations included in this De Novo request. Describe the scope of the device family and how testing covers the range of variants. This defines the breadth of the new classification.",
          textarea: true,
        },
      ],
    },
    {
      id: "classification_rationale",
      title: "Classification Rationale & Special Controls",
      description:
        "Regulatory rationale for the proposed classification, including analysis of risks and proposed special controls per Section 513(a)(1) of the FD&C Act.",
      fields: [
        {
          id: "classification_rationale",
          label: "Classification Rationale",
          hint: "Detailed argument for why the device should be classified into the proposed class rather than Class III. Demonstrate that general controls alone (Class I) or general controls plus special controls (Class II) provide reasonable assurance of safety and effectiveness. Reference 21 CFR 860.7 factors.",
          textarea: true,
        },
        {
          id: "risk_identification",
          label: "Identification of Risks to Health",
          hint: "Comprehensive list of all identified risks to health associated with the device type, including risks from device failure, use error, biocompatibility, software malfunction, and any unique risks of the novel technology. Each risk should be categorized by type and severity.",
          textarea: true,
        },
        {
          id: "proposed_special_controls",
          label: "Proposed Special Controls",
          hint: "For Class II classification: detailed proposed special controls that, together with general controls, mitigate each identified risk. Special controls may include: performance standards, postmarket surveillance, patient registries, special labelling, premarket data requirements (e.g., clinical, bench, biocompatibility), and guidelines. Map each special control to the specific risk(s) it addresses.",
          textarea: true,
        },
        {
          id: "risk_mitigation_matrix",
          label: "Risk-to-Special-Controls Mitigation Matrix",
          hint: "A matrix mapping each identified risk to the specific special control(s) that mitigate it, demonstrating that all identified risks are adequately addressed by the combination of general and special controls. This is a key element of the De Novo decision-making framework.",
          textarea: true,
        },
        {
          id: "general_controls_adequacy",
          label: "General Controls Applicability",
          hint: "Analysis of how general controls (establishment registration, device listing, premarket notification, good manufacturing practices/QSR, labelling, MDR, and banning) apply to this device type and contribute to safety assurance.",
          textarea: true,
        },
      ],
    },
    {
      id: "risk_management",
      title: "Risk Analysis",
      description:
        "Formal risk analysis per ISO 14971 supporting the De Novo classification rationale and special controls.",
      fields: [
        {
          id: "risk_management_plan",
          label: "Risk Management Plan",
          hint: "Risk management plan per ISO 14971 defining scope, risk acceptability criteria (severity/probability matrix), and risk management activities. The plan should align with the classification rationale and feed into the proposed special controls.",
          textarea: true,
        },
        {
          id: "hazard_analysis",
          label: "Hazard Analysis & Risk Estimation",
          hint: "Systematic hazard identification using FMEA, FTA, or equivalent methods. Include: hazards, hazardous situations, harms, severity ratings, probability of occurrence, and initial risk levels. Cover all phases of device life (manufacturing, transport, use, disposal).",
          textarea: true,
        },
        {
          id: "risk_controls",
          label: "Risk Control Measures",
          hint: "Risk control measures implemented in the design, manufacturing, and labelling of the device. Follow the ISO 14971 hierarchy: inherently safe design, protective measures, information for safety. Document verification of each risk control's effectiveness.",
          textarea: true,
        },
        {
          id: "benefit_risk_analysis",
          label: "Benefit-Risk Determination",
          hint: "Analysis of the probable benefits of the device compared to the probable risks, considering the intended patient population, disease severity, and available alternatives. This supports the regulatory determination that benefits outweigh risks when the proposed controls are in place.",
          textarea: true,
        },
        {
          id: "residual_risk_assessment",
          label: "Residual Risk Assessment",
          hint: "Assessment of all residual risks after risk controls are applied, both individually and in aggregate. Demonstrate that residual risks are acceptable within the context of the proposed classification and special controls.",
          textarea: true,
        },
        {
          id: "risk_management_report",
          label: "Risk Management Report",
          hint: "Summary risk management report per ISO 14971 Clause 9, confirming completeness of the risk management process, acceptability of overall residual risk, and adequacy of production/post-production information collection methods.",
          textarea: true,
        },
      ],
    },
    {
      id: "performance_testing",
      title: "Performance Testing",
      description:
        "Non-clinical performance testing demonstrating the device meets its design specifications and supports the safety and effectiveness claims.",
      fields: [
        {
          id: "bench_testing",
          label: "Bench Testing & Analytical Performance",
          hint: "Summary of bench testing results covering: mechanical performance, functional testing, accuracy, precision, analytical sensitivity/specificity, measuring range, and any device-specific performance characteristics. Include test methods (referencing ASTM, ISO, or custom protocols), sample sizes, acceptance criteria, and results.",
          textarea: true,
        },
        {
          id: "biocompatibility",
          label: "Biocompatibility Evaluation",
          hint: "Biological evaluation per ISO 10993-1 appropriate for device contact type and duration. Include material characterization, endpoint testing (cytotoxicity, sensitization, irritation, and others as required by the contact matrix), and a conclusion on biocompatibility acceptability.",
          textarea: true,
        },
        {
          id: "sterilization_shelf_life",
          label: "Sterilization & Shelf Life",
          hint: "If applicable: sterilization method and validation, sterility assurance level, sterilant residuals, and shelf life determination through accelerated/real-time aging. Package integrity testing per ISO 11607.",
          textarea: true,
        },
        {
          id: "electrical_safety_emc",
          label: "Electrical Safety & EMC",
          hint: "For electrically powered devices: IEC 60601-1 safety testing, IEC 60601-1-2 EMC testing (emissions and immunity), and identification of essential performance during EMC testing. Include any applicable collateral or particular standards (IEC 60601-1-X, IEC 60601-2-XX).",
          textarea: true,
        },
        {
          id: "software_testing",
          label: "Software Verification & Validation",
          hint: "Software documentation and testing per FDA premarket software guidance and IEC 62304, scaled to the Level of Concern. Include software description, hazard analysis, requirements, architecture, V&V testing, unresolved anomalies, and SOUP documentation. For AI/ML-based software, include algorithm training/validation data and performance metrics.",
          textarea: true,
        },
      ],
    },
    {
      id: "clinical_data",
      title: "Clinical Data",
      description:
        "Clinical evidence supporting the safety and effectiveness claims for the De Novo device, which may include clinical studies, literature, or clinical experience data.",
      fields: [
        {
          id: "clinical_evidence_strategy",
          label: "Clinical Evidence Strategy",
          hint: "Overall clinical evidence strategy: describe the types and sources of clinical evidence provided (clinical study, clinical literature, clinical experience, or combination). Justify why the chosen evidence is sufficient to support reasonable assurance of safety and effectiveness under the proposed classification.",
          textarea: true,
        },
        {
          id: "clinical_studies",
          label: "Clinical Study Data",
          hint: "If a clinical study was conducted: provide the complete study report including protocol, IRB approvals, informed consent, study design, patient demographics, primary/secondary endpoints, results with statistical analysis, adverse events, and conclusions. Reference IDE number if a significant risk device study.",
          textarea: true,
        },
        {
          id: "clinical_literature",
          label: "Clinical Literature Review",
          hint: "Systematic literature review of published clinical data relevant to the device type or technology. Include search methodology, database sources, inclusion/exclusion criteria, evidence grading, and synthesis of safety and effectiveness data from published studies.",
          textarea: true,
        },
        {
          id: "clinical_performance",
          label: "Clinical Performance Summary",
          hint: "Summary of all clinical performance data demonstrating the device achieves its intended clinical purpose. Include sensitivity, specificity, positive/negative predictive value (for diagnostics), or clinical success rates and complication rates (for therapeutics).",
          textarea: true,
        },
        {
          id: "usability_study",
          label: "Human Factors / Usability Study",
          hint: "Usability validation study per IEC 62366-1 and FDA HFE guidance. Include critical task identification, study design, representative user groups, use scenarios, task completion rates, use error analysis, and residual use-related risk assessment.",
          textarea: true,
        },
      ],
    },
    {
      id: "labelling",
      title: "Labelling",
      description:
        "Proposed device labelling that will serve as the basis for labelling requirements in the new classification regulation.",
      fields: [
        {
          id: "device_labels",
          label: "Device & Package Labels",
          hint: "Proposed label artwork for device label, immediate container, and outer packaging. Include all required elements: device name, manufacturer, model/catalog/lot numbers, UDI, sterilization indicators, Rx symbol, and applicable ISO 15223-1 symbols.",
        },
        {
          id: "instructions_for_use",
          label: "Instructions for Use",
          hint: "Complete IFU including: indications for use (matching the proposed classification), contraindications, warnings, precautions, adverse events, device description, setup/operating instructions, maintenance, technical specifications, and any information required by proposed special controls.",
          textarea: true,
        },
        {
          id: "professional_labelling",
          label: "Professional / Clinical Labelling",
          hint: "Labelling directed at healthcare professionals, including clinical decision guidance, procedural instructions, interpretation guides (for diagnostics), and any required training materials specified in proposed special controls.",
          textarea: true,
        },
        {
          id: "patient_labelling",
          label: "Patient-Directed Labelling",
          hint: "Any patient-facing materials: patient information leaflet, quick start guide (for home-use devices), or patient implant information. Written at appropriate health literacy level. Must be consistent with proposed indications and warnings.",
          textarea: true,
        },
        {
          id: "proposed_labelling_requirements",
          label: "Proposed Labelling Special Controls",
          hint: "Specific labelling requirements proposed as special controls for the new classification. These may include mandatory warnings, specific performance data disclosures, training requirements, or patient information requirements that future manufacturers of this device type must include.",
          textarea: true,
        },
      ],
    },
    {
      id: "design_controls",
      title: "Design Controls",
      description:
        "Evidence of design control compliance per 21 CFR 820.30 supporting the De Novo device development.",
      fields: [
        {
          id: "design_control_summary",
          label: "Design Control Summary",
          hint: "Summary of design control activities per 21 CFR 820.30: design planning, design input, design output, design review, design verification, design validation, design transfer, and design changes. Include the Design History File (DHF) structure and key design decisions.",
          textarea: true,
        },
        {
          id: "design_inputs",
          label: "Design Inputs & User Needs",
          hint: "Summary of design inputs derived from user needs, intended use, applicable standards, and regulatory requirements. Include performance requirements, safety requirements, interface requirements, and human factors requirements that guided device development.",
          textarea: true,
        },
        {
          id: "design_verification",
          label: "Design Verification Summary",
          hint: "Summary of design verification activities confirming design outputs meet design inputs through testing, inspection, and analysis. Include a traceability matrix linking design inputs to verification test results and pass/fail status.",
          textarea: true,
        },
        {
          id: "design_validation",
          label: "Design Validation Summary",
          hint: "Summary of design validation confirming the device meets user needs and intended uses under actual or simulated use conditions. Include clinical simulations, usability validation (IEC 62366-1), and any clinical data demonstrating the device functions as intended.",
          textarea: true,
        },
        {
          id: "design_transfer",
          label: "Design Transfer & Design Changes",
          hint: "Evidence that the device design was correctly translated into production specifications (design transfer per 21 CFR 820.30(h)). Document any design changes made after design freeze, including change rationale, impact assessment, and re-verification/re-validation activities.",
          textarea: true,
        },
      ],
    },
    {
      id: "manufacturing_quality",
      title: "Manufacturing & Quality System",
      description:
        "Manufacturing process information and quality system overview demonstrating the device can be consistently produced to specifications.",
      fields: [
        {
          id: "manufacturing_process",
          label: "Manufacturing Process Description",
          hint: "Description of the manufacturing process, including process flow diagram, critical process steps, in-process inspection/test points, special processes requiring validation per 21 CFR 820.75, and finished device acceptance testing. Sufficient detail to support assessment that the device can be consistently manufactured.",
          textarea: true,
        },
        {
          id: "process_validation",
          label: "Process Validation Summary",
          hint: "Summary of validation activities for special processes (sterilization, welding, sealing, molding, etc.) including IQ/OQ/PQ results. Include validation parameters, acceptance criteria, and conclusions regarding process capability.",
          textarea: true,
        },
        {
          id: "quality_system",
          label: "Quality System Overview",
          hint: "Overview of the Quality Management System addressing 21 CFR 820 requirements: management responsibility, CAPA, document control, purchasing controls, production and process controls, and complaint handling. For proposed Class II devices, these become applicable general controls.",
          textarea: true,
        },
        {
          id: "supplier_controls",
          label: "Supplier Management & Incoming Quality",
          hint: "Description of supplier qualification, ongoing supplier management, and incoming material/component inspection procedures. Identify critical suppliers and describe controls ensuring purchased materials meet device master record specifications.",
          textarea: true,
        },
      ],
    },
  ],
};

const US_HDE: RegulatoryFramework = {
  id: "US_HDE",
  countryCode: "US",
  countryName: "United States",
  flag: "🇺🇸",
  authority: "Humanitarian Device Exemption (FDA CDRH)",
  documentType: "Humanitarian Device Exemption (HDE)",
  sections: [
    {
      id: "cover_letter",
      title: "Cover Letter & Transmittal",
      description:
        "Formal cover letter transmitting the HDE application to FDA CDRH under Section 520(m) of the FD&C Act.",
      fields: [
        {
          id: "cover_letter_text",
          label: "Cover Letter",
          hint: "Formal letter addressed to CDRH requesting approval of a Humanitarian Device Exemption under Section 520(m) of the FD&C Act. Reference the Humanitarian Use Device (HUD) designation number granted by OOPD (Office of Orphan Products Development) and summarize the unmet medical need.",
          textarea: true,
        },
        {
          id: "contact_person",
          label: "Contact Person",
          hint: "Name, title, phone, and email of the primary regulatory contact for the HDE application. Include mailing address for official FDA correspondence.",
        },
        {
          id: "presubmission_reference",
          label: "Pre-Submission / Q-Sub Reference",
          hint: "Reference number(s) of any Pre-Submission meetings with FDA related to this HDE, including feedback on study design, probable benefit evidence, and population estimates.",
        },
        {
          id: "user_fee_information",
          label: "User Fee Information",
          hint: "HDEs are exempt from MDUFA user fees per Section 520(m)(6). Include a statement referencing this exemption. If any prior 510(k) or PMA user fees were paid for this device, reference those payments.",
        },
      ],
    },
    {
      id: "administrative",
      title: "Administrative Information",
      description:
        "Applicant and device identification details required per 21 CFR 814.104 for the HDE application.",
      fields: [
        {
          id: "applicant_name",
          label: "HDE Applicant Name",
          hint: "Legal name of the entity submitting the HDE application. The HDE holder will be responsible for all post-approval obligations including annual distribution reports and profit/non-profit compliance per Section 520(m)(3).",
        },
        {
          id: "applicant_address",
          label: "Applicant Address & Facilities",
          hint: "Complete business address and addresses of all manufacturing, assembly, and testing facilities. Include FEI numbers for all FDA-registered establishments.",
        },
        {
          id: "device_name",
          label: "Device Trade & Common Name",
          hint: "Proprietary/trade name and common/generic name of the device. The common name should clearly describe the device type and its humanitarian application.",
        },
        {
          id: "product_code_classification",
          label: "Product Code & Classification",
          hint: "FDA product code and classification regulation number. HDEs can be approved for devices that would otherwise require a PMA (Class III) or devices for which no classification regulation exists. Identify the applicable classification panel.",
        },
        {
          id: "establishment_registration",
          label: "Establishment Registration & Listing",
          hint: "FDA Establishment Registration Number (FEI) and Device Listing Number per 21 CFR 807. All facilities involved in the manufacture of the HDE device must be registered.",
        },
      ],
    },
    {
      id: "hud_designation",
      title: "HUD Designation & Population",
      description:
        "Humanitarian Use Device designation information and evidence supporting the population threshold requirement under 21 CFR 814.102.",
      fields: [
        {
          id: "hud_designation_number",
          label: "HUD Designation Number",
          hint: "The Humanitarian Use Device (HUD) designation number assigned by FDA's Office of Orphan Products Development (OOPD). Include the HUD designation request date, granting date, and the designated indication. The HUD designation must be obtained before HDE submission.",
        },
        {
          id: "disease_condition",
          label: "Disease or Condition Description",
          hint: "Detailed medical description of the disease or condition the device is intended to treat or diagnose. Include pathophysiology, natural history, current standard of care, and why existing approved devices or treatments are inadequate for this population.",
          textarea: true,
        },
        {
          id: "population_estimate",
          label: "Annual Patient Population Estimate",
          hint: "Evidence that the device is intended to benefit a patient population of not more than 8,000 individuals per year in the United States (per FDARA 2017 amendment, increased from 4,000). Include epidemiological data sources, prevalence/incidence calculations, and methodology for estimating the U.S. population that would be eligible for treatment/diagnosis with this device.",
          textarea: true,
        },
        {
          id: "population_data_sources",
          label: "Population Data Sources & Methodology",
          hint: "Identify all data sources used for population estimates (e.g., CDC databases, SEER, national registries, published epidemiological studies, ICD code analyses). Describe the methodology for deriving the estimate, including any assumptions or limitations in the data.",
          textarea: true,
        },
        {
          id: "unmet_medical_need",
          label: "Unmet Medical Need Justification",
          hint: "Justification that no comparable device is available to treat or diagnose this condition, or that existing devices are inadequate. Describe the treatment gap that the HUD device addresses and why the small population makes commercial development through the PMA pathway impractical.",
          textarea: true,
        },
      ],
    },
    {
      id: "device_description",
      title: "Device Description",
      description:
        "Technical description of the HDE device per 21 CFR 814.104(b)(3).",
      fields: [
        {
          id: "physical_description",
          label: "Physical Description & Mechanism of Action",
          hint: "Complete description of the device's physical characteristics, components, and mechanism of action. Include annotated photographs, engineering drawings, and diagrams explaining how the device addresses the designated disease/condition.",
          textarea: true,
        },
        {
          id: "technical_specifications",
          label: "Technical Specifications",
          hint: "Performance specifications with nominal values and acceptance ranges for all critical device parameters. Focus on specifications directly related to the therapeutic or diagnostic function.",
          textarea: true,
        },
        {
          id: "materials",
          label: "Materials of Construction",
          hint: "Materials used in device construction, with specifications for patient-contacting materials. Include biocompatibility classification per ISO 10993-1 based on contact type and duration.",
          textarea: true,
        },
        {
          id: "components_accessories",
          label: "Components, Accessories & Software",
          hint: "All components, accessories, and models included in the HDE application. If the device includes software, describe its function, safety classification, and regulatory status of any companion devices or accessories.",
          textarea: true,
        },
        {
          id: "device_variants",
          label: "Device Sizes & Configurations",
          hint: "All sizes, models, and configurations covered by this HDE application. Describe how the range of variants addresses the clinical needs of the target population (e.g., different sizes for anatomical variation).",
        },
      ],
    },
    {
      id: "indications_for_use",
      title: "Indications for Use",
      description:
        "Statement of intended use and indications for use, consistent with the HUD designation.",
      fields: [
        {
          id: "indications_statement",
          label: "Indications for Use",
          hint: "Statement of the specific intended use and indications for the device. Must be consistent with and not broader than the HUD designation. Describe the disease/condition, patient selection criteria, and clinical endpoints that define successful treatment.",
          textarea: true,
        },
        {
          id: "target_population",
          label: "Target Patient Population",
          hint: "Detailed description of the intended patient population, including demographics, disease stage/severity, and clinical criteria. Must be consistent with the population used in the HUD population estimate (≤8,000 per year).",
        },
        {
          id: "contraindications",
          label: "Contraindications",
          hint: "Conditions or patient characteristics that preclude safe use of the device. Include both absolute and relative contraindications identified through clinical experience, risk analysis, and any available clinical data.",
          textarea: true,
        },
        {
          id: "use_environment",
          label: "Intended Use Environment & User",
          hint: "Clinical settings and healthcare professional qualifications required for safe and effective use of the device. Specify any required training, institutional capabilities, or facility requirements.",
        },
      ],
    },
    {
      id: "probable_benefit",
      title: "Probable Benefit",
      description:
        "Evidence demonstrating probable benefit to health from use of the device per 21 CFR 814.104(b)(5). The HDE standard requires probable benefit, not reasonable assurance of effectiveness.",
      fields: [
        {
          id: "probable_benefit_summary",
          label: "Summary of Probable Benefit",
          hint: "Concise summary of the probable benefit to health that outweighs the risk of injury or illness from use of the device, considering the probable risks and benefits of currently available devices or alternative treatments. Note: the HDE standard is 'probable benefit,' which is a lower evidentiary standard than the PMA 'reasonable assurance of effectiveness.'",
          textarea: true,
        },
        {
          id: "clinical_data",
          label: "Clinical Data Supporting Probable Benefit",
          hint: "All available clinical data supporting probable benefit, including: feasibility clinical studies, compassionate use/emergency use data, published case reports and case series, clinical experience from outside the U.S., and physician-reported outcomes. While a controlled clinical trial is not required, all available clinical evidence should be presented.",
          textarea: true,
        },
        {
          id: "nonclinical_evidence",
          label: "Non-Clinical Evidence of Benefit",
          hint: "Non-clinical (bench, animal, computational) data supporting the probable benefit of the device. Include in vitro testing, animal efficacy studies, biomechanical analyses, and any modeling/simulation data that support the device's mechanism of action and therapeutic/diagnostic effect.",
          textarea: true,
        },
        {
          id: "literature_evidence",
          label: "Published Literature Evidence",
          hint: "Systematic review of published literature supporting the probable benefit of the device technology, including peer-reviewed articles, case reports, conference proceedings, and systematic reviews. Include search methodology and critical appraisal of evidence quality.",
          textarea: true,
        },
        {
          id: "benefit_risk_analysis",
          label: "Benefit-Risk Analysis",
          hint: "Structured analysis comparing the probable benefits of the device to its risks, considering: the severity of the target disease/condition, availability and effectiveness of alternative treatments, risk profile of alternatives, and the unmet medical need. Demonstrate that probable benefit outweighs risk of injury or illness per Section 520(m)(2)(C).",
          textarea: true,
        },
      ],
    },
    {
      id: "risk_safety",
      title: "Safety & Risk Analysis",
      description:
        "Safety data and risk analysis demonstrating the device does not pose an unreasonable or significant risk of illness or injury per 21 CFR 814.104(b)(4).",
      fields: [
        {
          id: "safety_data",
          label: "Safety Data Summary",
          hint: "All available safety data including adverse events from clinical use, complications, device failures/malfunctions, and any deaths or serious injuries associated with device use. Include data from U.S. and international clinical experience, even if limited in scope.",
          textarea: true,
        },
        {
          id: "risk_analysis",
          label: "Risk Analysis per ISO 14971",
          hint: "Formal risk analysis per ISO 14971 identifying all reasonably foreseeable hazards, hazardous situations, and harms. Include severity and probability estimation, risk evaluation, risk control measures, and residual risk assessment.",
          textarea: true,
        },
        {
          id: "biocompatibility",
          label: "Biocompatibility Evaluation",
          hint: "Biocompatibility evaluation per ISO 10993-1 appropriate for the device's patient contact nature and duration. Include material characterization and biological endpoint testing results (cytotoxicity, sensitization, irritation, and additional endpoints as required).",
          textarea: true,
        },
        {
          id: "bench_testing",
          label: "Non-Clinical Performance Testing",
          hint: "Bench testing results demonstrating the device meets critical performance specifications and is safe for its intended use. Include mechanical testing, functional testing, electrical safety/EMC (if applicable), sterilization validation (if applicable), and software V&V (if applicable).",
          textarea: true,
        },
      ],
    },
    {
      id: "irb_requirements",
      title: "IRB Approval & Institutional Requirements",
      description:
        "Requirements for Institutional Review Board approval and oversight for HDE device use at healthcare facilities per 21 CFR 814.124.",
      fields: [
        {
          id: "irb_approval_requirement",
          label: "IRB Approval Requirement",
          hint: "Description of the IRB approval requirement per 21 CFR 814.124. An HDE-approved device may only be used in facilities that have an IRB constituted under 21 CFR 56 that has approved the use of the device to treat or diagnose the specific condition. Detail how IRB oversight will be obtained and maintained.",
          textarea: true,
        },
        {
          id: "irb_approval_documentation",
          label: "IRB Approval Documentation",
          hint: "If available, provide copies of IRB approvals from institutions where the device has been or will be used. Include the IRB's review of the probable benefit/risk profile and any conditions of approval imposed by the IRB.",
          textarea: true,
        },
        {
          id: "informed_consent",
          label: "Informed Consent Process",
          hint: "Description of the informed consent process for patients receiving the HDE device. Include the proposed informed consent form addressing: humanitarian use status, available alternatives, probable benefits and risks, and that effectiveness has not been demonstrated to the level required for PMA.",
          textarea: true,
        },
        {
          id: "institutional_training",
          label: "Institutional & Physician Training Plan",
          hint: "Training program for physicians and clinical staff who will use the device, including: didactic training, hands-on training (cadaver lab, simulation), proctoring requirements for initial cases, and ongoing competency assessment. Required by many IRBs as a condition of HDE use approval.",
          textarea: true,
        },
        {
          id: "patient_registry",
          label: "Patient Registry / Tracking Plan",
          hint: "Plan for tracking all patients who receive the HDE device, including a patient registry if required by FDA as a condition of HDE approval. Include data elements collected, follow-up schedule, data analysis plan, and how registry data will support annual distribution reports and ongoing benefit-risk assessment.",
          textarea: true,
        },
      ],
    },
    {
      id: "labelling",
      title: "Labelling",
      description:
        "Device labelling per 21 CFR 814.104(b)(8), including the mandatory HDE labelling statement required by 21 CFR 814.116.",
      fields: [
        {
          id: "hde_labelling_statement",
          label: "Mandatory HDE Labelling Statement",
          hint: "Per 21 CFR 814.116, the labelling must bear the following statement: 'Humanitarian Device. Authorized by Federal law for use in [treatment/diagnosis of specified disease/condition]. The effectiveness of this device for this use has not been demonstrated.' This statement must be prominently displayed on device label and all labelling materials.",
        },
        {
          id: "device_labels",
          label: "Device & Package Labels",
          hint: "Label artwork for the device, immediate container, and outer packaging. Must include the mandatory HDE statement, device name, manufacturer, model/lot/serial numbers, UDI, and all applicable symbols. The HDE statement must be legible and prominent.",
        },
        {
          id: "instructions_for_use",
          label: "Instructions for Use",
          hint: "Complete IFU including: mandatory HDE statement, indications (matching HDE approval), contraindications, warnings (including that effectiveness has not been demonstrated to PMA standard), precautions, adverse events/complications, device description, procedural instructions, and technical specifications.",
          textarea: true,
        },
        {
          id: "physician_information",
          label: "Physician / Healthcare Provider Information",
          hint: "Professional-directed information including surgical technique, implant sizing guide (if applicable), follow-up recommendations, complication management, and any mandatory training prerequisites before device use. Include the requirement for IRB approval at the treating institution.",
          textarea: true,
        },
      ],
    },
    {
      id: "postmarket",
      title: "Post-Approval Obligations",
      description:
        "Post-approval reporting and distribution requirements specific to HDE-approved devices per 21 CFR 814.126.",
      fields: [
        {
          id: "annual_distribution_report",
          label: "Annual Distribution Report Plan",
          hint: "Plan for submitting annual distribution reports per 21 CFR 814.126(b)(1), detailing: the number of devices distributed (sold/donated), the names and addresses of all facilities to which devices were distributed, and the indications for which the device was used at each facility. Due annually on the anniversary of HDE approval.",
          textarea: true,
        },
        {
          id: "profit_nonprofit_status",
          label: "Profit / Non-Profit Compliance",
          hint: "Statement regarding whether the HDE holder intends to distribute the device at a profit or not for profit. Per Section 520(m)(3), devices approved under HDE generally may not be sold for profit unless the device is intended for a condition that affects pediatric patients (age <22 years at diagnosis) or unless a profit waiver has been granted. Document compliance approach.",
          textarea: true,
        },
        {
          id: "mdr_plan",
          label: "Medical Device Reporting (MDR) Plan",
          hint: "MDR plan per 21 CFR 803 for reporting deaths, serious injuries, and malfunctions associated with the HDE device. Include complaint handling procedures, MDR decision trees, report submission timelines (5-day and 30-day reports), and trending analysis.",
          textarea: true,
        },
        {
          id: "postmarket_surveillance",
          label: "Post-Market Surveillance Commitments",
          hint: "Any post-market surveillance commitments, either voluntary or as a condition of HDE approval. Include plans for collecting ongoing safety and benefit data, periodic benefit-risk reassessment, and any FDA-mandated postmarket studies (522 orders) if applicable.",
          textarea: true,
        },
      ],
    },
  ],
};

export const US_FRAMEWORKS: RegulatoryFramework[] = [
  US_510K,
  US_PMA,
  US_DENOVO,
  US_HDE,
];
