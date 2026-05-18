import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import DossierForm from "./DossierForm";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Technical Dossier — MDR Schedule V | SwayamSutra` };
}

export default async function DossierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  const user = await getSession();
  await connectToDatabase();

  const product = await Product.findOne({
    _id: id,
    userId: (user as Record<string, unknown>)._id,
  }).lean<any>();
  if (!product) notFound();

  const initialDossier = product.technicalDossier
    ? JSON.parse(JSON.stringify(product.technicalDossier))
    : {};

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <Link
        href={`/dashboard/products/${id}`}
        className="text-sm text-muted hover:text-foreground transition mb-4 inline-block"
      >
        ← Back to {product.name}
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-violet-600 text-white text-xs font-bold">2</span>
          <h1 className="text-2xl font-bold text-foreground">Technical Dossier</h1>
        </div>
        <p className="text-sm text-muted ml-11">
          <strong>MDR 2017 Schedule V</strong> — Technical documentation required for CDSCO registration of{" "}
          <span className="font-semibold text-foreground">{product.name}</span>{" "}
          (Class {product.deviceClass})
        </p>
      </div>

      <DossierForm
        productId={String(product._id)}
        deviceClass={product.deviceClass}
        initialDossier={initialDossier}
      />
    </div>
  );
}
