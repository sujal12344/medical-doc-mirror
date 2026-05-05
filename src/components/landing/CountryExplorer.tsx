"use client";

import { useMemo, useState } from "react";

type RegionGroup = {
  region: string;
  countries: { code: string; name: string; flag: string; frameworkCount: number }[];
};

export default function CountryExplorer({ regionGroups }: { regionGroups: RegionGroup[] }) {
  const [q, setQ] = useState("");
  const [activeRegion, setActiveRegion] = useState<string>("All");

  const regions = useMemo(() => ["All", ...regionGroups.map((r) => r.region)], [regionGroups]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const groups = regionGroups
      .filter((g) => activeRegion === "All" || g.region === activeRegion)
      .map((g) => ({
        ...g,
        countries: g.countries.filter(
          (c) =>
            !query ||
            c.name.toLowerCase().includes(query) ||
            c.code.toLowerCase().includes(query),
        ),
      }))
      .filter((g) => g.countries.length > 0);
    return groups;
  }, [q, activeRegion, regionGroups]);

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {regions.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setActiveRegion(r)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold transition ${
                activeRegion === r
                  ? "bg-[var(--accent)]/10 border-[var(--accent)]/25 text-[var(--accent)]"
                  : "bg-surface2 border-border text-muted hover:text-foreground hover:border-[var(--accent)]/25"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-[320px]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a country…"
              className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 21l-4.3-4.3m1.8-5.2a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {filtered.map((g) => (
          <div key={g.region}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-foreground">{g.region}</p>
              <span className="text-xs text-muted">{g.countries.length} countries</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {g.countries.map((c) => (
                <div
                  key={c.code}
                  className="group inline-flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-2 text-xs hover:border-[var(--accent)]/30 hover:shadow-sm transition"
                >
                  <span className="text-base">{c.flag}</span>
                  <span className="font-semibold text-foreground">{c.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-surface2 border border-border rounded font-semibold text-muted group-hover:text-[var(--accent)] transition">
                    {c.frameworkCount} types
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center text-sm text-muted py-10">
            No countries found for your search.
          </div>
        )}
      </div>
    </div>
  );
}

