import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { RegulatoryDocument } from "@/models/Document";
import { FRAMEWORKS, REGION_GROUPS, filterFrameworksByDeviceType } from "@/lib/frameworks";
import type { FrameworkDeviceType } from "@/lib/frameworks";
import CreateDocButton from "./CreateDocButton";
import ProductDetailsButton from "../../../../components/ProductDetailsButton";
import { getRequiredFormsForSource } from "@/lib/frameworks/asia/india-forms";

// Touched to trigger recompilation
export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  const user = await getSession();
  await connectToDatabase();
  const product = await Product.findOne({ _id: id, userId: (user as Record<string, unknown>)._id }).lean();
  if (!product) notFound();

  const docs = await RegulatoryDocument.find({
    $or: [
      { "contextPayload.productId": id },
      { "contextPayload.productIds": id }
    ]
  }).sort({ updatedAt: -1 }).lean();
  const productDeviceType: FrameworkDeviceType =
    product.deviceType === "ivd" ? "ivd" : "medical-device";
  const availableFrameworks = filterFrameworksByDeviceType(
    FRAMEWORKS.filter((f) => product.countries.includes(f.countryCode)),
    productDeviceType,
  );
  const uploadedDocs = (product.uploadedDocs || []) as { fileId: string; originalName: string; extractedText: string; uploadedAt: Date }[];
  const hasUploadedDocs = uploadedDocs.length > 0;


  const groupedByCountry = new Map<string, typeof availableFrameworks>();
  for (const fw of availableFrameworks) {
    const key = fw.countryCode;
    if (!groupedByCountry.has(key)) groupedByCountry.set(key, []);
    groupedByCountry.get(key)!.push(fw);
  }

  const countryMeta = new Map<string, { name: string; flag: string }>();
  for (const rg of REGION_GROUPS) {
    for (const c of rg.countries) {
      countryMeta.set(c.code, { name: c.name, flag: c.flag });
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <Link href="/dashboard/products" className="text-sm text-muted hover:text-foreground transition mb-4 inline-block">&larr; Back to products</Link>

      {/* Product header */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
            <p className="text-sm text-muted mt-1">
              {product.manufacturer} &middot; Class {product.deviceClass} &middot; {product.deviceType === "ivd" ? "IVD" : "Medical Device"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ProductDetailsButton product={JSON.parse(JSON.stringify(product))} />

            <span
              className={`text-xs px-3 py-1 rounded-full font-semibold ${product.status === "active"
                  ? "bg-green-50 text-green-600"
                  : product.status === "archived"
                    ? "bg-[var(--status-pending-bg)] text-[var(--status-pending)]"
                    : "bg-[var(--status-warning-bg)] text-[var(--status-warning)]"
                }`}
            >
              {product.status}
            </span>
          </div>
        </div>
        {product.description && <p className="text-sm text-muted mt-3 leading-relaxed">{product.description}</p>}
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {product.countries.map((c: string) => {
            const meta = countryMeta.get(c);
            return (
              <span key={c} className="text-xs px-2.5 py-0.5 bg-surface2 border border-border rounded-full text-muted font-medium">
                {meta ? `${meta.flag} ${meta.name}` : c}
              </span>
            );
          })}
        </div>
      </div>


      {/* Generate Regulatory Documents — grouped by country */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Generate Regulatory Document</h2>
            <p className="text-xs text-muted mt-0.5">
              Showing {productDeviceType === "ivd" ? "IVD" : "medical device"} dossier types only
              {productDeviceType === "ivd" ? " (e.g. DMF for India)" : ""}.
            </p>
          </div>
          <span className="text-xs text-muted shrink-0">
            {availableFrameworks.length} framework{availableFrameworks.length !== 1 ? "s" : ""} available
          </span>
        </div>

        {availableFrameworks.length === 0 ? (
          <p className="text-sm text-muted bg-surface border border-border rounded-xl p-6 text-center">
            No {productDeviceType === "ivd" ? "IVD" : "medical device"} frameworks for the selected countries.
            {productDeviceType === "ivd"
              ? " For India, use Device Master File (IVD). Add target countries on the product if needed."
              : " Go back and add target countries to this product."}
          </p>
        ) : (
          <div className="space-y-4">
            {[...groupedByCountry.entries()].map(([code, fws]) => {
              const meta = countryMeta.get(code);
              return (
                <div key={code}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{meta?.flag}</span>
                    <span className="text-sm font-semibold text-foreground">{meta?.name || code}</span>
                    <span className="text-[10px] text-muted">({fws.length} {fws.length === 1 ? "type" : "types"})</span>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {fws.map((fw) => {
                      const fieldCount = fw.sections.reduce((s, sec) => s + sec.fields.length, 0);
                      return (
                        <CreateDocButton
                          key={fw.id}
                          framework={fw}
                          productId={String(product._id)}
                          productName={product.name}
                          fieldCount={fieldCount}
                          hasUploadedDocs={hasUploadedDocs}
                        />
                      );
                    })}

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Existing documents */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Documents ({docs.length})</h2>
        {docs.length === 0 ? (
          <p className="text-sm text-muted bg-surface border border-border rounded-xl p-6 text-center">
            No documents generated yet. Click a framework above to start.
          </p>
        ) : (
          <div className="space-y-2">
            {docs.map((d) => {
              const requiredForms = getRequiredFormsForSource(d.frameworkId);
              return (
                <Link key={String(d._id)} href={`/dashboard/documents/${d._id}`}
                  className="flex items-center justify-between bg-surface border border-border rounded-xl p-4 hover:border-accent/40 hover:shadow-sm transition">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{d.title}</p>
                    <p className="text-xs text-muted mt-0.5">{d.countryCode} &middot; {d.frameworkId} &middot; v{d.version}</p>
                    {requiredForms.length > 0 && (
                      <p className="text-[11px] text-[var(--accent)] font-semibold mt-1.5 flex items-center gap-1.5">
                        <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--accent)]"></span></span>
                        Required for applications: {requiredForms.join(", ")}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${d.status === "submitted" ? "bg-[var(--status-success-bg)] text-[var(--status-success)]" : d.status === "approved" ? "bg-[var(--class-b-bg)] text-[var(--class-b)]" : d.status === "in-review" ? "bg-purple-50 text-purple-600" : "bg-[var(--status-warning-bg)] text-[var(--status-warning)]"}`}>
                    {d.status}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
