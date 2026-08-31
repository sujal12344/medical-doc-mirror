import { 
  FormGroup, 
  FormGroupId,
  ApplicationFormId,
  CommercialManufacturingFormId,
  SmallQuantityTestingFormId,
  CommercialImportFormId,
  PersonalUseImportFormId,
  ClinicalTrialsEvaluationFormId,
  NewDeviceApprovalsFormId,
  AuditTestingBodiesFormId,
  MarketSaleDistributionFormId,
  AuditInspectionRecordsFormId,
  InspectionRecordsSaleDistributionFormId,
} from '../form-types';

export const COMMERCIAL_MANUFACTURING_GROUP: FormGroup<'commercial-manufacturing', CommercialManufacturingFormId> = {
  id: 'commercial-manufacturing',
  name: 'Commercial Manufacturing',
  description: 'Domestic manufacturing and loan licenses for all device risk classes.',
  forms: [
    {
      id: 'MD-3',
      name: 'Application Form MD-3',
      description: 'Manufacture for Sale (Class A/B)',
      summary: "License to manufacture low to moderate risk medical devices or IVDs for commercial sale and distribution in India.",
      requiredContexts: ['PRODUCT_MULTI'],
      documents: [
        { fileName: '01_Covering_Letter_Template.docx', name: 'Covering Letter', source: 'FORM' },
        { fileName: '02_Official_Form_Template.docx', name: 'Official Form', source: 'FORM' },
        { fileName: '03_Constitution_Details_of_Manufacturer_Template.docx', name: 'Constitution Details of Manufacturer', source: 'LEGAL' },
        { fileName: '04_Site_Plant_Master_File_Template.docx', name: 'Site Plant Master File', source: 'PMF' },
        { fileName: '05_Device_Master_File_Non_IVD_Template.docx', name: 'Device Master File Non IVD', source: 'DMF', conditionRule: "context.product?.deviceType === 'medical-device'", badgeLabel: 'Non-IVD Only' },
        { fileName: '06_Device_Master_File_IVD_Template.docx', name: 'Device Master File IVD', source: 'DMF', conditionRule: "context.product?.deviceType === 'ivd'", badgeLabel: 'IVD Only' },
        { fileName: '07_Essential_Principles_Checklist_Template.docx', name: 'Essential Principles Checklist', source: 'DMF' },
        { fileName: '08_Fifth_Schedule_QMS_Compliance_Undertaking_Template.docx', name: 'Fifth Schedule QMS Compliance Undertaking', source: 'LEGAL' },
      ]
    },
    {
      id: 'MD-4',
      name: 'Application Form MD-4',
      description: 'Loan Licence to Manufacture (Class A/B)',
      summary: "Permission to use the manufacturing facilities of another licensee for commercial production of Class A/B devices.",
      requiredContexts: ['PRODUCT_MULTI'],
      documents: [
        { fileName: '01_Covering_Letter_Template.docx', name: 'Covering Letter', source: 'FORM' },
        { fileName: '02_Official_Form_Template.docx', name: 'Official Form', source: 'FORM' },
        { fileName: '03_Constitution_Details_Template.docx', name: 'Constitution Details', source: 'LEGAL' },
        { fileName: '04_Site_Plant_Master_File_Template.docx', name: 'Site Plant Master File', source: 'PMF' },
        { fileName: '05_Device_Master_File_or_Class_A_Technical_Information_Template.docx', name: 'Device Master File or Class A Technical Information', source: 'DMF' },
        { fileName: '06_Fifth_Schedule_QMS_Compliance_Undertaking_Template.docx', name: 'Fifth Schedule QMS Compliance Undertaking', source: 'LEGAL' },
      ]
    },
    {
      id: 'MD-7',
      name: 'Application Form MD-7',
      description: 'Manufacture for Sale (Class C/D)',
      summary: "License to manufacture high to very high risk medical devices or IVDs, requiring extensive quality and clinical data.",
      requiredContexts: ['PRODUCT_MULTI'],
      documents: [
        { fileName: '01_Covering_Letter_Template.docx', name: 'Covering Letter', source: 'FORM' },
        { fileName: '02_Official_Form_Template.docx', name: 'Official Form', source: 'FORM' },
        { fileName: '03_Constitution_Details_Template.docx', name: 'Constitution Details', source: 'LEGAL' },
        { fileName: '04_Plant_Master_File_Appendix_I_Template.docx', name: 'Plant Master File Appendix I', source: 'PMF' },
        { fileName: '05_QMS_Compliance_Undertaking_Template.docx', name: 'QMS Compliance Undertaking', source: 'LEGAL' },
        { fileName: '06_QMS_Requirements_and_Environmental_Summary_Template.docx', name: 'QMS Requirements and Environmental Summary', source: 'QMS' },
        { fileName: '07_Device_Master_File_Appendix_II_Template.docx', name: 'Device Master File Appendix II', source: 'DMF' },
        { fileName: '08_IVD_Device_Master_File_Appendix_III_Template_CONDITIONAL.docx', name: 'IVD Device Master File Appendix III  CONDITIONAL', source: 'DMF' },
      ]
    },
    {
      id: 'MD-8',
      name: 'Application Form MD-8',
      description: 'Loan Licence to Manufacture (Class C/D)',
      summary: "Permission to utilize another licensees facility to manufacture high risk devices under a loan arrangement.",
      requiredContexts: ['PRODUCT_MULTI'],
      documents: [
        { fileName: '01_Covering_Letter_Template.docx', name: 'Covering Letter', source: 'FORM' },
        { fileName: '01_MD8_Covering_Letter_Template.docx', name: 'MD8 Covering Letter', source: 'FORM' },
        { fileName: '02_Official_Form_Template.docx', name: 'Official Form', source: 'FORM' },
        { fileName: '03_Constitution_Details_Template.docx', name: 'Constitution Details', source: 'LEGAL' },
        { fileName: '04_Applicant_Manufacturer_Agreement_Template.docx', name: 'Applicant Manufacturer Agreement', source: 'LEGAL' },
        { fileName: '05_Plant_Master_File_Template.docx', name: 'Plant Master File', source: 'PMF' },
        { fileName: '06_QMS_Compliance_Undertaking_Template.docx', name: 'QMS Compliance Undertaking', source: 'LEGAL' },
        { fileName: '07_QMS_Requirements_Summary_Template.docx', name: 'QMS Requirements Summary', source: 'QMS' },
        { fileName: '08_Device_Master_File_Template.docx', name: 'Device Master File', source: 'DMF' },
        { fileName: '09_Essential_Principles_Checklist_Template.docx', name: 'Essential Principles Checklist', source: 'DMF' },
        { fileName: '10_IVD_Performance_Evaluation_Report_Template_CONDITIONAL.docx', name: 'IVD Performance Evaluation Report  CONDITIONAL', source: 'DMF' },
      ]
    },
  ]
};

