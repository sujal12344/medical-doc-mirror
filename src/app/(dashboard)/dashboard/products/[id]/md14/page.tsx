import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { Company } from "@/models/Company";
import Link from "next/link";
import PrintButton from "./PrintButton";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Form MD-14 — Import License Application | SwayamSutra` };
}

export default async function FormMD14Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  const user = await getSession();
  await connectToDatabase();

  const company = await Company.findById((user as any)._id).lean<any>();
  const product = await Product.findOne({
    _id: id,
    userId: (user as Record<string, unknown>)._id,
  }).lean<any>();

  if (!product || !company) notFound();

  const bg = company.businessGenesis || {};
  const dc = company.deviceClassification || {};
  const td = product.technicalDossier || {};

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8 print:hidden">
        <div>
          <Link
            href={`/dashboard/products/${id}`}
            className="text-sm text-muted hover:text-foreground transition mb-2 inline-block"
          >
            ← Back to {product.name}
          </Link>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-violet-600 text-white text-xs font-bold">2</span>
            <h1 className="text-2xl font-bold text-foreground">Form MD-14</h1>
          </div>
          <p className="text-sm text-muted mt-1 ml-11">
            Application for issue of import license to import medical device
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="bg-white text-black p-10 border border-gray-300 shadow-sm print:border-none print:shadow-none print:p-0">
        <div className="text-center mb-8 font-serif">
          <h2 className="text-xl font-bold underline mb-2">FORM MD-14</h2>
          <p className="text-sm">[See sub-rule (1) of rule 34]</p>
          <p className="text-base font-bold mt-4">Application for issue of import licence to import medical device</p>
        </div>

        <div className="space-y-6 text-sm font-serif leading-relaxed">
          <div className="flex gap-4">
            <span className="font-bold">1.</span>
            <div>
              <p>Name of the applicant:</p>
              <p className="font-semibold border-b border-gray-400 inline-block min-w-[300px] mt-1">{company.companyName || "____________________"}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="font-bold">2.</span>
            <div className="w-full">
              <p>Address of the applicant:</p>
              <p className="font-semibold border-b border-gray-400 block w-full mt-1 min-h-[24px]">
                {company.country || "____________________"}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="font-bold">3.</span>
            <div className="w-full">
              <p>Telephone Number and E-mail Address:</p>
              <div className="grid grid-cols-2 gap-4 mt-1">
                <p className="font-semibold border-b border-gray-400">Tel: {company.companyNumber || "____________________"}</p>
                <p className="font-semibold border-b border-gray-400">Email: {company.companyEmail || "____________________"}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="font-bold">4.</span>
            <div className="w-full">
              <p>Name and address of manufacturer:</p>
              <div className="grid grid-cols-2 gap-4 mt-1">
                <p className="font-semibold border-b border-gray-400">Name: {product.manufacturer || "____________________"}</p>
                <p className="font-semibold border-b border-gray-400">Address: {td.sec3?.manufacturerAddress || "____________________"}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="font-bold">5.</span>
            <div className="w-full">
              <p>Name and address of the manufacturing site(s):</p>
              <p className="font-semibold border-b border-gray-400 block w-full mt-1 min-h-[24px]">
                {td.sec3?.manufacturingSite || "____________________"}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="font-bold">6.</span>
            <div className="w-full">
              <p>Details of medical device(s) to be imported:</p>
              <table className="w-full mt-3 border-collapse border border-gray-400 text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 p-2 text-left">S.No.</th>
                    <th className="border border-gray-400 p-2 text-left">Generic Name</th>
                    <th className="border border-gray-400 p-2 text-left">Model No.</th>
                    <th className="border border-gray-400 p-2 text-left">Intended Use</th>
                    <th className="border border-gray-400 p-2 text-left">Class of medical device</th>
                    <th className="border border-gray-400 p-2 text-left">Material of construction</th>
                    <th className="border border-gray-400 p-2 text-left">Dimension</th>
                    <th className="border border-gray-400 p-2 text-left">Shelf life</th>
                    <th className="border border-gray-400 p-2 text-left">Sterile / Non-sterile</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-400 p-2">1</td>
                    <td className="border border-gray-400 p-2">{product.name}</td>
                    <td className="border border-gray-400 p-2">{td.sec1?.modelNumbers || "—"}</td>
                    <td className="border border-gray-400 p-2">{product.intendedUse || "—"}</td>
                    <td className="border border-gray-400 p-2">Class {product.deviceClass}</td>
                    <td className="border border-gray-400 p-2">{td.sec1?.materials || "—"}</td>
                    <td className="border border-gray-400 p-2">{td.sec1?.dimensions || "—"}</td>
                    <td className="border border-gray-400 p-2">{td.sec2?.shelfLife || "—"}</td>
                    <td className="border border-gray-400 p-2">{td.sec2?.sterilityInfo || "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="font-bold">7.</span>
            <div className="w-full">
              <p>Fee Paid:</p>
              <p className="font-semibold border-b border-gray-400 block w-full mt-1 min-h-[24px]">
                ____________________ [To be filled manually during CDSCO portal submission]
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="font-bold">8.</span>
            <div className="w-full">
              <p>I have enclosed the documents as specified in the Fourth Schedule of Medical Devices Rules, 2017.</p>
            </div>
          </div>

          <div className="mt-16 pt-8 grid grid-cols-2">
            <div>
              <p>Place: <span className="font-semibold border-b border-gray-400 inline-block min-w-[150px]"></span></p>
              <p className="mt-4">Date: <span className="font-semibold border-b border-gray-400 inline-block min-w-[150px]"></span></p>
            </div>
            <div className="text-right">
              <p className="mb-8">Signature: ___________________________</p>
              <p>Name: <span className="font-semibold border-b border-gray-400 inline-block min-w-[200px]"></span></p>
              <p className="mt-2">Designation: <span className="font-semibold border-b border-gray-400 inline-block min-w-[200px]"></span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
