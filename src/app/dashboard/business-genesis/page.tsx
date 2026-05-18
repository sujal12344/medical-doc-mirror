import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { redirect } from "next/navigation";
import BusinessGenesisForm from "./BusinessGenesisForm";

export const metadata = {
  title: "Phase 0: Business Genesis - SwayamSutra",
};

export default async function BusinessGenesisPage() {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  await connectToDatabase();
  
  // Extract businessGenesis data
  const businessGenesis = (user as any).businessGenesis || {};

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">Phase 0: Business Genesis</h1>
        <p className="text-sm text-muted">Complete the prerequisite business and statutory registrations before starting your medical device registration.</p>
      </div>

      <BusinessGenesisForm initialData={businessGenesis} />
    </div>
  );
}

