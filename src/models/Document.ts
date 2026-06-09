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
    // fields uses Mixed (not Map) — framework field ids contain dots (e.g. 1.1a, 2.0)
    sections: {
      type: Map,
      of: new Schema(
        { fields: { type: Schema.Types.Mixed, default: () => ({}) }, completionPct: { type: Number, default: 0 } },
        { _id: false },
      ),
      default: () => new Map(),
    },
    version: { type: Number, default: 1 },
  },
  { timestamps: true },
);

export const RegulatoryDocument = models.RegulatoryDocument || model<DocumentDocument>("RegulatoryDocument", documentSchema);
