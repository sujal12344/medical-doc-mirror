import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Company } from "@/models/Company";
import AlertsManager from "./AlertsManager";
import { redirect } from "next/navigation";

function toPlainJson(value: unknown): any {
  if (value === null || value === undefined) return [];
  return JSON.parse(JSON.stringify(value));
}

export default async function AlertsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  await connectToDatabase();
  const userId = (user as Record<string, unknown>)._id;

  const company = await Company.findById(userId).lean();
  if (!company) {
    return <div>Company not found</div>;
  }

  const licenses = toPlainJson(company.regulatoryLicenses || []);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Action Required: Alerts</h1>
        <p className="text-sm text-muted mt-1">
          This dashboard automatically filters your licenses to show only the ones that are expired or expiring within 90 days.
        </p>
      </div>

      <AlertsManager initialLicenses={licenses} companyId={String(userId)} mode="alerts" />
    </div>
  );
}
