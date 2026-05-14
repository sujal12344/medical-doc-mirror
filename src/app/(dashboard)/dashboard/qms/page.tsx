import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Company } from "@/models/Company";
import QMSDashboard from "./QMSDashboard";

export const metadata = {
  title: "Quality Management System (QMS) | SwayamSutra",
};

export default async function QMSPage() {
  const user = await getSession();
  await connectToDatabase();

  const company = await Company.findById((user as any)._id).lean<any>();
  const initialData = company?.qms
    ? JSON.parse(JSON.stringify(company.qms))
    : {};

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white text-xs font-bold">3</span>
          <h1 className="text-2xl font-bold text-foreground">Quality Management System</h1>
        </div>
        <p className="text-sm text-muted ml-11">
          Manage your ISO 13485 implementation, SOPs, and CAPAs.
        </p>
      </div>

      <QMSDashboard initialData={initialData} />
    </div>
  );
}
