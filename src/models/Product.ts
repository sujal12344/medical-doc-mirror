import { Schema, model, models, Types } from "mongoose";

// ── Phase 1 — autofill source document (one per product, upserted by /api/products/autofill)
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
  userId: Types.ObjectId;
  name: string;
  manufacturer: string;
  description: string;
  intendedUse: string;
  patientPopulation: string;
  deviceClass: "A" | "B" | "C" | "D";
  deviceType: "medical-device" | "ivd";
  countries: string[];
  status: "draft" | "active" | "archived";

  // Phase 1 — Product Info toggles
  isSterile: boolean;
  hasSoftware: boolean;

  // Phase 1 — Part I characterisation (medical-device)
  isActive: boolean;
  activeType: "therapeutic" | "diagnostic" | "other" | "";
  isInvasive: boolean;
  invasionType: "non-invasive" | "body-orifice" | "surgically-invasive" | "";
  contactDuration: "transient" | "short-term" | "long-term" | "";
  directCNSContact: boolean;
  directHeartContact: boolean;
  lifeSupporting: boolean;
  isImplantable: boolean;
  ionizingRadiation: boolean;
  isDrugDeviceCombo: boolean;
  containsAnimalTissue: boolean;
  isContraceptive: boolean;
  absorbed: boolean;
  reusableSurgicalInstrument: boolean;
  oralCavityOrEarOrNasal: boolean;
  mucousMembraneAbsorption: boolean;
  drugAdministration: boolean;

  // Phase 1 — Part II characterisation (ivd)
  ivdSelfTest: boolean;
  ivdNearPatient: boolean;
  ivdBloodDonorScreening: boolean;
  ivdBloodGrouping: boolean;
  ivdForKnownCondition: boolean;
  ivdTargetsHIV: boolean;
  ivdTargetsHBV: boolean;
  ivdTargetsHCV: boolean;
  ivdTargetsHTLV: boolean;
  ivdTargetsMalaria: boolean;
  ivdTargetsSyphilis: boolean;
  ivdTargetsCMV: boolean;
  ivdTargetsSTI: boolean;
  ivdGeneticTesting: boolean;
  ivdDrugMonitoring: boolean;
  ivdHLATyping: boolean;
  ivdCongenitalScreening: boolean;
  ivdCancerMarkers: boolean;
  ivdFertility: boolean;

  // Phase 1 — Predicate device & regulatory pathway (Step 1.5)
  predicateExists: boolean | null;
  predicateName: string;
  predicateManufacturer: string;
  predicateRegNo: string;
  predicateBasis: string;
  predicateClass: "A" | "B" | "C" | "D" | "";
  md26Status: "not-filed" | "filed" | "approved";
  md26RefNo: string;
  md27Status: "not-filed" | "filed" | "approved";
  md27RefNo: string;
  clinicalSiteCount: string;
  novelPathwayAcknowledged: boolean;

  // Phase 1 — Classification lock (Steps 1.6 / 1.8 / 1.9)
  classificationConfirmed: boolean;
  classificationOverride: "A" | "B" | "C" | "D" | "";
  classificationNote: string;
  classificationConfirmedBy: string;
  classificationLocked: boolean;
  classificationLockedBy: string;

  // Autofill source document
  uploadedDocs: UploadedDoc[];

  createdAt: Date;
  updatedAt: Date;
};

