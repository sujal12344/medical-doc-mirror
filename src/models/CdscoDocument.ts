import mongoose, { Schema, type Document } from "mongoose";

export interface ICdscoDocument extends Document {
  sourceUrl: string;
  gatewayUrl?: string;
  pageUrl: string;
  title: string;
  fileName: string;
  status: "pending" | "indexed" | "error" | "skipped";
  errorMessage?: string;
  chunksIndexed: number;
  pineconeIds: string[];
  scannedAt: Date;
  indexedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CdscoDocumentSchema = new Schema<ICdscoDocument>(
  {
    sourceUrl:     { type: String, required: true, unique: true },
    gatewayUrl:    { type: String },
    pageUrl:       { type: String, default: "" },
    title:         { type: String, default: "" },
    fileName:      { type: String, default: "" },
    status:        { type: String, enum: ["pending", "indexed", "error", "skipped"], default: "pending" },
    errorMessage:  { type: String },
    chunksIndexed: { type: Number, default: 0 },
    pineconeIds:   { type: [String], default: [] },
    scannedAt:     { type: Date, required: true },
    indexedAt:     { type: Date },
  },
  { timestamps: true }
);

CdscoDocumentSchema.index({ sourceUrl: 1 }, { unique: true });
CdscoDocumentSchema.index({ status: 1 });
CdscoDocumentSchema.index({ scannedAt: -1 });

export const CdscoDocument =
  mongoose.models.CdscoDocument ||
  mongoose.model<ICdscoDocument>("CdscoDocument", CdscoDocumentSchema);
