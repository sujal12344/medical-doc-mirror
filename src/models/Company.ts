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
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

export const Company = models.Company || model<CompanyDocument>("Company", CompanySchema);
