import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { RegulatoryDocument } from "@/models/Document";
import { FRAMEWORKS, REGION_GROUPS } from "@/lib/frameworks";
import CreateDocButton from "./CreateDocButton";
import ProductDocsUpload from "./ProductDocsUpload";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  const user = await getSession();
  await connectToDatabase();
  const product = await Product.findOne({ _id: id, userId: (user as Record<string, unknown>)._id }).lean();
  if (!product) notFound();

  const docs = await RegulatoryDocument.find({ productId: id }).sort({ updatedAt: -1 }).lean();
  const availableFrameworks = FRAMEWORKS.filter((f) => product.countries.includes(f.countryCode));
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
            <Link
              href={`/dashboard/products/${id}/dossier`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-violet-500 text-violet-600 hover:bg-violet-50 transition"
            >
              📋 Technical File (Schedule V)
            </Link>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${product.status === "active" ? "bg-green-50 text-green-600" : product.status === "archived" ? "bg-gray-100 text-gray-500" : "bg-yellow-50 text-yellow-600"}`}>
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

      {/* Uploaded Product Documents */}
      <div className="mb-6">
        <ProductDocsUpload
          productId={String(product._id)}
          initialDocs={uploadedDocs.map((d) => ({ fileId: d.fileId, originalName: d.originalName, charCount: d.extractedText?.length || 0 }))}
        />
      </div>

      {/* Generate Regulatory Documents — grouped by country */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Generate Regulatory Document</h2>
          <span className="text-xs text-muted">{availableFrameworks.length} framework{availableFrameworks.length !== 1 ? "s" : ""} available</span>
        </div>

        {availableFrameworks.length === 0 ? (
          <p className="text-sm text-muted bg-surface border border-border rounded-xl p-6 text-center">
            No frameworks available. Go back and add target countries to this product.
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
                    {code === "IN" && (
                      <>
                        <Link
                          href={`/dashboard/products/${id}/md14`}
                          className="flex flex-col text-left bg-surface border border-border rounded-xl p-4 hover:border-violet-500/50 hover:shadow-sm transition"
                        >
                          <span className="text-sm font-semibold text-foreground">Form MD-14</span>
                          <span className="text-xs text-muted mt-1 line-clamp-2">Import License Application</span>
                          <div className="flex gap-2 mt-3">
                            <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md font-medium">CDSCO</span>
                            <span className="text-[10px] px-2 py-0.5 bg-green-50 text-green-600 rounded-md font-medium">Auto-fill</span>
                          </div>
                        </Link>
                        <Link
                          href={`/dashboard/products/${id}/md16`}
                          className="flex flex-col text-left bg-surface border border-border rounded-xl p-4 hover:border-violet-500/50 hover:shadow-sm transition"
                        >
                          <span className="text-sm font-semibold text-foreground">Form MD-16</span>
                          <span className="text-xs text-muted mt-1 line-clamp-2">Manufacturing License</span>
                          <div className="flex gap-2 mt-3">
                            <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md font-medium">CDSCO</span>
                            <span className="text-[10px] px-2 py-0.5 bg-green-50 text-green-600 rounded-md font-medium">Auto-fill</span>
                          </div>
                        </Link>
                      </>
                    )}
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
            {docs.map((d) => (
              <Link key={String(d._id)} href={`/dashboard/documents/${d._id}`}
                className="flex items-center justify-between bg-surface border border-border rounded-xl p-4 hover:border-[var(--accent)]/40 hover:shadow-sm transition">
                <div>
                  <p className="text-sm font-semibold text-foreground">{d.title}</p>
                  <p className="text-xs text-muted mt-0.5">{d.countryCode} &middot; {d.frameworkId} &middot; v{d.version}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${d.status === "submitted" ? "bg-green-50 text-green-600" : d.status === "approved" ? "bg-blue-50 text-blue-600" : d.status === "in-review" ? "bg-purple-50 text-purple-600" : "bg-yellow-50 text-yellow-600"}`}>
                  {d.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
