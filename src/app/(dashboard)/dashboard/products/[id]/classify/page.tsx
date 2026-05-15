import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import ClassifyForm from "./ClassifyForm";

export default async function ClassifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  const user = await getSession();
  await connectToDatabase();
  const product = await Product.findOne({
    _id: id,
    userId: (user as Record<string, unknown>)._id,
  }).lean();
  if (!product) notFound();

  const existingClassification = product.classification
    ? JSON.parse(JSON.stringify(product.classification))
    : null;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <Link
        href={`/dashboard/products/${id}`}
        className="text-sm text-muted hover:text-foreground transition mb-6 inline-flex items-center gap-1"
      >
        ← Back to {product.name}
      </Link>

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-accent uppercase tracking-widest">
            Phase 1
          </span>
          <span className="text-xs text-muted">/ Device Classification</span>
        </div>
        <h1 className="text-2xl font-black text-foreground">{product.name}</h1>
        <p className="text-sm text-muted mt-1">
          AI-powered MDR 2017 (India) First Schedule classification using Pinecone RAG + GPT-4o.
        </p>

        {/* Progress bar */}
        {existingClassification && (
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 bg-surface2 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-accent transition-all duration-500"
                style={{ width: `${existingClassification.overallCompletionPct ?? 0}%` }}
              />
            </div>
            <span className="text-xs font-bold text-accent">
              {existingClassification.overallCompletionPct ?? 0}% complete
            </span>
          </div>
        )}
      </div>

      {/* How it works */}
      {!existingClassification?.wizardCompleted && (
        <div className="bg-surface border border-border rounded-2xl p-5 mb-6">
          <h2 className="text-xs font-bold text-muted uppercase tracking-wide mb-3">
            How AI Classification Works
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="w-8 h-8 bg-accent/10 text-accent rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-2">1</div>
              <div className="text-xs font-semibold text-foreground">Describe Device</div>
              <div className="text-xs text-muted mt-0.5">Manually or upload an IFU/brochure</div>
            </div>
            <div>
              <div className="w-8 h-8 bg-accent/10 text-accent rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-2">2</div>
              <div className="text-xs font-semibold text-foreground">AI Analyses</div>
              <div className="text-xs text-muted mt-0.5">Queries MDR 2017 rules from Pinecone</div>
            </div>
            <div>
              <div className="w-8 h-8 bg-accent/10 text-accent rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-2">3</div>
              <div className="text-xs font-semibold text-foreground">Review & Lock</div>
              <div className="text-xs text-muted mt-0.5">Confirm result to proceed to Phase 2</div>
            </div>
          </div>
        </div>
      )}

      {/* Main form */}
      <ClassifyForm
        productId={id}
        productName={product.name}
        existingClassification={existingClassification}
      />
    </div>
  );
}
