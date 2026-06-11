"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  fieldId: string;
  label: string;
  hint: string;
  textarea?: boolean;
  value: string;
  onChange: (value: string) => void;
  onUploadComplete?: () => void;
  allowUpload?: boolean;
  documentId?: string;
  fieldType?: "text" | "image";
  allFields?: Record<string, string>;
  documentVersion?: number;
  documentUpdatedAt?: string | Date;
  documentTitle?: string;
};

export function RegulatoryFieldEditor({
  fieldId,
  label,
  hint,
  textarea,
  value,
  onChange,
  allowUpload,
  documentId,
  fieldType,
  allFields,
  documentVersion,
  documentUpdatedAt,
  documentTitle,
  onUploadComplete
}: Props) {
  const [view, setView] = useState<"structured" | "edit">("structured");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [fileName, setFileName] = useState("");

  const hasContent = value.trim().length > 0;
  const isImageField = fieldType === "image";
  const isImageValue = value.startsWith("data:image/") || /\.(png|jpg|jpeg|webp|gif)$/i.test(value);

  const handleFieldFileUpload = async (files: FileList | File[]) => {
    if (!documentId || !files.length) return;
    setUploading(true);
    setUploadError("");
    setFileName(Array.from(files).map((f) => f.name).join(", "));

    const fd = new FormData();
    for (const file of Array.from(files)) {
      fd.append("file", file);
    }

    try {
      const res = await fetch(`/api/documents/${documentId}/fields/${fieldId}/upload`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onChange(data.value);
        setView("edit");
        if (onUploadComplete) {
          onUploadComplete();
        }
      } else {
        setUploadError(data.error || "Failed to process the uploaded file.");
      }
    } catch {
      setUploadError("Network error: failed to connect to upload service.");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = () => {
    if (isImageValue) {
      // Download image directly
      const a = document.createElement("a");
      a.href = value;
      a.download = `${label.replace(/\s+/g, "_")}.png`;
      a.click();
      return;
    }

    let finalHtml = "";
    const isLabellingUpload = fieldId === "20.upload" || fieldId === "8.upload";

    if (isLabellingUpload) {
      const sectionPrefix = fieldId.split(".")[0];
      const fields = allFields || {};

      const logoBase64 = fields[`${sectionPrefix}.logo`] || "";
      const productName = fields[`${sectionPrefix}.productName`] || "";
      const manufacturer = fields[`${sectionPrefix}.manufacturer`] || "";
      const mfgDate = fields[`${sectionPrefix}.mfgDate`] || "";
      const expDate = fields[`${sectionPrefix}.expDate`] || "";
      const packSize = fields[`${sectionPrefix}.packSize`] || "";
      const batchNo = fields[`${sectionPrefix}.batchNo`] || "";
      const deviceType = fields[`${sectionPrefix}.deviceType`] || "";
      const storage = fields[`${sectionPrefix}.storage`] || "";
      const mrp = fields[`${sectionPrefix}.mrp`] || "";

      const symbolLot = fields[`${sectionPrefix}.symbol_lot`] || "";
      const symbolDevice = fields[`${sectionPrefix}.symbol_device`] || "";
      const symbolMfg = fields[`${sectionPrefix}.symbol_mfg`] || "";
      const symbolExp = fields[`${sectionPrefix}.symbol_exp`] || "";
      const symbolStorage = fields[`${sectionPrefix}.symbol_storage`] || "";

      let companyName = "";
      let companyAddress = "";
      let formerName = "";

      if (manufacturer) {
        const formerMatch = manufacturer.match(/\((?:Formerly|formerly)\s+known\s+as\s+([^\)]+)\)/i);
        if (formerMatch) {
          formerName = formerMatch[1].trim();
        }
        let cleanMfg = manufacturer.replace(/\((?:Formerly|formerly)\s+known\s+as\s+[^\)]+\)/i, "").trim();
        const commaIndex = cleanMfg.indexOf(",");
        if (commaIndex !== -1) {
          companyName = cleanMfg.substring(0, commaIndex).trim();
          companyAddress = cleanMfg.substring(commaIndex + 1).trim();
        } else {
          companyName = cleanMfg;
          companyAddress = "";
        }
      }

      let logoHtml = companyName
        ? `<div style="font-size: 13pt; font-weight: bold; color: #1a1a2e; margin-bottom: 2px;">${companyName}</div>`
        : `<div style="font-size: 13pt; font-weight: bold; color: #1a1a2e; margin-bottom: 2px;">Logo Placeholder</div>`;
      if (logoBase64 && logoBase64.startsWith("data:image/")) {
        logoHtml = `<img src="${logoBase64}" style="max-height: 48px; max-width: 100%; object-fit: contain;" />`;
      }

      const docTypeTitle = documentTitle || "Device Master File";

      const headerTableHtml = `
<table style="width: 100%; border-collapse: collapse; border: 1.5pt solid black; font-family: Arial, sans-serif; margin-bottom: 25px;">
  <tr>
    <td rowspan="2" style="width: 25%; border: 1pt solid black; padding: 8px; text-align: center; vertical-align: middle;">
      ${logoHtml}
    </td>
    <td style="width: 75%; border: 1pt solid black; padding: 8px; text-align: center;">
      ${formerName ? `<div style="font-size: 8pt; font-weight: bold; margin-bottom: 2px;">(Formerly Known as ${formerName})</div>` : ""}
      <div style="font-size: 14pt; font-weight: bold; margin-bottom: 2px; letter-spacing: 0.5px;">${companyName || "Manufacturer Name"}</div>
      ${companyAddress ? `<div style="font-size: 8.5pt; font-weight: bold;">${companyAddress}</div>` : ""}
    </td>
  </tr>
  <tr>
    <td style="border: 1pt solid black; padding: 6px; text-align: center; font-size: 10pt; font-weight: bold; background-color: #f7f7f7; text-transform: uppercase;">
      ${docTypeTitle}
    </td>
  </tr>
</table>
      `;

      const isMD = sectionPrefix === "8";
      const deviceSymbol = isMD ? "MD" : "IVD";

      let metaDetailsTable = `
<h3 style="font-size: 13pt; font-family: Arial, sans-serif; font-weight: bold; color: #1a1a2e; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 4px;">Label Metadata Specifications</h3>
<table style="width: 100%; border-collapse: collapse; border: 1pt solid #ccc; font-family: Arial, sans-serif; margin-bottom: 20px;">
  <tr style="background:#f9f9f9;">
    <th style="width: 40%; border: 1pt solid #ccc; padding: 8px; text-align: left; font-size: 9.5pt;">Label Field</th>
    <th style="width: 60%; border: 1pt solid #ccc; padding: 8px; text-align: left; font-size: 9.5pt;">Extracted Value</th>
  </tr>
  ${productName ? `<tr><td style="border: 1pt solid #ccc; padding: 8px; font-size: 9pt; font-weight:bold;">Product Commercial Name</td><td style="border: 1pt solid #ccc; padding: 8px; font-size: 9pt;">${productName}</td></tr>` : ""}
  ${packSize ? `<tr><td style="border: 1pt solid #ccc; padding: 8px; font-size: 9pt; font-weight:bold;">Pack Size / Configuration</td><td style="border: 1pt solid #ccc; padding: 8px; font-size: 9pt;">${packSize}</td></tr>` : ""}
  ${batchNo ? `<tr><td style="border: 1pt solid #ccc; padding: 8px; font-size: 9pt; font-weight:bold; vertical-align: middle;">${symbolLot ? `<img src="${symbolLot}" style="max-height: 18px; max-width: 50px; vertical-align: middle; margin-right: 5px; object-fit: contain;" />` : `<span style="border: 1px solid black; padding: 1px 4px; font-size: 8pt; font-family: Arial; font-weight: bold; margin-right: 5px; background-color: #eee; display: inline-block; border-radius: 2px; vertical-align: middle;">LOT</span>`} Batch No.</td><td style="border: 1pt solid #ccc; padding: 8px; font-size: 9pt; vertical-align: middle;">${batchNo}</td></tr>` : ""}
  ${deviceType ? `<tr><td style="border: 1pt solid #ccc; padding: 8px; font-size: 9pt; font-weight:bold; vertical-align: middle;">${symbolDevice ? `<img src="${symbolDevice}" style="max-height: 18px; max-width: 50px; vertical-align: middle; margin-right: 5px; object-fit: contain;" />` : `<span style="border: 1px solid black; padding: 1px 4px; font-size: 8pt; font-family: Arial; font-weight: bold; margin-right: 5px; background-color: #eee; display: inline-block; border-radius: 2px; vertical-align: middle;">${deviceSymbol}</span>`} Device Regulatory Type</td><td style="border: 1pt solid #ccc; padding: 8px; font-size: 9pt; vertical-align: middle;">${deviceType}</td></tr>` : ""}
  ${mfgDate ? `<tr><td style="border: 1pt solid #ccc; padding: 8px; font-size: 9pt; font-weight:bold; vertical-align: middle;">${symbolMfg ? `<img src="${symbolMfg}" style="max-height: 18px; max-width: 50px; vertical-align: middle; margin-right: 5px; object-fit: contain;" />` : `<span style="font-size: 12pt; margin-right: 5px; vertical-align: middle;">🏭</span>`} Manufacturing Date</td><td style="border: 1pt solid #ccc; padding: 8px; font-size: 9pt; vertical-align: middle;">${mfgDate}</td></tr>` : ""}
  ${expDate ? `<tr><td style="border: 1pt solid #ccc; padding: 8px; font-size: 9pt; font-weight:bold; vertical-align: middle;">${symbolExp ? `<img src="${symbolExp}" style="max-height: 18px; max-width: 50px; vertical-align: middle; margin-right: 5px; object-fit: contain;" />` : `<span style="font-size: 12pt; margin-right: 5px; vertical-align: middle;">⌛</span>`} Expiry Date</td><td style="border: 1pt solid #ccc; padding: 8px; font-size: 9pt; vertical-align: middle;">${expDate}</td></tr>` : ""}
  ${storage ? `<tr><td style="border: 1pt solid #ccc; padding: 8px; font-size: 9pt; font-weight:bold; vertical-align: middle;">${symbolStorage ? `<img src="${symbolStorage}" style="max-height: 18px; max-width: 50px; vertical-align: middle; margin-right: 5px; object-fit: contain;" />` : `<span style="font-size: 12pt; margin-right: 5px; vertical-align: middle;">🌡️</span>`} Storage Conditions</td><td style="border: 1pt solid #ccc; padding: 8px; font-size: 9pt; vertical-align: middle;">${storage}</td></tr>` : ""}
  ${mrp ? `<tr><td style="border: 1pt solid #ccc; padding: 8px; font-size: 9pt; font-weight:bold;">MRP (Maximum Retail Price)</td><td style="border: 1pt solid #ccc; padding: 8px; font-size: 9pt;">${mrp}</td></tr>` : ""}
</table>
      `;

      let artworkHtml = "";
      const imgMatch = value.match(/!\[.*?\]\((data:image\/[a-zA-Z+-\/]+;base64,[\s\S]*?)\)/);
      if (imgMatch) {
        artworkHtml = `
<h3 style="font-size: 13pt; font-family: Arial, sans-serif; font-weight: bold; color: #1a1a2e; margin-top: 30px; margin-bottom: 12px; border-bottom: 1px solid #ddd; padding-bottom: 4px;">Label Artwork</h3>
<p style="text-align:center; margin:20px 0;">
  <img src="${imgMatch[1]}" style="max-width:100%; max-height:480px; border:1px solid #ccc; padding:4px; background:#fff;" />
</p>
        `;
      }

      finalHtml = `
        ${headerTableHtml}
        <h2 style="font-size: 16pt; font-family: Arial, sans-serif; font-weight: bold; color: #1a1a2e; margin-top: 15px; margin-bottom: 10px;">Labelling and Pack Size Specifications</h2>
        ${metaDetailsTable}
        ${artworkHtml}
      `;
    } else {
      finalHtml = markdownToHtml(value);
    }

    const htmlContent = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset="utf-8"><title>${label}</title>
<style>body{font-family:Arial,sans-serif;font-size:11pt;line-height:1.5;margin:2cm;}
h1,h2,h3,h4{color:#1a1a2e;}table{border-collapse:collapse;width:100%;}
td,th{border:1px solid #ccc;padding:6px 10px;}th{background:#f0f0f0;font-weight:bold;}</style>
</head><body>${finalHtml}</body></html>`;
    const mhtmlContent = htmlToMhtml(htmlContent);
    const blob = new Blob([mhtmlContent], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label.replace(/\s+/g, "_")}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filled = value.trim().length > 0;
  const showStructured = hasContent && view === "structured";
  const rows = textarea ? Math.min(24, Math.max(5, value.split("\n").length + 1)) : undefined;

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border bg-surface2/80 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{label}</h3>
            <span className="rounded-md bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted border border-border">
              {fieldId}
            </span>
            {isImageField && (
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-400">
                Image
              </span>
            )}
            {filled ? (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                Filled
              </span>
            ) : (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-400">
                Empty
              </span>
            )}
          </div>
          {hint ? <p className="mt-1 text-xs text-muted leading-relaxed">{hint}</p> : null}
        </div>
        <div className="flex gap-2">
          {filled && (
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-semibold text-muted hover:bg-surface2 hover:text-foreground transition shadow-sm"
            >
              {isImageValue ? "Download Image" : "Download .doc"}
            </button>
          )}
          {hasContent && !isImageField ? (
            <div className="flex rounded-lg border border-border p-0.5 text-[10px] font-medium shrink-0">
              <button
                type="button"
                onClick={() => setView("structured")}
                className={`rounded-md px-2.5 py-1 transition ${view === "structured" ? "bg-accent text-white" : "text-muted hover:text-foreground"}`}
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => setView("edit")}
                className={`rounded-md px-2.5 py-1 transition ${view === "edit" ? "bg-accent text-white" : "text-muted hover:text-foreground"}`}
              >
                Edit text
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="p-4">
        {/* Image field rendering */}
        {isImageField || isImageValue ? (
          <div className="space-y-3">
            {isImageValue ? (
              <div className="rounded-lg border border-border bg-surface2/50 p-3 flex items-center justify-center min-h-[100px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={value}
                  alt={label}
                  className="max-h-48 max-w-full object-contain rounded"
                />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-surface2/20 p-6 flex items-center justify-center text-xs text-muted">
                No image uploaded yet
              </div>
            )}
          </div>
        ) : showStructured ? (
          <div className="rounded-lg border border-border bg-surface2/50 p-4 overflow-hidden">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-6 mb-3 text-foreground" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-5 mb-2.5 text-foreground" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-base font-semibold mt-4 mb-2 text-foreground" {...props} />,
                h4: ({node, ...props}) => <h4 className="text-sm font-semibold mt-3 mb-1.5 text-foreground" {...props} />,
                p: ({node, ...props}) => <p className="text-xs text-foreground leading-relaxed mb-3 last:mb-0" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1 text-xs text-foreground" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-xs text-foreground" {...props} />,
                table: ({node, ...props}) => (
                  <div className="overflow-x-auto mb-4 border border-border rounded-lg">
                    <table className="w-full text-left text-xs" {...props} />
                  </div>
                ),
                thead: ({node, ...props}) => <thead className="bg-surface2" {...props} />,
                th: ({node, ...props}) => <th className="px-3 py-2 font-semibold text-foreground border-b border-border/60" {...props} />,
                td: ({node, ...props}) => <td className="px-3 py-2 text-foreground border-b border-border/60 align-top" {...props} />,
                tr: ({node, ...props}) => <tr className="last:border-0" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold text-foreground" {...props} />,
                em: ({node, ...props}) => <em className="italic text-muted" {...props} />,
                hr: ({node, ...props}) => <hr className="my-4 border-border/50" {...props} />,
                img: ({node, ...props}) => {
                  if (!props.src) return null;
                  // eslint-disable-next-line @next/next/no-img-element
                  return <img className="max-w-full max-h-96 object-contain rounded-lg border border-border p-1 bg-surface" {...props} />;
                },
              }}
            >
              {value}
            </ReactMarkdown>
          </div>
        ) : textarea ? (
          <textarea
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface2 px-3 py-2.5 font-mono text-sm leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-y min-h-[120px]"
            placeholder={`Enter ${label.toLowerCase()}…`}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface2 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            placeholder={`Enter ${label.toLowerCase()}…`}
          />
        )}

        {allowUpload && documentId && (
          <div className="mt-3 rounded-lg border border-dashed border-border bg-surface2/30 hover:border-accent/40 p-4 transition-all flex flex-col items-center justify-center text-center gap-2">
            <div className="flex items-center gap-2 text-xs text-muted">
              <svg className={`w-4 h-4 text-accent ${uploading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {uploading ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                )}
              </svg>
              {uploading ? (
                <span className="text-foreground font-semibold">Processing upload…</span>
              ) : fileName ? (
                <span>Uploaded: <strong className="text-foreground">{fileName}</strong></span>
              ) : (
                <span>Upload files to auto-populate this field (.pdf, .docx, .png, .jpg)</span>
              )}
            </div>
            {!uploading && (
              <label className="cursor-pointer inline-flex items-center justify-center px-3 py-1.5 border border-border hover:bg-surface2 text-[11px] font-semibold text-foreground rounded-lg transition shadow-sm mt-1">
                Upload Files
                <input
                  type="file"
                  accept=".pdf,.docx,.png,.jpg,.jpeg,.webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      handleFieldFileUpload(e.target.files);
                    }
                    e.target.value = "";
                  }}
                />
              </label>
            )}
            {uploadError && <p className="text-[10px] text-red-500 font-semibold">{uploadError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Simple markdown → HTML converter for Word .doc export ──────────────────
function markdownToHtml(md: string): string {
  let html = md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Images: ![alt](src)
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<p style="text-align:center;margin:20px 0;"><img src="$2" alt="$1" style="max-width:100%;max-height:450px;border:1px solid #ddd;padding:4px;background:#fff;" /></p>');

  return html
    // Tables
    .replace(/^\|(.+)\|$/gm, (_, row) => {
      const cells = row.split("|").map((c: string) => `<td style="border:1px solid #ccc;padding:6px 10px;">${c.trim()}</td>`).join("");
      return `<tr>${cells}</tr>`;
    })
    .replace(/(?:<tr>[\s\S]*?<\/tr>\n?)+/g, (t) => `<table style="border-collapse:collapse;width:100%;margin:12px 0;">${t}</table>`)
    // Headings
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold / italic
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // HR
    .replace(/^---$/gm, "<hr/>")
    // Lists
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    .replace(/(?:<li>[\s\S]*?<\/li>\n?)+/g, (l) => `<ul style="margin:8px 0;padding-left:20px;">${l}</ul>`)
    // Paragraphs
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>")
    .replace(/^(?!<[hultHULT])(.+)$/gm, (line) => line.startsWith("<") ? line : `<p>${line}</p>`);
}

function htmlToMhtml(htmlContent: string): string {
  const imageDeclarations: string[] = [];
  let imageCount = 0;

  const cleanHtml = htmlContent.replace(/src=["']data:(image\/[a-zA-Z0-9+.-]+);base64,([^"']+)["']/g, (match, mimeType, base64Content) => {
    imageCount++;
    const location = `image-${imageCount}`;
    
    imageDeclarations.push(
      `--NEXT.ITEM-BOUNDARY\r\n` +
      `Content-Type: ${mimeType}\r\n` +
      `Content-Transfer-Encoding: base64\r\n` +
      `Content-Location: ${location}\r\n\r\n` +
      base64Content.trim().replace(/\r?\n/g, "") + `\r\n`
    );

    return `src="${location}"`;
  });

  const mhtml = [
    `MIME-Version: 1.0\r\n`,
    `Content-Type: multipart/related; boundary="NEXT.ITEM-BOUNDARY"\r\n\r\n`,
    `--NEXT.ITEM-BOUNDARY\r\n`,
    `Content-Type: text/html; charset="utf-8"\r\n`,
    `Content-Transfer-Encoding: 8bit\r\n\r\n`,
    cleanHtml,
    `\r\n`,
    imageDeclarations.join(""),
    `--NEXT.ITEM-BOUNDARY--\r\n`
  ].join("");

  return mhtml;
}
