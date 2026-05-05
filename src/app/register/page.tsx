"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ companyName: "", companyEmail: "", companyPassword: "", companyNumber: "", description: "", country: "IN" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function upd(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      
      // Auto sign-in after successful registration
      const signInRes = await signIn("credentials", {
        redirect: false,
        email: form.companyEmail,
        password: form.companyPassword,
      });

      if (signInRes?.error) {
        setError("Account created but auto sign-in failed. Please sign in manually.");
        router.push("/login");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const countries = [
    { code: "IN", name: "India" }, { code: "US", name: "United States" }, { code: "EU", name: "European Union" },
    { code: "CN", name: "China" }, { code: "JP", name: "Japan" }, { code: "CA", name: "Canada" },
    { code: "AU", name: "Australia" }, { code: "SA", name: "Saudi Arabia" }, { code: "SG", name: "Singapore" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-foreground">
            <span className="w-9 h-9 bg-accent/15 border border-accent/30 rounded-xl flex items-center justify-center text-lg">S</span>
            SwayamSutra
          </Link>
          <p className="mt-2 text-muted text-sm">Create your company account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-8 shadow-sm space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Company Name</label>
            <input type="text" required value={form.companyName} onChange={(e) => upd("companyName", e.target.value)}
              className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition" placeholder="MedTech Inc." />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Company Email</label>
            <input type="email" required value={form.companyEmail} onChange={(e) => upd("companyEmail", e.target.value)}
              className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition" placeholder="contact@company.com" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input type="password" required minLength={6} value={form.companyPassword} onChange={(e) => upd("companyPassword", e.target.value)}
              className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition" placeholder="Min 6 characters" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Company Number</label>
              <input type="tel" value={form.companyNumber} onChange={(e) => upd("companyNumber", e.target.value)}
                className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition" placeholder="+91..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Country</label>
              <select value={form.country} onChange={(e) => upd("country", e.target.value)}
                className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition">
                {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description (Optional)</label>
            <textarea value={form.description} onChange={(e) => upd("description", e.target.value)}
              className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition" placeholder="Briefly describe your company..." rows={3} />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 text-white font-semibold rounded-xl text-sm transition disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--accent)] hover:bg-[var(--accent-hover)]">
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p className="text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-accent hover:underline font-medium">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
