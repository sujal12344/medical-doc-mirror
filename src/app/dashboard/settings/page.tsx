"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import BasicInfoForm from "./components/BasicInfoForm";
import CoiSection, { CoiData } from "./components/CoiSection";

type CompanyData = {
  _id: string;
  companyName: string;
  companyEmail: string;
  companyNumber?: string;
  description?: string;
  country?: string;
};

export default function SettingsPage() {
  const { status } = useSession();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [initialForm, setInitialForm] = useState({ companyName: "", companyNumber: "", description: "", country: "" });
  const [coiData, setCoiData] = useState<CoiData | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/companies/me").then((r) => r.json()).then((data) => {
        if (data.company) {
          setCompany(data.company);
          setInitialForm({
            companyName: data.company.companyName || "",
            companyNumber: data.company.companyNumber || "",
            description: data.company.description || "",
            country: data.company.country || ""
          });
        }
      });
      // Load existing COI data
      fetch("/api/companies/me/coi").then((r) => r.json()).then((data) => {
        if (data.coiData) setCoiData(data.coiData);
      });
    }
  }, [status]);

  if (status === "loading" || !company) {
    return <div className="p-8"><p className="text-muted">Loading...</p></div>;
  }

  return (
    <div className="max-w-[100rem] mx-auto h-full flex flex-col relative">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl pt-8 pb-4 px-8 border-b border-border/40 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Company Settings</h1>
          <p className="text-sm text-muted">Manage your company profile and regulatory identity documents</p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 items-start w-full px-8 pb-8">
        {/* ─── Basic Info Form ────────────────────────────────────────────── */}
        <BasicInfoForm company={company} initialForm={initialForm} />

        {/* ─── COI / Company Identity Document ───────────────────────────── */}
        <CoiSection coiData={coiData} onUploadSuccess={setCoiData} />
      </div>
    </div>
  );
}