export const SMALL_QUANTITY_TESTING_GROUP: FormGroup<'small-quantity-testing', SmallQuantityTestingFormId> = {
  id: 'small-quantity-testing',
  name: 'Small Quantity Testing',
  description: 'Manufacturing or importing small batches strictly for lab testing, analysis, or demonstration.',
  forms: [
    {
      id: 'MD-12',
      name: 'Application Form MD-12',
      description: 'Manufacture for Test/Evaluation',
      summary: "License to manufacture limited quantities of a device purely for clinical investigation, testing, or demonstration.",
      requiredContexts: ['PRODUCT_MULTI'],
      documents: [
      ]
    },
    {
      id: 'MD-16',
      name: 'Application Form MD-16',
      description: 'Import for Test/Evaluation',
      summary: "License to import limited quantities of unapproved medical devices strictly for testing or clinical trials.",
      requiredContexts: ['PRODUCT_MULTI'],
      documents: [
      ]
    },
  ]
};

export const COMMERCIAL_IMPORT_GROUP: FormGroup<'commercial-import', CommercialImportFormId> = {
  id: 'commercial-import',
  name: 'Commercial Import',
  description: 'Importing medical devices and In-Vitro Diagnostics (IVDs) in bulk for commercial sale.',
  forms: [
    {
      id: 'MD-14',
      name: 'Application Form MD-14',
      description: 'Commercial Import Licence',
      summary: "Comprehensive license allowing authorized Indian agents to import and sell foreign-manufactured medical devices.",
      requiredContexts: ['PRODUCT_MULTI'],
      documents: [
        { fileName: '01_Covering_Letter_Template.docx', name: 'Covering Letter', source: 'FORM' },
        { fileName: '02_Official_Form_Template.docx', name: 'Official Form', source: 'FORM' },
        { fileName: '03_Power_of_Attorney_and_Authorized_Agent_Undertaking_Template.docx', name: 'Power of Attorney and Authorized Agent Undertaking', source: 'LEGAL' },
        { fileName: '04_Constitution_Details_of_Authorized_Agent_Template.docx', name: 'Constitution Details of Authorized Agent', source: 'LEGAL' },
        { fileName: '05_Manufacturer_Declaration_of_Conformity_Template.docx', name: 'Manufacturer Declaration of Conformity', source: 'DMF' },
        { fileName: '06_Plant_Master_File_Appendix_I_Template.docx', name: 'Plant Master File Appendix I', source: 'PMF' },
        { fileName: '07_Device_Master_File_Appendix_II_Template.docx', name: 'Device Master File Appendix II', source: 'DMF' },
      ]
    },
  ]
};

