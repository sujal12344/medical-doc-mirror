import { Schema, model, models, Document } from "mongoose";

export interface CompanyDocument extends Document {
  companyName: string;
  companyEmail: string;
  companyPassword?: string;
  companyNumber?: string;
  description?: string;
  country?: string;
  businessSetup: {
    gstNumber: string;
    msmeNumber: string;
    iecCode: string;
    trademarkStatus: string;
    domainName: string;
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
    businessSetup: {
      type: {
        gstNumber: { type: String, default: "" },
        msmeNumber: { type: String, default: "" },
        iecCode: { type: String, default: "" },
        trademarkStatus: { type: String, default: "" },
        domainName: { type: String, default: "" },
      },
      default: {
        gstNumber: "",
        msmeNumber: "",
        iecCode: "",
        trademarkStatus: "",
        domainName: "",
      },
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

export const Company = models.Company || model<CompanyDocument>("Company", CompanySchema);
