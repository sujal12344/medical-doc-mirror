import pdf from "pdf-parse";

/**
 * Extract text content from a base64-encoded PDF
 */
export async function extractTextFromPDF(base64Data: string): Promise<string> {
  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, "base64");
    
    // Parse PDF with more lenient options
    const data = await pdf(buffer, {
      max: 0, // No page limit
      version: 'default'
    });
    
    // Return extracted text
    return data.text;
  } catch (error) {
    console.error("PDF extraction error:", error);
    // Return empty string instead of throwing - let AI work with empty text
    return "";
  }
}

/**
 * Extract text from multiple document formats
 */
export async function extractTextFromDocument(
  base64Data: string,
  mimeType: string,
  fileName: string
): Promise<string> {
  // For PDF files
  if (mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")) {
    return extractTextFromPDF(base64Data);
  }

  // For text files, decode base64 directly
  if (mimeType.startsWith("text/") || fileName.toLowerCase().endsWith(".txt")) {
    const buffer = Buffer.from(base64Data, "base64");
    return buffer.toString("utf-8");
  }

  // For Word documents (.docx), we would need additional processing
  // For now, return a placeholder
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.toLowerCase().endsWith(".docx")
  ) {
    return `[Word document: ${fileName}]\nWord document text extraction requires additional processing.`;
  }

  // Default fallback
  return `[Document: ${fileName}]\nUnsupported format for automatic text extraction.`;
}
