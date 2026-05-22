# SwayamSutra — Project context for Claude

> **Attach or `@CLAUDE.md` at the start of a session.** This file reflects the **current** repo layout (Next.js App Router, May 2026). Update it when you add routes, models, or rename folders.

---

## 1. Product summary

**SwayamSutra** (`nextjs-mongo-professional`) is a medical **device / IVD regulatory documentation** platform focused on **India MDR 2017 / CDSCO** and **40+ country frameworks**.

| Actor | Implementation |
|--------|----------------|
| Logged-in user | `Company` document (not a separate `User` model) |
| Auth | NextAuth v4 credentials → JWT → `getSession()` loads `Company` |
| Core entities | `Product`, `RegulatoryDocument` |
| AI | OpenAI + Pinecone RAG (autofill, optional classify) |
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

**Key dependencies:** `@pinecone-database/pinecone`, `openai`, `@google-cloud/storage`, `docxtemplater`, `pdf-parse`, `three-globe`.

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
| `/dashboard/products/new` | `products/new/page.tsx` | **Phase 1** registration + autofill + lock |
| | `products/new/DeviceCharacterisation.tsx` | Part I (medical device) |
| | `products/new/IVDCharacterisation.tsx` | Part II (IVD) |
| | `products/new/PredicatePathway.tsx` | Step 1.5 |
| | `products/new/ClassificationLock.tsx` | Steps 1.6 / 1.8 lock |
| | `products/new/Phase1MiniFlowchart.tsx` | Sidebar flowchart |
| `/dashboard/products/[id]` | `products/[id]/page.tsx` | Product hub; frameworks; doc list |
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
| POST | `/api/products/autofill` | `products/autofill/route.ts` | RAG extract fields → JSON (Pinecone namespace `company_{userId}`) |
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
| POST | `/api/documents/[id]/autofill` | `documents/[id]/autofill/route.ts` — uses product `uploadedDocs` |
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
- `businessGenesis` — Phase 0 nested sections (secA–secE)
- Legacy optional `deviceClassification` — still read by dashboard widget & some forms

### `Product.ts`

**Top-level (identity & markets):**
`userId`, `name`, `manufacturer`, `description`, `intendedUse`, `patientPopulation`, `deviceClass` (A|B|C|D), `deviceType` (`medical-device` | `ivd`), `countries[]`, `status`, `isSterile`, `hasSoftware`, `uploadedDocs[]`, timestamps.

**Nested sections (do not flatten at root):**

| Key | Stored when | Content |
|-----|-------------|---------|
| `medDevice` | `deviceType === "medical-device"` only | Part I: `isInvasive`, `invasionType`, `contactDuration`, risk flags, … |
| `IVDdevice` | `deviceType === "ivd"` only | Part II: `ivdSelfTest`, `ivdTargetsHIV`, … |
| `predDevice` | Always | Predicate / novel pathway: `predicateExists`, `md26Status`, … |
| `classLock` | Always | Human lock: `classificationConfirmed`, `classificationLocked`, … + `classLock.ai` for RAG |

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
| `productMapper.ts` | Flat form ↔ nested Product; `$unset` wrong device section |
| `classification/hybridQuery.ts` | Pinecone + GPT MDR classification |
| `compliance-knowledge/` | Static country data (`data.ts`, `types.ts`, `index.ts`) |
| `frameworks/` | Per-country regulatory field definitions |
| `frameworks/index.ts` | `FRAMEWORKS`, `REGION_GROUPS` |
| `frameworks/types.ts` | `RegulatoryFramework`, `FrameworkSection`, … |

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
| `phase1/ClassificationWidget.tsx` | Dashboard Phase 1 card → links **`/dashboard/products`** (not classification page) |

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
│ Phase 1: /dashboard/products/new                                │
│   1. Autofill: extract-text → /api/products/autofill (Pinecone) │
│   2. Form: medDevice OR IVDdevice + predDevice + classLock      │
│   3. POST /api/products (+ uploadedDocs from autofill file)    │
│   4. Optional: POST /api/products/[id]/upload                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Phase 2: /dashboard/products/[id]                               │
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
| Document autofill | **POST /api/documents/[id]/autofill** reads `product.uploadedDocs` |

Autofill API alone does **not** write `uploadedDocs`.

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
PINECONE_INDEX          # autofill / some uploads
PINECONE_INDEX2         # hybrid classification
PINECONE_EMBED_MODEL
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
| PDF autofill registration | `api/products/autofill/route.ts`, `products/new/page.tsx` |
| Persist IFU/PDF on product | `api/products/[id]/upload/route.ts` |
| DOCX bulk export | `api/upload/route.ts`, `dashboard/upload/page.tsx` |
| Sidebar broken “Documents” link | `components/Sidebar.tsx` — should point to products or doc list |

---

## 14. Known gaps / technical debt

- `/dashboard/vault` linked but missing.
- `ClassificationWizard.tsx` unused; no `/dashboard/classification` page.
- MD-14 / MD-16 / dossier **UI pages removed**; API dossier route remains.
- `/api/assistant` unused by frontend.
- `Company.companyPassword` stored/compared in plaintext.
- Duplicate path variants in tooling (`src\` vs `src/`) — same files on Windows.

---

*Regenerate this file when the route tree or `Product` schema changes materially.*
