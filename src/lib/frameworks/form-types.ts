export type CommercialManufacturingFormId = 'MD-3' | 'MD-4' | 'MD-7' | 'MD-8';
export type SmallQuantityTestingFormId = 'MD-12' | 'MD-16';
export type CommercialImportFormId = 'MD-14';
export type ClinicalTrialsEvaluationFormId = 'MD-22' | 'MD-24';
export type NewDeviceApprovalsFormId = 'MD-26' | 'MD-28';
export type AuditTestingBodiesFormId = 'MD-1' | 'MD-39';
export type MarketSaleDistributionFormId = 'MD-41';
export type PersonalUseImportFormId = 'MD-20';
export type AuditInspectionRecordsFormId = 'MD-11';
export type InspectionRecordsSaleDistributionFormId = 'MD-43';

export type ApplicationFormId = 
  | CommercialManufacturingFormId 
  | SmallQuantityTestingFormId 
  | CommercialImportFormId 
  | ClinicalTrialsEvaluationFormId 
  | NewDeviceApprovalsFormId 
  | AuditTestingBodiesFormId 
  | MarketSaleDistributionFormId
  | PersonalUseImportFormId
  | AuditInspectionRecordsFormId
  | InspectionRecordsSaleDistributionFormId;

export type DocumentSource = 
  | 'FORM'     // Generated specifically for this application (e.g. Cover Letter, Challan, Form MD-X)
  | 'LEGAL'    // Corporate/Legal (Constitution, POA, Undertakings, Agreements)
  | 'QMS'      // Extracted from Organization Quality System (ISO 13485, SOPs, Quality Manual)
  | 'PMF'      // Extracted from Site Plant Master File (Layouts, Equipment, Site specifics)
  | 'DMF'      // Extracted from Product Device Master File (Design, IFU, Risk, Essential Principles)
  | 'CLINICAL' // Clinical Investigation & Performance (Ethics approval, Investigator Brochure)
  | 'EXTERNAL'; // Provided by 3rd party or foreign regulators (FSC, NOCs, Valid Licenses)

// Define strict Group IDs
export type FormGroupId = 
  | 'commercial-manufacturing'
  | 'small-quantity-testing'
  | 'commercial-import'
  | 'clinical-trials-evaluation'
  | 'new-device-approvals'
  | 'audit-testing-bodies'
  | 'market-sale-distribution'
  | 'personal-use-import'
  | 'audit-inspection-records'
  | 'inspection-records-sale-distribution';

// Document Template Definition (Maps to format/ folders)
export interface DocumentTemplate {
  fileName: string; // e.g., '04_Site_Plant_Master_File_Template.docx'
  name: string; // Friendly name for UI e.g., 'Site Plant Master File'
  required: boolean;
  source?: DocumentSource;
}

// Form Definition
export interface FormDefinition<TFormId extends ApplicationFormId = ApplicationFormId> {
  id: TFormId;
  name: string;
  description?: string;
  documents: DocumentTemplate[];
}

// Group Definition with strict generics
export interface FormGroup<TId extends FormGroupId, TFormId extends ApplicationFormId> {
  id: TId;
  name: string;
  description: string;
  forms: FormDefinition<TFormId>[];
}
