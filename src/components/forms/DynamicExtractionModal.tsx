import { UploadCloud, X, FileText, Loader2 } from "lucide-react";

interface DynamicExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingKeys: string[];
  uploadFiles: File[];
  setUploadFiles: (files: File[]) => void;
  uploading: boolean;
  filledSummary?: { Field: string; Source: string; Value: string }[];
  requiredSources?: string[];
  onExtract: () => void;
  onGenerateAnyway: () => void;
}

export function DynamicExtractionModal({
  isOpen,
  onClose,
  missingKeys,
  uploadFiles,
  setUploadFiles,
  uploading,
  filledSummary = [],
  requiredSources = [],
  onExtract,
  onGenerateAnyway
}: DynamicExtractionModalProps) {
  if (!isOpen) return null;

  // Dynamically determine the suggested document name based on the missing keys
  const getDocumentSuggestions = () => {
    const suggestions: { name: string, links?: { label: string, url: string }[] }[] = [];
    
    if (missingKeys.some(k => k.toLowerCase().includes('fee') || k.toLowerCase().includes('bharatkosh') || k.toLowerCase().includes('challan'))) {
      suggestions.push({ 
        name: "Bharatkosh Fee Receipt / Challan", 
        links: [
          { label: "Receipt Example", url: "https://bharatkosh.gov.in/Static/Template/UserguideBharatkosh.pdf#page=15" },
          { label: "Challan Example", url: "https://bharatkosh.gov.in/Static/Template/UserguideBharatkosh.pdf#page=17" },
          { label: "User Manual", url: "https://cdscoonline.gov.in/CDSCO/resources/app_srv/cdsco/global/Online_Payment_User_Manual_v1.0.pdf" }
        ]
      });
    }
    
    // Only suggest Legal or Clinical documents if the form needs them
    if (requiredSources.length === 0 || requiredSources.includes('LEGAL') || requiredSources.includes('CLINICAL')) {
      if (missingKeys.some(k => k.toLowerCase().includes('ethics'))) {
        suggestions.push({ 
          name: "Ethics Committee Approval Letter",
          links: [
            { label: "ICMR Guidelines", url: "https://ethics.ncdirindia.org/asset/pdf/ICMR_National_Ethical_Guidelines.pdf" },
            { label: "EC Registration (CDSCO)", url: "https://cdsco.gov.in/opencms/opencms/en/Clinical-Trial/Ethics-Committee/" }
          ]
        });
      }
      if (missingKeys.some(k => k.toLowerCase().includes('sponsor') || k.toLowerCase().includes('contact') || k.toLowerCase().includes('email') || k.toLowerCase().includes('fax'))) {
        suggestions.push({ 
          name: "Sponsor Agreement or Cover Page with Contact Details",
          links: [
            { label: "Clinical Trial Agreement Guide", url: "https://www.paho.org/en/documents/regional-template-clinical-trial-agreement" }
          ]
        });
      }
    }
    
    // Only suggest CIP/IB if the form needs Clinical Data
    if (requiredSources.length === 0 || requiredSources.includes('CLINICAL')) {
      if (missingKeys.some(k => k.toLowerCase().startsWith('cip') || k.toLowerCase().startsWith('ib') || k.toLowerCase().includes('study'))) {
        suggestions.push({ 
          name: "Clinical Investigation Plan (CIP) / Investigator Brochure (IB)",
          links: [
            { label: "ISO 14155:2020 CIP Structure", url: "https://www.iso.org/obp/ui/#iso:std:iso:14155:ed-3:v1:en" },
            { label: "Investigator Brochure (WHO)", url: "https://cdn.who.int/media/docs/default-source/medicines/norms-and-standards/guidelines/regulatory-standards/trs850-annex3.pdf" }
          ]
        });
      }
    }
    
    // Only suggest QMS/PMF if the form actually needs a PMF or QMS
    if (requiredSources.length === 0 || requiredSources.includes('PMF') || requiredSources.includes('QMS')) {
      if (missingKeys.some(k => k.toLowerCase().includes('iso') || k.toLowerCase().includes('qms'))) {
        suggestions.push({ 
          name: "ISO Certificate or Quality Management System (QMS) documents",
          links: [
            { label: "ISO 13485 (Medical Devices)", url: "https://www.iso.org/standard/59752.html" },
            { label: "CDSCO QMS Guidelines", url: "https://cdsco.gov.in/opencms/opencms/en/Medical-Device-Diagnostics/Medical-Device-Diagnostics/" }
          ]
        });
      }
      if (missingKeys.some(k => k.toLowerCase().includes('site') || k.toLowerCase().includes('plant'))) {
        suggestions.push({ 
          name: "Site Master File (SMF) or Plant Master File",
          links: [
            { label: "WHO SMF Guidelines", url: "https://cdn.who.int/media/docs/default-source/medicines/norms-and-standards/guidelines/production/trs961-annex14-who-gmp-sitemasterfile.pdf" }
          ]
        });
      }
    }

    // Filter out documents that were already used for AI Extraction
    const filteredSuggestions = suggestions.filter(suggestion => {
      const suggestionKeywords = suggestion.name.toLowerCase().split(/[\s/()]+/).filter(w => w.length > 3);
      const isAlreadyUsed = filledSummary.some(summary => {
         const sourceLower = summary.Source.toLowerCase();
         if (sourceLower.includes("ai extracted")) {
            return suggestionKeywords.some(keyword => sourceLower.includes(keyword));
         }
         return false;
      });
      return !isAlreadyUsed;
    });

    if (filteredSuggestions.length === 0) {
      return [{ name: "Supporting Source Documents" }];
    }

    return filteredSuggestions;
  };

  const documentSuggestions = getDocumentSuggestions();

  return (
    <div 
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-surface border border-border w-full max-w-lg rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface2/50">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-[var(--accent)]" />
            Upload Source Documents
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-muted/50 rounded-lg transition text-muted">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-4">
            To perfectly fill out this form, we need data for <strong>{missingKeys.length} fields</strong> (e.g. {missingKeys.slice(0, 3).join(", ")}).
          </p>
          <p className="text-sm text-foreground font-medium mb-2">
            Please upload the following documents:
          </p>
          <ul className="text-sm text-muted-foreground mb-6 list-none bg-surface2/50 p-4 rounded-xl border border-border/50">
            {documentSuggestions.map((suggestion, idx) => (
              <li key={idx} className="flex flex-col items-start pb-3 border-b border-border/30 last:border-0 last:pb-0 pt-3 first:pt-0">
                <span className="text-[var(--accent)] font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {suggestion.name}
                </span>
                {suggestion.links && suggestion.links.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 ml-6">
                    {suggestion.links.map((link, lidx) => (
                      <a
                        key={lidx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] px-2.5 py-1 bg-background border border-border/50 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center shadow-sm"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
          
          <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center bg-surface2/30 mb-6">
            <input 
              type="file" 
              id="dynamic-upload" 
              className="hidden" 
              accept=".pdf,.docx,.doc,.png,.jpg,.jpeg" 
              multiple
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                   setUploadFiles(Array.from(e.target.files));
                }
              }} 
            />
            <label htmlFor="dynamic-upload" className="cursor-pointer flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold text-[var(--accent)]">Browse Files</span>
              <span className="text-xs text-muted-foreground mt-1 text-center">
                {uploadFiles.length > 0 
                  ? `${uploadFiles.length} file(s) selected: ${uploadFiles.map(f => f.name).join(', ')}`
                  : "Select one or more PDF, Word, or Image documents"}
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <button 
              onClick={onGenerateAnyway}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition"
            >
              Generate Anyway (Leave Blank)
            </button>
            <button
              onClick={onExtract}
              disabled={uploading || uploadFiles.length === 0}
              className="px-6 py-2 bg-[var(--accent)] text-white text-sm font-semibold rounded-lg shadow-sm hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {uploading ? "Extracting..." : "Upload & Extract"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
