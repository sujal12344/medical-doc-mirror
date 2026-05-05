import { Schema, model, models } from "mongoose";

export type DmfRecordDocument = {
  _id: string;
  productName: string;
  manufacturer: string;
  intendedUse: string;
  riskClass: "A" | "B" | "C" | "D";
  shelfLife: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

const dmfRecordSchema = new Schema<DmfRecordDocument>(
  {
    productName: { type: String, required: true, trim: true, minlength: 2, maxlength: 200 },
    manufacturer: { type: String, required: true, trim: true, minlength: 2, maxlength: 200 },
    intendedUse: { type: String, required: true, trim: true, minlength: 5, maxlength: 3000 },
    riskClass: {
      type: String,
      required: true,
      enum: ["A", "B", "C", "D"],
      default: "B",
    },
    shelfLife: { type: String, required: true, trim: true, maxlength: 100 },
    notes: { type: String, trim: true, maxlength: 5000 },
  },
  {
    timestamps: true,
  },
);

export const DmfRecord = models.DmfRecord || model<DmfRecordDocument>("DmfRecord", dmfRecordSchema);
