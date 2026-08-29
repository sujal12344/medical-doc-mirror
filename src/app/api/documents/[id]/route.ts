import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { Product } from "@/models/Product";
import { requireAuth } from "@/lib/auth";


export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    await connectToDatabase();
    const doc = await RegulatoryDocument.findOne({ _id: id, userId: (user as Record<string, unknown>)._id }).lean();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    
    console.log("DEBUG /api/documents/[id]: Found doc", doc._id, "contextPayload:", doc.contextPayload);

    // Fetch related products for frontend condition evaluation
    let products: any[] = [];
    const prefillData: Record<string, string> = {};

    const { sectionsToPlain } = await import("@/lib/documentSections");

    // Flatten current document fields (e.g. MD-3 form fields)
    const docSections = sectionsToPlain(doc.sections || {});
    for (const sectionData of Object.values(docSections)) {
      if (sectionData.fields) {
        for (const [k, v] of Object.entries(sectionData.fields)) {
          if (v !== undefined && v !== null) {
            prefillData[k] = String(v);
          }
        }
      }
    }

    if (doc.contextPayload?.productIds?.length) {
      const productIds = doc.contextPayload.productIds;
      products = await Product.find({ _id: { $in: productIds }, userId: (user as Record<string, unknown>)._id }).lean();

      // Fetch technical docs
      const techDocs = await RegulatoryDocument.find({
          userId: (user as Record<string, unknown>)._id,
          frameworkId: { $in: ["IN_DMF", "IN_DMF_MD", "IN_PMF"] },
          "contextPayload.productId": { $in: productIds }
      }).lean();

      const { sectionsToPlain } = await import("@/lib/documentSections");
      for (const d of techDocs) {
        const sections = sectionsToPlain(d.sections);
        for (const sectionData of Object.values(sections)) {
          if (sectionData.fields) {
            for (const [k, v] of Object.entries(sectionData.fields)) {
              if (v !== undefined && v !== null && !prefillData[k]) {
                prefillData[k] = String(v);
              }
            }
          }
        }
      }
      
      if (products.length > 0) {
        const classes = Array.from(new Set(products.map(p => p.deviceClass).filter(Boolean)));
        if (classes.length && !prefillData.deviceClass) {
          prefillData.deviceClass = classes.join(", ");
        }
        
        const scopes = Array.from(new Set(products.map(p => p.intendedUse || p.name).filter(Boolean)));
        if (scopes.length && !prefillData.deviceScopeSummary) {
          prefillData.deviceScopeSummary = scopes.join("; ");
        }
      }
    }

    // Fetch company COI data
    const { Company } = await import("@/models/Company");
    const company = await Company.findById((user as Record<string, unknown>)._id).lean();
    if (company?.coiData) {
      const coi = company.coiData;
      if (coi.applicantName && !prefillData.applicantName) prefillData.applicantName = coi.applicantName;
      if (coi.bodyConstitution && !prefillData.bodyConstitution) prefillData.bodyConstitution = coi.bodyConstitution;
      if (coi.registeredOfficeAddress && !prefillData.registeredOfficeAddress) prefillData.registeredOfficeAddress = coi.registeredOfficeAddress;
      if (coi.incorporationDate && !prefillData.incorporationDate) prefillData.incorporationDate = coi.incorporationDate;
      if (coi.cinNumber && !prefillData.incorporationNumber) prefillData.incorporationNumber = coi.cinNumber;
      if (coi.signatories && coi.signatories.length > 0) {
        if (!prefillData.designatedPersonName) prefillData.designatedPersonName = coi.signatories[0].name;
        if (!prefillData.designatedPersonDesignation) prefillData.designatedPersonDesignation = coi.signatories[0].designation;
      }
    }

    if (!prefillData.manufacturingSiteAddress && prefillData.registeredOfficeAddress) {
       prefillData.manufacturingSiteAddress = prefillData.registeredOfficeAddress;
    }

    // Add smart defaults to match generation logic
    const today = new Date();
    if (!prefillData.applicationDate) {
      prefillData.applicationDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    }
    if (!prefillData.applicationPlace) {
      prefillData.applicationPlace = prefillData.registeredOfficeAddress?.split(",")[0] || "Mumbai";
    }
    if (!prefillData.designatedPersonName) {
      prefillData.designatedPersonName = "[Authorized Signatory Name]";
    }
    if (!prefillData.designatedPersonDesignation) {
      prefillData.designatedPersonDesignation = "[Designation]";
    }

    // Handlers for some computed specific fields
    prefillData.accreditationValidity = prefillData.accreditationIssueDate && prefillData.accreditationExpiryDate 
      ? `${prefillData.accreditationIssueDate} to ${prefillData.accreditationExpiryDate}` 
      : "";
    prefillData.feePaymentDetails = prefillData.feePaidDate && prefillData.feeAmount
      ? `Date: ${prefillData.feePaidDate}, Amount: ${prefillData.feeAmount}, Receipt: ${prefillData.feeReceiptOrChallanNumber || ""}`
      : "";
    
    // Standardize aliases used in older templates
    if (prefillData.incorporationOrRegistrationNumber) prefillData.incorporationNumber = prefillData.incorporationOrRegistrationNumber;
    if (prefillData.incorporationOrRegistrationDate) prefillData.incorporationDate = prefillData.incorporationOrRegistrationDate;
    if (prefillData.mobileNumber) {
      prefillData.telephoneNumber = prefillData.mobileNumber;
      prefillData.faxNumber = prefillData.mobileNumber;
    }
    prefillData.slNo = "1";
    if (prefillData.applicableAccreditationStandards) prefillData.standard = prefillData.applicableAccreditationStandards;
    if (prefillData.accreditationScopeSummary) prefillData.scope = prefillData.accreditationScopeSummary;
    
    console.log("DEBUG /api/documents/[id]: Returning prefillData with keys:", Object.keys(prefillData));

    return NextResponse.json({ document: doc, products, prefillData });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    await connectToDatabase();
    const result = await RegulatoryDocument.findOneAndDelete({ _id: id, userId: (user as Record<string, unknown>)._id });
    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
