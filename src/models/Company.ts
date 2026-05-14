import { Schema, model, models, Document } from "mongoose";

export interface CompanyDocument extends Document {
  companyName: string;
  companyEmail: string;
  companyPassword?: string;
  companyNumber?: string;
  description?: string;
  country?: string;
  businessGenesis?: {
    secA: {
      gst: { status: 'pending' | 'in-progress' | 'complete'; number: string; documentUrl: string };
      msme: { status: 'pending' | 'in-progress' | 'complete'; number: string; documentUrl: string };
      iec: { status: 'pending' | 'in-progress' | 'complete'; number: string; documentUrl: string };
      shopEstablishment: { status: 'pending' | 'in-progress' | 'complete'; documentUrl: string };
      professionalTax: { status: 'pending' | 'in-progress' | 'complete'; documentUrl: string };
      esicEpfo: { status: 'pending' | 'in-progress' | 'complete'; documentUrl: string };
    };
    secB: {
      entityType: 'pvt-ltd' | 'llp' | 'opc' | 'partnership' | 'sole-prop' | '';
      cin: string;
      pan: string;
      tan: string;
      incorporationDate?: Date;
      incorporationDocUrl: string;
    };
    secC: {
      bankAccountOpened: boolean;
      adCodeObtained: boolean;
    };
    secD: {
      trademarkStatus: 'not-filed' | 'filed' | 'registered' | '';
      trademarkNumber: string;
      domainRegistered: boolean;
      patentFiled: boolean;
    };
    secE: {
      tamAnalysisDone: boolean;
      competitorScanDone: boolean;
      regulatoryPathwayChosen: boolean;
      targetCountries: string[];
    };
    overallCompletionPct: number;
    lastUpdated: Date;
  };
  deviceClassification?: {
    // Step 1 — Device Identity
    deviceName: string;
    intendedUse: string;
    isIVD: boolean;
    isSoftware: boolean;
    isImplantable: boolean;
    // Step 2 — MDR 2017 Classification (India)
    mdrClass: 'A' | 'B' | 'C' | 'D' | '';
    mdrClassRationale: string;
    // Step 3 — Global Regulatory Targets
    targetRegulations: Array<'CDSCO' | 'FDA-510k' | 'FDA-PMA' | 'EU-MDR' | 'CE-IVD' | 'ANVISA' | 'TGA'>;
    // Step 4 — Predicate & Classification Evidence
    predicateDeviceName: string;
    predicateDeviceNumber: string;
    hsCode: string;
    // Meta
    classificationLocked: boolean;
    lockedAt?: Date;
    completionPct: number;
    lastUpdated: Date;
  };
  qms?: {
    iso13485: {
      managementResponsibility: number;
      resourceManagement: number;
      productRealization: number;
      measurementAnalysis: number;
    };
    sops: Array<{
      id: string;
      title: string;
      status: 'draft' | 'in-review' | 'approved';
      version: string;
      effectiveDate?: Date;
      documentUrl?: string;
    }>;
    capas: Array<{
      id: string;
      title: string;
      description: string;
      status: 'open' | 'investigating' | 'implemented' | 'closed';
      rootCause?: string;
      actionTaken?: string;
      openedDate: Date;
      closedDate?: Date;
    }>;
    completionPct: number;
    lastUpdated: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<CompanyDocument>(
  {
    companyName: { type: String, required: true },
    companyEmail: { type: String, required: true, unique: true },
    companyPassword: { type: String, required: true },
    companyNumber: { type: String, required: false },
    description: { type: String, required: false },
    country: { type: String, required: false },
    businessGenesis: {
      type: {
        secA: {
          gst: {
            status: { type: String, enum: ['pending', 'in-progress', 'complete'], default: 'pending' },
            number: { type: String, default: "" },
            documentUrl: { type: String, default: "" },
          },
          msme: {
            status: { type: String, enum: ['pending', 'in-progress', 'complete'], default: 'pending' },
            number: { type: String, default: "" },
            documentUrl: { type: String, default: "" },
          },
          iec: {
            status: { type: String, enum: ['pending', 'in-progress', 'complete'], default: 'pending' },
            number: { type: String, default: "" },
            documentUrl: { type: String, default: "" },
          },
          shopEstablishment: {
            status: { type: String, enum: ['pending', 'in-progress', 'complete'], default: 'pending' },
            documentUrl: { type: String, default: "" },
          },
          professionalTax: {
            status: { type: String, enum: ['pending', 'in-progress', 'complete'], default: 'pending' },
            documentUrl: { type: String, default: "" },
          },
          esicEpfo: {
            status: { type: String, enum: ['pending', 'in-progress', 'complete'], default: 'pending' },
            documentUrl: { type: String, default: "" },
          },
        },
        secB: {
          entityType: { type: String, enum: ['pvt-ltd', 'llp', 'opc', 'partnership', 'sole-prop', ''], default: '' },
          cin: { type: String, default: "" },
          pan: { type: String, default: "" },
          tan: { type: String, default: "" },
          incorporationDate: { type: Date },
          incorporationDocUrl: { type: String, default: "" },
        },
        secC: {
          bankAccountOpened: { type: Boolean, default: false },
          adCodeObtained: { type: Boolean, default: false },
        },
        secD: {
          trademarkStatus: { type: String, enum: ['not-filed', 'filed', 'registered', ''], default: '' },
          trademarkNumber: { type: String, default: "" },
          domainRegistered: { type: Boolean, default: false },
          patentFiled: { type: Boolean, default: false },
        },
        secE: {
          tamAnalysisDone: { type: Boolean, default: false },
          competitorScanDone: { type: Boolean, default: false },
          regulatoryPathwayChosen: { type: Boolean, default: false },
          targetCountries: { type: [String], default: [] },
        },
        overallCompletionPct: { type: Number, default: 0 },
        lastUpdated: { type: Date, default: Date.now },
      },
      default: {},
    },
    deviceClassification: {
      type: {
        deviceName: { type: String, default: '' },
        intendedUse: { type: String, default: '' },
        isIVD: { type: Boolean, default: false },
        isSoftware: { type: Boolean, default: false },
        isImplantable: { type: Boolean, default: false },
        mdrClass: { type: String, enum: ['A', 'B', 'C', 'D', ''], default: '' },
        mdrClassRationale: { type: String, default: '' },
        targetRegulations: { type: [String], default: [] },
        predicateDeviceName: { type: String, default: '' },
        predicateDeviceNumber: { type: String, default: '' },
        hsCode: { type: String, default: '' },
        classificationLocked: { type: Boolean, default: false },
        lockedAt: { type: Date },
        completionPct: { type: Number, default: 0 },
        lastUpdated: { type: Date, default: Date.now },
      },
      default: {},
    },
    qms: {
      type: {
        iso13485: {
          managementResponsibility: { type: Number, default: 0 },
          resourceManagement: { type: Number, default: 0 },
          productRealization: { type: Number, default: 0 },
          measurementAnalysis: { type: Number, default: 0 },
        },
        sops: {
          type: [{
            id: { type: String, required: true },
            title: { type: String, required: true },
            status: { type: String, enum: ['draft', 'in-review', 'approved'], default: 'draft' },
            version: { type: String, default: '1.0' },
            effectiveDate: { type: Date },
            documentUrl: { type: String, default: '' },
          }],
          default: [],
        },
        capas: {
          type: [{
            id: { type: String, required: true },
            title: { type: String, required: true },
            description: { type: String, default: '' },
            status: { type: String, enum: ['open', 'investigating', 'implemented', 'closed'], default: 'open' },
            rootCause: { type: String, default: '' },
            actionTaken: { type: String, default: '' },
            openedDate: { type: Date, default: Date.now },
            closedDate: { type: Date },
          }],
          default: [],
        },
        completionPct: { type: Number, default: 0 },
        lastUpdated: { type: Date, default: Date.now },
      },
      default: {},
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

export const Company = models.Company || model<CompanyDocument>("Company", CompanySchema);
