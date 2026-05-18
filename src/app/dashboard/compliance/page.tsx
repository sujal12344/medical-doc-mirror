"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { COMPLIANCE_DATA } from "@/lib/compliance-knowledge";
import type { CountryCompliance } from "@/lib/compliance-knowledge";

type ChatMsg = { role: "user" | "bot"; text: string };

const REGIONS = [...new Set(COMPLIANCE_DATA.map((c) => c.region))];

export default function ComplianceGuidePage() {
  const [selected, setSelected] = useState<string>(COMPLIANCE_DATA[0]?.countryCode || "IN");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "flow" | "forms" | "fees" | "laws" | "tips">("overview");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const country: CountryCompliance | undefined = useMemo(
    () => COMPLIANCE_DATA.find((c) => c.countryCode === selected),
    [selected],
  );

  const filteredByRegion = useMemo(() => {
    const q = search.toLowerCase().trim();
    return REGIONS.map((region) => ({
      region,
      countries: COMPLIANCE_DATA.filter((c) => c.region === region).filter(
        (c) => !q || c.countryName.toLowerCase().includes(q) || c.countryCode.toLowerCase().includes(q),
      ),
    })).filter((r) => r.countries.length > 0);
  }, [search]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  function handleCountrySelect(code: string) {
    setSelected(code);
    setActiveTab("overview");
    setChatMessages([]);
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading || !country) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: msg }]);
    setChatLoading(true);

    try {
      const ctx = `Country: ${country.countryName} (${country.countryCode})
Regulatory Authority: ${country.regulatoryAuthority.name} (${country.regulatoryAuthority.abbreviation})
Classification: ${country.classification.system}
Key Laws: ${country.keyLaws.map((l) => l.name).join(", ")}
Submission Steps: ${country.submissionFlow.map((s) => `${s.step}. ${s.title}`).join("; ")}
Timeline: ${country.timelines.standardReview}
Renewal: ${country.timelines.renewalPeriod}
Local Requirements: ${country.localRequirements.join("; ")}`;

      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are an expert in medical device regulatory compliance for ${country.countryName}. You have deep knowledge of ${country.regulatoryAuthority.abbreviation} requirements, submission processes, timelines, fees, and best practices.

Here is the regulatory context:
${ctx}

Answer the user's questions accurately and concisely. If asked about something outside your knowledge for this country, say so. Provide practical, actionable guidance.`,
            },
            { role: "user", content: msg },
          ],
          max_tokens: 1200,
          temperature: 0.3,
        }),
      });
      const data = await r.json();
      setChatMessages((prev) => [...prev, { role: "bot", text: data.content || "No response" }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: "bot", text: "Connection error. Please try again." }]);
    }
    setChatLoading(false);
  }

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "flow" as const, label: "Submission Flow" },
    { id: "forms" as const, label: "Required Forms" },
    { id: "fees" as const, label: "Fees & Timelines" },
    { id: "laws" as const, label: "Laws & Standards" },
    { id: "tips" as const, label: "Tips & Updates" },
  ];

  return (
    <div className="flex h-full">
      {/* Country Selector */}
      <div className="w-60 bg-surface border-r border-border flex flex-col shrink-0">
        <div className="p-3 border-b border-border">
          <h2 className="text-sm font-bold text-foreground mb-2">Compliance Guide</h2>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search countries..."
            className="w-full px-3 py-1.5 border border-border rounded-lg bg-surface2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 transition"
          />
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {filteredByRegion.map((group) => (
            <div key={group.region}>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest px-2 mb-1">{group.region}</p>
              <div className="space-y-0.5">
                {group.countries.map((c) => (
                  <button
                    key={c.countryCode}
                    onClick={() => handleCountrySelect(c.countryCode)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition text-left ${
                      selected === c.countryCode
                        ? "bg-[var(--accent)]/10 text-[var(--accent)] font-semibold"
                        : "text-muted hover:text-foreground hover:bg-surface2"
                    }`}
                  >
                    <span className="text-sm">{c.flag}</span>
                    <span className="truncate">{c.countryName}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Knowledge Content */}
      <div className="flex-1 overflow-y-auto">
        {country ? (
          <div className="p-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <span className="text-4xl">{country.flag}</span>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground">{country.countryName}</h1>
                <p className="text-sm text-muted mt-0.5">
                  {country.regulatoryAuthority.abbreviation} &middot; {country.classification.system}
                </p>
                <a href={country.regulatoryAuthority.website} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-[var(--accent)] hover:underline mt-1 inline-block">
                  {country.regulatoryAuthority.website} &rarr;
                </a>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/api/compliance-book"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-surface border border-border rounded-xl hover:border-[var(--accent)]/40 hover:shadow-sm transition text-xs font-semibold text-foreground"
                  title="Opens a print-ready guidebook. Use Save as PDF."
                >
                  Download PDF (All Countries)
                </a>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-xs font-medium border-b-2 transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-[var(--accent)] text-[var(--accent)]"
                      : "border-transparent text-muted hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="bg-surface border border-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Regulatory Overview</h3>
                  <p className="text-sm text-muted leading-relaxed">{country.overview}</p>
                </div>

                <div className="bg-surface border border-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Regulatory Authority</h3>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[var(--accent)]/10 rounded-lg flex items-center justify-center text-xs font-bold text-[var(--accent)] shrink-0">
                      {country.regulatoryAuthority.abbreviation.slice(0, 3)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{country.regulatoryAuthority.name}</p>
                      <p className="text-xs text-muted mt-0.5">{country.regulatoryAuthority.description}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-surface border border-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Device Classification</h3>
                  <p className="text-xs text-muted mb-3">{country.classification.system}</p>
                  <div className="space-y-2">
                    {country.classification.classes.map((cls, i) => (
                      <div key={i} className="flex items-start gap-3 bg-surface2 rounded-lg p-3">
                        <span className="w-7 h-7 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-bold flex items-center justify-center shrink-0">
                          {cls.name.replace(/Class\s*/i, "").slice(0, 3)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground">{cls.name}</p>
                          <p className="text-[11px] text-muted">{cls.description}</p>
                          <p className="text-[10px] text-muted mt-0.5">Examples: {cls.examples}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-surface border border-border rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-2">Timelines</h3>
                    <div className="space-y-2 text-xs">
                      <div><span className="text-muted">Standard Review:</span> <span className="text-foreground font-medium">{country.timelines.standardReview}</span></div>
                      {country.timelines.expeditedReview && <div><span className="text-muted">Expedited:</span> <span className="text-foreground font-medium">{country.timelines.expeditedReview}</span></div>}
                      <div><span className="text-muted">Renewal:</span> <span className="text-foreground font-medium">{country.timelines.renewalPeriod}</span></div>
                      {country.timelines.notes && <p className="text-[11px] text-muted mt-2">{country.timelines.notes}</p>}
                    </div>
                  </div>
                  <div className="bg-surface border border-border rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-2">Local Requirements</h3>
                    <ul className="space-y-1.5">
                      {country.localRequirements.slice(0, 4).map((req, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-muted">
                          <span className="text-[var(--accent)] mt-0.5 shrink-0">&#9679;</span>
                          <span>{req}</span>
                        </li>
                      ))}
                      {country.localRequirements.length > 4 && (
                        <li className="text-[10px] text-[var(--accent)] cursor-pointer" onClick={() => setActiveTab("tips")}>
                          +{country.localRequirements.length - 4} more &rarr;
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "flow" && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground mb-4">Submission Flow — Step by Step</h3>
                <div className="relative">
                  {country.submissionFlow.map((step, i) => (
                    <div key={i} className="flex gap-4 mb-4 last:mb-0">
                      {/* Timeline connector */}
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {step.step}
                        </div>
                        {i < country.submissionFlow.length - 1 && (
                          <div className="w-0.5 flex-1 bg-[var(--accent)]/20 mt-1" />
                        )}
                      </div>
                      {/* Step content */}
                      <div className="bg-surface border border-border rounded-xl p-4 flex-1 -mt-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-foreground">{step.title}</h4>
                          {step.duration && (
                            <span className="text-[10px] px-2 py-0.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded-full font-medium whitespace-nowrap shrink-0">
                              {step.duration}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-1 leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "forms" && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground mb-4">Required Forms & Documentation</h3>
                <div className="space-y-2">
                  {country.requiredForms.map((form, i) => (
                    <div key={i} className="bg-surface border border-border rounded-xl p-4 flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${form.mandatory ? "bg-red-500" : "bg-yellow-500"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{form.name}</p>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${form.mandatory ? "bg-red-50 text-red-600" : "bg-yellow-50 text-yellow-600"}`}>
                            {form.mandatory ? "Mandatory" : "Conditional"}
                          </span>
                        </div>
                        <p className="text-xs text-muted mt-0.5">{form.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "fees" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4">Fee Structure</h3>
                  <div className="bg-surface border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-surface2">
                          <th className="text-left px-4 py-2.5 font-semibold text-foreground">Category</th>
                          <th className="text-right px-4 py-2.5 font-semibold text-foreground">Amount</th>
                          <th className="text-left px-4 py-2.5 font-semibold text-foreground">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {country.fees.map((fee, i) => (
                          <tr key={i} className="border-t border-border">
                            <td className="px-4 py-2.5 text-foreground font-medium">{fee.category}</td>
                            <td className="px-4 py-2.5 text-right text-[var(--accent)] font-semibold whitespace-nowrap">{fee.amount}</td>
                            <td className="px-4 py-2.5 text-muted">{fee.notes || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-surface border border-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Review Timelines</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-surface2 rounded-lg p-3">
                      <p className="text-muted text-[10px] uppercase tracking-wide font-semibold mb-1">Standard Review</p>
                      <p className="text-foreground font-medium">{country.timelines.standardReview}</p>
                    </div>
                    {country.timelines.expeditedReview && (
                      <div className="bg-surface2 rounded-lg p-3">
                        <p className="text-muted text-[10px] uppercase tracking-wide font-semibold mb-1">Expedited</p>
                        <p className="text-foreground font-medium">{country.timelines.expeditedReview}</p>
                      </div>
                    )}
                    <div className="bg-surface2 rounded-lg p-3">
                      <p className="text-muted text-[10px] uppercase tracking-wide font-semibold mb-1">Renewal Period</p>
                      <p className="text-foreground font-medium">{country.timelines.renewalPeriod}</p>
                    </div>
                  </div>
                  {country.timelines.notes && <p className="text-[11px] text-muted mt-3">{country.timelines.notes}</p>}
                </div>
              </div>
            )}

            {activeTab === "laws" && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground mb-4">Key Laws & Standards</h3>
                <div className="space-y-2">
                  {country.keyLaws.map((law, i) => (
                    <div key={i} className="bg-surface border border-border rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{law.name}</p>
                        {law.year && <span className="text-[10px] px-2 py-0.5 bg-surface2 border border-border rounded-full text-muted font-medium shrink-0">{law.year}</span>}
                      </div>
                      <p className="text-xs text-muted mt-1">{law.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "tips" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Expert Tips</h3>
                  <div className="space-y-2">
                    {country.tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-3 bg-[var(--accent)]/5 border border-[var(--accent)]/10 rounded-xl p-3">
                        <span className="text-[var(--accent)] text-sm mt-0.5">💡</span>
                        <p className="text-xs text-foreground leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {country.recentUpdates && country.recentUpdates.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Recent Updates</h3>
                    <div className="space-y-2">
                      {country.recentUpdates.map((update, i) => (
                        <div key={i} className="flex items-start gap-3 bg-surface border border-border rounded-xl p-3">
                          <span className="text-blue-500 text-sm mt-0.5">📰</span>
                          <p className="text-xs text-muted leading-relaxed">{update}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">All Local Requirements</h3>
                  <div className="bg-surface border border-border rounded-xl p-4">
                    <ul className="space-y-2">
                      {country.localRequirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted">
                          <span className="text-[var(--accent)] mt-0.5 shrink-0">&#9679;</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-muted">Select a country to view compliance details</div>
        )}
      </div>

      {/* Chat Panel */}
      <div className="w-80 bg-surface border-l border-border flex flex-col shrink-0">
        <div className="p-3 border-b border-border">
          <h3 className="text-xs font-semibold text-foreground">Compliance AI Chat</h3>
          <p className="text-[10px] text-muted">
            Ask about {country?.countryName || "any country"}&apos;s regulations
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {chatMessages.length === 0 && country && (
            <div className="text-[11px] text-muted p-3 bg-surface2 rounded-lg border border-border space-y-2">
              <p className="font-medium text-foreground">Ask me about {country.countryName} compliance!</p>
              <p>Example questions:</p>
              <ul className="space-y-1 ml-1">
                <li className="cursor-pointer hover:text-[var(--accent)] transition" onClick={() => { setChatInput(`What documents do I need to register a Class III device in ${country.countryName}?`); }}>
                  &bull; What documents for Class III?
                </li>
                <li className="cursor-pointer hover:text-[var(--accent)] transition" onClick={() => { setChatInput(`How long does ${country.regulatoryAuthority.abbreviation} review take?`); }}>
                  &bull; How long is the review process?
                </li>
                <li className="cursor-pointer hover:text-[var(--accent)] transition" onClick={() => { setChatInput(`Do I need a local representative in ${country.countryName}?`); }}>
                  &bull; Do I need a local representative?
                </li>
                <li className="cursor-pointer hover:text-[var(--accent)] transition" onClick={() => { setChatInput(`What are the fees for device registration in ${country.countryName}?`); }}>
                  &bull; What are the registration fees?
                </li>
              </ul>
            </div>
          )}
          {chatMessages.map((m, i) => (
            <div
              key={i}
              className={`text-xs p-2.5 rounded-lg whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-surface2 ml-6 text-foreground"
                  : "bg-[var(--accent)]/5 border border-[var(--accent)]/10 text-foreground mr-4"
              }`}
            >
              {m.text}
            </div>
          ))}
          {chatLoading && <div className="text-xs text-muted p-2 animate-pulse">Thinking...</div>}
          <div ref={chatEndRef} />
        </div>
        <div className="p-3 border-t border-border">
          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
              placeholder={`Ask about ${country?.countryName || "regulations"}...`}
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-surface2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 transition"
            />
            <button
              onClick={sendChat}
              disabled={chatLoading}
              className="px-3 py-2 bg-[var(--accent)] text-white rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-[var(--accent-hover)] transition"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
