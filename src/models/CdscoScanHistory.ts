import mongoose, { Schema, type Document } from "mongoose";

export interface ICdscoScanHistory extends Document {
  startedAt: Date;
  completedAt?: Date;
  status: "running" | "completed" | "failed";
  pagesScanned: number;
  pdfsDiscovered: number;
  pdfsNew: number;
  pdfsIndexed: number;
  pdfsSkipped: number;
  pdfsError: number;
  errorMessages: string[];
  triggeredBy: "cron" | "manual";
}

const CdscoScanHistorySchema = new Schema<ICdscoScanHistory>(
  {
    startedAt:      { type: Date, required: true },
    completedAt:    { type: Date },
    status:         { type: String, enum: ["running", "completed", "failed"], default: "running" },
    pagesScanned:   { type: Number, default: 0 },
    pdfsDiscovered: { type: Number, default: 0 },
    pdfsNew:        { type: Number, default: 0 },
    pdfsIndexed:    { type: Number, default: 0 },
    pdfsSkipped:    { type: Number, default: 0 },
    pdfsError:      { type: Number, default: 0 },
    errorMessages:  { type: [String], default: [] },
    triggeredBy:    { type: String, enum: ["cron", "manual"], default: "manual" },
  },
  { timestamps: true }
);

CdscoScanHistorySchema.index({ startedAt: -1 });

export const CdscoScanHistory =
  mongoose.models.CdscoScanHistory ||
  mongoose.model<ICdscoScanHistory>("CdscoScanHistory", CdscoScanHistorySchema);
