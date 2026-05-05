import Link from "next/link";
import { FRAMEWORKS, REGION_GROUPS } from "@/lib/frameworks";
import HeroInteractive from "@/components/landing/HeroInteractive";
import PricingInteractive from "@/components/landing/PricingInteractive";
import FaqAccordion from "@/components/landing/FaqAccordion";
import CountryExplorer from "@/components/landing/CountryExplorer";
import "@/components/landing/LandingPolish.css";
import SpotlightBorder from "@/components/landing/SpotlightBorder";

const totalFields = FRAMEWORKS.reduce((sum, fw) => sum + fw.sections.reduce((s, sec) => s + sec.fields.length, 0), 0);
const totalCountries = new Set(FRAMEWORKS.map((f) => f.countryCode)).size;
const totalRegions = new Set(REGION_GROUPS.map((r) => r.region)).size;

const metrics = [
  { value: `${totalCountries}+`, label: "Countries" },
  { value: `${FRAMEWORKS.length}`, label: "Frameworks" },
  { value: `${Math.round(totalFields / 100) * 100}+`, label: "Regulatory Fields" },
  { value: "100%", label: "Compliance Coverage" },
];

const capabilities = [
  {
    title: "Structured Regulatory Intelligence",
    desc: "Every field in every framework is mapped to real regulatory requirements — CDSCO DMF, FDA 510(k), EU MDR, NMPA, PMDA, and 40+ more. No generic templates.",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
  },
  {
    title: "AI-Powered Document Assistant",
    desc: "Upload COAs, clinical reports, IFUs, or safety data sheets. Our AI extracts relevant data and maps it to the correct regulatory fields automatically.",
    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  },
  {
    title: "Multi-Submission Generation",
    desc: "Register one product, select target markets. SwayamSutra generates country-specific regulatory documents with the correct structure, fields, and language requirements.",
    icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    title: "Version Control & Audit Trail",
    desc: "Every change is tracked. Create versioned snapshots, compare revisions, and maintain the complete audit trail regulators require.",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    title: "Secure Document Vault",
    desc: "Enterprise-grade encrypted storage for all regulatory documents. Role-based access, download controls, and complete traceability.",
    icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  },
  {
    title: "Export & Submit",
    desc: "Generate print-ready PDFs in the exact format each authority requires. A4, Letter, structured annexes — all handled automatically.",
    icon: "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
];

const workflow = [
  { step: "01", title: "Register Product", desc: "Enter your device details once — name, manufacturer, class, intended use." },
  { step: "02", title: "Select Markets", desc: "Choose from 35+ countries. Each market shows available submission types." },
  { step: "03", title: "Generate Documents", desc: "One click creates the full regulatory document with all required sections." },
  { step: "04", title: "Fill with AI", desc: "Upload source documents or type answers. AI helps fill fields accurately." },
  { step: "05", title: "Review & Export", desc: "Review, version, and export compliant PDFs ready for submission." },
];

const pricing = [
  { name: "Starter", monthly: "$299", yearly: "$2,999", desc: "For small manufacturers entering 1-2 markets", features: ["3 products", "2 country frameworks", "AI assistant", "PDF export", "Email support"] },
  { name: "Professional", monthly: "$799", yearly: "$7,999", desc: "For growing companies with multi-market ambitions", features: ["Unlimited products", "10 country frameworks", "AI assistant + auto-fill", "Version control", "Document vault", "Priority support"], popular: true },
  { name: "Enterprise", monthly: "Custom", yearly: "Custom", desc: "For organizations managing global portfolios", features: ["Unlimited everything", "All 35+ countries", "API access", "SSO / SAML", "Dedicated success manager", "Custom integrations", "On-premise option"] },
];

const testimonials = [
  {
    name: "Head of Regulatory Affairs",
    company: "IVD Manufacturer",
    quote: "We turned a multi-country submission plan into a structured, trackable workflow. The biggest win: one source of truth across teams and markets.",
  },
  {
    name: "Regulatory Consultant",
    company: "Global Consultancy",
    quote: "The framework structure is the difference. It’s not a template library — it’s a compliance system that mirrors how regulators actually evaluate dossiers.",
  },
  {
    name: "Operations Lead",
    company: "Medical Device Company",
    quote: "Versioning + document vault removed the chaos. Audits went from stressful to routine because the trail is already there.",
  },
];

const faqs = [
  {
    q: "Is this a generic template tool?",
    a: "No. Each country framework is built as structured sections + fields aligned to the authority’s expectations (e.g., CDSCO, FDA, EU MDR/IVDR, NMPA, PMDA).",
  },
  {
    q: "How does AI auto-fill work?",
    a: "You upload existing source documents (COA, IFU, SDS, clinical reports). AI extracts relevant facts and maps them into the correct fields of the selected framework.",
  },
  {
    q: "Can I manage multiple products and markets?",
    a: "Yes. Register products once, select target markets, and generate the right submission types per country with progress tracking and version control.",
  },
  {
    q: "Do you support audit trails and versioning?",
    a: "Yes. Snapshots/versions are built-in, so you can review changes over time and keep compliance evidence organized.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-surface/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-[var(--accent)]/15 border border-[var(--accent)]/30 rounded-lg flex items-center justify-center text-sm font-bold text-[var(--accent)]">S</span>
            <span className="text-lg font-bold text-foreground tracking-tight">SwayamSutra</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted">
            <a href="#how-it-works" className="hover:text-foreground transition">How it works</a>
            <a href="#platform" className="hover:text-foreground transition">Platform</a>
            <a href="#countries" className="hover:text-foreground transition">Countries</a>
            <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-muted hover:text-foreground transition px-3 py-2">Sign in</Link>
            <Link href="/register" className="text-sm font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-2 rounded-xl transition">Start free trial</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <HeroInteractive
        totalCountries={totalCountries}
        totalFrameworks={FRAMEWORKS.length}
        totalRegions={totalRegions}
        metrics={metrics}
        coveredCountries={REGION_GROUPS.flatMap((rg) => rg.countries)}
      />

      {/* Trust strip */}
      <section className="border-y border-border bg-surface">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="text-center">
            <p className="text-[10px] font-bold text-muted uppercase tracking-[0.22em]">Trusted by teams who ship submissions</p>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                "IVD Manufacturers",
                "Regulatory Teams",
                "CROs",
                "Consultancies",
                "Hospitals",
                "Distributors",
              ].map((x) => (
                <div key={x} className="ss-logoPill px-4 py-2 text-xs text-muted font-semibold text-center">
                  {x}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-20 md:py-28 relative">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-[var(--accent)] uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">From product to submission in five steps</h2>
          <p className="mt-4 text-muted max-w-xl mx-auto">No consultants. No Word templates. No duplicated effort.</p>
        </div>
        <div className="grid md:grid-cols-5 gap-6">
          {workflow.map((w, i) => (
            <div key={w.step} className="relative ss-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-2xl font-bold text-[var(--accent)]/25">{w.step}</div>
                <div className="w-9 h-9 bg-[var(--accent)]/10 rounded-xl flex items-center justify-center text-[var(--accent)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d={capabilities[i % capabilities.length].icon} />
                  </svg>
                </div>
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1">{w.title}</h3>
              <p className="text-xs text-muted leading-relaxed">{w.desc}</p>
              {i < workflow.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 text-border text-lg">&rarr;</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section id="platform" className="bg-surface border-y border-border relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 left-[-260px] w-[860px] h-[860px] blur-2xl opacity-30 bg-[radial-gradient(circle,rgba(14,165,233,0.14),transparent_62%)]" />
          <div className="absolute -bottom-48 right-[-260px] w-[920px] h-[920px] blur-2xl opacity-25 bg-[radial-gradient(circle,rgba(43,108,176,0.12),transparent_64%)]" />
          <div className="absolute inset-0 opacity-[0.10] [background-image:linear-gradient(to_right,rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.06)_1px,transparent_1px)] [background-size:88px_88px]" />
        </div>
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 relative">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-[var(--accent)] uppercase tracking-widest mb-3">Platform</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Built for regulatory professionals</h2>
            <p className="mt-4 text-muted max-w-xl mx-auto">Every feature designed to eliminate the pain of medical device documentation.</p>
          </div>
          <SpotlightBorder className="ss-gradientBorder ss-glowCard">
            <div className="bg-transparent p-0">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {capabilities.map((c) => (
                  <div
                    key={c.title}
                    className="ss-glowCard bg-background/70 backdrop-blur-sm border border-border rounded-2xl p-6 hover:border-[var(--accent)]/30 hover:shadow-sm transition hover:-translate-y-0.5"
                  >
                    <div className="w-10 h-10 bg-[var(--accent)]/10 border border-[var(--accent)]/15 rounded-xl flex items-center justify-center text-[var(--accent)] mb-4">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d={c.icon} /></svg>
                    </div>
                    <h3 className="font-semibold text-foreground text-sm mb-2">{c.title}</h3>
                    <p className="text-xs text-muted leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </SpotlightBorder>
        </div>
      </section>

      {/* Countries */}
      <section id="countries" className="max-w-7xl mx-auto px-6 py-20 md:py-28 relative">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-[var(--accent)] uppercase tracking-widest mb-3">Global coverage</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">{totalCountries} countries. {FRAMEWORKS.length} regulatory frameworks.</h2>
          <p className="mt-4 text-muted max-w-xl mx-auto">The most comprehensive medical device regulatory platform in the world.</p>
        </div>
        <div className="ss-card p-0">
          <CountryExplorer regionGroups={REGION_GROUPS} />
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="bg-surface border-y border-border relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-48 right-[-280px] w-[980px] h-[980px] blur-2xl opacity-25 bg-[radial-gradient(circle,rgba(220,38,38,0.10),transparent_60%)]" />
          <div className="absolute -bottom-56 left-[-280px] w-[980px] h-[980px] blur-2xl opacity-20 bg-[radial-gradient(circle,rgba(34,197,94,0.10),transparent_60%)]" />
        </div>
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 relative">
          <div className="grid md:grid-cols-2 gap-10">
            <div className="ss-glowCard bg-background/70 backdrop-blur-sm border border-border rounded-2xl p-8">
              <p className="text-xs font-semibold text-red-500 uppercase tracking-widest mb-3">Without SwayamSutra</p>
              <h3 className="text-2xl font-bold text-foreground mb-6 tracking-tight">Documentation is your bottleneck</h3>
              <div className="space-y-4">
                {[
                  "6-12 months preparing each multi-country submission",
                  "Repetitive data entry across 15-20 documents per product",
                  "Expensive consultants at $300-500/hr for formatting work",
                  "Version chaos — Word docs emailed between 5 stakeholders",
                  "Regulatory deficiencies from missing or inconsistent data",
                  "No audit trail when authorities ask questions",
                ].map((item) => (
                  <div key={item} className="flex gap-3 text-sm text-muted">
                    <span className="text-red-400 mt-0.5 shrink-0">&#x2717;</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="ss-glowCard bg-background/70 backdrop-blur-sm border border-border rounded-2xl p-8">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-widest mb-3">With SwayamSutra</p>
              <h3 className="text-2xl font-bold text-foreground mb-6 tracking-tight">Weeks become hours</h3>
              <div className="space-y-4">
                {[
                  "Enter product data once, generate submissions for 35+ countries",
                  "AI extracts data from your existing documents automatically",
                  "Real regulatory fields — not generic templates — for every country",
                  "Built-in version control with complete audit trail",
                  "Compliance validation catches errors before submission",
                  "Export authority-ready PDFs in the exact required format",
                ].map((item) => (
                  <div key={item} className="flex gap-3 text-sm text-muted">
                    <span className="text-green-500 mt-0.5 shrink-0">&#x2713;</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-20 md:py-28 relative">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-[var(--accent)] uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Simple, transparent pricing</h2>
          <p className="mt-4 text-muted max-w-xl mx-auto">Start free. Scale as your regulatory portfolio grows.</p>
        </div>
        <div className="ss-card p-6">
          <PricingInteractive plans={pricing} />
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-[var(--accent)] uppercase tracking-widest mb-3">Proof</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Loved by regulatory teams</h2>
            <p className="mt-4 text-muted max-w-xl mx-auto">Built to reduce submission time, risk, and stakeholder friction.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.quote} className="ss-card p-6">
                <div className="flex items-center gap-1 text-[var(--accent)] mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed font-medium">“{t.quote}”</p>
                <div className="mt-5 pt-5 border-t border-border flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{t.name}</p>
                    <p className="text-[11px] text-muted">{t.company}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/15 flex items-center justify-center text-[var(--accent)] font-bold">
                    {t.company[0]}
                  </div>
                </div>
                  </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28 relative">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-[var(--accent)] uppercase tracking-widest mb-3">FAQ</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Questions, answered</h2>
          <p className="mt-4 text-muted max-w-xl mx-auto">Everything you need to evaluate the platform.</p>
        </div>
        <div className="ss-card p-0">
          <FaqAccordion faqs={faqs} />
        </div>
      </section>

      {/* Team */}
      <section className="bg-surface border-y border-border relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-44 right-[-260px] w-[860px] h-[860px] blur-2xl opacity-25 bg-[radial-gradient(circle,rgba(14,165,233,0.14),transparent_62%)]" />
          <div className="absolute -bottom-56 left-[-260px] w-[980px] h-[980px] blur-2xl opacity-18 bg-[radial-gradient(circle,rgba(43,108,176,0.12),transparent_64%)]" />
        </div>
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 relative">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-[var(--accent)] uppercase tracking-widest mb-3">Team</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Built by industry veterans</h2>
            <p className="mt-4 text-muted max-w-xl mx-auto">Combined 55+ years of regulatory, AI, and operations expertise.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { role: "Regulatory Expert", bio: "15+ years founding India's leading CDSCO consulting organization. Deep expertise in import licensing, IVD distribution, and multi-country submissions." },
              { role: "AI & Technology", bio: "Built multiple AI products serving Indian enterprises. Expertise in NLP, document understanding, and building products that scale to millions of users." },
              { role: "Operations & Compliance", bio: "25+ years in the IVD industry. Expertise in operations, supply chain, IT infrastructure, regulatory compliance, and cybersecurity." },
            ].map((m, i) => (
              <div key={i} className="ss-glowCard bg-background/70 backdrop-blur-sm border border-border rounded-2xl p-6 text-center hover:border-[var(--accent)]/25 hover:shadow-sm transition hover:-translate-y-0.5">
                <div className="w-14 h-14 bg-[var(--accent)]/10 border border-[var(--accent)]/15 rounded-2xl flex items-center justify-center text-[var(--accent)] font-bold text-lg mx-auto mb-4">
                  {m.role[0]}
                </div>
                <h3 className="font-bold text-foreground mb-2">{m.role}</h3>
                <p className="text-xs text-muted leading-relaxed">{m.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-52 left-1/2 -translate-x-1/2 w-[1200px] h-[720px] blur-2xl opacity-55 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.22),transparent_58%)]" />
          <div className="absolute -bottom-72 right-[-220px] w-[920px] h-[920px] blur-2xl opacity-45 bg-[radial-gradient(circle,rgba(43,108,176,0.16),transparent_60%)]" />
          <div className="absolute inset-0 opacity-[0.10] [background-image:linear-gradient(to_right,rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.06)_1px,transparent_1px)] [background-size:96px_96px]" />
        </div>
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32 text-center relative">
          <div className="max-w-3xl mx-auto ss-gradientBorder">
            <div className="bg-surface/75 backdrop-blur-sm border border-border rounded-[17px] p-10 md:p-12">
              <p className="text-[10px] font-bold text-muted uppercase tracking-[0.22em]">Start shipping submissions</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
                Ready to transform your regulatory workflow?
              </h2>
              <p className="text-muted max-w-xl mx-auto mb-8">
                Consolidate frameworks, documents, and collaboration into one submission workspace — built for global scale.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/register" className="w-full sm:w-auto px-10 py-3.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-[var(--accent)]/20 hover:-translate-y-0.5">
                  Start your free trial
                </Link>
                <Link href="/login" className="w-full sm:w-auto px-10 py-3.5 bg-surface2/80 border border-border hover:border-[var(--accent)]/40 text-foreground font-semibold rounded-xl text-sm transition backdrop-blur-sm hover:-translate-y-0.5">
                  Sign in
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted">
                {["No credit card", "14-day trial", "Export-ready PDFs", "Versioning + audit trail"].map((x) => (
                  <span key={x} className="px-3 py-1 rounded-full border border-border bg-background/60 backdrop-blur-sm">
                    {x}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 bg-[var(--accent)]/15 border border-[var(--accent)]/30 rounded-lg flex items-center justify-center text-xs font-bold text-[var(--accent)]">S</span>
                <span className="text-sm font-bold text-foreground">SwayamSutra</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">The global operating system for medical device regulatory compliance.</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">Product</p>
              <div className="space-y-2 text-xs text-muted">
                <a href="#how-it-works" className="block hover:text-foreground transition">How it works</a>
                <a href="#platform" className="block hover:text-foreground transition">Platform</a>
                <a href="#countries" className="block hover:text-foreground transition">Supported countries</a>
                <a href="#pricing" className="block hover:text-foreground transition">Pricing</a>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">Frameworks</p>
              <div className="space-y-2 text-xs text-muted">
                <span className="block">FDA 510(k) / PMA</span>
                <span className="block">EU MDR / IVDR</span>
                <span className="block">India CDSCO DMF</span>
                <span className="block">China NMPA</span>
                <span className="block">+{FRAMEWORKS.length - 8} more</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">Company</p>
              <div className="space-y-2 text-xs text-muted">
                <span className="block">About</span>
                <span className="block">Contact</span>
                <span className="block">Privacy Policy</span>
                <span className="block">Terms of Service</span>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted">
            <span>&copy; {new Date().getFullYear()} SwayamSutra. All rights reserved.</span>
            <span>The global operating system for medical device compliance.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
