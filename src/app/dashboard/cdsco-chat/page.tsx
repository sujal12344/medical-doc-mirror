"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Database, RefreshCw, ExternalLink, Bot, User, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Array<{ title: string; url: string; score: number }>;
}

interface ScanStatus {
  totalIndexed: number;
  totalError: number;
  latestScan: {
    status: string;
    startedAt: string;
    completedAt?: string;
    pdfsIndexed: number;
    pdfsDiscovered: number;
    triggeredBy: string;
  } | null;
}

const SUGGESTED_QUESTIONS = [
  "What are the latest CDSCO notifications for medical devices?",
  "What is the process for importing medical devices into India?",
  "Explain the MD-14/15 test license requirements.",
  "What are the registration requirements under the Medical Devices Rules 2017?",
];

export default function CdscoChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null);
  const [scraping, setScraping] = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/cdsco/status");
      if (res.ok) setScanStatus(await res.json());
    } catch {}
  }

  async function handleSend(queryOverride?: string) {
    const query = (queryOverride || input).trim();
    if (!query || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: query }]);
    setLoading(true);

    try {
      const res = await fetch("/api/cdsco/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, messages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get response");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, sources: data.sources },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${String(err)}` },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  async function handleTriggerScrape() {
    setScraping(true);
    setScrapeMsg("Scraper started... This may take several minutes.");
    try {
      const res = await fetch("/api/cdsco/cron-scrape", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setScrapeMsg(`Done! Indexed ${data.pdfsIndexed} new documents, skipped ${data.pdfsSkipped}.`);
        fetchStatus();
      } else {
        setScrapeMsg(`Error: ${data.error}`);
      }
    } catch (err) {
      setScrapeMsg(`Error: ${String(err)}`);
    } finally {
      setScraping(false);
      setTimeout(() => setScrapeMsg(""), 8000);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const latestScan = scanStatus?.latestScan;

  return (
    <div className="flex flex-col h-full max-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 bg-surface shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">CDSCO Intelligence</h1>
              <p className="text-xs text-muted">Chat with live regulatory data from the CDSCO portal</p>
            </div>
          </div>

          {/* Knowledge base stats */}
          <div className="flex items-center gap-4 shrink-0">
            {scanStatus && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-surface2 border border-border rounded-lg text-xs text-muted">
                <Database className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>{scanStatus.totalIndexed} documents indexed</span>
              </div>
            )}
            <button
              onClick={handleTriggerScrape}
              disabled={scraping}
              title="Run scraper now (fetch latest from CDSCO)"
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-surface2 border border-border text-muted hover:text-foreground hover:border-[var(--accent)] rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scraping ? "animate-spin" : ""}`} />
              {scraping ? "Scraping..." : "Sync CDSCO"}
            </button>
          </div>
        </div>
      </div>

      {/* Scrape status banner */}
      {scrapeMsg && (
        <div className="bg-[var(--accent)]/10 border-b border-[var(--accent)]/20 px-6 py-2 text-xs text-[var(--accent)] font-medium text-center animate-in fade-in">
          {scrapeMsg}
        </div>
      )}

      {/* Knowledge base last sync info */}
      {latestScan && (
        <div className="border-b border-border px-6 py-2 bg-surface2 shrink-0">
          <div className="max-w-5xl mx-auto flex items-center gap-4 text-xs text-muted">
            <span>Last sync: {new Date(latestScan.startedAt).toLocaleString()}</span>
            <span className={`font-medium ${latestScan.status === "completed" ? "text-green-500" : latestScan.status === "running" ? "text-[var(--accent)]" : "text-red-500"}`}>
              ● {latestScan.status}
            </span>
            <span>{latestScan.pdfsIndexed} PDFs indexed</span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-[var(--accent)]" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Ask about CDSCO Regulations</h2>
              <p className="text-sm text-muted max-w-md mx-auto mb-8">
                I have access to the latest notifications, guidelines, and documents scraped directly from the CDSCO official portal.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="p-3 text-left text-xs text-muted bg-surface border border-border rounded-xl hover:border-[var(--accent)] hover:text-foreground transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-[var(--accent)]" />
                </div>
              )}
              <div className={`max-w-[85%] ${msg.role === "user" ? "order-first" : ""}`}>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[var(--accent)] text-white ml-auto"
                      : "bg-surface border border-border text-foreground"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none text-foreground [&_code]:bg-surface2 [&_code]:px-1 [&_code]:rounded [&_strong]:text-foreground">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>

                {/* Sources */}
                {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {msg.sources.slice(0, 4).map((src, si) => (
                      <a
                        key={si}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-muted hover:text-[var(--accent)] border border-border hover:border-[var(--accent)] rounded-lg px-2 py-1 bg-surface transition"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[160px]">{src.title || "Source"}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-foreground" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-[var(--accent)]" />
              </div>
              <div className="bg-surface border border-border rounded-2xl px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-surface px-4 py-4 shrink-0">
        <div className="max-w-3xl mx-auto flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about CDSCO notifications, medical device regulations, approvals..."
              rows={1}
              className="w-full resize-none bg-surface2 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted focus:outline-none focus:border-[var(--accent)] transition max-h-32 overflow-y-auto"
              style={{ minHeight: "44px" }}
            />
          </div>
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white flex items-center justify-center transition disabled:opacity-40 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-xs text-muted mt-2">
          Powered by DeepSeek · Data sourced from{" "}
          <a href="https://cdsco.gov.in" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--accent)]">
            cdsco.gov.in
          </a>
        </p>
      </div>
    </div>
  );
}
