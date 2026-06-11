"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

// Initialize mermaid once client-side
if (typeof window !== "undefined") {
  mermaid.initialize({
    startOnLoad: false,
    theme: "neutral",
    securityLevel: "loose",
  });
}

export function MermaidChart({ chartCode }: { chartCode: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !chartCode) return;

    let isMounted = true;
    const cleanId = `mermaid-${Math.random().toString(36).substring(2, 11)}`;

    const renderChart = async () => {
      try {
        setError(null);
        let cleanCode = chartCode.trim();
        // Extract raw code if wrapped in a markdown-like block
        if (cleanCode.startsWith("```mermaid")) {
          cleanCode = cleanCode.replace(/^```mermaid\s*/i, "").replace(/```\s*$/, "").trim();
        } else if (cleanCode.startsWith("```")) {
          cleanCode = cleanCode.replace(/^```[a-zA-Z]*\s*/i, "").replace(/```\s*$/, "").trim();
        }
        
        // Remove trailing or leading mermaid labels if any
        if (cleanCode.startsWith("mermaid")) {
          cleanCode = cleanCode.substring(7).trim();
        }

        const { svg } = await mermaid.render(cleanId, cleanCode);
        if (isMounted) {
          setSvg(svg);
        }
      } catch (err) {
        console.error("Mermaid rendering failed:", err);
        if (isMounted) {
          setError("Could not parse flowchart syntax.");
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chartCode]);

  if (error) {
    return (
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-mono whitespace-pre-wrap">
        <p className="font-semibold mb-1">Flowchart Render Warning:</p>
        <p className="text-[10px] text-muted mb-2">The system generated flowchart is shown below as text:</p>
        <pre className="p-2 bg-surface rounded max-h-40 overflow-y-auto">{chartCode}</pre>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center bg-surface border border-border rounded-xl p-6 my-4 overflow-x-auto select-none shadow-inner">
      <div 
        ref={containerRef}
        className="mermaid-chart-svg" 
        dangerouslySetInnerHTML={{ __html: svg || '<span className="text-xs text-muted animate-pulse">Rendering flowchart...</span>' }} 
      />
    </div>
  );
}
