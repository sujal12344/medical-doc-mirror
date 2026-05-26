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
      legalEntityExists: boolean | null;
      entityType: 'pvt-ltd' | 'llp' | 'opc' | 'partnership' | 'sole-prop' | '';
      runNameApproval: boolean;
      dscDinObtained: boolean;
      moaAoaDrafted: boolean;
      moaIncludesMedicalDeviceObject: boolean;
      spicePlusFiled: boolean;
      cin: string;
      pan: string;
      tan: string;
      incorporationDate?: Date;
      incorporationDocUrl: string;
    };
    secC: {
      bankAccountOpened: boolean;
      bankName: string;
      accountNumber: string;
      adCodeObtained: boolean;
      signatories: { name: string; designation: string }[];
    };
    secD: {
      trademarkStatus: 'not-filed' | 'filed' | 'registered' | '';
      trademarkNumber: string;
      trademarkDocUrl: string;
      domainRegistered: boolean;
      domainName: string;
      patentFiled: boolean;
      designFiled: boolean;
      ndaTemplateUrl: string;
    };
    secE: {
      tamAnalysisDone: boolean;
      reimbursementLandscapeDone: boolean;
      reimbursementNotes: string;
      competitorScanDone: boolean;
      patentLandscapeDone: boolean;
      patentLandscapeNotes: string;
      pathwayIndia: boolean;
      pathwayCE: boolean;
      pathwayFDA: boolean;
      regulatoryPathwayChosen: boolean;
      pathwayNotes: string;
      targetCountries: string[];
      trademarkPlanningDone: boolean;
    };
    overallCompletionPct: number;
    phase0Complete: boolean;
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
          legalEntityExists: { type: Boolean, default: null },
          entityType: { type: String, enum: ['pvt-ltd', 'llp', 'opc', 'partnership', 'sole-prop', ''], default: '' },
          runNameApproval: { type: Boolean, default: false },
          dscDinObtained: { type: Boolean, default: false },
          moaAoaDrafted: { type: Boolean, default: false },
          moaIncludesMedicalDeviceObject: { type: Boolean, default: false },
          spicePlusFiled: { type: Boolean, default: false },
          cin: { type: String, default: "" },
          pan: { type: String, default: "" },
          tan: { type: String, default: "" },
          incorporationDate: { type: Date },
          incorporationDocUrl: { type: String, default: "" },
        },
        secC: {
          bankAccountOpened: { type: Boolean, default: false },
          bankName: { type: String, default: "" },
          accountNumber: { type: String, default: "" },
          adCodeObtained: { type: Boolean, default: false },
          signatories: {
            type: [{ name: { type: String, default: "" }, designation: { type: String, default: "" } }],
            default: [],
            _id: false,
          },
        },
        secD: {
          trademarkStatus: { type: String, enum: ['not-filed', 'filed', 'registered', ''], default: '' },
          trademarkNumber: { type: String, default: "" },
          trademarkDocUrl: { type: String, default: "" },
          domainRegistered: { type: Boolean, default: false },
          domainName: { type: String, default: "" },
          patentFiled: { type: Boolean, default: false },
          designFiled: { type: Boolean, default: false },
          ndaTemplateUrl: { type: String, default: "" },
        },
        secE: {
          tamAnalysisDone: { type: Boolean, default: false },
          reimbursementLandscapeDone: { type: Boolean, default: false },
          reimbursementNotes: { type: String, default: "" },
          competitorScanDone: { type: Boolean, default: false },
          patentLandscapeDone: { type: Boolean, default: false },
          patentLandscapeNotes: { type: String, default: "" },
          pathwayIndia: { type: Boolean, default: true },
          pathwayCE: { type: Boolean, default: false },
          pathwayFDA: { type: Boolean, default: false },
          regulatoryPathwayChosen: { type: Boolean, default: false },
          pathwayNotes: { type: String, default: "" },
          targetCountries: { type: [String], default: ["IN"] },
          trademarkPlanningDone: { type: Boolean, default: false },
        },
        overallCompletionPct: { type: Number, default: 0 },
        phase0Complete: { type: Boolean, default: false },
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
