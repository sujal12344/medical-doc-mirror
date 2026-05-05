import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login");

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar userName={(user as Record<string, unknown>).companyName as string} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
