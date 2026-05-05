import Link from "next/link";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { RegulatoryDocument } from "@/models/Document";
import { Product } from "@/models/Product";
import { DocumentVersion } from "@/models/DocumentVersion";

export default async function VaultPage() {
  const user = await getSession();
  await connectToDatabase();

  const userId = (user as Record<string, unknown>)._id;
  const [docs, products, versions] = await Promise.all([
    RegulatoryDocument.find({ userId }).sort({ updatedAt: -1 }).lean(),
    Product.find({ userId }).lean(),
    DocumentVersion.find({}).sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  const productMap = new Map(products.map((p) => [String(p._id), p.name]));

  const statusColors: Record<string, string> = {
    draft: "bg-yellow-50 text-yellow-600",
    "in-review": "bg-purple-50 text-purple-600",
    approved: "bg-blue-50 text-blue-600",
    submitted: "bg-green-50 text-green-600",
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Document Vault</h1>
        <p className="text-sm text-muted mt-1">All regulatory documents across your products</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-xs text-muted font-medium uppercase">Total</p>
          <p className="text-2xl font-bold text-foreground">{docs.length}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-xs text-muted font-medium uppercase">Drafts</p>
          <p className="text-2xl font-bold text-yellow-600">{docs.filter((d) => d.status === "draft").length}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-xs text-muted font-medium uppercase">Submitted</p>
          <p className="text-2xl font-bold text-green-600">{docs.filter((d) => d.status === "submitted").length}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-xs text-muted font-medium uppercase">Versions</p>
          <p className="text-2xl font-bold text-blue-600">{versions.length}</p>
        </div>
      </div>

      {/* Documents Table */}
      {docs.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <p className="text-lg font-semibold text-foreground mb-2">Vault is empty</p>
          <p className="text-sm text-muted">Create a product and generate documents to populate your vault.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface2">
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-5 py-3">Document</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-5 py-3">Product</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-5 py-3">Country</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-5 py-3">Version</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-5 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={String(d._id)} className="border-b border-border last:border-0 hover:bg-surface2 transition">
                  <td className="px-5 py-3.5">
                    <Link href={`/dashboard/documents/${d._id}`} className="text-sm font-medium text-foreground hover:text-accent transition">
                      {d.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted">{productMap.get(String(d.productId)) || "—"}</td>
                  <td className="px-5 py-3.5 text-xs text-muted">{d.countryCode}</td>
                  <td className="px-5 py-3.5 text-xs text-muted font-mono">v{d.version}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[d.status] || ""}`}>{d.status}</span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted">{new Date(d.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
