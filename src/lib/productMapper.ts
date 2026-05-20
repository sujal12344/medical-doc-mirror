import type { ClassLock, IVDdevice, MedDevice, PredDevice, ProductDocument, UploadedDoc } from "@/models/Product";

type AnyDoc = Record<string, unknown>;

const MED_DEVICE_KEYS: (keyof MedDevice)[] = [
  "isActive", "activeType", "isInvasive", "invasionType", "contactDuration",
  "directCNSContact", "directHeartContact", "lifeSupporting", "isImplantable",
  "ionizingRadiation", "isDrugDeviceCombo", "containsAnimalTissue", "isContraceptive",
  "absorbed", "reusableSurgicalInstrument", "oralCavityOrEarOrNasal",
  "mucousMembraneAbsorption", "drugAdministration",
];

const IVD_KEYS: (keyof IVDdevice)[] = [
  "ivdSelfTest", "ivdNearPatient", "ivdBloodDonorScreening", "ivdBloodGrouping",
  "ivdForKnownCondition", "ivdTargetsHIV", "ivdTargetsHBV", "ivdTargetsHCV",
  "ivdTargetsHTLV", "ivdTargetsMalaria", "ivdTargetsSyphilis", "ivdTargetsCMV",
  "ivdTargetsSTI", "ivdGeneticTesting", "ivdDrugMonitoring", "ivdHLATyping",
  "ivdCongenitalScreening", "ivdCancerMarkers", "ivdFertility",
];

const PRED_KEYS: (keyof PredDevice)[] = [
  "predicateExists", "predicateName", "predicateManufacturer", "predicateRegNo",
  "predicateBasis", "predicateClass", "md26Status", "md26RefNo", "md27Status",
  "md27RefNo", "clinicalSiteCount", "novelPathwayAcknowledged",
];

const CLASS_LOCK_KEYS: (keyof Omit<ClassLock, "ai">)[] = [
  "classificationConfirmed", "classificationOverride", "classificationNote",
  "classificationConfirmedBy", "classificationLocked", "classificationLockedBy",
];

function pick<T extends Record<string, unknown>>(keys: (keyof T)[], src: AnyDoc, fallback: T): T {
  const out = { ...fallback };
  for (const k of keys) {
    if (k in src && src[k as string] !== undefined) {
      (out as AnyDoc)[k as string] = src[k as string];
    }
  }
  return out;
}

export function defaultMedDevice(): MedDevice {
  return {
    isActive: false, activeType: "", isInvasive: false, invasionType: "", contactDuration: "",
    directCNSContact: false, directHeartContact: false, lifeSupporting: false, isImplantable: false,
    ionizingRadiation: false, isDrugDeviceCombo: false, containsAnimalTissue: false,
    isContraceptive: false, absorbed: false, reusableSurgicalInstrument: false,
    oralCavityOrEarOrNasal: false, mucousMembraneAbsorption: false, drugAdministration: false,
  };
}

export function defaultIVDdevice(): IVDdevice {
  return Object.fromEntries(IVD_KEYS.map((k) => [k, false])) as unknown as IVDdevice;
}

export function defaultPredDevice(): PredDevice {
  return {
    predicateExists: null, predicateName: "", predicateManufacturer: "", predicateRegNo: "",
    predicateBasis: "", predicateClass: "", md26Status: "not-filed", md26RefNo: "",
    md27Status: "not-filed", md27RefNo: "", clinicalSiteCount: "", novelPathwayAcknowledged: false,
  };
}

export function defaultClassLock(): ClassLock {
  return {
    classificationConfirmed: false, classificationOverride: "", classificationNote: "",
    classificationConfirmedBy: "", classificationLocked: false, classificationLockedBy: "",
    ai: {},
  };
}