export const PERSONAL_USE_IMPORT_GROUP: FormGroup<'personal-use-import', PersonalUseImportFormId> = {
  id: 'personal-use-import',
  name: 'Personal Use Import',
  description: 'Application for permission to import a small quantity of a medical device for bona fide personal use.',
  forms: [
    {
      id: 'MD-20',
      name: 'Application Form MD-20',
      description: 'Import for Personal Use',
      summary: "Permission for patients to legally import small quantities of medical devices prescribed for their personal treatment.",
      requiredContexts: ['PRODUCT_SINGLE'],
      documents: [
        { fileName: '01_Covering_Letter_Template.docx', name: 'Covering Letter', source: 'FORM' },
        { fileName: 'MD-20.docx', name: 'MD-20', source: 'DMF' },
        { fileName: 'Supporting_01_Bona_Fide_Personal_Use_Declaration.docx', name: 'Supporting 01 Bona Fide Personal Use Declaration', source: 'DMF' },
        { fileName: 'Supporting_02_Registered_Medical_Practitioner_Prescription.docx', name: 'Supporting 02 Registered Medical Practitioner Prescription', source: 'DMF' },
      ]
    },
  ]
};

export const CLINICAL_TRIALS_EVALUATION_GROUP: FormGroup<'clinical-trials-evaluation', ClinicalTrialsEvaluationFormId> = {
  id: 'clinical-trials-evaluation',
  name: 'Clinical Trials & Evaluation',
  description: 'Conducting human clinical trials for devices or clinical performance evaluations for IVDs.',
  forms: [
    {
      id: 'MD-22',
      name: 'Application Form MD-22',
      description: 'Conduct Clinical Investigation',
      summary: "Approval from CDSCO to initiate a clinical trial for an investigational medical device involving human participants.",
      requiredContexts: ['PRODUCT_SINGLE'],
      documents: [
        { fileName: '01_Cover_Letter_Template.docx', name: 'Cover Letter', source: 'FORM' },
        { fileName: '02_Official_Form_Template.docx', name: 'Official Form', source: 'FORM' },
        { fileName: '03_Device_Classification_Justification_Template.docx', name: 'Device Classification Justification', source: 'DMF' },
        { fileName: '04_Design_Analysis_Report_Template.docx', name: 'Design Analysis Report', source: 'DMF' },
        { fileName: '05_Sponsor_Principal_Investigator_Agreement_Template.docx', name: 'Sponsor Principal Investigator Agreement', source: 'LEGAL' },
        { fileName: '06_AE_SAE_Reporting_Forms_Template.docx', name: 'AE SAE Reporting Forms', source: 'DMF' },
        { fileName: '07_Investigator_Brochure_Template.docx', name: 'Investigator Brochure', source: 'CLINICAL' },
        { fileName: '08_Clinical_Investigation_Plan_Template.docx', name: 'Clinical Investigation Plan', source: 'CLINICAL' },
        { fileName: '09_Case_Report_Form_Template.docx', name: 'Case Report Form', source: 'CLINICAL' },
        { fileName: '10_Patient_Information_and_Informed_Consent_Template.docx', name: 'Patient Information and Informed Consent', source: 'CLINICAL' },
        { fileName: '11_Investigator_Undertaking_Template.docx', name: 'Investigator Undertaking', source: 'LEGAL' },
      ]
    },
    {
      id: 'MD-24',
      name: 'Application Form MD-24',
      description: 'Clinical Performance Evaluation (IVD)',
      summary: "Permission to evaluate the performance and safety of a new In-Vitro Diagnostic (IVD) device using clinical specimens.",
      requiredContexts: ['PRODUCT_SINGLE'],
      documents: [
        { fileName: '01_Cover_Letter_Template.docx', name: 'Cover Letter', source: 'FORM' },
        { fileName: '02_Form_MD24_with_Annexure.docx', name: 'Form MD24 with Annexure', source: 'FORM' },
        { fileName: '03_IVD_Device_Description_IFU_and_Labels.docx', name: 'IVD Device Description IFU and Labels', source: 'DMF' },
        { fileName: '04_In_House_Performance_Evaluation_Report.docx', name: 'In House Performance Evaluation Report', source: 'DMF' },
        { fileName: '05_Clinical_Performance_Evaluation_Plan.docx', name: 'Clinical Performance Evaluation Plan', source: 'DMF' },
        { fileName: '06_Case_Report_Form.docx', name: 'Case Report Form', source: 'CLINICAL' },
        { fileName: '07_Investigator_Undertaking.docx', name: 'Investigator Undertaking', source: 'LEGAL' },
        { fileName: '08_Device_Conformity_and_Safety_Undertaking.docx', name: 'Device Conformity and Safety Undertaking', source: 'LEGAL' },
      ]
    },
  ]
};

