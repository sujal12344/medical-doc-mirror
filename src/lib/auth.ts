import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import { Company } from "@/models/Company";

export async function getSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  await connectToDatabase();
  // Return company with an injected _id to maintain compatibility
  const company = await Company.findById((session.user as any).id).select("-companyPassword").lean();
  return company ?? null;
}

export async function requireAuth() {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  return user;
}