/** Map flat registration form → nested MongoDB document. */
export function flatToNestedProduct(flat: AnyDoc, existing?: Partial<ProductDocument>): Partial<ProductDocument> {
  const med = pick(MED_DEVICE_KEYS, flat, existing?.medDevice ?? defaultMedDevice());
  if (flat.medDevice && typeof flat.medDevice === "object") Object.assign(med, flat.medDevice);

  const ivd = pick(IVD_KEYS, flat, existing?.IVDdevice ?? defaultIVDdevice());
  if (flat.IVDdevice && typeof flat.IVDdevice === "object") Object.assign(ivd, flat.IVDdevice);

  const pred = pick(PRED_KEYS, flat, existing?.predDevice ?? defaultPredDevice());
  if (flat.predDevice && typeof flat.predDevice === "object") Object.assign(pred, flat.predDevice);

  const classLock = pick(CLASS_LOCK_KEYS, flat, existing?.classLock ?? defaultClassLock());
  if (flat.classLock && typeof flat.classLock === "object") {
    const cl = flat.classLock as ClassLock;
    Object.assign(classLock, cl);
    if (cl.ai) classLock.ai = { ...classLock.ai, ...cl.ai };
  }
  if (flat.classification && typeof flat.classification === "object") {
    classLock.ai = { ...classLock.ai, ...(flat.classification as Record<string, unknown>) };
  }

  return {
    name: (flat.name as string) ?? existing?.name,
    manufacturer: (flat.manufacturer as string) ?? existing?.manufacturer,
    description: (flat.description as string) ?? existing?.description ?? "",
    intendedUse: (flat.intendedUse as string) ?? existing?.intendedUse ?? "",
    patientPopulation: (flat.patientPopulation as string) ?? existing?.patientPopulation ?? "",
    deviceClass: (flat.deviceClass as ProductDocument["deviceClass"]) ?? existing?.deviceClass ?? "A",
    deviceType: (flat.deviceType as ProductDocument["deviceType"]) ?? existing?.deviceType ?? "medical-device",
    countries: (flat.countries as string[]) ?? existing?.countries ?? ["IN"],
    status: (flat.status as ProductDocument["status"]) ?? existing?.status ?? "draft",
    isSterile: typeof flat.isSterile === "boolean" ? flat.isSterile : existing?.isSterile ?? false,
    hasSoftware: typeof flat.hasSoftware === "boolean" ? flat.hasSoftware : existing?.hasSoftware ?? false,
    medDevice: med,
    IVDdevice: ivd,
    predDevice: pred,
    classLock,
    uploadedDocs: (flat.uploadedDocs as UploadedDoc[]) ?? existing?.uploadedDocs ?? [],
  };
}

/** Lift legacy flat documents (pre-migration) into nested shape. */
export function normalizeProductDoc(doc: AnyDoc): AnyDoc {
  if (!doc || typeof doc !== "object") return doc;
  if (doc.medDevice && doc.IVDdevice && doc.predDevice && doc.classLock) return doc;

  doc.medDevice = pick(MED_DEVICE_KEYS, doc, defaultMedDevice());
  doc.IVDdevice = pick(IVD_KEYS, doc, defaultIVDdevice());
  doc.predDevice = pick(PRED_KEYS, doc, defaultPredDevice());

  const classLock = pick(CLASS_LOCK_KEYS, doc, defaultClassLock());
  if (doc.classification && typeof doc.classification === "object") {
    classLock.ai = { ...(classLock.ai ?? {}), ...(doc.classification as Record<string, unknown>) };
  }
  doc.classLock = classLock;

  return doc;
}

/** Flatten nested product for forms / legacy API consumers. */
export function nestedToFlat(doc: AnyDoc): AnyDoc {
  const normalized = normalizeProductDoc({ ...doc });
  return {
    ...normalized,
    ...(normalized.medDevice as object),
    ...(normalized.IVDdevice as object),
    ...(normalized.predDevice as object),
    ...(normalized.classLock as object),
    classification: (normalized.classLock as ClassLock | undefined)?.ai,
  };
}

export function getUploadedDocs(doc: AnyDoc): UploadedDoc[] {
  return (normalizeProductDoc(doc).uploadedDocs as UploadedDoc[]) ?? [];
}

export function ensureClassLock(doc: { classLock?: ClassLock }): ClassLock {
  if (!doc.classLock) doc.classLock = defaultClassLock();
  if (!doc.classLock.ai) doc.classLock.ai = {};
  return doc.classLock;
}