export const NEW_DEVICE_APPROVALS_GROUP: FormGroup<'new-device-approvals', NewDeviceApprovalsFormId> = {
  id: 'new-device-approvals',
  name: 'New Device Approvals',
  description: 'First-time approval for entirely new medical devices or IVDs that do not have an existing predicate in the market.',
  forms: [
    {
      id: 'MD-26',
      name: 'Application Form MD-26',
      description: 'New Device Approval (No Predicate)',
      summary: "Marketing authorization for innovative medical devices that do not have an equivalent predicate device currently on the market.",
      requiredContexts: ['PRODUCT_SINGLE'],
      documents: [
        { fileName: '01_Cover_Letter_Template.docx', name: 'Cover Letter', source: 'FORM' },
        { fileName: '02_Official_Form_Template.docx', name: 'Official Form', source: 'FORM' },
        { fileName: '03_Device_Classification_Justification_Template.docx', name: 'Device Classification Justification', source: 'DMF' },
        { fileName: '04_Design_Analysis_and_VV_Report_Template.docx', name: 'Design Analysis and VV Report', source: 'DMF' },
        { fileName: '05_Essential_Principles_Checklist_Template.docx', name: 'Essential Principles Checklist', source: 'DMF' },
        { fileName: '06_Risk_Management_Report_Template.docx', name: 'Risk Management Report', source: 'DMF' },
        { fileName: '07_Proposed_IFU_Template.docx', name: 'Proposed IFU', source: 'DMF' },
        { fileName: '08_Proposed_Labelling_Specification_Template.docx', name: 'Proposed Labelling Specification', source: 'DMF' },
        { fileName: '09_Clinical_Investigation_Report_Template.docx', name: 'Clinical Investigation Report', source: 'CLINICAL' },
        { fileName: '10_Stability_Study_Report_Conditional_Template.docx', name: 'Stability Study Report Conditional', source: 'DMF' },
        { fileName: '11_Biocompatibility_and_Animal_Performance_Conditional_Template.docx', name: 'Biocompatibility and Animal Performance Conditional', source: 'DMF' },
        { fileName: '12_Regulatory_Market_PMS_and_Indian_Population_Conditional_Template.docx', name: 'Regulatory Market PMS and Indian Population Conditional', source: 'DMF' },
        { fileName: '13_Clinical_Investigation_Waiver_Request_Conditional_Template.docx', name: 'Clinical Investigation Waiver Request Conditional', source: 'CLINICAL' },
        { fileName: '14_Post_Marketing_Clinical_Investigation_Undertaking_Conditional_Template.docx', name: 'Post Marketing Clinical Investigation Undertaking Conditional', source: 'LEGAL' },
        { fileName: '15_Drug_Device_Combination_Data_Conditional_Template.docx', name: 'Drug Device Combination Data Conditional', source: 'DMF' },
      ]
    },
    {
      id: 'MD-28',
      name: 'Application Form MD-28',
      description: 'New IVD Approval',
      summary: "Application to import or manufacture a completely new In-Vitro Diagnostic (IVD) that lacks a predicate in the Indian market.",
      requiredContexts: ['PRODUCT_SINGLE'],
      documents: [
        { fileName: '01_Cover_Letter_Template.docx', name: 'Cover Letter', source: 'FORM' },
        { fileName: '02_Official_Form_Template.docx', name: 'Official Form', source: 'FORM' },
        { fileName: '03_Fifth_Schedule_Compliance_Undertaking_Template.docx', name: 'Fifth Schedule Compliance Undertaking', source: 'LEGAL' },
        { fileName: '04_Site_or_Plant_Master_File_Template.docx', name: 'Site or Plant Master File', source: 'PMF' },
        { fileName: '05_IVD_Device_Master_File_Template.docx', name: 'IVD Device Master File', source: 'DMF' },
        { fileName: '06_Device_Data_and_Validation_Report_Template.docx', name: 'Device Data and Validation Report', source: 'DMF' },
        { fileName: '07_Risk_Management_Report_Template.docx', name: 'Risk Management Report', source: 'DMF' },
        { fileName: '08_Clinical_Performance_Evaluation_Data_Report_Template.docx', name: 'Clinical Performance Evaluation Data Report', source: 'DMF' },
        { fileName: '09_Regulatory_Status_and_Restrictions_Statement_Template.docx', name: 'Regulatory Status and Restrictions Statement', source: 'DMF' },
        { fileName: '10_Essential_Principles_Checklist_Template.docx', name: 'Essential Principles Checklist', source: 'DMF' },
        { fileName: '11_Product_Insert_Template.docx', name: 'Product Insert', source: 'DMF' },
        { fileName: '12_Labelling_and_Pack_Size_Specification_Template.docx', name: 'Labelling and Pack Size Specification', source: 'DMF' },
        { fileName: '13_Stability_Study_Report_Template.docx', name: 'Stability Study Report', source: 'DMF' },
        { fileName: '14_Power_of_Attorney_Import_Only_Template.docx', name: 'Power of Attorney Import Only', source: 'LEGAL' },
        { fileName: '15_Authorised_Agent_Undertaking_Import_Only_Template.docx', name: 'Authorised Agent Undertaking Import Only', source: 'LEGAL' },
        { fileName: '16_to_FSC_Product_Correlation_Chart_Import_Only_Template.docx', name: 'to FSC Product Correlation Chart Import Only', source: 'EXTERNAL' },
        { fileName: '17_CPE_Waiver_Request_Conditional_Template.docx', name: 'CPE Waiver Request Conditional', source: 'DMF' },
      ]
    },
  ]
};

