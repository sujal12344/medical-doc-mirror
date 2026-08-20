import React from "react";
import { FileText } from "lucide-react";
import type { DocumentTemplate } from "@/lib/frameworks/form-types";

interface DocumentSourceListProps {
  documents: DocumentTemplate[];
}

export function DocumentSourceList({ documents }: DocumentSourceListProps) {
  if (!documents || documents.length === 0) return null;

  const grouped = documents.reduce((acc, doc) => {
    const s = doc.source || 'EXTERNAL';
    if (!acc[s]) acc[s] = [];
    acc[s].push(doc);
    return acc;
  }, {} as Record<string, typeof documents>);

  const getLabel = (source: string, count: number) => {
    const plural = count === 1 ? '' : 's';
    switch(source) {
      case 'FORM': 
        return `Generating ${count} form template${plural} specifically for this application`;
      case 'LEGAL': 
        return `Extracting ${count} file${plural} from your corporate and legal records`;
      case 'QMS': 
        return `Pulling ${count} document${plural} from your Quality Management System (QMS)`;
      case 'PMF': 
        return `Including ${count} document${plural} from your manufacturing site's Plant Master File (PMF)`;
      case 'DMF': 
        return `Attaching ${count} technical file${plural} from your product's Device Master File (DMF)`;
      case 'CLINICAL': 
        return `Gathering ${count} record${plural} from your clinical trials and performance evaluations`;
      case 'EXTERNAL': 
        return `Adding ${count} certificate${plural} provided by regulatory or third-party bodies`;
      default: 
        return `Extracting ${count} document${plural}`;
    }
  };

  return (
    <div className="mb-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {(Object.entries(grouped) as [string, DocumentTemplate[]][]).map(([source, docs]) => (
        <div key={source}>
          <h3 className="text-xs font-semibold text-muted mb-3 tracking-wider">
            {getLabel(source, docs.length)}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {docs.map((doc, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-surface2 border border-border rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-foreground truncate" title={doc.fileName}>
                  {doc.fileName}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
