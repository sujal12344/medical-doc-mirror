# SwayamSutra — Implementation Plan vs Regulatory Flowchart

> Mapping the 11-phase India Medical Device Manufacturing License flowchart to what SwayamSutra has built, what's partial, and what's missing.

---

## Status Legend

| Icon | Meaning |
|------|---------|
| ✅ | **Implemented** — Feature is built and functional |
| 🟡 | **Partial** — Foundation exists but incomplete |
| ❌ | **Not Implemented** — No code exists yet |
| 🔵 | **Out of Scope** — Physical/legal process, not software |

---

## Phase-by-Phase Coverage

### Phase 0 · Business Genesis (Company Registration)

| Step | Flowchart | SwayamSutra Status | Details |
|------|-----------|-------------------|---------|
| 0.1–0.3 | TAM analysis, competitor scan, pathway analysis | 🔵 Out of Scope | Business strategy, not software |
| 0.4–0.7 | Legal entity incorporation | 🔵 Out of Scope | MCA/government process |
| 0.8 | Statutory registrations (GST, MSME, IEC) | ❌ Not Implemented | Could add a checklist tracker |
| 0.9 | IP & brand (trademark, patents) | ❌ Not Implemented | Could add a checklist tracker |
| **Platform equivalent** | Company registration on SwayamSutra | ✅ **Implemented** | `Company` model + `/api/auth/register` + `/register` page. Fields: companyName, companyEmail, companyPassword, companyNumber, description, country |

> [!NOTE]
> The platform's Company registration is the digital equivalent of "entity exists" (step 0.4). The physical incorporation steps (0.5–0.8) happen offline. SwayamSutra could add a **Business Setup Checklist** dashboard widget to track these prerequisites.

---

### Phase 1 · Device Classification (7–30 days)

| Step | Flowchart | SwayamSutra Status | Details |
|------|-----------|-------------------|---------|
| 1.1 | Device characterisation (generic name, intended use, invasive/non-invasive, sterile, etc.) | 🟡 **Partial** | `Product` model captures: `name`, `manufacturer`, `intendedUse`, `deviceType` (medical-device/ivd), `deviceClass` (A/B/C/D). **Missing**: contraindications, patient population, duration, reusable/single-use, active/non-active, invasive/non-invasive, sterile, software-enabled, IoT |
| 1.2 | IVD vs Medical Device? | ✅ **Implemented** | `Product.deviceType` enum: `"medical-device" \| "ivd"` |
| 1.3–1.4 | Risk-rule mapping (First Schedule rules) | ❌ Not Implemented | No classification wizard or rule engine. User manually selects class |
| 1.5 | Predicate device search | ❌ Not Implemented | No CDSCO Notified Devices list integration |
| 1.6–1.8 | Classification confirmation | 🟡 **Partial** | User manually picks `deviceClass` A/B/C/D on product creation form |
| 1.9 | Final class locked | ✅ **Implemented** | Stored in `Product.deviceClass` |

> [!IMPORTANT]
> **Key Gap**: There is no **Classification Wizard** that walks the user through the First Schedule rules and automatically determines the risk class. Currently the user must know their class and manually select it.

**What to build:**
- [ ] Classification Wizard UI (guided questionnaire based on First Schedule Part I rules 1–22 and Part II IVD rules)
- [ ] Expand `Product` schema with: `isInvasive`, `isSterile`, `isActive`, `duration`, `isReusable`, `hasSoftware`, `patientPopulation`, `contraindications`
- [ ] Predicate device search against CDSCO published device list

---

### Phase 2 · Infrastructure (90–180 days)

| Step | Flowchart | SwayamSutra Status | Details |
|------|-----------|-------------------|---------|
| 2.1–2.3 | Site selection, land, statutory clearances | 🔵 Out of Scope | Physical process |
| 2.4 | Premises layout per Fifth Schedule | ❌ Not Implemented | Could provide layout templates/checklists |
| 2.5 | Cleanroom design (if sterile) | 🔵 Out of Scope | Engineering process |
| 2.6–2.7 | Utility systems, equipment qualification | 🔵 Out of Scope | Physical process |

