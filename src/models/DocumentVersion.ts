import { Schema, model, models, Types } from "mongoose";

export type DocumentVersionDocument = {
  _id: string;
  documentId: Types.ObjectId;
  version: number;
  snapshot: Record<string, unknown>;
  changeNote: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
};

const documentVersionSchema = new Schema<DocumentVersionDocument>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: "RegulatoryDocument", required: true, index: true },
    version: { type: Number, required: true },
    snapshot: { type: Schema.Types.Mixed, required: true },
    changeNote: { type: String, trim: true, maxlength: 1000, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  },
  { timestamps: true },
);

documentVersionSchema.index({ documentId: 1, version: 1 }, { unique: true });

export const DocumentVersion = models.DocumentVersion || model<DocumentVersionDocument>("DocumentVersion", documentVersionSchema);
