"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SECTIONS = [
  { id: "A", label: "A. Statutory Registrations" },
  { id: "B", label: "B. Company Incorporation" },
  { id: "C", label: "C. Bank" },
  { id: "D", label: "D. IP & Brand" },
  { id: "E", label: "E. Market Research" },
];

export default function BusinessGenesisForm({ initialData }: { initialData: any }) {
  const [activeTab, setActiveTab] = useState("A");
  const [data, setData] = useState<any>({
    secA: {
      gst: { status: 'pending', number: '', documentUrl: '', ...initialData?.secA?.gst },
      msme: { status: 'pending', number: '', documentUrl: '', ...initialData?.secA?.msme },
      iec: { status: 'pending', number: '', documentUrl: '', ...initialData?.secA?.iec },
      shopEstablishment: { status: 'pending', documentUrl: '', ...initialData?.secA?.shopEstablishment },
      professionalTax: { status: 'pending', documentUrl: '', ...initialData?.secA?.professionalTax },
      esicEpfo: { status: 'pending', documentUrl: '', ...initialData?.secA?.esicEpfo },
    },
    secB: {
      entityType: initialData?.secB?.entityType || '',
      cin: initialData?.secB?.cin || '',
      pan: initialData?.secB?.pan || '',
      tan: initialData?.secB?.tan || '',
      incorporationDocUrl: initialData?.secB?.incorporationDocUrl || '',
    },
    secC: {
      bankAccountOpened: initialData?.secC?.bankAccountOpened || false,
      adCodeObtained: initialData?.secC?.adCodeObtained || false,
    },
    secD: {
      trademarkStatus: initialData?.secD?.trademarkStatus || '',
      trademarkNumber: initialData?.secD?.trademarkNumber || '',
      domainRegistered: initialData?.secD?.domainRegistered || false,
      patentFiled: initialData?.secD?.patentFiled || false,
    },
    secE: {
      tamAnalysisDone: initialData?.secE?.tamAnalysisDone || false,
      competitorScanDone: initialData?.secE?.competitorScanDone || false,
      regulatoryPathwayChosen: initialData?.secE?.regulatoryPathwayChosen || false,
    }
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});
  const router = useRouter();

  const handleUpdateNested = (sectionKey: string, fieldKey: string, propKey: string, value: any) => {
    setData((prev: any) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [fieldKey]: {
          ...prev[sectionKey][fieldKey],
          [propKey]: value
        }
      }
    }));
  };

  const handleUpdate = (sectionKey: string, field: string, value: any) => {
    setData((prev: any) => ({ 
      ...prev, 
      [sectionKey]: {
        ...prev[sectionKey],
        [field]: value
      }
    }));
  };

  const uploadFile = async (file: File, uploadKey: string, onComplete: (url: string) => void) => {
    setUploadingState((prev) => ({ ...prev, [uploadKey]: true }));
    try {
      // 1. Get Signed URL
      const resUrl = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });
      if (!resUrl.ok) throw new Error("Failed to get upload URL");
      const { signedUrl, gcsPath } = await resUrl.json();

      // 2. Upload to GCS
      const resUpload = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!resUpload.ok) throw new Error("Failed to upload to Google Cloud Storage");

      // 3. Complete
      onComplete(gcsPath);
    } catch (err) {
      console.error(err);
      alert("Failed to upload file");
    } finally {
      setUploadingState((prev) => ({ ...prev, [uploadKey]: false }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = { businessGenesis: data };
      const res = await fetch("/api/companies/me/setup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Render helper for registration blocks
  const renderRegBlock = (key: string, label: string, hasNumber: boolean = false) => {
    const val = data.secA[key];
    const isUploading = uploadingState[key];
    
    return (
      <div className="p-4 border rounded-xl bg-surface2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm">{label}</h3>
          <select 
            value={val.status} 
            onChange={(e) => handleUpdateNested('secA', key, 'status', e.target.value)}
            className="text-xs border border-border rounded-md px-2 py-1 bg-surface"
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="complete">Complete</option>
          </select>
        </div>
        {val.status === 'complete' && (
          <div className="space-y-3">
            {hasNumber && (
              <div>
                <label className="block text-xs text-muted mb-1">Registration Number</label>
                <input 
                  type="text" 
                  value={val.number} 
                  onChange={(e) => handleUpdateNested('secA', key, 'number', e.target.value)}
                  className="w-full text-sm border border-border rounded-md px-3 py-2"
                  placeholder={`Enter ${label} Number`}
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-muted mb-1">Document Link / Certificate</label>
              {val.documentUrl ? (
                <div className="flex items-center gap-2 mt-1">
                  <a href={`/api/download?path=${encodeURIComponent(val.documentUrl)}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--accent)] hover:underline truncate max-w-[200px]">
                    View Uploaded Document
                  </a>
                  <button onClick={() => handleUpdateNested('secA', key, 'documentUrl', '')} className="text-xs text-red-500 hover:underline">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <input 
                    type="file" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        uploadFile(e.target.files[0], key, (url) => handleUpdateNested('secA', key, 'documentUrl', url));
                      }
                    }}
                    className="flex-1 text-xs border border-border rounded-md px-2 py-1.5 file:mr-2 file:py-1 file:px-2 file:border-0 file:rounded-md file:text-xs file:font-semibold file:bg-[var(--accent)] file:text-white hover:file:bg-[var(--accent-hover)]"
                    accept=".pdf,.png,.jpg,.jpeg"
                    disabled={isUploading}
                  />
                  {isUploading && <span className="text-xs text-[var(--accent)] font-medium animate-pulse">Uploading...</span>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col md:flex-row">
      {/* Sidebar Tabs */}
      <div className="w-full md:w-64 border-r border-border bg-surface2/50 flex flex-col p-4 gap-2">
        {SECTIONS.map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveTab(sec.id)}
            className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === sec.id 
                ? "bg-[var(--accent)] text-white" 
                : "text-muted hover:bg-surface hover:text-foreground"
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-[500px]">
        <div className="p-6 flex-1 overflow-y-auto">
          {activeTab === "A" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-foreground">Statutory Registrations</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {renderRegBlock('gst', 'GST Registration', true)}
                {renderRegBlock('msme', 'MSME / Udyam', true)}
                {renderRegBlock('iec', 'Importer-Exporter Code (IEC)', true)}
                {renderRegBlock('shopEstablishment', 'Shop & Establishment Act')}
                {renderRegBlock('professionalTax', 'Professional Tax (PT)')}
                {renderRegBlock('esicEpfo', 'ESIC / EPFO')}
              </div>
            </div>
          )}

          {activeTab === "B" && (
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-lg font-bold text-foreground">Company Incorporation</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Entity Type</label>
                  <select 
                    value={data.secB.entityType} 
                    onChange={(e) => handleUpdate('secB', 'entityType', e.target.value)}
                    className="w-full text-sm border border-border rounded-md px-3 py-2"
                  >
                    <option value="">Select entity type...</option>
                    <option value="pvt-ltd">Private Limited (Pvt Ltd)</option>
                    <option value="llp">Limited Liability Partnership (LLP)</option>
                    <option value="opc">One Person Company (OPC)</option>
                    <option value="partnership">Partnership</option>
                    <option value="sole-prop">Sole Proprietorship</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">CIN</label>
                    <input type="text" value={data.secB.cin} onChange={(e) => handleUpdate('secB', 'cin', e.target.value)} className="w-full text-sm border border-border rounded-md px-3 py-2" placeholder="Corporate Identity Number" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">PAN</label>
                    <input type="text" value={data.secB.pan} onChange={(e) => handleUpdate('secB', 'pan', e.target.value)} className="w-full text-sm border border-border rounded-md px-3 py-2" placeholder="Company PAN" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">TAN</label>
                    <input type="text" value={data.secB.tan} onChange={(e) => handleUpdate('secB', 'tan', e.target.value)} className="w-full text-sm border border-border rounded-md px-3 py-2" placeholder="Tax Deduction Account Number" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Incorporation Doc</label>
                    {data.secB.incorporationDocUrl ? (
                      <div className="flex items-center gap-2 mt-2">
                        <a href={`/api/download?path=${encodeURIComponent(data.secB.incorporationDocUrl)}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--accent)] hover:underline truncate max-w-[200px]">
                          View Document
                        </a>
                        <button onClick={() => handleUpdate('secB', 'incorporationDocUrl', '')} className="text-xs text-red-500 hover:underline">Remove</button>
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <input 
                          type="file" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              uploadFile(e.target.files[0], 'incorporationDocUrl', (url) => handleUpdate('secB', 'incorporationDocUrl', url));
                            }
                          }}
                          className="w-full text-xs border border-border rounded-md px-2 py-1.5 file:mr-2 file:py-1 file:px-2 file:border-0 file:rounded-md file:text-xs file:font-semibold file:bg-[var(--accent)] file:text-white hover:file:bg-[var(--accent-hover)]"
                          accept=".pdf,.png,.jpg,.jpeg"
                          disabled={uploadingState['incorporationDocUrl']}
                        />
                        {uploadingState['incorporationDocUrl'] && <span className="text-xs text-[var(--accent)] animate-pulse">...</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "C" && (
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-lg font-bold text-foreground">Bank Details</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-surface2 transition">
                  <input type="checkbox" checked={data.secC.bankAccountOpened} onChange={(e) => handleUpdate('secC', 'bankAccountOpened', e.target.checked)} className="w-5 h-5 text-[var(--accent)]" />
                  <div>
                    <p className="font-medium text-sm text-foreground">Corporate Bank Account Opened</p>
                    <p className="text-xs text-muted">Required for all financial transactions and GST</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-surface2 transition">
                  <input type="checkbox" checked={data.secC.adCodeObtained} onChange={(e) => handleUpdate('secC', 'adCodeObtained', e.target.checked)} className="w-5 h-5 text-[var(--accent)]" />
                  <div>
                    <p className="font-medium text-sm text-foreground">AD Code Obtained from Bank</p>
                    <p className="text-xs text-muted">Authorized Dealer Code required for customs clearance</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {activeTab === "D" && (
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-lg font-bold text-foreground">IP & Brand</h2>
              
              <div className="p-5 border rounded-xl space-y-4">
                <h3 className="font-semibold text-sm">Trademark (TM-A)</h3>
                <div>
                  <label className="block text-xs text-muted mb-1">Status</label>
                  <select 
                    value={data.secD.trademarkStatus} 
                    onChange={(e) => handleUpdate('secD', 'trademarkStatus', e.target.value)}
                    className="w-full text-sm border border-border rounded-md px-3 py-2"
                  >
                    <option value="">Select status...</option>
                    <option value="not-filed">Not Filed</option>
                    <option value="filed">Filed</option>
                    <option value="registered">Registered</option>
                  </select>
                </div>
                {['filed', 'registered'].includes(data.secD.trademarkStatus) && (
                  <div>
                    <label className="block text-xs text-muted mb-1">Application / Registration Number</label>
                    <input type="text" value={data.secD.trademarkNumber} onChange={(e) => handleUpdate('secD', 'trademarkNumber', e.target.value)} className="w-full text-sm border border-border rounded-md px-3 py-2" placeholder="e.g. 1234567" />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-surface2 transition">
                  <input type="checkbox" checked={data.secD.domainRegistered} onChange={(e) => handleUpdate('secD', 'domainRegistered', e.target.checked)} className="w-5 h-5 text-[var(--accent)]" />
                  <p className="font-medium text-sm text-foreground">Website Domain Registered</p>
                </label>
                <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-surface2 transition">
                  <input type="checkbox" checked={data.secD.patentFiled} onChange={(e) => handleUpdate('secD', 'patentFiled', e.target.checked)} className="w-5 h-5 text-[var(--accent)]" />
                  <p className="font-medium text-sm text-foreground">Patents Filed (if applicable)</p>
                </label>
              </div>
            </div>
          )}

          {activeTab === "E" && (
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-lg font-bold text-foreground">Market Research & Strategy</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-surface2 transition">
                  <input type="checkbox" checked={data.secE.tamAnalysisDone} onChange={(e) => handleUpdate('secE', 'tamAnalysisDone', e.target.checked)} className="w-5 h-5 text-[var(--accent)]" />
                  <div>
                    <p className="font-medium text-sm text-foreground">TAM / SAM / SOM Analysis Done</p>
                    <p className="text-xs text-muted">Market sizing and revenue projections established</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-surface2 transition">
                  <input type="checkbox" checked={data.secE.competitorScanDone} onChange={(e) => handleUpdate('secE', 'competitorScanDone', e.target.checked)} className="w-5 h-5 text-[var(--accent)]" />
                  <div>
                    <p className="font-medium text-sm text-foreground">Competitor & Predicate Scan Complete</p>
                    <p className="text-xs text-muted">CDSCO/FDA predicates identified for substantially equivalent claims</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-surface2 transition">
                  <input type="checkbox" checked={data.secE.regulatoryPathwayChosen} onChange={(e) => handleUpdate('secE', 'regulatoryPathwayChosen', e.target.checked)} className="w-5 h-5 text-[var(--accent)]" />
                  <div>
                    <p className="font-medium text-sm text-foreground">Regulatory Pathway Frozen</p>
                    <p className="text-xs text-muted">Decision made on CDSCO vs CE vs FDA priority order</p>
                  </div>
                </label>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-surface flex justify-end">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-[var(--accent)] text-white font-medium rounded-lg hover:bg-[var(--accent-hover)] transition disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? 'Saving...' : 'Save Progress'}
          </button>
        </div>
      </div>
    </div>
  );
}