> [!TIP]
> **Opportunity**: Add an **Infrastructure Readiness Checklist** page that tracks completion of Phase 2 prerequisites (clearances, equipment list, utilities). This doesn't automate the physical work but helps companies track what's done vs pending.

**What to build:**
- [ ] Infrastructure checklist page with status tracking (CTE/CTO, Fire NOC, Factories Act, etc.)
- [ ] Equipment Master List template (downloadable or in-app)

---

### Phase 3 · People & QMS (60–120 days)

| Step | Flowchart | SwayamSutra Status | Details |
|------|-----------|-------------------|---------|
| 3.1 | Hire technical staff per Fifth Schedule | ❌ Not Implemented | Could add staff registry with qualification tracking |
| 3.2 | Training program | ❌ Not Implemented | Could add training records module |
| 3.3 | ISO 13485:2016 QMS implementation | 🟡 **Partial** | Compliance Guide page has awareness content. No SOP management system |
| 3.3c | Risk Management per ISO 14971 | ❌ Not Implemented | No FMEA/risk management module |
| 3.4 | Pre-certification readiness | ❌ Not Implemented | No audit readiness tracker |
| 3.5–3.6 | ISO 13485 certification | 🔵 Out of Scope | External CB audit |

**What to build:**
- [ ] Staff Registry: name, qualification, role, appointment date, training records
- [ ] QMS Document Hierarchy tracker (Quality Manual → SOPs → Forms → Records)
- [ ] Training Matrix: courses × staff with completion dates
- [ ] ISO 13485 Gap Assessment checklist (clause-by-clause)

---

### Phase 4 · Design, V&V, Testing (120–365 days)

| Step | Flowchart | SwayamSutra Status | Details |
|------|-----------|-------------------|---------|
| 4.1 | Design & Development per ISO 13485 §7.3 | ❌ Not Implemented | No Design History File (DHF) module |
| 4.2–4.3 | Test License (Form MD-12/MD-13) via NSWS | ❌ Not Implemented | Could add application tracker |
| 4.4 | Verification & Validation sub-processes | ❌ Not Implemented | No V&V tracking (process validation, sterilization, biocompat, electrical, software, performance) |
| 4.5–4.6 | Test reports (NABL lab / govt lab / in-house) | ❌ Not Implemented | Could track test report status |
| 4.7 | Stability program | ❌ Not Implemented | No stability study tracker |
| 4.8 | Clinical data (Form MD-22/MD-23) | ❌ Not Implemented | No clinical investigation tracker |

**What to build:**
- [ ] Design Controls module: Design Plan → Inputs → Outputs → Reviews → V&V → Transfer
- [ ] Test License tracker (MD-12 application → MD-13 grant)
- [ ] V&V Checklist per device (which tests apply based on device characteristics)
- [ ] Test Report repository with pass/fail status
- [ ] Stability Study tracker (timepoints, results)

---

### Phase 5 · Documentation Dossier (30–60 days) ⭐ CORE PLATFORM

