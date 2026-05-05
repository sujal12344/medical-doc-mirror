import { Schema, model, models, Types } from "mongoose";

export type DocumentDocument = {
  _id: string;
  productId: Types.ObjectId;
  userId: Types.ObjectId;
  countryCode: string;
  frameworkId: string;
  title: string;
  status: "draft" | "in-review" | "approved" | "submitted";
  sections: Map<string, { fields: Record<string, string>; completionPct: number }>;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

const documentSchema = new Schema<DocumentDocument>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    countryCode: { type: String, required: true, maxlength: 10 },
    frameworkId: { type: String, required: true, maxlength: 50 },
    title: { type: String, required: true, trim: true, maxlength: 500 },
    status: { type: String, enum: ["draft", "in-review", "approved", "submitted"], default: "draft" },
    sections: { type: Map, of: new Schema({ fields: { type: Map, of: String }, completionPct: Number }, { _id: false }), default: {} },
    version: { type: Number, default: 1 },
  },
  { timestamps: true },
);

export const RegulatoryDocument = models.RegulatoryDocument || model<DocumentDocument>("RegulatoryDocument", documentSchema);
