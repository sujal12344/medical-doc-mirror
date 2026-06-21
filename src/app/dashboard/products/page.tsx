import Link from "next/link";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models/Product";

export default async function ProductsPage() {
  const user = await getSession();
  await connectToDatabase();
  const products = await Product.find({ userId: (user as Record<string, unknown>)._id }).sort({ updatedAt: -1 }).lean();

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted mt-1">Manage your medical devices and IVD products</p>
        </div>
        <Link href="/dashboard/products/new?fresh=1" className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl text-sm transition">
          + New Product
        </Link>
      </div>
      <div className="p-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Products</h1>
            <p className="text-sm text-muted mt-1">Manage your medical devices and IVD products</p>
          </div>
          <Link href="/dashboard/products/disintegrate?fresh=1" className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl text-sm transition">
            + Disintegrate Product
          </Link>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center text-accent text-2xl mx-auto mb-4">+</div>
          <h2 className="text-lg font-semibold text-foreground mb-2">No products yet</h2>
          <p className="text-sm text-muted mb-5">Register your first medical device or IVD product to start generating regulatory documents.</p>
          <Link href="/dashboard/products/new?fresh=1" className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl text-sm transition inline-block">
            Create your first product
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <Link key={String(p._id)} href={`/dashboard/products/${p._id}`} className="bg-surface border border-border rounded-xl p-5 hover:border-accent/40 hover:shadow-sm transition group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center text-accent text-xs font-bold group-hover:bg-accent/20 transition">
                  {p.deviceClass}
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${p.status === "active" ? "bg-green-50 text-green-600" : p.status === "archived" ? "bg-gray-100 text-gray-500" : "bg-yellow-50 text-yellow-600"}`}>
                  {p.status}
                </span>
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">{p.name}</h3>
              <p className="text-xs text-muted mb-3">{p.manufacturer}</p>
              <div className="flex gap-1.5 flex-wrap">
                {p.countries.map((c: string) => (
                  <span key={c} className="text-[10px] px-2 py-0.5 bg-surface2 border border-border rounded-full text-muted font-medium">{c}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