export const AUDIT_TESTING_BODIES_GROUP: FormGroup<'audit-testing-bodies', AuditTestingBodiesFormId> = {
  id: 'audit-testing-bodies',
  name: 'Audit & Testing Bodies',
  description: 'Registering third-party auditing agencies (Notified Bodies) and authorized private testing laboratories.',
  forms: [
    {
      id: 'MD-1',
      name: 'Application Form MD-1',
      description: 'Register Notified Body',
      summary: "Registration for third-party auditing organizations authorized to inspect Class A and Class B manufacturing facilities.",
      documents: [
        { fileName: '01_Covering_Letter_Template.docx', name: 'Covering Letter', source: 'FORM' },
        { fileName: '02_Constitution_Details_Template.docx', name: 'Constitution Details', source: 'LEGAL' },
        { fileName: '03_Organisation_Audit_Business_Profile_Template.docx', name: 'Organisation Audit Business Profile', source: 'QMS' },
        { fileName: '04_SOP_Master_List_Template.docx', name: 'SOP Master List', source: 'QMS' },
        { fileName: '05_Technical_Personnel_and_Outside_Experts_List_Template.docx', name: 'Technical Personnel and Outside Experts List', source: 'DMF' },
        { fileName: '06_Independence_and_Conflict_of_Interest_Undertaking_Template.docx', name: 'Independence and Conflict of Interest Undertaking', source: 'LEGAL' },
        { fileName: '07_Official_Form_Template.docx', name: 'Official Form', source: 'FORM' },
        { fileName: '08_Quality_Manual_of_the_Organisation_Template.docx', name: 'Quality Manual of the Organisation', source: 'QMS' },
        { fileName: 'Form_Application_Template.docx', name: 'Form Application', source: 'DMF' },
      ]
    },
    {
      id: 'MD-39',
      name: 'Application Form MD-39',
      description: 'Register Testing Laboratory',
      summary: "Approval for private testing laboratories to carry out testing and evaluation of medical devices on behalf of manufacturers.",
      documents: [
        { fileName: '01_Covering_Letter_Template.docx', name: 'Covering Letter', source: 'FORM' },
        { fileName: '02_Official_Form_Template.docx', name: 'Official Form', source: 'FORM' },
        { fileName: '03_Organisation_Chart_and_Key_Personnel_Template.docx', name: 'Organisation Chart and Key Personnel', source: 'QMS' },
        { fileName: '04_Technical_Staff_and_Person_In-Charge_List_Template.docx', name: 'Technical Staff and Person In-Charge List', source: 'DMF' },
        { fileName: '05_Equipment_Apparatus_and_Instruments_List_Template.docx', name: 'Equipment Apparatus and Instruments List', source: 'DMF' },
        { fileName: '06_Contract_Activities_Statement_Template.docx', name: 'Contract Activities Statement', source: 'DMF' },
        { fileName: '07_Laboratory_QMS_Requirements_Template.docx', name: 'Laboratory QMS Requirements', source: 'QMS' },
        { fileName: '08_Training_Needs_and_Competence_Procedure_Template.docx', name: 'Training Needs and Competence Procedure', source: 'DMF' },
        { fileName: '09_Standard_and_Test_Method_Master_List_Template.docx', name: 'Standard and Test Method Master List', source: 'DMF' },
        { fileName: '10_SOP_Master_List_Template.docx', name: 'SOP Master List', source: 'QMS' },
      ]
    },
  ]
};