| Step | Flowchart | SwayamSutra Status | Details |
|------|-----------|-------------------|---------|
| 5.1 | Compile Application Dossier per Fourth Schedule | ✅ **Implemented** | This is the **heart of SwayamSutra** — the RAG upload pipeline |
| 5.2 | Plant Master File (PMF) | 🟡 **Partial** | Not a dedicated PMF generator, but document framework sections cover some PMF fields. Could be a dedicated template |
| 5.3 | Device Master File (DMF) | ✅ **Implemented** | `DmfRecord` model + `/api/dmf-records` CRUD + DMF Assistant page. The upload pipeline extracts device data (name, class, use, materials, shelf life, etc.) and populates DMF-like templates |
| 5.3a–5.3n | DMF sub-sections (executive summary, device description, intended use, risk class, clinical evidence, labels, etc.) | 🟡 **Partial** | The upload pipeline extracts many of these fields (product name, model number, class, intended use, material, shelf life, size, temperature). **Missing**: sterilization details, global regulatory status, essential principles checklist, AER history, price declaration |
| 5.4 | Supporting Documents | 🟡 **Partial** | Document upload exists (`uploadedDocs` on Product). **Missing**: structured tracking of COI/MoA, lease, ISO cert, test reports, staff bio-data, NOCs, etc. |
| 5.5 | Internal QA review + legal review | ❌ Not Implemented | No review/approval workflow |

**What's implemented in detail:**

```
✅ /api/upload/route.ts (951 lines) — The RAG Pipeline:
   Phase 1: PDF → text → chunks → OpenAI embeddings → Pinecone upsert
   Phase 2: Pinecone query → GPT-4o-mini extraction → product + company JSON
   Phase 3: placeholders.json mapping → docxtemplater → ZIP download

✅ 7 DOCX templates in format/:
   - Covering Letter
   - Declaration Letter
   - Fee Challan Declaration
   - Medical Device Description
   - Quantity Justification
   - Test Protocol
   - Undertaking

✅ placeholders.json — maps each template to its {tags}

✅ /dashboard/upload — Professional dropzone UI with terminal-style progress log

✅ DmfRecord model + CRUD — standalone DMF records

✅ RegulatoryDocument model — section-based document management with version history

✅ Document editor with AI chatbot — ask questions about uploaded PDFs
```

**What to build to complete Phase 5:**
- [ ] PMF template generator (structured sections matching flowchart 5.2a–5.2m)
- [ ] Essential Principles Checklist (~200 line items) — interactive checklist
- [ ] Document review/approval workflow (draft → QA review → legal review → approved)
- [ ] Supporting Documents checklist tracker (COI, ISO cert, test reports, etc.)
- [ ] Auto-save generated DOCX to Document Vault (currently only streams ZIP to user)

---

### Phase 6 · Application Submission (7–15 days)

| Step | Flowchart | SwayamSutra Status | Details |
|------|-----------|-------------------|---------|
| 6.1 | CDSCO MD Online portal registration | 🔵 Out of Scope | External government portal |
| 6.2 | Treasury Challan via Bharatkosh | 🔵 Out of Scope | Payment portal |
| 6.3 | Fee calculation by risk class | 🟡 **Partial** | Compliance Guide page has fee structures per country. No interactive calculator |
| 6.4–6.5 | Form selection (MD-3/4/7/8) by class + license type | 🟡 **Partial** | Compliance Guide shows required forms. No auto-selection logic |
| 6.6 | Document upload to portal | ❌ Not Implemented | No CDSCO portal integration (likely out of scope) |
| 6.7 | DSC sign + submit | 🔵 Out of Scope | Government portal process |

**What to build:**
- [ ] Fee Calculator: input device class + count → auto-calculate fees
- [ ] Form Selector: based on class (A/B vs C/D) + license type (regular vs loan) → show which MD form to file
- [ ] Submission Readiness Checklist: verify all Phase 5 documents are complete before filing
- [ ] ARN Tracker: log Application Reference Number after filing externally

---

### Phase 7 · Scrutiny (45–90 days)

| Step | Flowchart | SwayamSutra Status | Details |
|------|-----------|-------------------|---------|
| 7.1–7.4 | Application review by SLA/CLA | 🔵 Out of Scope | Government internal process |
| 7.5 | Query response management | ❌ Not Implemented | No query tracking/response system |
| 7.6 | Scrutiny cleared | ❌ Not Implemented | No status tracking |

