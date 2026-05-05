import { NextResponse } from "next/server";
import { COMPLIANCE_DATA } from "@/lib/compliance-knowledge";

function esc(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function li(items: string[]) {
  if (!items?.length) return "<p class=\"muted\">—</p>";
  return `<ul>${items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
}

function buildCountrySection(i: number) {
  const c = COMPLIANCE_DATA[i]!;
  const id = `country-${esc(c.countryCode)}`;
  const keyLaws = c.keyLaws?.length
    ? `<ul>${c.keyLaws.map((l) => `<li><strong>${esc(l.name)}</strong>${l.year ? ` <span class="pill">${esc(l.year)}</span>` : ""}<br/><span class="muted">${esc(l.description)}</span></li>`).join("")}</ul>`
    : "<p class=\"muted\">—</p>";

  const steps = c.submissionFlow?.length
    ? `<ol class="steps">${c.submissionFlow.map((s) => `<li><div class="step-title">${esc(String(s.step))}. ${esc(s.title)}${s.duration ? ` <span class="pill">${esc(s.duration)}</span>` : ""}</div><div class="muted">${esc(s.description)}</div></li>`).join("")}</ol>`
    : "<p class=\"muted\">—</p>";

  const forms = c.requiredForms?.length
    ? `<table class="table">
        <thead><tr><th style="width:32%">Document / Form</th><th>Description</th><th style="width:12%">Type</th></tr></thead>
        <tbody>
          ${c.requiredForms.map((f) => `<tr><td><strong>${esc(f.name)}</strong></td><td class="muted">${esc(f.description)}</td><td><span class="badge ${f.mandatory ? "badge-red" : "badge-amber"}">${f.mandatory ? "Mandatory" : "Conditional"}</span></td></tr>`).join("")}
        </tbody>
      </table>`
    : "<p class=\"muted\">—</p>";

  const fees = c.fees?.length
    ? `<table class="table">
        <thead><tr><th>Category</th><th style="width:22%">Amount</th><th>Notes</th></tr></thead>
        <tbody>
          ${c.fees.map((f) => `<tr><td>${esc(f.category)}</td><td><strong>${esc(f.amount)}</strong></td><td class="muted">${esc(f.notes || "—")}</td></tr>`).join("")}
        </tbody>
      </table>`
    : "<p class=\"muted\">—</p>";

  return `
  <section class="page" id="${id}">
    <div class="header">
      <div>
        <div class="kicker">${esc(c.region)} • ${esc(c.countryCode)}</div>
        <h2>${esc(c.flag)} ${esc(c.countryName)} Compliance Guide</h2>
        <div class="meta">
          <span><strong>Authority:</strong> ${esc(c.regulatoryAuthority.abbreviation)} — ${esc(c.regulatoryAuthority.name)}</span>
          <span class="sep">•</span>
          <span><strong>Website:</strong> ${esc(c.regulatoryAuthority.website)}</span>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <h3>Regulatory Overview</h3>
        <p class="muted">${esc(c.overview)}</p>
      </div>
      <div class="card">
        <h3>Classification</h3>
        <p class="muted">${esc(c.classification.system)}</p>
        <div class="small">
          ${c.classification.classes?.length ? c.classification.classes.map((cl) => `<div class="chip"><strong>${esc(cl.name)}</strong><br/><span class="muted">${esc(cl.description)}</span><br/><span class="muted">Examples: ${esc(cl.examples)}</span></div>`).join("") : "<p class=\"muted\">—</p>"}
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <h3>Submission Flow</h3>
        ${steps}
      </div>
      <div class="card">
        <h3>Timelines</h3>
        <div class="kv">
          <div><span class="muted">Standard review</span><div class="value">${esc(c.timelines.standardReview)}</div></div>
          ${c.timelines.expeditedReview ? `<div><span class="muted">Expedited</span><div class="value">${esc(c.timelines.expeditedReview)}</div></div>` : ""}
          <div><span class="muted">Renewal</span><div class="value">${esc(c.timelines.renewalPeriod)}</div></div>
        </div>
        ${c.timelines.notes ? `<p class="muted" style="margin-top:10px">${esc(c.timelines.notes)}</p>` : ""}
      </div>
    </div>

    <div class="card">
      <h3>Required Forms & Documents</h3>
      ${forms}
    </div>

    <div class="grid-2">
      <div class="card">
        <h3>Fees</h3>
        ${fees}
      </div>
      <div class="card">
        <h3>Key Laws & Standards</h3>
        ${keyLaws}
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <h3>Local Requirements</h3>
        ${li(c.localRequirements)}
      </div>
      <div class="card">
        <h3>Practical Tips</h3>
        ${li(c.tips)}
      </div>
    </div>

    ${c.recentUpdates?.length ? `<div class="card"><h3>Recent Updates</h3>${li(c.recentUpdates)}</div>` : ""}

    <div class="footer">
      <span>SwayamSutra — Global Compliance Guidebook</span>
      <span class="muted">${esc(c.countryName)} • ${esc(c.regulatoryAuthority.abbreviation)}</span>
    </div>
  </section>
  `;
}

export async function GET() {
  const countriesByRegion = [...new Set(COMPLIANCE_DATA.map((c) => c.region))].map((region) => ({
    region,
    countries: COMPLIANCE_DATA.filter((c) => c.region === region),
  }));

  const toc = countriesByRegion
    .map(
      (g) => `
      <div class="toc-group">
        <div class="toc-region">${esc(g.region)}</div>
        <div class="toc-items">
          ${g.countries
            .map((c) => `<a class="toc-item" href="#country-${esc(c.countryCode)}"><span>${esc(c.flag)} ${esc(c.countryName)}</span><span class="muted">${esc(c.countryCode)}</span></a>`)
            .join("")}
        </div>
      </div>`,
    )
    .join("");

  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>SwayamSutra — Global Compliance Guidebook</title>
      <style>
        :root{
          --ink:#0b1220;
          --muted:#4b5563;
          --border:#e5e7eb;
          --surface:#ffffff;
          --surface2:#f9fafb;
          --accent:#2b6cb0;
          --accent2:#0ea5e9;
          --red:#dc2626;
          --amber:#d97706;
        }
        @page { size: A4; margin: 14mm 14mm 14mm 14mm; }
        html,body{ margin:0; padding:0; background: var(--surface2); color: var(--ink); font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, \"Apple Color Emoji\", \"Segoe UI Emoji\"; }
        .page{ background: var(--surface); width: 210mm; min-height: 297mm; margin: 0 auto 10mm; box-shadow: 0 10px 30px rgba(0,0,0,0.06); position: relative; padding: 18mm 16mm; box-sizing:border-box; }
        @media print{
          body{ background: #fff; }
          .page{ margin:0; box-shadow:none; }
          a{ color: inherit; text-decoration: none; }
        }
        h1,h2,h3{ margin:0; }
        h1{ font-size: 30px; letter-spacing: -0.02em; }
        h2{ font-size: 20px; letter-spacing: -0.01em; }
        h3{ font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 10px; }
        p{ margin: 0; }
        .muted{ color: var(--muted); }
        .kicker{ font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
        .meta{ font-size: 11px; color: var(--muted); margin-top: 6px; }
        .meta .sep{ margin: 0 6px; }
        .cover{ display:flex; flex-direction:column; gap:14px; }
        .cover-top{ display:flex; align-items:center; justify-content:space-between; }
        .brand{ display:flex; align-items:center; gap:10px; }
        .logo{ width:36px; height:36px; border-radius:10px; background: linear-gradient(135deg, rgba(43,108,176,0.15), rgba(14,165,233,0.10)); border:1px solid rgba(43,108,176,0.25); display:flex; align-items:center; justify-content:center; font-weight:800; color: var(--accent); }
        .cover h1{ margin-top: 4px; }
        .hero{ margin-top: 10px; padding: 14px 14px; border:1px solid var(--border); border-radius: 14px; background: linear-gradient(180deg, rgba(43,108,176,0.06), rgba(255,255,255,0)); }
        .hero-grid{ display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 12px; }
        .metric{ border:1px solid var(--border); border-radius: 12px; padding: 10px; background: #fff; }
        .metric .val{ font-size: 18px; font-weight: 800; }
        .metric .lab{ font-size: 10px; letter-spacing: 0.10em; text-transform: uppercase; color: var(--muted); margin-top: 2px; }
        .toc-title{ margin-top: 18px; display:flex; align-items:flex-end; justify-content:space-between; gap:10px; }
        .toc-grid{ margin-top: 12px; display:grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .toc-group{ border:1px solid var(--border); border-radius: 14px; padding: 10px 10px; background:#fff; }
        .toc-region{ font-size: 11px; font-weight: 800; color: var(--ink); letter-spacing: 0.10em; text-transform: uppercase; margin-bottom: 8px; }
        .toc-items{ display:flex; flex-direction:column; gap: 6px; }
        .toc-item{ display:flex; align-items:center; justify-content:space-between; gap:10px; font-size: 11px; padding: 6px 8px; border:1px solid var(--border); border-radius: 10px; background: var(--surface2); }
        .header{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding-bottom: 10px; border-bottom: 1px solid var(--border); margin-bottom: 12px; }
        .grid-2{ display:grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
        .card{ border:1px solid var(--border); border-radius: 14px; padding: 12px 12px; background: #fff; }
        .small{ display:grid; grid-template-columns: 1fr; gap: 8px; }
        .chip{ border:1px solid var(--border); border-radius: 12px; padding: 10px; background: var(--surface2); font-size: 11px; }
        .table{ width:100%; border-collapse: separate; border-spacing:0; font-size: 11px; overflow:hidden; border:1px solid var(--border); border-radius: 12px; }
        .table thead th{ background: var(--surface2); color: var(--ink); text-align:left; padding: 8px 10px; font-weight: 800; border-bottom:1px solid var(--border); }
        .table tbody td{ padding: 8px 10px; border-bottom:1px solid var(--border); vertical-align: top; }
        .table tbody tr:last-child td{ border-bottom:none; }
        .badge{ font-size: 10px; padding: 3px 8px; border-radius: 999px; font-weight: 700; display:inline-block; }
        .badge-red{ background: rgba(220,38,38,0.10); color: var(--red); border:1px solid rgba(220,38,38,0.20); }
        .badge-amber{ background: rgba(217,119,6,0.10); color: var(--amber); border:1px solid rgba(217,119,6,0.20); }
        .pill{ font-size: 10px; padding: 2px 8px; border-radius: 999px; border:1px solid var(--border); background: #fff; color: var(--muted); margin-left: 6px; white-space: nowrap; }
        ul{ margin:0; padding-left: 18px; }
        li{ margin: 6px 0; }
        ol.steps{ margin:0; padding-left: 18px; }
        .step-title{ font-weight: 800; font-size: 11px; }
        .kv{ display:grid; grid-template-columns: 1fr; gap: 10px; font-size: 11px; }
        .kv .value{ font-weight: 800; margin-top: 2px; color: var(--ink); }
        .footer{ position:absolute; bottom: 10mm; left: 16mm; right: 16mm; display:flex; justify-content:space-between; font-size: 10px; color: var(--muted); border-top: 1px solid var(--border); padding-top: 6px; }
      </style>
    </head>
    <body>
      <section class=\"page\">
        <div class=\"cover\">
          <div class=\"cover-top\">
            <div class=\"brand\">
              <div class=\"logo\">S</div>
              <div>
                <div class=\"kicker\">SwayamSutra</div>
                <div style=\"font-weight:800\">Global Compliance</div>
              </div>
            </div>
            <div class=\"muted\" style=\"font-size:11px\">Generated: ${esc(new Date().toISOString().slice(0, 10))}</div>
          </div>
          <div>
            <h1>Global Medical Device Compliance Guidebook</h1>
            <p class=\"muted\" style=\"margin-top:8px; font-size:13px; line-height:1.5\">
              A McKinsey-style, country-by-country reference covering authorities, laws, submission flows, timelines, fees, required forms, and practical execution tips.
            </p>
          </div>

          <div class=\"hero\">
            <div class=\"kicker\">At a glance</div>
            <div class=\"hero-grid\">
              <div class=\"metric\"><div class=\"val\">${esc(String(COMPLIANCE_DATA.length))}</div><div class=\"lab\">Countries</div></div>
              <div class=\"metric\"><div class=\"val\">${esc(String([...new Set(COMPLIANCE_DATA.map((c) => c.region))].length))}</div><div class=\"lab\">Regions</div></div>
              <div class=\"metric\"><div class=\"val\">6</div><div class=\"lab\">Knowledge Sections</div></div>
            </div>
          </div>

          <div class=\"toc-title\">
            <div>
              <div class=\"kicker\">Table of contents</div>
              <div class=\"muted\" style=\"font-size:11px; margin-top:4px\">Click a country to jump (works in PDF viewers that support internal links).</div>
            </div>
            <div class=\"muted\" style=\"font-size:11px\">A4 • Print-ready</div>
          </div>
          <div class=\"toc-grid\">${toc}</div>
        </div>
        <div class=\"footer\"><span>SwayamSutra — Global Compliance Guidebook</span><span class=\"muted\">Cover</span></div>
      </section>

      ${COMPLIANCE_DATA.map((_c, idx) => buildCountrySection(idx)).join("")}

      <script>
        window.addEventListener('load', () => {
          setTimeout(() => { window.focus(); window.print(); }, 120);
        });
      </script>
    </body>
  </html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

