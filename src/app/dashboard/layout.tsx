import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import { connectToDatabase } from "@/lib/mongodb";
import { Company } from "@/models/Company";
import Link from "next/link";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login");

  // Fetch Company to check for global alerts
  await connectToDatabase();
  const company = await Company.findById((user as Record<string, unknown>)._id).lean();
  let alertCount = 0;

  if (company && company.regulatoryLicenses) {
    const today = new Date();
    const msInDay = 24 * 60 * 60 * 1000;
    
    // Type assertion for LeanDocument arrays
    const licenses = company.regulatoryLicenses as Array<{ expiryDate?: Date }>;
    
    licenses.forEach((lic) => {
      if (lic.expiryDate) {
        const daysUntilExpiry = Math.floor((new Date(lic.expiryDate).getTime() - today.getTime()) / msInDay);
        if (daysUntilExpiry <= 90) {
          alertCount++;
        }
      }
    });
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar userName={(user as Record<string, unknown>).companyName as string} />
      <main className="flex-1 flex flex-col min-w-0">
        {alertCount > 0 && (
          <Link 
            href="/dashboard/alerts" 
            className="w-full shrink-0 bg-[var(--status-error-bg)] border-b border-[var(--status-error-border)] px-6 py-3 flex items-center gap-3 hover:opacity-90 transition-colors cursor-pointer group z-10"
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
            </span>
            <span className="text-[13px] font-bold text-red-600 group-hover:text-red-700 transition-colors">
              Action Required: You have {alertCount} regulatory license{alertCount > 1 ? "s" : ""} expired or expiring soon. Click here to review.
            </span>
          </Link>
        )}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
