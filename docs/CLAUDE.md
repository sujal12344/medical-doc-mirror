# SwayamSutra — Project context for Claude

> **Attach or `@CLAUDE.md` at the start of a session.** This file reflects the **current** repo layout (Next.js App Router, May 2026). Update it when you add routes, models, or rename folders. **Recent work:** see [§15 Recent development](#15-recent-development-may-2026).

---

## 1. Product summary

**SwayamSutra** (`nextjs-mongo-professional`) is a medical **device / IVD regulatory documentation** platform focused on **India MDR 2017 / CDSCO** and **40+ country frameworks**.

| Actor | Implementation |
|--------|----------------|
| Logged-in user | `Company` document (not a separate `User` model) |
| Auth | NextAuth v4 credentials → JWT → `getSession()` loads `Company` |
| Core entities | `Product`, `RegulatoryDocument` |
| AI | OpenAI + Pinecone RAG (autofill, classify); Playwright CDSCO predicate scrape |
| Export | docxtemplater, ZIP pipeline via `/api/upload` |

---

## 2. Tech stack

| Layer | Choice |
|--------|--------|
| Framework | Next.js **16**, React **19**, App Router only (no `pages/`) |
| Language | TypeScript |
| DB | MongoDB + Mongoose **9** |
| Auth | `next-auth` **4.24** — route **must** be `src/app/api/auth/[...nextauth]/route.ts` |
| Styling | Tailwind CSS **4** |
| Path alias | `@/*` → `src/*` (`tsconfig.json`) |

**Key dependencies:** `@pinecone-database/pinecone`, `openai`, `playwright`, `@google-cloud/storage`, `docxtemplater`, `pdf-parse`, `pdfjs-dist`, `@napi-rs/canvas`, `three-globe`.

**Next.js server externals** (`next.config.ts`): `pdfjs-dist`, `@napi-rs/canvas`, `pdf-parse`.

---

## 3. Repository tree (current)

```
nextjs-mongo-professional/
├── CLAUDE.md                    ← This file
├── .env                         ← Secrets (do not commit)
├── package.json
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── postcss.config.mjs
├── placeholders.json              ← DOCX merge-field names for export
├── MDR_2017_Interactive_Flowchart.html  ← MDR Phase 0–2 reference (not mounted in app)
├── public/
│   ├── dmf_template_exact.html
│   ├── dmf_chatbot.html           ← Legacy UI; POST /api/chat
│   ├── file.svg, vercel.svg, window.svg
├── format/                        ← Empty / reserved
└── src/
    ├── app/                       ← Pages + API routes
    ├── components/                ← Shared UI
    ├── lib/                       ← Logic, frameworks, mappers
    ├── models/                    ← Mongoose schemas
    ├── scripts/                   ← seedKnowledge.ts
    └── guidelines/                ← Empty / reserved
```

**~117 source files** under `src/` (excluding `node_modules`, `.next`).

---

## 4. `src/app/` — pages (UI routes)

### Public

| URL | File |
|-----|------|
| `/` | `app/page.tsx` — landing (framework metrics, pricing, globe) |
| `/login` | `app/login/page.tsx` |
| `/register` | `app/register/page.tsx` |

**Root layout:** `app/layout.tsx` + `app/globals.css` + `components/Providers.tsx` (SessionProvider).

### Dashboard (`app/dashboard/layout.tsx` — requires session)

| URL | File | Notes |
|-----|------|--------|
| `/dashboard` | `dashboard/page.tsx` | Home; Phase 0/1 widgets; recent products/docs |
| `/dashboard/business-genesis` | `business-genesis/page.tsx` | Phase 0 company setup |
| | `business-genesis/BusinessGenesisForm.tsx` | Form UI |
| | `business-genesis/Phase0MiniFlowchart.tsx` | Sidebar flowchart |
| `/dashboard/products` | `products/page.tsx` | Product list |
| `/dashboard/products/new` | `products/new/page.tsx` | **Phase 1** registration; Knowledge Base RAG; India-only markets; `?fresh=1` for new session |
| | `products/new/DeviceCharacterisation.tsx` | Part I (medical device) |
| | `products/new/IVDCharacterisation.tsx` | Part II (IVD) |
| | `products/new/PredicatePathway.tsx` | Step 1.5 — CDSCO predicate (Import/Manufacturer toggle, top 5 suggestions) |
| | `products/new/ClassificationLock.tsx` | Steps 1.6 / 1.7 / 1.8 — listed/ambiguous, CLA, lock |
| | `products/new/Phase1MiniFlowchart.tsx` | Sidebar flowchart |
| `/dashboard/products/[id]` | `products/[id]/page.tsx` | Product hub; **frameworks filtered by `deviceType`**; doc list |
| | `products/[id]/CreateDocButton.tsx` | Creates `RegulatoryDocument` |
| `/dashboard/documents/[id]` | `documents/[id]/page.tsx` | Section editor + AI chat |
| `/dashboard/compliance` | `compliance/page.tsx` | Country guide + `/api/chat` |
| `/dashboard/upload` | `upload/page.tsx` | Bulk PDF → DOCX ZIP pipeline UI |
| `/dashboard/settings` | `settings/page.tsx` | Account settings |

### Routes that do **not** exist (avoid assuming)

| URL | Status |
|-----|--------|
| `/dashboard/vault` | **404** — Sidebar still links here; use `/dashboard/documents/[id]` or product doc list |
| `/dashboard/classification` | **404** — no `classification/page.tsx` (only orphan `ClassificationWizard.tsx`) |
| `/dashboard/products/[id]/md14` | **Removed** — links commented out in `products/[id]/page.tsx` |
| `/dashboard/products/[id]/md16` | **Removed** |
| `/dashboard/products/[id]/dossier` | **Removed** (API `dossier` may still exist) |
| `/dashboard/products/[id]/classify` | **No page** |

---

## 5. `src/app/api/` — API routes (current)

### Auth & company

| Methods | Path | File |
|---------|------|------|
| GET, POST | `/api/auth/[...nextauth]` | `auth/[...nextauth]/route.ts` — exports `authOptions` |
| POST | `/api/auth/register` | `auth/register/route.ts` |
| GET, PUT | `/api/companies/me` | `companies/me/route.ts` |
| PUT | `/api/companies/me/setup` | `companies/me/setup/route.ts` — `businessGenesis`, legacy `deviceClassification` |

### Products

| Methods | Path | File | Purpose |
|---------|------|------|---------|
| GET, POST | `/api/products` | `products/route.ts` | List / create (`flatToNestedProduct`) |
| GET, PUT, DELETE | `/api/products/[id]` | `products/[id]/route.ts` | CRUD; PUT uses `buildProductWritePayload` |
| POST | `/api/products/autofill` | `products/autofill/route.ts` | RAG → `product_{userId}_{productNamespaceId}`; returns `descriptionSuggestions[]` |
| POST | `/api/products/predicate` | `products/predicate/route.ts` | Playwright CDSCO scrape; body `{ intendedUse, cdscoListType?: "import" \| "manufacturer" }`; returns up to 5 `matches[]` |
| POST | `/api/products/[id]/upload` | `products/[id]/upload/route.ts` | Append `uploadedDocs` (multipart **or** JSON text) |
| GET, POST | `/api/products/[id]/classify` | `products/[id]/classify/route.ts` | AI class → `classLock.ai` |
| POST | `/api/products/[id]/classify/confirm` | `products/[id]/classify/confirm/route.ts` | Lock AI classification |
| GET, PUT | `/api/products/[id]/dossier` | `products/[id]/dossier/route.ts` | Dossier fields (no dashboard page currently) |

### Regulatory documents

| Methods | Path | File |
|---------|------|------|
| GET, POST | `/api/documents` | `documents/route.ts` |
| GET, PUT, DELETE | `/api/documents/[id]` | `documents/[id]/route.ts` |
| PUT | `/api/documents/[id]/sections` | `documents/[id]/sections/route.ts` |
| POST | `/api/documents/[id]/autofill` | `documents/[id]/autofill/route.ts` — seeds from `Product.intendedUse` + `predDevice` via `dmfProductPrefill.ts`; then GPT from `uploadedDocs` (either alone is enough) |
| POST | `/api/documents/[id]/chat-upload` | `documents/[id]/chat-upload/route.ts` |

### AI, files, utilities

| Methods | Path | File | Used by |
|---------|------|------|---------|
| POST | `/api/chat` | `chat/route.ts` | `documents/[id]`, `compliance`, `public/dmf_chatbot.html` |
| POST | `/api/assistant` | `assistant/route.ts` | **No UI caller** |
| POST | `/api/extract-text` | `extract-text/route.ts` | Product registration autofill |
| POST | `/api/upload` | `upload/route.ts` | Large pipeline (~950 lines): chunk, embed, DOCX, ZIP |
| POST | `/api/upload-url` | `upload-url/route.ts` | GCS signed URLs |
| GET | `/api/download` | `download/route.ts` | Downloads |
| POST | `/api/print-template` | `print-template/route.ts` | HTML print |
| GET | `/api/compliance-book` | `compliance-book/route.ts` | Compliance export |
| GET | `/api/countries` | `countries/route.ts` | Country metadata |
| GET | `/api/legacy-chatbot` | `legacy-chatbot/route.ts` | Legacy DMF HTML |

---

## 6. `src/models/` — MongoDB shape

### `Company.ts`
- `companyName`, `companyEmail`, `companyPassword` (plaintext in current code)
- `businessGenesis` — Phase 0 nested sections (secA–secE): secB `incorporationDate`; secC `bankName`, `accountNumber`; secD `trademarkDocUrl`, `designFiled`
- Legacy optional `deviceClassification` — still read by dashboard widget & some forms

### `Product.ts`

**Top-level (identity & markets):**
`userId`, `name`, `manufacturer`, `description`, `intendedUse`, `patientPopulation`, `deviceClass` (A|B|C|D), `deviceType` (`medical-device` | `ivd`), `countries[]`, `status`, `isSterile`, `hasSoftware`, `vectorNamespaceId`, `uploadedDocs[]`, timestamps.

`vectorNamespaceId` — UUID (or product `_id` fallback) for Pinecone namespace `product_{userId}_{vectorNamespaceId}`.

**Nested sections (do not flatten at root):**

| Key | Stored when | Content |
|-----|-------------|---------|
| `medDevice` | `deviceType === "medical-device"` only | Part I: `isInvasive`, `invasionType`, `contactDuration`, risk flags, … |
| `IVDdevice` | `deviceType === "ivd"` only | Part II: `ivdSelfTest`, `ivdTargetsHIV`, … |
| `predDevice` | Always | Predicate / novel pathway: `predicateExists`, `md26Status`, … |
| `classLock` | Always | Human lock + branch state: `classificationConfirmed`, `cdscoListStatus`, `claClarificationStatus`, `classificationLocked`, … + `classLock.ai` for RAG |

**Rules:**
- Never persist **both** `medDevice` and `IVDdevice` on one product.
- IVD products: `invasionType` / `contactDuration` are N/A (Part I only).
- Use `src/lib/productMapper.ts` for create/update (`flatToNestedProduct`, `buildProductWritePayload`, `applyDeviceTypeSections`).

### `Document.ts` (`RegulatoryDocument`)
- `productId`, `userId`, `countryCode`, `frameworkId`, `title`, `status`
- `sections`: Map of `{ fields, completionPct }`

---

## 7. `src/lib/` — shared logic

| Path | Role |
|------|------|
| `mongodb.ts` | Cached Mongoose connection |
| `env.ts` | `MONGODB_URI`, optional `OPENAI_API_KEY` |
| `auth.ts` | `getSession()`, `requireAuth()` |
| `documentExtract.ts` | PDF text extraction + OCR fallback (pdf-parse → pdfjs render → OpenAI Vision) |
| `productMapper.ts` | Flat form ↔ nested Product; `$unset` wrong device section |
| `dmfProductPrefill.ts` | Phase 1 → DMF field seeds (`intendedUse`, `predDevice`, name, class) for `IN_DMF` / `IN_DMF_MD` |
| `businessGenesis.ts` | Phase 0 completion; **India-only** secE helpers (`enforceIndiaOnlySecE`) |
| `classification/hybridQuery.ts` | Pinecone `product_{companyId}_{vectorNamespaceId}` + MDR rules + GPT |
| `compliance-knowledge/` | Static country data (`data.ts`, `types.ts`, `index.ts`) |
| `frameworks/` | Per-country regulatory field definitions |
| `frameworks/index.ts` | `FRAMEWORKS`, `REGION_GROUPS`, `filterFrameworksByDeviceType()` |
| `frameworks/types.ts` | `RegulatoryFramework` (+ optional `deviceType`: `ivd` \| `medical-device`) |

### `frameworks/` regions (35 country modules)

```
africa/          kenya, nigeria, south-africa
americas/        us, canada, brazil, mexico, argentina, colombia, chile
asia/            india, china, japan, south-korea, taiwan
europe/          eu, uk, switzerland, turkey, russia
middle-east/     saudi-arabia, uae, israel, egypt
oceania/         australia, new-zealand
south-asia/      pakistan, bangladesh
southeast-asia/  singapore, thailand, indonesia, malaysia, philippines, vietnam, asean-csdt
```

---

## 8. `src/components/`

| File / folder | Role |
|---------------|------|
| `Providers.tsx` | NextAuth `SessionProvider` |
| `Sidebar.tsx` | Dashboard nav (note: `/dashboard/vault` broken link) |
| `ProductDetailsButton.tsx` | Client button on product detail |
| `ProductDetailsModal.tsx` | Modal: full product + nested `medDevice` / `IVDdevice` / `predDevice` / `classLock` |
| `landing/*` | Marketing: Hero, Globe, CountryExplorer, Pricing, FAQ, SpotlightBorder, CSS |
| `phase0/BusinessSetupWidget.tsx` | Dashboard Phase 0 card |
| `phase1/ClassificationWidget.tsx` | Dashboard Phase 1 card → `/dashboard/products/new?fresh=1` |

**Co-located UI** (under `app/dashboard/...`): forms, flowcharts, `CreateDocButton`, document editor, etc.

**Orphan:** `dashboard/classification/ClassificationWizard.tsx` — company-level wizard; **not mounted** on any page; saves via `/api/companies/me/setup`.

---

## 9. End-to-end workflows

```
┌─────────────────────────────────────────────────────────────────┐
│ Phase 0: /dashboard/business-genesis                            │
│   → Company.businessGenesis (API: companies/me/setup)         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Phase 1: /dashboard/products/new?fresh=1                        │
│   1. Knowledge Base (optional): upload IFU → extract-text        │
│      (pdf-parse; Vision OCR fallback for sparse/image PDFs)     │
│      POST /api/products/autofill → Pinecone                     │
│      product_{userId}_{productNamespaceId}                      │
│   2. Product form: medDevice OR IVDdevice (by deviceType)       │
│      Description: pick from AI descriptionSuggestions (≥4)      │
│   3. Step 1.5 PredicatePathway: CDSCO Import or Manufacturer    │
│      → POST /api/products/predicate (top 5 ranked matches)      │
│   4. ClassificationLock: 1.6 listed/ambiguous →                 │
│      1.7 CLA clarification (if ambiguous) → 1.8 lock            │
│   5. Target markets: India only (locked); countries = ["IN"]    │
│   6. POST /api/products (vectorNamespaceId); clear draft/NS     │
│   7. Optional: POST /api/products/[id]/upload                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Phase 2: /dashboard/products/[id]                               │
│   Framework cards filtered by product.deviceType (IVD vs MD)  │
│   India IVD → IN_DMF only; MD → IN_DMF_MD only                │
│   CreateDocButton → RegulatoryDocument                          │
│   /dashboard/documents/[id] → edit sections, chat, autofill     │
│   /dashboard/upload → bulk DOCX ZIP (separate pipeline)         │
└─────────────────────────────────────────────────────────────────┘
```

### `uploadedDocs` on Product

| Step | What happens |
|------|----------------|
| Autofill on **new** product | Text stored in client `pendingSourceDoc` → sent as `uploadedDocs` on **POST /api/products** |
| After product exists | **POST /api/products/[id]/upload** with JSON `{ originalName, extractedText }` or multipart files |
| Document autofill | **POST /api/documents/[id]/autofill** — **(1)** deterministic prefill from `intendedUse`, `predDevice`, identity fields; **(2)** GPT from `uploadedDocs` / chat upload (skips fields already filled) |

Product registration autofill (`/api/products/autofill`) does **not** write `uploadedDocs` (vectors only in Pinecone).

### India DMF frameworks (`lib/frameworks/asia/india.ts`)

| Framework | `deviceType` | Notable sections |
|-----------|--------------|------------------|
| `IN_DMF` | `ivd` | §1–22 + **s10** regulatory certificates; **2.0** intended use; **2.1s** prior generations; **2.4** predicate (from `predDevice`) |
| `IN_DMF_MD` | `medical-device` | §1–10; **2.13** predicate; **2.14** prior generations; **2.2** intended use |

**DMF prefill map** (`getProductDmfPrefill`):

| Product field | IVD (`IN_DMF`) | MD (`IN_DMF_MD`) |
|---------------|----------------|------------------|
| `name` | `s1` / `1.1a` | `s1` / `1.1a` |
| `description` | `s1` / `1.1b` | `s1` / `1.1b` |
| `deviceClass` | `s1` / `1.1e` | `s1` / `1.1e` |
| `intendedUse` | `s2` / `2.0`, `2.1c` | `s2` / `2.2` |
| `patientPopulation` | `s2` / `2.1g` | — |
| `predDevice.*` | `s2` / `2.4`, `s1` / `1.2` pathway note | `s2` / `2.13`, `s1` / `1.2` |

### Pinecone namespaces (registration RAG)

| Namespace | Written by | Read by |
|-----------|------------|---------|
| `product_{userId}_{productNamespaceId}` | `POST /api/products/autofill` | `hybridQuery.ts`, autofill retrieval |
| `productNamespaceId` | Client UUID on `/products/new`; persisted as `Product.vectorNamespaceId` (fallback: `product._id`) | — |
| ~~`product_{userId}`~~ | **Legacy** single-user namespace | Re-index if migrating old vectors |
| ~~`predicate_{userId}`~~ | **Removed** | — |
| ~~`company_{userId}`~~ | **Legacy** | — |

**New product session:** `/dashboard/products/new?fresh=1` clears `localStorage` keys `newproduct_draft` and `newproduct_namespace_id`; successful POST also clears them so each registration gets a new namespace UUID.

**Predicate lookup** does not use Pinecone; Playwright scrapes [CDSCO ListOfApprovedDevices](https://cdscomdonline.gov.in/NewMedDev/ListOfApprovedDevices) — **Manufacturer** or **Import** tab (`#impPre` / `loadAppsImport`) — then OpenAI ranks up to 5 matches (all scraped devices when ≤5 unique rows).

### Framework selection (Phase 2)

| Product `deviceType` | India frameworks shown |
|---------------------|-------------------------|
| `ivd` | `IN_DMF` (Device Master File IVD) |
| `medical-device` | `IN_DMF_MD` (Device Master File Medical Device) |

EU: `EU_IVDR` vs `EU_MDR`. China: `CN_NMPA_IVD` vs `CN_NMPA_II`/`III`. Untagged country frameworks default to **medical-device** only. Use `filterFrameworksByDeviceType()` in `frameworks/index.ts`.

**Not in repo yet:** PMF (Plant Master File) — referenced in `MDR_2017_Interactive_Flowchart.html` but no `IN_PMF` framework module.

---

## 10. Classification (avoid confusion)

| Mechanism | Where | Data location |
|-----------|--------|----------------|
| **Primary (current)** | `products/new` + `ClassificationLock` | `Product.classLock`, `deviceClass`, `predDevice` |
| **Dashboard widget** | `ClassificationWidget` | Reads **`Company.deviceClassification`** (legacy) |
| **Optional AI** | `/api/products/[id]/classify` | `Product.classLock.ai` |
| **Orphan wizard** | `ClassificationWizard.tsx` | Would save to **Company** — unused in UI |

For new features, prefer **product-level** `classLock`, not company `deviceClassification`.

---

## 11. Environment variables (names only)

```
MONGODB_URI
NEXTAUTH_SECRET
NEXTAUTH_URL
OPENAI_API_KEY
PINECONE_KEY
PINECONE_INDEX          # product autofill (`product_{userId}_{productNamespaceId}`)
PINECONE_INDEX2         # hybrid classification (same namespace pattern + MDR rules index)
OPENAI_MODEL            # GPT for autofill, predicate ranking, classification
PINECONE_EMBED_MODEL
OPENAI_OCR_MODEL        # optional; defaults to OPENAI_MODEL
PDF_OCR_ENABLED         # optional flag for OCR fallback
OCR_MAX_PAGES           # optional OCR page cap
OCR_RENDER_SCALE        # optional OCR render scale
OCR_MAX_EDGE            # optional max OCR image dimension
OCR_MAX_IMAGE_BYTES     # optional safety cap per OCR image
PDF_MIN_TEXT_CHARS
PDF_MIN_CHARS_PER_PAGE
PDF_MIN_TEXT_MULTI_PAGE
PDF_MIN_CHARS_PER_PAGE_MULTI
# GCS vars used by upload-url / upload routes
```

---

## 12. Conventions for edits

1. Import via `@/` alias.
2. Product writes: always go through `productMapper.ts`.
3. `deviceType === "ivd"` → no `medDevice` in DB; do not require Part I fields in UI validation.
4. NextAuth folder: **`[...nextauth]`** exactly (lowercase).
5. Minimal diffs; match surrounding file style.
6. Do not commit `.env` or change git config.

---

## 13. Quick lookup — “where do I change X?”

| Task | Start here |
|------|------------|
| New product field | `models/Product.ts` → `lib/productMapper.ts` → `products/new/page.tsx` |
| Product detail UI | `dashboard/products/[id]/page.tsx`, `ProductDetailsModal.tsx` |
| Country framework fields | `lib/frameworks/<region>/<country>.ts`, `frameworks/index.ts` |
| Fix session / login | `api/auth/[...nextauth]/route.ts`, `lib/auth.ts` |
| Document editor chat | `dashboard/documents/[id]/page.tsx`, `api/chat/route.ts` |
| PDF autofill registration | Knowledge Base on `products/new/page.tsx`, `api/products/autofill/route.ts`, `lib/documentExtract.ts` |
| Description suggestions (autofill) | `autofill/route.ts` → `descriptionSuggestions[]`; UI on `products/new/page.tsx` |
| Auto-find predicate (CDSCO) | `PredicatePathway.tsx`, `api/products/predicate/route.ts` |
| Per-product Pinecone namespace | `products/new/page.tsx` (`vectorNamespaceId`), `autofill/route.ts`, `hybridQuery.ts` |
| IVD vs MD framework cards | `products/[id]/page.tsx`, `filterFrameworksByDeviceType()` |
| Phase 0 India-only markets | `businessGenesis.ts`, `BusinessGenesisForm.tsx` |
| New product fresh session | Link `?fresh=1` from products list, dashboard, ClassificationWidget |
| Persist IFU/PDF on product | `api/products/[id]/upload/route.ts` |
| DMF section autofill (Phase 1 seed) | `lib/dmfProductPrefill.ts`, `api/documents/[id]/autofill/route.ts`, `frameworks/asia/india.ts` |
| Nested product create/update | `lib/productMapper.ts`, `models/Product.ts` |
| DOCX bulk export | `api/upload/route.ts`, `dashboard/upload/page.tsx` |
| Sidebar broken “Documents” link | `components/Sidebar.tsx` — should point to products or doc list |

---

## 14. Known gaps / technical debt

- `/dashboard/vault` linked but missing.
- `ClassificationWizard.tsx` unused; no `/dashboard/classification` page.
- MD-14 / MD-16 / dossier **UI pages removed**; API dossier route remains.
- `/api/assistant` unused by frontend.
- `Company.companyPassword` stored/compared in plaintext.
- **`IN_PMF` (Plant Master File)** not implemented — flowchart lists PMF + DMF; only DMF frameworks exist.
- Multi-country product registration UI commented out (India-only Phase 1); framework data for 40+ countries remains.
- Re-index legacy vectors from `company_*` or bare `product_{userId}` if old uploads must be reused.
- Predicate scrape uses Playwright `headless: false` — may need headless/server config for production deploy.

---

## 15. Recent development (May 2026)

Summary of work through late May 2026 — use when continuing sessions.

### Product schema & mapper

- Nested sections: `medDevice`, `IVDdevice`, `predDevice`, `classLock`.
- **`vectorNamespaceId`** on `Product` for per-product Pinecone isolation.
- `productMapper.ts`: `flatToNestedProduct`, `buildProductWritePayload`, `applyDeviceTypeSections`.

### Phase 0 (`/dashboard/business-genesis`)

- Flowchart tab order **E→B→C→A→D**; `computePhase0Completion`, `isPhase0Complete`.
- **India-only** regulatory pathway and target markets (`enforceIndiaOnlySecE`, locked checkbox chips).
- Server→client plain JSON for `businessGenesis` (no ObjectId leak to client components).
- Signatories subdocs without `_id` in forms.

### Phase 1 (`/dashboard/products/new`)

- **Knowledge Base:** extract-text + autofill; OCR for sparse PDFs (`documentExtract.ts`, `next.config.ts` `serverExternalPackages`).
- **Description suggestions:** autofill returns `descriptionSuggestions[]` (≥4); selectable cards in UI.
- **Predicate:** CDSCO scrape with **Import / Manufacturer** toggle; **top 5** ranked suggestions; backfill when ≤5 unique rows scraped.
- **ClassificationLock:** 1.6 listed vs ambiguous → 1.7 CLA → 1.8 lock (`cdscoListStatus`, `claClarification*` fields).
- **Target markets:** India-only UI; `countries: ["IN"]`; multi-country picker commented for later.
- **Namespace session:** fresh UUID per registration; `?fresh=1` on new-product links; clear `localStorage` on successful create.

### Phase 2 (`/dashboard/products/[id]`)

- **`filterFrameworksByDeviceType()`** — IVD products see IVD dossiers only (e.g. `IN_DMF`, not `IN_DMF_MD`).
- Frameworks may set explicit `deviceType`; inference from id/documentType for EU/China/India.

### RAG / Pinecone

- Namespace pattern: **`product_{userId}_{productNamespaceId}`** (Option B).
- Autofill accepts/returns `productNamespaceId`; classification uses `vectorNamespaceId || productId`.
- Removed predicate/company namespace RAG paths.

### India DMF field audit & document autofill (late May 2026)

- **`india.ts`:** IVD **2.0** intended use, **2.1s** prior generations, **s10** certificates (parity with MD); MD **2.13** predicate, **2.14** prior generations; clarified §2.3 I/II/III labels; fixed **6.5** typo.
- **`dmfProductPrefill.ts`:** Reads `Product.intendedUse` and nested `predDevice` (`predicateName`, `predicateManufacturer`, `predicateRegNo`, `predicateClass`, `predicateBasis`, `predicateExists`) from MongoDB before GPT autofill.
- **`documents/[id]/autofill`:** Applies product seed first; allows autofill with Phase 1 data only (no IFU upload); merges GPT extractions without overwriting seeded or user-edited fields.

### APIs (recent)

| Area | File |
|------|------|
| Autofill + description suggestions | `api/products/autofill/route.ts` |
| CDSCO predicate (Import/Mfg, top 5) | `api/products/predicate/route.ts` |
| Extract-text + OCR | `api/extract-text/route.ts` |
| Product create + vectorNamespaceId | `api/products/route.ts` |
| Classification RAG namespace | `lib/classification/hybridQuery.ts`, `api/products/[id]/classify/route.ts` |
| DMF document autofill + product seed | `lib/dmfProductPrefill.ts`, `api/documents/[id]/autofill/route.ts` |

### Still open

- `/dashboard/products/[id]/classify` UI (API exists).
- Standalone `/dashboard/classification` page.
- **`IN_PMF`** framework and upload flow (PMF in MDR flowchart).
- Re-enable multi-country target markets post–Phase 1 lock.
- Production headless Playwright for predicate API.

---

*Regenerate this file when the route tree or `Product` schema changes materially.*
