import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Company } from "@/models/Company";
import { connectToDatabase } from "@/lib/mongodb";
import ClassificationWizard from "./ClassificationWizard";

export const metadata = { title: "Phase 1 — Device Classification | SwayamSutra" };

export default async function ClassificationPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectToDatabase();
  const companyId = (session as Record<string, unknown>)._id;
  const company = await Company.findById(companyId).lean<any>();
  if (!company) redirect("/login");

  const initialData = company.deviceClassification || {};

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent)] text-white text-xs font-bold">1</span>
          <h1 className="text-2xl font-bold text-foreground">Device Classification Wizard</h1>
        </div>
        <p className="text-sm text-muted ml-11">
          Classify your medical device per <strong>MDR 2017 Schedule III</strong> and identify your global regulatory pathways.
        </p>
      </div>
      <ClassificationWizard initialData={initialData} />
    </div>
  );
}