const productSchema = new Schema<ProductDocument>(
  {
    userId:          { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name:            { type: String, required: true, trim: true, minlength: 2, maxlength: 300 },
    manufacturer:    { type: String, required: true, trim: true, maxlength: 300 },
    description:     { type: String, trim: true, maxlength: 5000, default: "" },
    intendedUse:     { type: String, trim: true, maxlength: 3000, default: "" },
    patientPopulation: { type: String, trim: true, maxlength: 500, default: "" },
    deviceClass:     { type: String, enum: ["A", "B", "C", "D"], default: "A", required: true },
    deviceType:      { type: String, enum: ["medical-device", "ivd"], default: "ivd", required: true },
    countries:       { type: [String], default: ["IN"] },
    status:          { type: String, enum: ["draft", "active", "archived"], default: "draft" },

    // Product Info
    isSterile:   { type: Boolean, default: false },
    hasSoftware: { type: Boolean, default: false },

    // Part I — medical-device characterisation
    isActive:                { type: Boolean, default: false },
    activeType:              { type: String, enum: ["therapeutic", "diagnostic", "other", ""], default: "" },
    isInvasive:              { type: Boolean, default: false },
    invasionType:            { type: String, enum: ["non-invasive", "body-orifice", "surgically-invasive", ""], default: "" },
    contactDuration:         { type: String, enum: ["transient", "short-term", "long-term", ""], default: "" },
    directCNSContact:        { type: Boolean, default: false },
    directHeartContact:      { type: Boolean, default: false },
    lifeSupporting:          { type: Boolean, default: false },
    isImplantable:           { type: Boolean, default: false },
    ionizingRadiation:       { type: Boolean, default: false },
    isDrugDeviceCombo:       { type: Boolean, default: false },
    containsAnimalTissue:    { type: Boolean, default: false },
    isContraceptive:         { type: Boolean, default: false },
    absorbed:                { type: Boolean, default: false },
    reusableSurgicalInstrument: { type: Boolean, default: false },
    oralCavityOrEarOrNasal:  { type: Boolean, default: false },
    mucousMembraneAbsorption: { type: Boolean, default: false },
    drugAdministration:      { type: Boolean, default: false },

    // Part II — IVD characterisation
    ivdSelfTest:            { type: Boolean, default: false },
    ivdNearPatient:         { type: Boolean, default: false },
    ivdBloodDonorScreening: { type: Boolean, default: false },
    ivdBloodGrouping:       { type: Boolean, default: false },
    ivdForKnownCondition:   { type: Boolean, default: false },
    ivdTargetsHIV:          { type: Boolean, default: false },
    ivdTargetsHBV:          { type: Boolean, default: false },
    ivdTargetsHCV:          { type: Boolean, default: false },
    ivdTargetsHTLV:         { type: Boolean, default: false },
    ivdTargetsMalaria:      { type: Boolean, default: false },
    ivdTargetsSyphilis:     { type: Boolean, default: false },
    ivdTargetsCMV:          { type: Boolean, default: false },
    ivdTargetsSTI:          { type: Boolean, default: false },
    ivdGeneticTesting:      { type: Boolean, default: false },
    ivdDrugMonitoring:      { type: Boolean, default: false },
    ivdHLATyping:           { type: Boolean, default: false },
    ivdCongenitalScreening: { type: Boolean, default: false },
    ivdCancerMarkers:       { type: Boolean, default: false },
    ivdFertility:           { type: Boolean, default: false },

    // Predicate device & regulatory pathway
    predicateExists:            { type: Boolean, default: null },
    predicateName:              { type: String, default: "" },
    predicateManufacturer:      { type: String, default: "" },
    predicateRegNo:             { type: String, default: "" },
    predicateBasis:             { type: String, default: "" },
    predicateClass:             { type: String, enum: ["A", "B", "C", "D", ""], default: "" },
    md26Status:                 { type: String, enum: ["not-filed", "filed", "approved"], default: "not-filed" },
    md26RefNo:                  { type: String, default: "" },
    md27Status:                 { type: String, enum: ["not-filed", "filed", "approved"], default: "not-filed" },
    md27RefNo:                  { type: String, default: "" },
    clinicalSiteCount:          { type: String, default: "" },
    novelPathwayAcknowledged:   { type: Boolean, default: false },

    // Classification lock
    classificationConfirmed:    { type: Boolean, default: false },
    classificationOverride:     { type: String, enum: ["A", "B", "C", "D", ""], default: "" },
    classificationNote:         { type: String, default: "" },
    classificationConfirmedBy:  { type: String, default: "" },
    classificationLocked:       { type: Boolean, default: false },
    classificationLockedBy:     { type: String, default: "" },

    // Autofill source document (one per product, upserted by /api/products/autofill)
    uploadedDocs: {
      type: [{
        fileId:        { type: String, required: true },
        originalName:  { type: String, required: true },
        mimeType:      { type: String, default: "application/pdf" },
        sizeBytes:     { type: Number, default: 0 },
        extractedText: { type: String, default: "" },
        uploadedAt:    { type: Date, default: Date.now },
      }],
      default: [],
    },
  },
  { timestamps: true },
);

export const Product = models.Product || model<ProductDocument>("Product", productSchema);
