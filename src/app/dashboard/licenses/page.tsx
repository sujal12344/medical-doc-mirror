import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Company } from "@/models/Company";
import AlertsManager from "../alerts/AlertsManager";
import { redirect } from "next/navigation";

function toPlainJson(value: unknown): any {
  if (value === null || value === undefined) return [];
  return JSON.parse(JSON.stringify(value));
}

export default async function LicensesPage() {
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
        <h1 className="text-2xl font-bold text-foreground">License Vault</h1>
        <p className="text-sm text-muted mt-1">
          Upload and manage your regulatory licenses (MD-9, MD-17, etc.) here. Our AI will automatically extract expiry dates so we can alert you when they need attention.
        </p>
      </div>

      <AlertsManager initialLicenses={licenses} companyId={String(userId)} mode="vault" />
    </div>
  );
}