export const MARKET_SALE_DISTRIBUTION_GROUP: FormGroup<'market-sale-distribution', MarketSaleDistributionFormId> = {
  id: 'market-sale-distribution',
  name: 'Market Sale & Distribution',
  description: 'Registration for wholesalers, stockists, and retailers to legally sell and distribute devices.',
  forms: [
    {
      id: 'MD-41',
      name: 'Application Form MD-41',
      description: 'Registration to Sell/Distribute',
      summary: "Mandatory registration certificate for wholesalers, retailers, and distributors dealing in medical devices.",
      requiredContexts: ['PRODUCT_MULTI'],
      documents: [
        { fileName: '01_Official_Form_Template.docx', name: 'Official Form', source: 'FORM' },
        { fileName: '02_Good_Distribution_Compliance_Self-Certificate_Template.docx', name: 'Good Distribution Compliance Self-Certificate', source: 'DMF' },
        { fileName: '03_Other_Activities_at_Premises_Statement_Template.docx', name: 'Other Activities at Premises Statement', source: 'DMF' },
        { fileName: '04_Storage_Requirements_Compliance_Undertaking_Template.docx', name: 'Storage Requirements Compliance Undertaking', source: 'LEGAL' },
      ]
    },
  ]
};

export const AUDIT_INSPECTION_RECORDS_GROUP: FormGroup<'audit-inspection-records', AuditInspectionRecordsFormId> = {
  id: 'audit-inspection-records',
  name: 'Audit & Inspection Records',
  description: 'Prescribed audit and inspection books maintained at licensed medical-device premises for recording observations and non-conformities identified by auditors or Medical Device Officers.',
  forms: [
    {
      id: 'MD-11',
      name: 'Application Form MD-11',
      description: 'Audit/Inspection Book (Manufacturing)',
      summary: "Required record book maintained at the manufacturing site for official auditors to log observations and remarks.",
      documents: [
        { fileName: '01_Inspection_book_Template.docx', name: 'Inspection book', source: 'DMF' },
        { fileName: 'Inspection book.docx', name: 'Inspection book', source: 'DMF' },
      ]
    },
  ]
};

