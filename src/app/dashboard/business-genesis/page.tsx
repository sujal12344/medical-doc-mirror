import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { normalizeBusinessGenesis } from "@/lib/businessGenesis";
import { redirect } from "next/navigation";
import BusinessGenesisForm from "./BusinessGenesisForm";

/** Strip Mongoose ObjectIds / buffers for Client Component props */
function toPlainJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export const metadata = {
  title: "Phase 0: Business Genesis - SwayamSutra",
};

export default async function BusinessGenesisPage() {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  await connectToDatabase();
  
  const rawGenesis = (user as Record<string, unknown>).businessGenesis;
  const businessGenesis = normalizeBusinessGenesis(
    rawGenesis ? toPlainJson(rawGenesis) : null,
  );

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

