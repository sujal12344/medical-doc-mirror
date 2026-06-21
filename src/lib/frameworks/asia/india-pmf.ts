import type { RegulatoryFramework } from "../types";

export const IN_PMF_FRAMEWORK: RegulatoryFramework = {
  id: "IN_PMF",
  countryCode: "IN",
  countryName: "India",
  flag: "🇮🇳",
  authority: "CDSCO",
  documentType: "Plant Master File (IVD)",
  deviceType: "ivd",

  sections: [
    {
      id: "s1",
      title: "1.0 General Information",
      description: "General details of the manufacturing site and activities",
      fields: [
        { id: "1.1", label: "Site Name", hint: "Legal name of manufacturing site" },
        { id: "1.2", label: "Site Address", hint: "Complete address of manufacturing facility", textarea: true },
        { id: "1.3", label: "Relationship with Other Sites", hint: "Parent company, subsidiaries, contract sites", textarea: true },
        { id: "1.4", label: "Brief History of Company", hint: "Year established and organizational background", textarea: true },
        { id: "1.5", label: "Manufacturing Activities", hint: "Brief description of products and manufacturing operations", textarea: true },
        { id: "1.6", label: "Manufacturing Flow", hint: "Raw material receipt to finished goods release", textarea: true },
        { id: "1.7", label: "Product Categories", hint: "Biochemistry, Hematology, ELISA, CLIA, FIA, Molecular Diagnostics", textarea: true },
        { id: "1.8", label: "Flow Diagram", hint: "Manufacturing process flow diagram", textarea: true }
      ]
    },
    {
      id: "s2",
      title: "2.0 Personnel",
      description: "Organization structure, qualifications and training",
      fields: [
        { id: "2.1", label: "Organization Chart", hint: "Hierarchy of key personnel", textarea: true },
        { id: "2.2", label: "Factory Manager Details", hint: "Qualification, experience and responsibilities", textarea: true },
        { id: "2.3", label: "Head QA/QC Details", hint: "Qualification, experience and responsibilities", textarea: true },
        { id: "2.4", label: "Technical Staff Details", hint: "Production, QC, R&D personnel details", textarea: true },
        { id: "2.5", label: "Training Policy", hint: "Documented training procedure", textarea: true },
        { id: "2.6", label: "Basic Training Program", hint: "Induction and onboarding training", textarea: true },
        { id: "2.7", label: "In-Service Training Program", hint: "Continuous training and competency evaluation", textarea: true },
        { id: "2.8", label: "Training Records", hint: "Method for maintaining training records", textarea: true }
      ]
    },
    {
      id: "s3",
      title: "3.0 Premises and Facilities",
      description: "Layout and environmental controls",
      fields: [
        { id: "3.1", label: "Layout of Premises", hint: "Scaled layout drawings", textarea: true },
        { id: "3.2", label: "Construction Materials", hint: "Walls, partitions, flooring and finishes", textarea: true },
        { id: "3.3", label: "Ventilation System", hint: "AHU, HEPA filters, airflow and room classification", textarea: true },
        { id: "3.4", label: "Critical Areas", hint: "Grade A/B/C/D areas and contamination controls", textarea: true },
        { id: "3.5", label: "Pressure Differentials", hint: "Positive pressure and monitoring arrangements", textarea: true },
        { id: "3.6", label: "Temperature and Humidity Control", hint: "Environmental controls in manufacturing areas", textarea: true },
        { id: "3.7", label: "Special Areas", hint: "Handling of hazardous or sensitizing materials", textarea: true },
        { id: "3.8", label: "Waste Disposal Areas", hint: "Biomedical waste handling and segregation", textarea: true },
        { id: "3.9", label: "Water System", hint: "Purified water generation and distribution", textarea: true },
        { id: "3.10", label: "Maintenance of Premises", hint: "Preventive maintenance of facility", textarea: true }
      ]
    },
    {
      id: "s4",
      title: "4.0 Equipment",
      description: "Production and quality control equipment",
      fields: [
        { id: "4.1", label: "Production Equipment", hint: "Major manufacturing equipment list", textarea: true },
        { id: "4.2", label: "Quality Control Equipment", hint: "Major QC laboratory instruments", textarea: true },
        { id: "4.3", label: "Preventive Maintenance Program", hint: "Scheduled maintenance activities", textarea: true },
        { id: "4.4", label: "Maintenance Recording System", hint: "Equipment history and maintenance records", textarea: true },
        { id: "4.5", label: "Equipment Qualification", hint: "DQ, IQ, OQ and PQ details", textarea: true },
        { id: "4.6", label: "Calibration Program", hint: "Calibration procedures and schedules", textarea: true },
        { id: "4.7", label: "Calibration Records", hint: "Traceability and certificates", textarea: true },
        { id: "4.8", label: "Computerized System Validation", hint: "LIMS, CMMS and software validation", textarea: true }
      ]
    },
    {
      id: "s5",
      title: "5.0 Sanitation",
      description: "Cleaning and sanitation procedures",
      fields: [
        { id: "5.1", label: "Cleaning Procedures", hint: "Written SOPs for cleaning", textarea: true },
        { id: "5.2", label: "Cleaning Agents Used", hint: "Disinfectants and cleaning chemicals", textarea: true },
        { id: "5.3", label: "Cleaning Frequency", hint: "Daily, weekly and monthly schedules", textarea: true },
        { id: "5.4", label: "Equipment Cleaning", hint: "Cleaning procedures for equipment", textarea: true },
        { id: "5.5", label: "Cleaning Records", hint: "Documentation and logbooks", textarea: true }
      ]
    },
    {
      id: "s6",
      title: "6.0 Production",
      description: "Manufacturing operations and controls",
      fields: [
        { id: "6.1", label: "Product Categories", hint: "Products manufactured at site", textarea: true },
        { id: "6.2", label: "Manufacturing Process Flow", hint: "Process flow from receipt to release", textarea: true },
        { id: "6.3", label: "In-Process Controls", hint: "Monitoring during production", textarea: true },
        { id: "6.4", label: "Batch Numbering System", hint: "Lot identification and traceability", textarea: true },
        { id: "6.5", label: "Packaging Operations", hint: "Labeling and packing procedures", textarea: true },
        { id: "6.6", label: "Rework and Reprocessing", hint: "Procedure for reworked products", textarea: true },
        { id: "6.7", label: "Validation of Manufacturing Processes", hint: "Process validation activities", textarea: true }
      ]
    },
    {
      id: "s7",
      title: "7.0 Quality Assurance",
      description: "Quality system and batch release",
      fields: [
        { id: "7.1", label: "Quality Management System", hint: "ISO 13485 based QMS", textarea: true },
        { id: "7.2", label: "Quality Assurance Activities", hint: "Responsibilities of QA department", textarea: true },
        { id: "7.3", label: "Document Control System", hint: "Control of procedures and forms", textarea: true },
        { id: "7.4", label: "Internal Audit Program", hint: "Audit schedules and findings", textarea: true },
        { id: "7.5", label: "CAPA System", hint: "Corrective and preventive actions", textarea: true },
        { id: "7.6", label: "Supplier Qualification", hint: "Approved vendor management", textarea: true },
        { id: "7.7", label: "Risk Management", hint: "Risk assessment activities", textarea: true },
        { id: "7.8", label: "Complaint Handling", hint: "Post-market feedback and vigilance", textarea: true },
        { id: "7.9", label: "Finished Product Release Procedure", hint: "Batch release by QA", textarea: true }
      ]
    },
    {
      id: "s8",
      title: "8.0 Storage",
      description: "Storage policy and environmental controls",
      fields: [
        { id: "8.1", label: "Storage Policy", hint: "Product preservation procedures", textarea: true },
        { id: "8.2", label: "Room Temperature Storage", hint: "15–30°C conditions", textarea: true },
        { id: "8.3", label: "Cold Storage", hint: "2–8°C conditions", textarea: true },
        { id: "8.4", label: "Deep Freezer Storage", hint: "-20°C conditions", textarea: true },
        { id: "8.5", label: "Environmental Monitoring", hint: "Temperature and humidity monitoring", textarea: true },
        { id: "8.6", label: "Alarm Systems", hint: "Out-of-specification alarm procedures", textarea: true },
        { id: "8.7", label: "FIFO / FEFO System", hint: "Inventory control system", textarea: true },
        { id: "8.8", label: "Quarantine Area", hint: "Rejected and nonconforming material storage", textarea: true }
      ]
    },
    {
      id: "s9",
      title: "9.0 Documentation",
      description: "Documentation and record control",
      fields: [
        { id: "9.1", label: "Document Control Procedure", hint: "Creation, approval and revision", textarea: true },
        { id: "9.2", label: "Master Documents", hint: "SOPs, specifications and forms", textarea: true },
        { id: "9.3", label: "Record Retention Policy", hint: "Retention period and archival", textarea: true },
        { id: "9.4", label: "Electronic Records", hint: "Computerized documentation system", textarea: true }
      ]
    },
    {
      id: "s10",
      title: "10.0 Internal Audit",
      description: "Self-inspection and audit program",
      fields: [
        { id: "10.1", label: "Internal Audit Procedure", hint: "Self-inspection process", textarea: true },
        { id: "10.2", label: "Audit Frequency", hint: "Annual or periodic schedules", textarea: true },
        { id: "10.3", label: "Audit Team", hint: "Qualified internal auditors", textarea: true },
        { id: "10.4", label: "Audit Findings and CAPA", hint: "Follow-up actions", textarea: true }
      ]
    },
    {
      id: "s11",
      title: "11.0 Distribution and Complaints",
      description: "Distribution and customer feedback",
      fields: [
        { id: "11.1", label: "Distribution System", hint: "Warehousing and transportation", textarea: true },
        { id: "11.2", label: "Distribution Records", hint: "Traceability records", textarea: true },
        { id: "11.3", label: "Complaint Handling System", hint: "Complaint registration and investigation", textarea: true },
        { id: "11.4", label: "Field Safety Corrective Actions", hint: "Recall and FSCA procedures", textarea: true }
      ]
    },
    {
      id: "s12",
      title: "12.0 Product Recall",
      description: "Recall procedures and effectiveness checks",
      fields: [
        { id: "12.1", label: "Recall Procedure", hint: "Written product recall SOP", textarea: true },
        { id: "12.2", label: "Recall Classification", hint: "Class I, II and III recalls", textarea: true },
        { id: "12.3", label: "Recall Communication", hint: "Notification to customers and authorities", textarea: true },
        { id: "12.4", label: "Mock Recall Exercises", hint: "Recall effectiveness verification", textarea: true }
      ]
    }
  ]
};
