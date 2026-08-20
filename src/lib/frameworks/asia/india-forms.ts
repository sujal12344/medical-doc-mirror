import {
  FormGroup,
  CommercialManufacturingFormId,
  SmallQuantityTestingFormId,
  CommercialImportFormId,
  ClinicalTrialsEvaluationFormId,
  NewDeviceApprovalsFormId,
  AuditTestingBodiesFormId,
  MarketSaleDistributionFormId
} from '../form-types';

export const COMMERCIAL_MANUFACTURING_GROUP: FormGroup<'commercial-manufacturing', CommercialManufacturingFormId> = {
  id: 'commercial-manufacturing',
  name: 'Commercial Manufacturing',
  description: 'Domestic manufacturing and loan licenses for all device risk classes.',
  forms: [
    {
      id: 'MD-3',
      name: 'Application Form MD-3',
      documents: [
        { fileName: '01_MD-3_Covering_Letter_Template.docx', name: 'MD-3 Covering Letter', required: true },
        { fileName: '02_Official_Form_MD-3_Template.docx', name: 'Official Form MD-3', required: true },
        { fileName: '03_Constitution_Details_of_Manufacturer_Template.docx', name: 'Constitution Details of Manufacturer', required: true },
        { fileName: '04_Site_Plant_Master_File_Template.docx', name: 'Site Plant Master File', required: true },
        { fileName: '05_Device_Master_File_Non_IVD_Template.docx', name: 'Device Master File Non IVD', required: true },
        { fileName: '06_Device_Master_File_IVD_Template.docx', name: 'Device Master File IVD', required: true },
        { fileName: '07_Essential_Principles_Checklist_Template.docx', name: 'Essential Principles Checklist', required: true },
        { fileName: '08_Fifth_Schedule_QMS_Compliance_Undertaking_Template.docx', name: 'Fifth Schedule QMS Compliance Undertaking', required: true },
      ]
    },
    {
      id: 'MD-4',
      name: 'Application Form MD-4',
      documents: [
        { fileName: '01_MD-4_Covering_Letter_Template.docx', name: 'MD-4 Covering Letter', required: true },
        { fileName: '02_Official_Form_MD-4_Template.docx', name: 'Official Form MD-4', required: true },
        { fileName: '03_Constitution_Details_Template.docx', name: 'Constitution Details', required: true },
        { fileName: '04_Site_Plant_Master_File_Template.docx', name: 'Site Plant Master File', required: true },
        { fileName: '05_Device_Master_File_or_Class_A_Technical_Information_Template.docx', name: 'Device Master File or Class A Technical Information', required: true },
        { fileName: '06_Fifth_Schedule_QMS_Compliance_Undertaking_Template.docx', name: 'Fifth Schedule QMS Compliance Undertaking', required: true },
      ]
    },
    {
      id: 'MD-7',
      name: 'Application Form MD-7',
      documents: [
        { fileName: '01_MD-7_Covering_Letter_Template.docx', name: 'MD-7 Covering Letter', required: true },
        { fileName: '02_Official_Form_MD-7_Template.docx', name: 'Official Form MD-7', required: true },
        { fileName: '03_Constitution_Details_Template.docx', name: 'Constitution Details', required: true },
        { fileName: '04_Plant_Master_File_Appendix_I_Template.docx', name: 'Plant Master File Appendix I', required: true },
        { fileName: '05_QMS_Compliance_Undertaking_Template.docx', name: 'QMS Compliance Undertaking', required: true },
        { fileName: '06_QMS_Requirements_and_Environmental_Summary_Template.docx', name: 'QMS Requirements and Environmental Summary', required: true },
        { fileName: '07_Device_Master_File_Appendix_II_Template.docx', name: 'Device Master File Appendix II', required: true },
        { fileName: '08_IVD_Device_Master_File_Appendix_III_Template_CONDITIONAL.docx', name: 'IVD Device Master File Appendix III  CONDITIONAL', required: true },
      ]
    },
    {
      id: 'MD-8',
      name: 'Application Form MD-8',
      documents: [
        { fileName: '01_MD8_Covering_Letter_Template.docx', name: 'MD8 Covering Letter', required: true },
        { fileName: '02_Official_Form_MD8_Template.docx', name: 'Official Form MD8', required: true },
        { fileName: '03_Constitution_Details_Template.docx', name: 'Constitution Details', required: true },
        { fileName: '04_Applicant_Manufacturer_Agreement_Template.docx', name: 'Applicant Manufacturer Agreement', required: true },
        { fileName: '05_Plant_Master_File_Template.docx', name: 'Plant Master File', required: true },
        { fileName: '06_QMS_Compliance_Undertaking_Template.docx', name: 'QMS Compliance Undertaking', required: true },
        { fileName: '07_QMS_Requirements_Summary_Template.docx', name: 'QMS Requirements Summary', required: true },
        { fileName: '08_Device_Master_File_Template.docx', name: 'Device Master File', required: true },
        { fileName: '09_Essential_Principles_Checklist_Template.docx', name: 'Essential Principles Checklist', required: true },
        { fileName: '10_IVD_Performance_Evaluation_Report_Template_CONDITIONAL.docx', name: 'IVD Performance Evaluation Report  CONDITIONAL', required: true },
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
      documents: [
      ]
    },
    {
      id: 'MD-16',
      name: 'Application Form MD-16',
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
      documents: [
        { fileName: '01_MD-14_Covering_Letter_Template.docx', name: 'MD-14 Covering Letter', required: true },
        { fileName: '02_Official_Form_MD-14_Template.docx', name: 'Official Form MD-14', required: true },
        { fileName: '03_Power_of_Attorney_and_Authorized_Agent_Undertaking_Template.docx', name: 'Power of Attorney and Authorized Agent Undertaking', required: true },
        { fileName: '04_Constitution_Details_of_Authorized_Agent_Template.docx', name: 'Constitution Details of Authorized Agent', required: true },
        { fileName: '05_Manufacturer_Declaration_of_Conformity_Template.docx', name: 'Manufacturer Declaration of Conformity', required: true },
        { fileName: '06_Plant_Master_File_Appendix_I_Template.docx', name: 'Plant Master File Appendix I', required: true },
        { fileName: '07_Device_Master_File_Appendix_II_Template.docx', name: 'Device Master File Appendix II', required: true },
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
      documents: [
        { fileName: '01_MD-22_Cover_Letter_Template.docx', name: 'MD-22 Cover Letter', required: true },
        { fileName: '02_Official_Form_MD-22_Template.docx', name: 'Official Form MD-22', required: true },
        { fileName: '03_MD-22_Device_Classification_Justification_Template.docx', name: 'MD-22 Device Classification Justification', required: true },
        { fileName: '04_MD-22_Design_Analysis_Report_Template.docx', name: 'MD-22 Design Analysis Report', required: true },
        { fileName: '05_MD-22_Sponsor_Principal_Investigator_Agreement_Template.docx', name: 'MD-22 Sponsor Principal Investigator Agreement', required: true },
        { fileName: '06_MD-22_AE_SAE_Reporting_Forms_Template.docx', name: 'MD-22 AE SAE Reporting Forms', required: true },
        { fileName: '07_MD-22_Investigator_Brochure_Template.docx', name: 'MD-22 Investigator Brochure', required: true },
        { fileName: '08_MD-22_Clinical_Investigation_Plan_Template.docx', name: 'MD-22 Clinical Investigation Plan', required: true },
        { fileName: '09_MD-22_Case_Report_Form_Template.docx', name: 'MD-22 Case Report Form', required: true },
        { fileName: '10_MD-22_Patient_Information_and_Informed_Consent_Template.docx', name: 'MD-22 Patient Information and Informed Consent', required: true },
        { fileName: '11_MD-22_Investigator_Undertaking_Template.docx', name: 'MD-22 Investigator Undertaking', required: true },
      ]
    },
    {
      id: 'MD-24',
      name: 'Application Form MD-24',
      documents: [
        { fileName: '01_Cover_Letter_MD24.docx', name: 'Cover Letter MD24', required: true },
        { fileName: '02_Form_MD24_with_Annexure.docx', name: 'Form MD24 with Annexure', required: true },
        { fileName: '03_IVD_Device_Description_IFU_and_Labels.docx', name: 'IVD Device Description IFU and Labels', required: true },
        { fileName: '04_In_House_Performance_Evaluation_Report.docx', name: 'In House Performance Evaluation Report', required: true },
        { fileName: '05_Clinical_Performance_Evaluation_Plan.docx', name: 'Clinical Performance Evaluation Plan', required: true },
        { fileName: '06_Case_Report_Form.docx', name: 'Case Report Form', required: true },
        { fileName: '07_Investigator_Undertaking.docx', name: 'Investigator Undertaking', required: true },
        { fileName: '08_Device_Conformity_and_Safety_Undertaking.docx', name: 'Device Conformity and Safety Undertaking', required: true },
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
      documents: [
        { fileName: '01_MD-26_Cover_Letter_Template.docx', name: 'MD-26 Cover Letter', required: true },
        { fileName: '02_Official_Form_MD-26_Template.docx', name: 'Official Form MD-26', required: true },
        { fileName: '03_MD-26_Device_Classification_Justification_Template.docx', name: 'MD-26 Device Classification Justification', required: true },
        { fileName: '04_MD-26_Design_Analysis_and_VV_Report_Template.docx', name: 'MD-26 Design Analysis and VV Report', required: true },
        { fileName: '05_MD-26_Essential_Principles_Checklist_Template.docx', name: 'MD-26 Essential Principles Checklist', required: true },
        { fileName: '06_MD-26_Risk_Management_Report_Template.docx', name: 'MD-26 Risk Management Report', required: true },
        { fileName: '07_MD-26_Proposed_IFU_Template.docx', name: 'MD-26 Proposed IFU', required: true },
        { fileName: '08_MD-26_Proposed_Labelling_Specification_Template.docx', name: 'MD-26 Proposed Labelling Specification', required: true },
        { fileName: '09_MD-26_Clinical_Investigation_Report_Template.docx', name: 'MD-26 Clinical Investigation Report', required: true },
        { fileName: '10_MD-26_Stability_Study_Report_Conditional_Template.docx', name: 'MD-26 Stability Study Report Conditional', required: true },
        { fileName: '11_MD-26_Biocompatibility_and_Animal_Performance_Conditional_Template.docx', name: 'MD-26 Biocompatibility and Animal Performance Conditional', required: true },
        { fileName: '12_MD-26_Regulatory_Market_PMS_and_Indian_Population_Conditional_Template.docx', name: 'MD-26 Regulatory Market PMS and Indian Population Conditional', required: true },
        { fileName: '13_MD-26_Clinical_Investigation_Waiver_Request_Conditional_Template.docx', name: 'MD-26 Clinical Investigation Waiver Request Conditional', required: true },
        { fileName: '14_MD-26_Post_Marketing_Clinical_Investigation_Undertaking_Conditional_Template (1).docx', name: 'MD-26 Post Marketing Clinical Investigation Undertaking Conditional  (1)', required: true },
        { fileName: '14_MD-26_Post_Marketing_Clinical_Investigation_Undertaking_Conditional_Template.docx', name: 'MD-26 Post Marketing Clinical Investigation Undertaking Conditional', required: true },
        { fileName: '15_MD-26_Drug_Device_Combination_Data_Conditional_Template.docx', name: 'MD-26 Drug Device Combination Data Conditional', required: true },
      ]
    },
    {
      id: 'MD-28',
      name: 'Application Form MD-28',
      documents: [
        { fileName: '01_MD-28_Cover_Letter_Template.docx', name: 'MD-28 Cover Letter', required: true },
        { fileName: '02_Official_Form_MD-28_Template.docx', name: 'Official Form MD-28', required: true },
        { fileName: '03_MD-28_Fifth_Schedule_Compliance_Undertaking_Template.docx', name: 'MD-28 Fifth Schedule Compliance Undertaking', required: true },
        { fileName: '04_MD-28_Site_or_Plant_Master_File_Template.docx', name: 'MD-28 Site or Plant Master File', required: true },
        { fileName: '05_MD-28_IVD_Device_Master_File_Template.docx', name: 'MD-28 IVD Device Master File', required: true },
        { fileName: '06_MD-28_Device_Data_and_Validation_Report_Template.docx', name: 'MD-28 Device Data and Validation Report', required: true },
        { fileName: '07_MD-28_Risk_Management_Report_Template.docx', name: 'MD-28 Risk Management Report', required: true },
        { fileName: '08_MD-28_Clinical_Performance_Evaluation_Data_Report_Template.docx', name: 'MD-28 Clinical Performance Evaluation Data Report', required: true },
        { fileName: '09_MD-28_Regulatory_Status_and_Restrictions_Statement_Template.docx', name: 'MD-28 Regulatory Status and Restrictions Statement', required: true },
        { fileName: '10_MD-28_Essential_Principles_Checklist_Template.docx', name: 'MD-28 Essential Principles Checklist', required: true },
        { fileName: '11_MD-28_Product_Insert_Template.docx', name: 'MD-28 Product Insert', required: true },
        { fileName: '12_MD-28_Labelling_and_Pack_Size_Specification_Template.docx', name: 'MD-28 Labelling and Pack Size Specification', required: true },
        { fileName: '13_MD-28_Stability_Study_Report_Template.docx', name: 'MD-28 Stability Study Report', required: true },
        { fileName: '14_MD-28_Power_of_Attorney_Import_Only_Template.docx', name: 'MD-28 Power of Attorney Import Only', required: true },
        { fileName: '15_MD-28_Authorised_Agent_Undertaking_Import_Only_Template.docx', name: 'MD-28 Authorised Agent Undertaking Import Only', required: true },
        { fileName: '16_MD-28_to_FSC_Product_Correlation_Chart_Import_Only_Template.docx', name: 'MD-28 to FSC Product Correlation Chart Import Only', required: true },
        { fileName: '17_MD-28_CPE_Waiver_Request_Conditional_Template.docx', name: 'MD-28 CPE Waiver Request Conditional', required: true },
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
      documents: [
        { fileName: '01_MD-1_Covering_Letter_Template.docx', name: 'MD-1 Covering Letter', required: true },
        { fileName: '02_MD-1_Constitution_Details_Template.docx', name: 'MD-1 Constitution Details', required: true },
        { fileName: '03_MD-1_Organisation_Audit_Business_Profile_Template.docx', name: 'MD-1 Organisation Audit Business Profile', required: true },
        { fileName: '04_MD-1_SOP_Master_List_Template(1).docx', name: 'MD-1 SOP Master List (1)', required: true },
        { fileName: '05_MD-1_Technical_Personnel_and_Outside_Experts_List_Template.docx', name: 'MD-1 Technical Personnel and Outside Experts List', required: true },
        { fileName: '06_MD-1_Independence_and_Conflict_of_Interest_Undertaking_Template.docx', name: 'MD-1 Independence and Conflict of Interest Undertaking', required: true },
        { fileName: '07_Official_Form_MD-1_Template.docx', name: 'Official Form MD-1', required: true },
        { fileName: '08_Quality_Manual_of_the_Organisation_Template.docx', name: 'Quality Manual of the Organisation', required: true },
        { fileName: 'Form_MD-1_Application_Template.docx', name: 'Form MD-1 Application', required: true },
      ]
    },
    {
      id: 'MD-39',
      name: 'Application Form MD-39',
      documents: [
        { fileName: '01_MD-39_Covering_Letter_Template.docx', name: 'MD-39 Covering Letter', required: true },
        { fileName: '02_Official_Form_MD-39_Template.docx', name: 'Official Form MD-39', required: true },
        { fileName: '03_MD-39_Organisation_Chart_and_Key_Personnel_Template.docx', name: 'MD-39 Organisation Chart and Key Personnel', required: true },
        { fileName: '04_MD-39_Technical_Staff_and_Person_In-Charge_List_Template.docx', name: 'MD-39 Technical Staff and Person In-Charge List', required: true },
        { fileName: '05_MD-39_Equipment_Apparatus_and_Instruments_List_Template.docx', name: 'MD-39 Equipment Apparatus and Instruments List', required: true },
        { fileName: '06_MD-39_Contract_Activities_Statement_Template.docx', name: 'MD-39 Contract Activities Statement', required: true },
        { fileName: '07_MD-39_Laboratory_QMS_Requirements_Template.docx', name: 'MD-39 Laboratory QMS Requirements', required: true },
        { fileName: '08_MD-39_Training_Needs_and_Competence_Procedure_Template.docx', name: 'MD-39 Training Needs and Competence Procedure', required: true },
        { fileName: '09_MD-39_Standard_and_Test_Method_Master_List_Template.docx', name: 'MD-39 Standard and Test Method Master List', required: true },
        { fileName: '10_MD-39_SOP_Master_List_Template.docx', name: 'MD-39 SOP Master List', required: true },
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
      documents: [
        { fileName: '01_Official_Form_MD-41_Template.docx', name: 'Official Form MD-41', required: true },
        { fileName: '02_MD-41_Good_Distribution_Compliance_Self-Certificate_Template.docx', name: 'MD-41 Good Distribution Compliance Self-Certificate', required: true },
        { fileName: '03_MD-41_Other_Activities_at_Premises_Statement_Template.docx', name: 'MD-41 Other Activities at Premises Statement', required: true },
        { fileName: '04_MD-41_Storage_Requirements_Compliance_Undertaking_Template.docx', name: 'MD-41 Storage Requirements Compliance Undertaking', required: true },
      ]
    },
  ]
};

export const CDSCO_FORM_GROUPS = [
  COMMERCIAL_MANUFACTURING_GROUP,
  SMALL_QUANTITY_TESTING_GROUP,
  COMMERCIAL_IMPORT_GROUP,
  CLINICAL_TRIALS_EVALUATION_GROUP,
  NEW_DEVICE_APPROVALS_GROUP,
  AUDIT_TESTING_BODIES_GROUP,
  MARKET_SALE_DISTRIBUTION_GROUP,
];
