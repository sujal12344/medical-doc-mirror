import { Schema, model, models, Types } from "mongoose";

export type UploadedDoc = {
  fileId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  extractedText: string;
  uploadedAt: Date;
};

export type ProductDocument = {
  _id: string;
  userId: Types.ObjectId; // Kept as userId for compatibility, but refers to Company
  name: string;
  manufacturer: string;
  description: string;
  deviceClass: "A" | "B" | "C" | "D";
  deviceType: "medical-device" | "ivd";
  intendedUse: string;
  countries: string[];
  status: "draft" | "active" | "archived";
  uploadedDocs: UploadedDoc[];
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
  },
  { timestamps: true },
);

export const Product = models.Product || model<ProductDocument>("Product", productSchema);
