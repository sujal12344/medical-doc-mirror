import { UploadCloud, X, FileText, Loader2 } from "lucide-react";

interface DynamicExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingKeys: string[];
  uploadFiles: File[];
  setUploadFiles: (files: File[]) => void;
  uploading: boolean;
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
  onExtract,
  onGenerateAnyway
}: DynamicExtractionModalProps) {
  if (!isOpen) return null;

  // Dynamically determine the suggested document name based on the missing keys
  const getDocumentSuggestion = () => {
    if (missingKeys.some(k => k.toLowerCase().startsWith('cip') || k.toLowerCase().startsWith('ib'))) {
      return "Clinical Investigation Plan (CIP) or Investigator Brochure (IB)";
    }
    if (missingKeys.some(k => k.toLowerCase().includes('iso') || k.toLowerCase().includes('qms'))) {
      return "ISO Certificate or Quality Management System (QMS) documents";
    }
    if (missingKeys.some(k => k.toLowerCase().includes('site') || k.toLowerCase().includes('plant'))) {
      return "Site Master File (SMF) or Plant Master File";
    }
    return "Supporting Source Documents";
  };

  const documentSuggestion = getDocumentSuggestion();

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border w-full max-w-lg rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
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
          <p className="text-sm text-foreground font-medium mb-4">
            Please upload your <strong>{documentSuggestion}</strong>.
          </p>
          
          <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center bg-surface2/30 mb-6">
            <input 
              type="file" 
              id="dynamic-upload" 
              className="hidden" 
              accept=".pdf,.docx,.doc" 
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
                  : "Select one or more PDF/Word documents"}
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