**What to build:**
- [ ] Query Tracker: log queries received from SLA/CLA, track response deadlines (45 days), attach response documents
- [ ] Application Status tracker: submitted → under scrutiny → queries → cleared → inspection

---

### Phase 8 · Audit/Inspection

| Step | Flowchart | SwayamSutra Status | Details |
|------|-----------|-------------------|---------|
| 8A | Class A: post-grant NB audit | ❌ Not Implemented | No audit tracker |
| 8B | Class B: NB Stage 1 + Stage 2 audit | ❌ Not Implemented | No NB engagement tracker |
| 8C/D | Class C/D: government inspection | ❌ Not Implemented | No inspection tracker |
| All | CAPA management for findings | ❌ Not Implemented | No CAPA module |

**What to build:**
- [ ] Audit/Inspection Tracker: schedule, NB details, stage 1/2 dates, findings
- [ ] CAPA Module: log non-conformities, root cause analysis, corrective actions, evidence, closure
- [ ] NC Classification: critical / major / minor with auto-escalation rules

---

### Phase 9–10 · License Grant

| Step | Flowchart | SwayamSutra Status | Details |
|------|-----------|-------------------|---------|
| 10.0–10.2 | License form issued (MD-5/6/9/10) | ❌ Not Implemented | No license registry |

**What to build:**
- [ ] License Registry: store license number, form type, grant date, devices listed, conditions
- [ ] License document storage (PDF upload of actual license)
- [ ] Retention fee reminder (5-year cycle auto-alerts)

---

### Phase 11 · Post-License (Ongoing)

| Step | Flowchart | SwayamSutra Status | Details |
|------|-----------|-------------------|---------|
| 11.1 | Commercial manufacture begins | 🔵 Out of Scope | Physical manufacturing |
| 11.2 | Labelling per Seventh Schedule | ❌ Not Implemented | Could add label template generator |
| 11.3 | Continuous compliance (audits, CAPA, training) | ❌ Not Implemented | No ongoing compliance module |
| 11.4 | Surveillance audits | ❌ Not Implemented | No audit calendar |
| 11.5a | PSUR (Periodic Safety Update Reports) | ❌ Not Implemented | No PSUR generation |
| 11.5b | Materiovigilance / AER (Adverse Event Reporting) | ❌ Not Implemented | No AER module |
| 11.5c | FSCA (Field Safety Corrective Action) | ❌ Not Implemented | No recall management |
| 11.5d | Customer complaints | ❌ Not Implemented | No complaint system |
| 11.6 | License amendments | ❌ Not Implemented | No amendment tracker |
| 11.7 | Retention fee tracking | ❌ Not Implemented | No fee reminder system |
| **Platform equivalent** | Document Vault + Version History | ✅ **Implemented** | `RegulatoryDocument` with sections, status workflow (draft/in-review/approved/submitted), `DocumentVersion` for immutable snapshots |

---

## Summary Scorecard

| Phase | Name | Coverage | Status |
|-------|------|----------|--------|
| 0 | Business Genesis | 🟡 20% | Company registration only |
| 1 | Device Classification | 🟡 30% | Manual class selection, no wizard |
| 2 | Infrastructure | ❌ 0% | Out of scope (physical) |
| 3 | People & QMS | 🟡 10% | Compliance guide content only |
| 4 | Design, V&V, Testing | ❌ 0% | No design controls or V&V tracking |
| **5** | **Documentation Dossier** | **✅ 70%** | **Core feature — RAG pipeline, templates, DMF** |
| 6 | Application Submission | 🟡 15% | Compliance guide shows forms/fees |
| 7 | Scrutiny | ❌ 0% | No query management |
| 8 | Audit/Inspection | ❌ 0% | No audit/CAPA modules |
| 9–10 | License Grant | ❌ 0% | No license registry |
| 11 | Post-License | 🟡 15% | Document vault + versioning |

---

## What IS Fully Working Today

