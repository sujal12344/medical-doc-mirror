"use client";

import { useState } from "react";

type CompanyData = {
  _id: string;
  companyName: string;
  companyEmail: string;
  companyNumber?: string;
  description?: string;
  country?: string;
};

type Props = {
  company: CompanyData;
  initialForm: {
    companyName: string;
    companyNumber: string;
    description: string;
    country: string;
  };
};

export default function BasicInfoForm({ company, initialForm }: Props) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

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

  return (
    <form onSubmit={handleSave} className="w-full xl:w-[40%] bg-surface border border-border rounded-2xl p-8 space-y-5 sticky top-[140px]">
      <h2 className="text-base font-bold text-foreground mb-1">Basic Information</h2>

      {msg && (
        <div className={`text-sm rounded-lg px-4 py-3 ${msg.includes("success") ? "bg-green-500/10 border border-green-500/30 text-green-600" : "bg-red-500/10 border border-red-500/30 text-red-600"}`}>
          {msg}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5">Company Email</label>
        <input type="email" disabled value={company.companyEmail}
          className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm text-muted cursor-not-allowed" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Company Name</label>
        <input type="text" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Company Number</label>
          <input type="tel" value={form.companyNumber} onChange={(e) => setForm({ ...form, companyNumber: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Country</label>
          <input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition" placeholder="e.g. IN, US" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Description</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition" rows={3} />
      </div>

      <button type="submit" disabled={saving}
        className="w-full py-2.5 bg-[var(--accent)] hover:opacity-90 text-white font-semibold rounded-xl text-sm transition disabled:opacity-50">
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
