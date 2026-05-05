import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "@/lib/mongodb";
import { Company } from "@/models/Company";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }
        await connectToDatabase();
        const company = await Company.findOne({ companyEmail: credentials.email.toLowerCase() }).lean();
        if (!company || !company.companyPassword) {
          throw new Error("Company not found or invalid password");
        }
        
        if (credentials.password !== company.companyPassword) {
          throw new Error("Invalid email or password");
        }
        return {
          id: company._id.toString(),
          name: company.companyName,
          email: company.companyEmail,
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any)._id = token.id;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_key_for_development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
