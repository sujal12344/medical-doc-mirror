"use client";

import { useState, useRef } from "react";

interface DynamicUploadButtonProps {
  documentId: string;
  sectionId: string;
  frameworkId: string;
  generatedDocName: string;
  uploadDocName: string;
  onSuccess?: (data: unknown) => void;
  onError?: (error: unknown) => void;
  isVisible?: boolean;
}

export default function DynamicUploadButton({
  documentId,
  sectionId,
  frameworkId,
  generatedDocName,
  uploadDocName,
  onSuccess,
  onError,
  isVisible = true,
}: DynamicUploadButtonProps) {
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isVisible) return null;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setProcessing(true);
    const fileArray = Array.from(files);
    
    try {
      // Step 1: Upload all files
      setUploadProgress(`Uploading ${fileArray.length} file(s)...`);
      
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setUploadProgress(`Uploading ${i + 1}/${fileArray.length}: ${file.name}`);
        
        const base64 = await fileToBase64(file);
        const uploadRes = await fetch(`/api/documents/${documentId}/upload-doc`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, mimeType: file.type, base64 }),
        });

        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          if (onError) onError(new Error(data.message || `Upload failed for ${file.name}`));
          return;
        }
      }

      // Step 2: Auto-generate content after all uploads
      setUploadProgress("Extracting data...");
      const generateRes = await fetch(`/api/documents/${documentId}/sections/${sectionId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!generateRes.ok) {
        const text = await generateRes.text();
        let errorMsg = "Generation failed";
        try {
          const data = JSON.parse(text);
          errorMsg = data.error || data.message || errorMsg;
        } catch {
          errorMsg = `Route not found`;
        }
        if (onError) onError(new Error(errorMsg));
        return;
      }

      const data = await generateRes.json();
      if (onSuccess) onSuccess(data);
    } catch (error) {
      if (onError) onError(error);
    } finally {
      setProcessing(false);
      setUploadProgress("");
    }
    e.target.value = "";
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return (
    <div className="inline-flex flex-col items-end gap-1 max-w-[240px]">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={processing}
        className="text-[10px] px-3 py-1.5 bg-[var(--ui-purple)] hover:opacity-90 text-white rounded font-medium transition disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5"
      >
        {processing ? (
          <>
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            {uploadProgress || "Processing..."}
          </>
        ) : (
          <>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload
          </>
        )}
      </button>
    </div>
  );
}
