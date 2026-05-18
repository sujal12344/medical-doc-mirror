"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type CompanyData = { _id: string; companyName: string; companyEmail: string; companyNumber?: string; description?: string; country?: string; };

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [form, setForm] = useState({ companyName: "", companyNumber: "", description: "", country: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/companies/me").then((r) => r.json()).then((data) => {
        if (data.company) {
          setCompany(data.company);
          setForm({ 
            companyName: data.company.companyName || "", 
            companyNumber: data.company.companyNumber || "", 
            description: data.company.description || "",
            country: data.company.country || ""
          });
        }
      });
    }
  }, [status]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const r = await fetch("/api/companies/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (r.ok) setMsg("Settings saved successfully");
      else setMsg("Failed to save");
    } catch {
      setMsg("Connection error");
    }
    setSaving(false);
  }

  if (status === "loading" || !company) return <div className="p-8"><p className="text-muted">Loading...</p></div>;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground mb-1">Company Settings</h1>
      <p className="text-sm text-muted mb-8">Manage your company profile</p>

      <form onSubmit={handleSave} className="bg-surface border border-border rounded-2xl p-8 space-y-5">
        {msg && (
          <div className={`text-sm rounded-lg px-4 py-3 ${msg.includes("success") ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>{msg}</div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1.5">Company Email</label>
          <input type="email" disabled value={company.companyEmail}
            className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm text-muted cursor-not-allowed" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Company Name</label>
          <input type="text" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Company Number</label>
            <input type="tel" value={form.companyNumber} onChange={(e) => setForm({ ...form, companyNumber: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Country</label>
            <input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition" placeholder="e.g. IN, US" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition" rows={3} />
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-xl text-sm transition disabled:opacity-50">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
