import { Schema, model, models, Types } from "mongoose";

export type UploadedDoc = {
  fileId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  extractedText: string;
  uploadedAt: Date;
};

export type StandardsRow = {
  standard: string;       // e.g. IEC 60601-1
  applicability: string;  // e.g. Electrical safety
  status: 'applicable' | 'not-applicable' | 'under-review';
  docRef: string;
};

export type TechnicalDossier = {
  // Section 1 — Device Description & Specification (Schedule V §1)
  sec1: {
    deviceDescription: string;
    modelNumbers: string;
    variants: string;
    dimensions: string;
    materials: string;
    accessories: string;
    contraindications: string;
    completionPct: number;
  };
  // Section 2 — Labelling & IFU (Schedule V §2, MDR Rule 9)
  sec2: {
    labelText: string;
    ifuText: string;
    storageConditions: string;
    shelfLife: string;
    sterilityInfo: string;
    labelDocUrl: string;
    ifuDocUrl: string;
    completionPct: number;
  };
  // Section 3 — Design & Manufacturing Information (Schedule V §3)
  sec3: {
    manufacturingSite: string;
    manufacturerAddress: string;
    manufacturingProcess: string;
    sterilizationMethod: string;
    designControlsApplied: boolean;
    iso13485CertUrl: string;
    completionPct: number;
  };
  // Section 4 — Risk Management (Schedule V §4, ISO 14971)
  sec4: {
    riskManagementStandard: string;
    hazardsIdentified: string;
    riskControlMeasures: string;
    residualRiskAcceptable: boolean;
    riskBenefitSummary: string;
    rmfDocUrl: string;
    completionPct: number;
  };
  // Section 5 — Testing & Verification (Schedule V §5)
  sec5: {
    performanceTested: boolean;
    electricalSafetyStandard: string;
    biocompatibilityDone: boolean;
    biocompatibilityStandard: string;
    softwareLifecycleDone: boolean;
    sterilizationValidationDone: boolean;
    shelfLifeTested: boolean;
    standardsMatrix: StandardsRow[];
    completionPct: number;
  };
  // Section 6 — Clinical Evaluation (Schedule V §6) — Class B/C/D
  sec6: {
    clinicalEvalRequired: boolean;
    cerStatus: 'not-started' | 'in-progress' | 'complete';
    clinicalDataSource: string;
    literatureReviewDone: boolean;
    clinicalTrialDone: boolean;
    cerDocUrl: string;
    completionPct: number;
  };
  // Section 7 — Post-Market Surveillance Plan (Schedule V §7) — Class C/D
  sec7: {
    pmsPlanRequired: boolean;
    pmsPlanStatus: 'not-started' | 'in-progress' | 'complete';
    psurFrequency: string;
    vigilanceSetup: boolean;
    pmsPlanUrl: string;
    completionPct: number;
  };
  overallCompletionPct: number;
  lastUpdated: Date;
};

export type ProductDocument = {
  _id: string;
  userId: Types.ObjectId;
  name: string;
  manufacturer: string;
  description: string;
  deviceClass: "A" | "B" | "C" | "D";
  deviceType: "medical-device" | "ivd";
  intendedUse: string;
  countries: string[];
  status: "draft" | "active" | "archived";
  uploadedDocs: UploadedDoc[];
  technicalDossier?: TechnicalDossier;
  createdAt: Date;
  updatedAt: Date;
};

const productSchema = new Schema<ProductDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 300 },
    manufacturer: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, trim: true, maxlength: 5000, default: "" },
    deviceClass: { type: String, enum: ["A", "B", "C", "D"], default: "B", required: true },
    deviceType: { type: String, enum: ["medical-device", "ivd"], default: "ivd", required: true },
    intendedUse: { type: String, trim: true, maxlength: 3000, default: "" },
    countries: { type: [String], default: ["IN"] },
    status: { type: String, enum: ["draft", "active", "archived"], default: "draft" },
    uploadedDocs: { type: [{
      fileId: { type: String, required: true },
      originalName: { type: String, required: true },
      mimeType: { type: String, default: "application/pdf" },
      sizeBytes: { type: Number, default: 0 },
      extractedText: { type: String, default: "" },
      uploadedAt: { type: Date, default: Date.now },
    }], default: [] },
    technicalDossier: {
      type: {
        sec1: {
          deviceDescription: { type: String, default: '' },
          modelNumbers: { type: String, default: '' },
          variants: { type: String, default: '' },
          dimensions: { type: String, default: '' },
          materials: { type: String, default: '' },
          accessories: { type: String, default: '' },
          contraindications: { type: String, default: '' },
          completionPct: { type: Number, default: 0 },
        },
        sec2: {
          labelText: { type: String, default: '' },
          ifuText: { type: String, default: '' },
          storageConditions: { type: String, default: '' },
          shelfLife: { type: String, default: '' },
          sterilityInfo: { type: String, default: '' },
          labelDocUrl: { type: String, default: '' },
          ifuDocUrl: { type: String, default: '' },
          completionPct: { type: Number, default: 0 },
        },
        sec3: {
          manufacturingSite: { type: String, default: '' },
          manufacturerAddress: { type: String, default: '' },
          manufacturingProcess: { type: String, default: '' },
          sterilizationMethod: { type: String, default: '' },
          designControlsApplied: { type: Boolean, default: false },
          iso13485CertUrl: { type: String, default: '' },
          completionPct: { type: Number, default: 0 },
        },
        sec4: {
          riskManagementStandard: { type: String, default: '' },
          hazardsIdentified: { type: String, default: '' },
          riskControlMeasures: { type: String, default: '' },
          residualRiskAcceptable: { type: Boolean, default: false },
          riskBenefitSummary: { type: String, default: '' },
          rmfDocUrl: { type: String, default: '' },
          completionPct: { type: Number, default: 0 },
        },
        sec5: {
          performanceTested: { type: Boolean, default: false },
          electricalSafetyStandard: { type: String, default: '' },
          biocompatibilityDone: { type: Boolean, default: false },
          biocompatibilityStandard: { type: String, default: '' },
          softwareLifecycleDone: { type: Boolean, default: false },
          sterilizationValidationDone: { type: Boolean, default: false },
          shelfLifeTested: { type: Boolean, default: false },
          standardsMatrix: { type: [{ standard: String, applicability: String, status: String, docRef: String }], default: [] },
          completionPct: { type: Number, default: 0 },
        },
        sec6: {
          clinicalEvalRequired: { type: Boolean, default: true },
          cerStatus: { type: String, enum: ['not-started', 'in-progress', 'complete'], default: 'not-started' },
          clinicalDataSource: { type: String, default: '' },
          literatureReviewDone: { type: Boolean, default: false },
          clinicalTrialDone: { type: Boolean, default: false },
          cerDocUrl: { type: String, default: '' },
          completionPct: { type: Number, default: 0 },
        },
        sec7: {
          pmsPlanRequired: { type: Boolean, default: true },
          pmsPlanStatus: { type: String, enum: ['not-started', 'in-progress', 'complete'], default: 'not-started' },
          psurFrequency: { type: String, default: '' },
          vigilanceSetup: { type: Boolean, default: false },
          pmsPlanUrl: { type: String, default: '' },
          completionPct: { type: Number, default: 0 },
        },
        overallCompletionPct: { type: Number, default: 0 },
        lastUpdated: { type: Date, default: Date.now },
      },
      default: {},
    },
  },
  { timestamps: true },
);

export const Product = models.Product || model<ProductDocument>("Product", productSchema);
