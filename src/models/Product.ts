import { Schema, model, models, Types } from "mongoose";

export type UploadedDoc = {
  fileId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  extractedText: string;
  uploadedAt: Date;
};

/** Schedule III Part I — general medical device characterisation */
export type MedDevice = {
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
};

/** Schedule III Part II — IVD characterisation */
export type IVDdevice = {
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
};

/** Step 1.5 — predicate / novel pathway */
export type PredDevice = {
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
};

/** Steps 1.6 / 1.8 / 1.9 — human confirm + lock; `ai` holds RAG classification output */
export type ClassLock = {
  classificationConfirmed: boolean;
  classificationOverride: "A" | "B" | "C" | "D" | "";
  classificationNote: string;
  classificationConfirmedBy: string;
  classificationLocked: boolean;
  classificationLockedBy: string;
  ai?: Record<string, unknown>;
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

  isSterile: boolean;
  hasSoftware: boolean;

  /** Present only when deviceType is "medical-device" */
  medDevice?: MedDevice;
  /** Present only when deviceType is "ivd" */
  IVDdevice?: IVDdevice;
  predDevice: PredDevice;
  classLock: ClassLock;

  uploadedDocs: UploadedDoc[];

  createdAt: Date;
  updatedAt: Date;
};

const medDeviceSchema = new Schema<MedDevice>(
  {
    isActive: { type: Boolean, default: false },
    activeType: { type: String, enum: ["therapeutic", "diagnostic", "other", ""], default: "" },
    isInvasive: { type: Boolean, default: false },
    invasionType: { type: String, enum: ["non-invasive", "body-orifice", "surgically-invasive", ""], default: "" },
    contactDuration: { type: String, enum: ["transient", "short-term", "long-term", ""], default: "" },
    directCNSContact: { type: Boolean, default: false },
    directHeartContact: { type: Boolean, default: false },
    lifeSupporting: { type: Boolean, default: false },
    isImplantable: { type: Boolean, default: false },
    ionizingRadiation: { type: Boolean, default: false },
    isDrugDeviceCombo: { type: Boolean, default: false },
    containsAnimalTissue: { type: Boolean, default: false },
    isContraceptive: { type: Boolean, default: false },
    absorbed: { type: Boolean, default: false },
    reusableSurgicalInstrument: { type: Boolean, default: false },
    oralCavityOrEarOrNasal: { type: Boolean, default: false },
    mucousMembraneAbsorption: { type: Boolean, default: false },
    drugAdministration: { type: Boolean, default: false },
  },
  { _id: false },
);

const ivdDeviceSchema = new Schema<IVDdevice>(
  {
    ivdSelfTest: { type: Boolean, default: false },
    ivdNearPatient: { type: Boolean, default: false },
    ivdBloodDonorScreening: { type: Boolean, default: false },
    ivdBloodGrouping: { type: Boolean, default: false },
    ivdForKnownCondition: { type: Boolean, default: false },
    ivdTargetsHIV: { type: Boolean, default: false },
    ivdTargetsHBV: { type: Boolean, default: false },
    ivdTargetsHCV: { type: Boolean, default: false },
    ivdTargetsHTLV: { type: Boolean, default: false },
    ivdTargetsMalaria: { type: Boolean, default: false },
    ivdTargetsSyphilis: { type: Boolean, default: false },
    ivdTargetsCMV: { type: Boolean, default: false },
    ivdTargetsSTI: { type: Boolean, default: false },
    ivdGeneticTesting: { type: Boolean, default: false },
    ivdDrugMonitoring: { type: Boolean, default: false },
    ivdHLATyping: { type: Boolean, default: false },
    ivdCongenitalScreening: { type: Boolean, default: false },
    ivdCancerMarkers: { type: Boolean, default: false },
    ivdFertility: { type: Boolean, default: false },
  },
  { _id: false },
);

const predDeviceSchema = new Schema<PredDevice>(
  {
    predicateExists: { type: Boolean, default: null },
    predicateName: { type: String, default: "" },
    predicateManufacturer: { type: String, default: "" },
    predicateRegNo: { type: String, default: "" },
    predicateBasis: { type: String, default: "" },
    predicateClass: { type: String, enum: ["A", "B", "C", "D", ""], default: "" },
    md26Status: { type: String, enum: ["not-filed", "filed", "approved"], default: "not-filed" },
    md26RefNo: { type: String, default: "" },
    md27Status: { type: String, enum: ["not-filed", "filed", "approved"], default: "not-filed" },
    md27RefNo: { type: String, default: "" },
    clinicalSiteCount: { type: String, default: "" },
    novelPathwayAcknowledged: { type: Boolean, default: false },
  },
  { _id: false },
);

const classLockSchema = new Schema<ClassLock>(
  {
    classificationConfirmed: { type: Boolean, default: false },
    classificationOverride: { type: String, enum: ["A", "B", "C", "D", ""], default: "" },
    classificationNote: { type: String, default: "" },
    classificationConfirmedBy: { type: String, default: "" },
    classificationLocked: { type: Boolean, default: false },
    classificationLockedBy: { type: String, default: "" },
    ai: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const productSchema = new Schema<ProductDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 300 },
    manufacturer: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, trim: true, maxlength: 5000, default: "" },
    intendedUse: { type: String, trim: true, maxlength: 3000, default: "" },
    patientPopulation: { type: String, trim: true, maxlength: 500, default: "" },
    deviceClass: { type: String, enum: ["A", "B", "C", "D"], default: "A", required: true },
    deviceType: { type: String, enum: ["medical-device", "ivd"], default: "medical-device", required: true },
    countries: { type: [String], default: ["IN"] },
    status: { type: String, enum: ["draft", "active", "archived"], default: "draft" },

    isSterile: { type: Boolean, default: false },
    hasSoftware: { type: Boolean, default: false },

    medDevice: { type: medDeviceSchema, required: false },
    IVDdevice: { type: ivdDeviceSchema, required: false },
    predDevice: { type: predDeviceSchema, default: () => ({}) },
    classLock: { type: classLockSchema, default: () => ({}) },

    uploadedDocs: {
      type: [
        {
          fileId: { type: String, required: true },
          originalName: { type: String, required: true },
          mimeType: { type: String, default: "application/pdf" },
          sizeBytes: { type: Number, default: 0 },
          extractedText: { type: String, default: "" },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

/** Persist only the characterisation block that matches deviceType. */
productSchema.pre("save", function () {
  if (this.deviceType === "ivd") {
    this.set("medDevice", undefined);
  } else {
    this.set("IVDdevice", undefined);
  }
});

export const Product = models.Product || model<ProductDocument>("Product", productSchema);
