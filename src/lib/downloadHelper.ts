// Simple markdown → HTML converter for Word .doc export
export function markdownToHtml(md: string): string {
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

export function htmlToMhtml(htmlContent: string): string {
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

export function downloadAsDoc({
  label,
  fieldId,
  safeValue,
  allFields,
  documentTitle
}: {
  label: string;
  fieldId: string;
  safeValue: string;
  allFields?: Record<string, string>;
  documentTitle?: string;
}) {
  let finalHtml = "";
  const isLabellingUpload = fieldId === "20.upload" || fieldId === "8.upload";

  if (isLabellingUpload && allFields) {
    const sectionPrefix = fieldId.split(".")[0];
    const logoBase64 = allFields[`${sectionPrefix}.logo`] || "";
    const productName = allFields[`${sectionPrefix}.productName`] || "";
    const manufacturer = allFields[`${sectionPrefix}.manufacturer`] || "";
    const mfgDate = allFields[`${sectionPrefix}.mfgDate`] || "";
    const expDate = allFields[`${sectionPrefix}.expDate`] || "";
    const packSize = allFields[`${sectionPrefix}.packSize`] || "";
    const batchNo = allFields[`${sectionPrefix}.batchNo`] || "";
    const deviceType = allFields[`${sectionPrefix}.deviceType`] || "";
    const storage = allFields[`${sectionPrefix}.storage`] || "";
    const mrp = allFields[`${sectionPrefix}.mrp`] || "";

    const symbolLot = allFields[`${sectionPrefix}.symbol_lot`] || "";
    const symbolDevice = allFields[`${sectionPrefix}.symbol_device`] || "";
    const symbolMfg = allFields[`${sectionPrefix}.symbol_mfg`] || "";
    const symbolExp = allFields[`${sectionPrefix}.symbol_exp`] || "";
    const symbolStorage = allFields[`${sectionPrefix}.symbol_storage`] || "";

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
    const imgMatch = safeValue.match(/!\[.*?\]\((data:image\/[a-zA-Z+-\/]+;base64,[\s\S]*?)\)/);
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
    finalHtml = markdownToHtml(safeValue);
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
}
