import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models/Product";

export const metadata = { title: "Phase 1 — Device Classification | MedDoc" };

export default async function ClassificationPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectToDatabase();
  const userId = (session as Record<string, unknown>)._id;
  const products = await Product.find({ userId }).select("name deviceClass classification").lean();

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-accent uppercase tracking-widest">Phase 1</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Device Classification</h1>
        <p className="text-sm text-muted mt-1">
          Classification is performed per product under <strong>MDR 2017 Schedule III</strong> using AI-powered RAG analysis.
          Select a product below to classify it.
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6 flex gap-4">
        <div className="text-2xl">🔬</div>
        <div>
          <div className="text-sm font-bold text-blue-800 mb-1">How Classification Works</div>
          <p className="text-xs text-blue-700 leading-relaxed">
            Each product you register gets its own AI classification. Our system queries the MDR 2017 First Schedule rules from 
            Pinecone and uses GPT-4o to determine the correct risk class (A / B / C / D), the applicable rule, and the licensing authority.
          </p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center">
          <div className="text-4xl mb-4">📦</div>
          <h2 className="text-lg font-semibold text-foreground mb-2">No products registered yet</h2>
          <p className="text-sm text-muted mb-5">
            Register a product first in Phase 2, then come back here to classify it.
          </p>
          <Link
            href="/dashboard/products/new"
            className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl text-sm transition inline-block"
          >
            Register Your First Product
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
            Your Products
          </div>
          {products.map((p) => {
            const cls = p.classification as any;
            const isClassified = cls?.wizardCompleted;
            const confirmedClass = cls?.confirmedClass || p.deviceClass;
            const pct = cls?.overallCompletionPct ?? 0;

            const classBadgeColor: Record<string, string> = {
              A: "bg-green-50 text-green-700 border-green-200",
              B: "bg-yellow-50 text-yellow-700 border-yellow-200",
              C: "bg-orange-50 text-orange-700 border-orange-200",
              D: "bg-red-50 text-red-700 border-red-200",
            };

            return (
              <Link
                key={String(p._id)}
                href={`/dashboard/products/${p._id}/classify`}
                className="flex items-center justify-between bg-surface border border-border hover:border-accent/40 rounded-2xl p-5 transition group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black border ${classBadgeColor[confirmedClass] || "bg-surface2 text-muted border-border"}`}>
                    {confirmedClass || "?"}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{p.name}</div>
                    <div className="text-xs text-muted mt-0.5">
                      {isClassified ? "🔒 Classification locked" : pct > 0 ? `${pct}% classified — review pending` : "Not yet classified"}
                    </div>
                  </div>
                </div>
                <div className="text-xs font-semibold text-accent group-hover:underline">
                  {isClassified ? "View →" : "Classify →"}
                </div>
              </Link>
            );
          })}

          <div className="pt-2">
            <Link
              href="/dashboard/products/new"
              className="text-xs text-accent hover:underline"
            >
              + Register another product
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
