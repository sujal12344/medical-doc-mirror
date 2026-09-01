import { UploadCloud, X, FileText, Loader2 } from "lucide-react";
import { SUGGESTION_RULES } from "@/lib/config/document-suggestions";

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
    
    SUGGESTION_RULES.forEach(rule => {
      // 1. Check if the form requires this rule's source context (if rule has constraints)
      const hasRequiredSource = rule.requiredSourceContexts.length === 0 || 
        rule.requiredSourceContexts.some(ctx => requiredSources.includes(ctx)) ||
        requiredSources.length === 0; // If form doesn't specify sources, show it
        
      if (!hasRequiredSource) return;

      // 2. Check if any missing key matches the rule's keywords
      const hasMatchingKeyword = missingKeys.some(k => {
        const lowerKey = k.toLowerCase();
        return rule.keywords.some(keyword => lowerKey.includes(keyword));
      });

      if (hasMatchingKeyword) {
        suggestions.push({
          name: rule.name,
          links: rule.links
        });
      }
    });

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
        className="bg-surface border border-border w-full max-w-lg rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh]"
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
        <div className="p-6 overflow-y-auto">
          <p className="text-sm text-muted-foreground mb-4">
            To perfectly fill out this form, we need data for <strong>{missingKeys.length} fields</strong> (e.g. {missingKeys.slice(0, 3).join(", ")}).
          </p>
          <p className="text-sm text-foreground font-medium mb-2">
            Please upload the following documents:
          </p>
          <ul className="text-sm text-muted-foreground mb-6 list-none bg-surface2/50 p-3 rounded-xl border border-border/50 max-h-[240px] overflow-y-auto">
            {documentSuggestions.map((suggestion, idx) => (
              <li key={idx} className="flex flex-col items-start py-2.5 border-b border-border/30 last:border-0">
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