```
1. Authentication & Identity
   ✅ Company registration + login via NextAuth (JWT)
   ✅ Session management across all pages
   ✅ Protected dashboard routes

2. Product Management
   ✅ Create/edit/archive products with device class + type
   ✅ Upload PDFs to products (text extraction)
   ✅ Product detail pages

3. AI Document Generation Pipeline (Phase 5 core)
   ✅ Upload multiple PDFs via professional dropzone UI
   ✅ pdf-parse text extraction
   ✅ Text chunking (1500 chars, 200 overlap)
   ✅ OpenAI embedding generation
   ✅ Pinecone vector upsert (namespaced by company)
   ✅ 4 targeted RAG queries (products, specs, intended use, instrument specs)
   ✅ GPT-4o-mini product extraction (up to 5 products)
   ✅ GPT-4o-mini company extraction
   ✅ Regex fallbacks for email + phone
   ✅ Product registry deduplication
   ✅ 7 DOCX templates auto-filled via docxtemplater
   ✅ ZIP packaging + download

4. Document Management
   ✅ RegulatoryDocument CRUD with section-based editing
   ✅ Version history (immutable snapshots)
   ✅ Document Vault (all docs table with status badges)
   ✅ AI autofill for document sections
   ✅ AI chatbot per document (queries Pinecone context)

5. Compliance Knowledge Base
   ✅ Multi-country compliance data (authority, classification, laws, forms, fees, timelines)
   ✅ Multi-region regulatory framework definitions
   ✅ Compliance Guide page with country browser

6. DMF Records
   ✅ DmfRecord CRUD (product name, manufacturer, intended use, risk class, shelf life)
   ✅ DMF Assistant page

7. UI/UX
   ✅ Dashboard with stats + recent activity
   ✅ Sidebar navigation with all sections
   ✅ Landing page with 3D globe visualization
   ✅ Responsive Tailwind styling throughout
```

---

## Recommended Build Priority (Next Phases)

### Priority 1 — Complete Phase 5 (Documentation)
These extend your strongest feature:
1. **Auto-save to Vault**: Save generated DOCX files to Document Vault automatically
2. **Document Review Workflow**: draft → QA review → approved → submitted status transitions with notifications
3. **Essential Principles Checklist**: Interactive 200-item checklist per device
4. **PMF Template Generator**: Structured Plant Master File sections

### Priority 2 — Phase 1 Enhancement (Classification)
High user value, moderate effort:
5. **Classification Wizard**: Guided questionnaire → auto-determine risk class
6. **Expand Product Schema**: Add missing device characterisation fields
7. **Predicate Device Search**: Search against known device lists

### Priority 3 — Phase 6 & 7 (Submission + Scrutiny)
Completes the pre-license workflow:
8. **Fee Calculator**: Auto-calculate based on class + device count
9. **Form Selector**: Which MD form to file based on class + license type
10. **Submission Readiness Check**: Verify all docs complete
11. **Query Tracker**: Log and respond to SLA/CLA queries

### Priority 4 — Phase 8 & 11 (Audit + Post-Market)
Post-license operational tools:
12. **CAPA Module**: Non-conformity → root cause → corrective action → closure
13. **Audit Tracker**: Schedule, findings, NB details
14. **License Registry**: Store license details + retention fee reminders
15. **AER / Complaint System**: Adverse event reporting + complaint logging

### Priority 5 — Phase 3 (QMS Infrastructure)
Enterprise features:
16. **Staff Registry + Training Matrix**
17. **SOP Management System**
18. **Internal Audit Scheduler**

---

## Security Reminder

> [!CAUTION]
> Passwords are currently stored in **plain text** for testing convenience. Before any production deployment:
> 1. Re-enable `bcryptjs` hashing in `/api/auth/register/route.ts`
> 2. Re-enable bcrypt comparison in `/api/auth/[...nextauth]/route.ts`
> 3. Ensure `NEXTAUTH_SECRET` is a strong, unique value
