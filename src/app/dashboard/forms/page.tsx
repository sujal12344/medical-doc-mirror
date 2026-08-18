"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";

type FormSpec = {
  id: string;
  frameworkId: string;
  title: string;
  name: string;
  description: string;
  path: string;
};

const FORMS: FormSpec[] = [
  {
    id: "md-1",
    frameworkId: "IN_MD_1",
    title: "MD-1",
    name: "MD-1 Form",
    description: "Application for Registration as Notified Body",
    path: "/dashboard/forms/md-1",
  },
  {
    id: "md-3",
    frameworkId: "IN_MD_3",
    title: "MD-3",
    name: "MD-3 Form",
    description: "Site Master File for manufacturing premises",
    path: "/dashboard/forms/md-3",
  },
  {
    id: "md-4",
    frameworkId: "IN_MD_4",
    title: "MD-4",
    name: "MD-4 Form",
    description: "Application for grant of loan licence to manufacture for sale or for distribution of Class A or Class B medical device",
    path: "/dashboard/forms/md-4",
  },
  {
    id: "md-7",
    frameworkId: "IN_MD_7",
    title: "MD-7",
    name: "MD-7 Form",
    description: "Application for Grant of Licence to Manufacture for Sale or for Distribution of Class C or Class D",
    path: "/dashboard/forms/md-7",
  },
  {
    id: "md-8",
    frameworkId: "IN_MD_8",
    title: "MD-8",
    name: "MD-8 Form",
    description: "Application for Grant of Loan Licence to Manufacture for Sale or for Distribution of Class C or Class D",
    path: "/dashboard/forms/md-8",
  },
  {
    id: "md-14",
    frameworkId: "IN_MD_14",
    title: "MD-14",
    name: "MD-14 Form",
    description: "Application for import registration/license of medical device",
    path: "/dashboard/forms/md-14",
  },
  {
    id: "md-11",
    frameworkId: "IN_MD_11",
    title: "MD-11",
    name: "MD-11 Form",
    description: "Inspection Book for audits",
    path: "/dashboard/forms/md-11",
  },
  {
    id: "md-18",
    frameworkId: "IN_MD_18",
    title: "MD-18",
    name: "MD-18 Form",
    description: "Importing medical devices for medical institution",
    path: "/dashboard/forms/md-18",
  },
  {
    id: "md-20",
    frameworkId: "IN_MD_20",
    title: "MD-20",
    name: "MD-20 Form",
    description: "Importing medical devices for personal use",
    path: "/dashboard/forms/md-20",
  },
  {
    id: "md-22",
    frameworkId: "IN_MD_22",
    title: "MD-22",
    name: "MD-22 Form",
    description: "Grant of permission to conduct clinical investigation of an investigational medical device",
    path: "/dashboard/forms/md-22",
  },
  {
    id: "md-24",
    frameworkId: "IN_MD_24",
    title: "MD-24",
    name: "MD-24 Form",
    description: "Grant of permission to conduct performance evaluation of an in vitro diagnostic medical device",
    path: "/dashboard/forms/md-24",
  },
  {
    id: "md-26",
    frameworkId: "IN_MD_26",
    title: "MD-26",
    name: "MD-26 Form",
    description: "Grant of permission to sale of an in vitro diagnostic medical device(Manufacturing License)",
    path: "/dashboard/forms/md-26",
  },
  {
    id: "md-28",
    frameworkId: "IN_MD_28",
    title: "MD-28",
    name: "MD-28 Form",
    description: "Grant of permission for sale of an in vitro diagnostic medical device(Import License)",
    path: "/dashboard/forms/md-28",
  },
  {
    id: "md-30",
    frameworkId: "IN_MD_30",
    title: "MD-30",
    name: "MD-30 Form",
    description: "Court Sample Memorandum",
    path: "/dashboard/forms/md-30",
  },
  {
    id: "md-39",
    frameworkId: "IN_MD_39",
    title: "MD-39",
    name: "MD-39 Form",
    description: "Grant of registration to common test or evaluation laboratory",
    path: "/dashboard/forms/md-39",
  },
  {
    id: "md-41",
    frameworkId: "IN_MD_41",
    title: "MD-41",
    name: "MD-41 Form",
    description: "Grant of registration to medical device distributor",
    path: "/dashboard/forms/md-41",
  },
  {
    id: "test-license",
    frameworkId: "IN_TEST_LICENSE",
    title: "Test License",
    name: "MD-12 & MD-16",
    description: "Test License for both import and domestic",
    path: "/dashboard/forms/test-license",
  },
];

function CreateFormButton({ form }: { form: FormSpec }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  async function create() {
    setLoading(true);
    setStatus("Creating document...");
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryCode: "IN",
          frameworkId: form.frameworkId,
          title: form.title,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`${form.path}?docId=${data.document._id}`);
      } else {
        setStatus(data.message || "Failed to create document.");
        setTimeout(() => setStatus(""), 3000);
      }
    } catch (e) {
      setStatus("An error occurred");
      setTimeout(() => setStatus(""), 3000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={create}
      disabled={loading}
      className="flex flex-col text-left bg-surface border border-border rounded-xl p-5 hover:border-[var(--accent)] hover:shadow-sm transition disabled:opacity-50 w-full"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
          <FileText className="w-4 h-4" />
        </div>
        <span className="text-sm font-semibold text-foreground">{form.name}</span>
      </div>
      <span className="text-xs text-muted line-clamp-2">{form.description}</span>
      {loading && status && (
        <p className="text-[10px] text-[var(--accent)] mt-3 font-medium animate-pulse">{status}</p>
      )}
      {!loading && status && (
        <p className="text-[10px] text-[var(--status-error)] mt-3">{status}</p>
      )}
    </button>
  );
}

export default function FormsDashboard() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Forms Library</h1>
          <p className="text-sm text-muted mt-1">
            Generate supporting documents for application forms
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FORMS.map((form) => (
          <CreateFormButton key={form.id} form={form} />
        ))}
      </div>
    </div>
  );
}
