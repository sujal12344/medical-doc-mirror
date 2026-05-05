import type { RegulatoryFramework } from "../types";

export const TR_FRAMEWORKS: RegulatoryFramework[] = [
  {
    id: "TR_TITCK",
    countryCode: "TR",
    countryName: "Turkey",
    flag: "🇹🇷",
    authority: "TITCK",
    documentType: "Medical Device Registration",
    sections: [
      {
        id: "s1",
        title: "Administrative Information",
        description: "Applicant details, Turkish representation, and national registry identifiers",
        fields: [
          { id: "1.1", label: "Applicant / Manufacturer Name", hint: "Legal entity name of the manufacturer as registered with TITCK" },
          { id: "1.2", label: "Turkey Authorized Representative", hint: "Name and address of the authorized representative established in Turkey per Turkish MDR requirements" },
          { id: "1.3", label: "ÜTS Registration Number", hint: "Product tracking system (Ürün Takip Sistemi) registration number assigned by Turkish Ministry of Health" },
          { id: "1.4", label: "TITUBB Product Code", hint: "Turkish National Medical Device Database (TITUBB/ÜTS) product barcode and classification code" },
          { id: "1.5", label: "Device Trade Name", hint: "Commercial name and model designation of the device as it will appear in the Turkish market" },
        ],
      },
      {
        id: "s2",
        title: "Device Description",
        description: "Technical characteristics, classification, and component details",
        fields: [
          { id: "2.1", label: "Device Description", hint: "Comprehensive description of the device including operating principle, technology, and mechanism of action", textarea: true },
          { id: "2.2", label: "Intended Purpose", hint: "Specific intended medical purpose, target patient population, intended user, and clinical indication per Turkish MDR", textarea: true },
          { id: "2.3", label: "Device Classification", hint: "Risk classification (Class I, IIa, IIb, III) per Turkish MDR Annex VIII classification rules" },
          { id: "2.4", label: "Materials and Components", hint: "Bill of materials including all raw materials, sub-assemblies, and components with biological contact designation", textarea: true },
          { id: "2.5", label: "Component Specifications", hint: "Critical component specifications, tolerances, and acceptance criteria relevant to safety and performance", textarea: true },
          { id: "2.6", label: "Software Description", hint: "Software as or in a medical device: version, platform, SOUP items, cybersecurity measures, and algorithm description", textarea: true },
          { id: "2.7", label: "Variants and Accessories", hint: "All device variants, sizes, configurations, and accessories covered under this registration application", textarea: true },
        ],
      },
      {
        id: "s3",
        title: "Essential Requirements",
        description: "Compliance demonstration with Turkish MDR general safety and performance requirements",
        fields: [
          { id: "3.1", label: "Safety & Performance Requirements Checklist", hint: "Completed GSPR checklist per Turkish MDR Annex I with compliance method, applied standard, and evidence reference for each requirement", textarea: true },
          { id: "3.2", label: "Applied Harmonized Standards", hint: "List of EN/ISO standards applied to demonstrate conformity, with declaration of full or partial application", textarea: true },
          { id: "3.3", label: "Equivalence Justification", hint: "Where non-harmonized or alternative standards are used, justification demonstrating equivalent level of safety and performance", textarea: true },
        ],
      },
      {
        id: "s4",
        title: "Risk Management",
        description: "Risk management process documentation per ISO 14971",
        fields: [
          { id: "4.1", label: "Risk Management Plan", hint: "Plan per ISO 14971:2019 defining scope, risk acceptability matrix, and activities throughout device lifecycle" },
          { id: "4.2", label: "Hazard Identification and Analysis", hint: "Systematic hazard identification using techniques such as FMEA, FTA, or HAZOP for all use scenarios", textarea: true },
          { id: "4.3", label: "Risk Evaluation and Control", hint: "Risk evaluation against acceptability criteria with control measures prioritized: design, protective measures, information", textarea: true },
          { id: "4.4", label: "Overall Residual Risk Assessment", hint: "Benefit-risk analysis demonstrating overall residual risk is acceptable considering state of the art", textarea: true },
          { id: "4.5", label: "Risk Management Report", hint: "Comprehensive report confirming all risk management plan activities completed and overall residual risk acceptable", textarea: true },
        ],
      },
      {
        id: "s5",
        title: "Testing & Validation",
        description: "Standards compliance, performance testing, and product validation evidence",
        fields: [
          { id: "5.1", label: "Performance Testing Reports", hint: "Test protocols and reports demonstrating device meets all design output specifications and performance requirements", textarea: true },
          { id: "5.2", label: "Biocompatibility Assessment", hint: "Biological evaluation per ISO 10993-1 with endpoint selection, material characterization, and test reports", textarea: true },
          { id: "5.3", label: "Electrical Safety Testing", hint: "Test reports per IEC 60601-1 general safety and applicable particular/collateral standards for electrical medical devices", textarea: true },
          { id: "5.4", label: "EMC Testing", hint: "Electromagnetic compatibility test reports per IEC 60601-1-2 including emissions and immunity for intended environment", textarea: true },
          { id: "5.5", label: "Sterilization Validation", hint: "Sterilization method validation (EtO per ISO 11135, radiation per ISO 11137, steam per ISO 17665) with SAL demonstration", textarea: true },
          { id: "5.6", label: "Stability / Shelf Life Studies", hint: "Real-time and accelerated aging studies establishing claimed shelf life with acceptance criteria for critical parameters", textarea: true },
          { id: "5.7", label: "Software Verification & Validation", hint: "Software lifecycle per IEC 62304 including V&V activities, cybersecurity risk assessment, and anomaly resolution", textarea: true },
        ],
      },
      {
        id: "s6",
        title: "Clinical Evaluation",
        description: "Clinical evidence supporting device safety and performance",
        fields: [
          { id: "6.1", label: "Clinical Evaluation Report", hint: "CER per Turkish MDR Annex XIV demonstrating sufficient clinical evidence through literature, experience, or investigation data", textarea: true },
          { id: "6.2", label: "Clinical Data Summary", hint: "Summary of all clinical data including investigations, registry data, published literature, and post-market clinical data", textarea: true },
          { id: "6.3", label: "Literature Search and Review", hint: "Systematic literature search strategy, databases used, inclusion/exclusion criteria, appraisal, and analysis of findings", textarea: true },
        ],
      },
      {
        id: "s7",
        title: "Manufacturing & Quality System",
        description: "Manufacturing process details and quality management system certification",
        fields: [
          { id: "7.1", label: "Manufacturing Process Description", hint: "Detailed manufacturing flow including critical steps, process parameters, in-process controls, and final release testing", textarea: true },
          { id: "7.2", label: "Manufacturing Sites", hint: "All production, assembly, sterilization, and packaging sites with addresses, activities, and responsible persons" },
          { id: "7.3", label: "Quality Management System Certificate", hint: "Valid ISO 13485 QMS certificate from a Notified Body recognized by TITCK covering relevant device scope" },
          { id: "7.4", label: "Notified Body / Designated Body", hint: "Name and identification number of the Notified Body that issued the CE certificate or equivalent Turkish assessment" },
        ],
      },
      {
        id: "s8",
        title: "Labelling & Instructions for Use",
        description: "Turkish labelling requirements, UDI, and user information",
        fields: [
          { id: "8.1", label: "Device Labels (Turkish)", hint: "All device labels translated to Turkish per Turkish MDR Annex I with mandatory symbols per ISO 15223-1", textarea: true },
          { id: "8.2", label: "Instructions for Use (Turkish)", hint: "Complete IFU in Turkish language including indications, contraindications, warnings, precautions, and disposal instructions", textarea: true },
          { id: "8.3", label: "UDI Assignment", hint: "UDI-DI and UDI-PI assignment per Turkish UDI regulation with barcode format and database registration in ÜTS" },
          { id: "8.4", label: "Packaging and Transport Labels", hint: "Outer packaging labels including storage conditions, lot/serial number, expiry date, and transport hazard markings" },
        ],
      },
      {
        id: "s9",
        title: "Post-Market Activities",
        description: "Vigilance, adverse event reporting, and corrective actions for Turkish market",
        fields: [
          { id: "9.1", label: "Vigilance Plan", hint: "Documented plan for monitoring and reporting serious incidents and field safety corrective actions to TITCK", textarea: true },
          { id: "9.2", label: "Adverse Event Reporting to TITCK", hint: "Process for reporting adverse events within mandated timelines (immediate for serious threats, 10 days for other serious incidents)", textarea: true },
          { id: "9.3", label: "Trend Reporting", hint: "Procedures for identifying and reporting statistically significant increases in non-serious adverse events to TITCK" },
          { id: "9.4", label: "CAPA Procedures", hint: "Corrective and preventive action process triggered by complaints, adverse events, and post-market surveillance findings", textarea: true },
          { id: "9.5", label: "Post-Market Surveillance Report", hint: "Periodic summary report (annual for Class IIa+ or biennial for Class I) of PMS data, trend analysis, and conclusions", textarea: true },
        ],
      },
    ],
  },
];