export const INSPECTION_RECORDS_SALE_DISTRIBUTION_GROUP: FormGroup<'inspection-records-sale-distribution', InspectionRecordsSaleDistributionFormId> = {
  id: 'inspection-records-sale-distribution',
  name: 'Sale & Distribution Inspection Records',
  description: 'Prescribed inspection book maintained by registration-certificate holders for recording observations and defects noted by Medical Device Officers at registered sale or distribution premises.',
  forms: [
    {
      id: 'MD-43',
      name: 'Application Form MD-43',
      description: 'Inspection Book (Sale/Distribution)',
      summary: "Statutory inspection book maintained by registered distributors to record observations by Medical Device Officers.",
      documents: [
        { fileName: '01_Inspection_Book_Template.docx', name: 'Inspection Book', source: 'DMF' },
      ]
    },
  ]
};

export const CDSCO_FORM_GROUPS: FormGroup<FormGroupId, ApplicationFormId>[] = [
  COMMERCIAL_MANUFACTURING_GROUP,
  SMALL_QUANTITY_TESTING_GROUP,
  COMMERCIAL_IMPORT_GROUP,
  PERSONAL_USE_IMPORT_GROUP,
  CLINICAL_TRIALS_EVALUATION_GROUP,
  NEW_DEVICE_APPROVALS_GROUP,
  AUDIT_TESTING_BODIES_GROUP,
  MARKET_SALE_DISTRIBUTION_GROUP,
  AUDIT_INSPECTION_RECORDS_GROUP,
  INSPECTION_RECORDS_SALE_DISTRIBUTION_GROUP,
];

/**
 * Dynamically determines which application forms (e.g., MD-3, MD-4) require a given generated document.
 * This ensures full traceability between foundational documents (DMF/PMF) and their required application endpoints.
 */
export function getRequiredFormsForSource(frameworkId: string): string[] {
  // Map standard document framework IDs to their underlying logical Source domain
  let source: string | null = null;
  
  if (frameworkId === 'IN_DMF' || frameworkId === 'IN_DMF_MD') source = 'DMF';
  else if (frameworkId === 'IN_PMF') source = 'PMF';
  // Future mappings (e.g., IN_QMS -> 'QMS') can simply be appended here.

  if (!source) return [];

  const requiredIn: string[] = [];
  for (const group of CDSCO_FORM_GROUPS) {
    for (const form of group.forms) {
      if (form.documents.some(d => d.source === source)) {
        requiredIn.push(form.id);
      }
    }
  }
  return requiredIn;
}
