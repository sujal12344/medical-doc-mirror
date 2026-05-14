import Link from "next/link";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { RegulatoryDocument } from "@/models/Document";
import BusinessSetupWidget from "@/components/BusinessSetupWidget";
import ClassificationWidget from "@/components/ClassificationWidget";
import TechnicalDossierWidget from "@/components/TechnicalDossierWidget";
import QMSWidget from "@/components/QMSWidget";

export default async function DashboardPage() {
  const user = await getSession();
  await connectToDatabase();

  const userId = (user as Record<string, unknown>)._id;
  const initialSetup = (user as any).businessGenesis || {};
  const initialClassification = (user as any).deviceClassification || {};

  const [productCount, docCount, draftCount, submittedCount] = await Promise.all([
    Product.countDocuments({ userId }),
    RegulatoryDocument.countDocuments({ userId }),
    RegulatoryDocument.countDocuments({ userId, status: "draft" }),
    RegulatoryDocument.countDocuments({ userId, status: "submitted" }),
  ]);

  const recentProducts = await Product.find({ userId }).sort({ updatedAt: -1 }).limit(5).lean();
  const recentDocs = await RegulatoryDocument.find({ userId }).sort({ updatedAt: -1 }).limit(5).lean();

  const userName = (user as Record<string, unknown>).companyName as string;
  const isEmpty = productCount === 0;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Welcome back, {userName}</h1>
        <p className="text-sm text-muted mt-1">
          {isEmpty
            ? "Let's get started — follow the steps below to create your first regulatory submission."
            : `You have ${productCount} product${productCount !== 1 ? "s" : ""} and ${docCount} document${docCount !== 1 ? "s" : ""}.`}
        </p>
      </div>

      {/* Phases Section */}
      <div className="mb-8 space-y-4">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Phases</h2>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div>
            <BusinessSetupWidget initialSetup={initialSetup} />
          </div>
          <div>
            <ClassificationWidget initialData={initialClassification} />
          </div>
          <div>
            <TechnicalDossierWidget productCount={productCount} docCount={docCount} />
          </div>
          <div>
            <QMSWidget initialData={(user as any).qms || {}} />
          </div>
        </div>
      </div>

      {/* How It Works — always visible when empty, collapsed link when not */}
      {isEmpty ? (
        <div className="bg-surface border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-base font-bold text-foreground mb-1">How SwayamSutra works</h2>
          <p className="text-xs text-muted mb-5">Three simple steps to build your regulatory dossier</p>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-full bg-[var(--accent)] text-white text-sm font-bold flex items-center justify-center shrink-0">1</span>
                <span className="font-semibold text-foreground text-sm">Register Your Product</span>
              </div>
              <p className="text-xs text-muted leading-relaxed ml-11">
                Add your medical device or IVD — name, manufacturer, device class, and target countries.
              </p>
              <div className="hidden md:block absolute top-4 -right-3 text-border text-lg">&rarr;</div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-full bg-[var(--accent)] text-white text-sm font-bold flex items-center justify-center shrink-0">2</span>
                <span className="font-semibold text-foreground text-sm">Generate Documents</span>
              </div>
              <p className="text-xs text-muted leading-relaxed ml-11">
                Pick a country framework (India DMF, US 510k, EU MDR, etc.) to generate the required regulatory document with all sections pre-structured.
              </p>
              <div className="hidden md:block absolute top-4 -right-3 text-border text-lg">&rarr;</div>
            </div>

            {/* Step 3 */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-full bg-[var(--accent)] text-white text-sm font-bold flex items-center justify-center shrink-0">3</span>
                <span className="font-semibold text-foreground text-sm">Fill & Submit</span>
              </div>
              <p className="text-xs text-muted leading-relaxed ml-11">
                Fill each section manually or upload documents (COA, IFU, clinical reports) and let AI auto-fill. Then export as PDF.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-border">
            <Link
              href="/dashboard/products/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-xl text-sm transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14" strokeLinecap="round"/></svg>
              Register Your First Product
            </Link>
            <span className="text-xs text-muted ml-3">Takes ~2 minutes</span>
          </div>
        </div>
      ) : (
        <>
          {/* Stats row — only when there's data */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Products", value: productCount, icon: "📦" },
              { label: "Total Documents", value: docCount, icon: "📄" },
              { label: "Drafts", value: draftCount, icon: "✏️" },
              { label: "Submitted", value: submittedCount, icon: "✅" },
            ].map((s) => (
              <div key={s.label} className="bg-surface border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted font-medium uppercase tracking-wide">{s.label}</span>
                  <span className="text-base">{s.icon}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Main Grid: Quick Actions */}
      <div className="mb-8 space-y-4">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link href="/dashboard/products/new" className="bg-surface border border-border rounded-xl p-4 hover:border-[var(--accent)]/40 hover:shadow-sm transition group flex items-start gap-3">
            <div className="w-10 h-10 bg-[var(--accent)]/10 rounded-lg flex items-center justify-center text-[var(--accent)] shrink-0 group-hover:bg-[var(--accent)]/20 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14" strokeLinecap="round"/></svg>
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">New Product</p>
              <p className="text-xs text-muted mt-0.5">Add a medical device or IVD to get started</p>
            </div>
          </Link>

          <Link href="/dashboard/products" className="bg-surface border border-border rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition group flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-100 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">My Products</p>
              <p className="text-xs text-muted mt-0.5">View products and generate regulatory docs</p>
            </div>
          </Link>

          <Link href="/dashboard/vault" className="bg-surface border border-border rounded-xl p-4 hover:border-green-300 hover:shadow-sm transition group flex items-start gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600 shrink-0 group-hover:bg-green-100 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Document Vault</p>
              <p className="text-xs text-muted mt-0.5">Browse, version, and export all documents</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent activity — only when data exists */}
      {!isEmpty && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Products */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <h2 className="font-semibold text-foreground text-sm">Recent Products</h2>
              <Link href="/dashboard/products" className="text-xs text-[var(--accent)] hover:underline font-medium">View all</Link>
            </div>
            <div className="divide-y divide-border">
              {recentProducts.map((p) => (
                <Link key={String(p._id)} href={`/dashboard/products/${p._id}`} className="flex items-center justify-between px-5 py-3 hover:bg-surface2 transition">
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted">{p.manufacturer} &middot; Class {p.deviceClass}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {p.countries.slice(0, 3).map((c: string) => (
                        <span key={c} className="text-[10px] px-1.5 py-0.5 bg-surface2 rounded text-muted font-medium">{c}</span>
                      ))}
                      {p.countries.length > 3 && <span className="text-[10px] text-muted">+{p.countries.length - 3}</span>}
                    </div>
                    <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Documents */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <h2 className="font-semibold text-foreground text-sm">Recent Documents</h2>
              <Link href="/dashboard/vault" className="text-xs text-[var(--accent)] hover:underline font-medium">View all</Link>
            </div>
            {recentDocs.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <p className="text-sm text-muted">No documents yet.</p>
                <p className="text-xs text-muted mt-1">Open a product and click a country framework to generate one.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentDocs.map((d) => (
                  <Link key={String(d._id)} href={`/dashboard/documents/${d._id}`} className="flex items-center justify-between px-5 py-3 hover:bg-surface2 transition">
                    <div>
                      <p className="text-sm font-medium text-foreground">{d.title}</p>
                      <p className="text-xs text-muted">{d.countryCode} &middot; v{d.version}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        d.status === "submitted" ? "bg-green-50 text-green-700"
                        : d.status === "approved" ? "bg-blue-50 text-blue-700"
                        : d.status === "in-review" ? "bg-purple-50 text-purple-700"
                        : "bg-yellow-50 text-yellow-700"
                      }`}>{d.status}</span>
                      <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
