# SwayamSutra — AI Regulatory Documentation Engine

> An AI-powered SaaS platform that automates medical device regulatory document generation. Companies upload their product PDFs (IFUs, brochures, manuals) and the system uses RAG (Retrieval-Augmented Generation) with GPT-4o + Pinecone to extract structured data, then auto-fills official DOCX regulatory templates and returns them as a downloadable ZIP.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Auth | NextAuth.js v4 (JWT + CredentialsProvider) |
| Database | MongoDB Atlas via Mongoose 9 |
| Vector DB | Pinecone (for RAG embeddings) |
| AI/LLM | OpenAI GPT-4o-mini + text-embedding-3-small |
| PDF Parsing | pdf-parse v1.1.1 |
| DOCX Rendering | docxtemplater + PizZip |
| ZIP Packaging | JSZip |
| Validation | Zod |
| 3D Globe | Three.js + three-globe (landing page) |

---

## Environment Variables (`.env`)

```env
MONGODB_URI=mongodb+srv://...           # MongoDB Atlas connection (database: medDoc)
NEXTAUTH_URL=http://localhost:3000      # Base URL for NextAuth
NEXTAUTH_SECRET=<random-secret>         # JWT encryption secret
OPENAI_API_KEY=sk-...                   # OpenAI API key
PINECONE_KEY=...                        # Pinecone API key
PINECONE_INDEX=medical-docs             # Pinecone index name (optional, defaults to medical-docs)
```

---

## Project Structure

```
nextjs-mongo-professional/
├── format/                          # DOCX regulatory templates (7 files)
│   ├── Covering Letter.docx
│   ├── Declaration Letter.docx
│   ├── Fee Challan Declaration.docx
│   ├── Medical Device Description.docx
│   ├── Quantity Justification.docx
│   ├── Test Protocol.docx
│   └── Undertaking.docx
├── placeholders.json                # Maps each template → its {placeholder} tags
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout (wraps everything in SessionProvider)
│   │   ├── page.tsx                 # Landing page (public, 3D globe, marketing)
│   │   ├── login/page.tsx           # Login page (NextAuth signIn)
│   │   ├── register/page.tsx        # Registration page
│   │   ├── (dashboard)/dashboard/   # Protected dashboard (route group)
│   │   │   ├── page.tsx             # Dashboard home (stats, recent products/docs)
│   │   │   ├── products/            # Product management (list, create, detail)
│   │   │   ├── vault/page.tsx       # Document Vault (all regulatory docs table)
│   │   │   ├── upload/page.tsx      # Upload PDFs → AI generates DOCX ZIP
│   │   │   ├── documents/[id]/      # Single document editor with AI chatbot
│   │   │   ├── compliance/          # Compliance guide (country frameworks)
│   │   │   ├── settings/            # Company settings
│   │   │   └── dmf-assistant/       # DMF records assistant
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── [...nextauth]/route.ts  # NextAuth handler (JWT, CredentialsProvider)
│   │       │   └── register/route.ts       # POST: company registration
│   │       ├── upload/route.ts             # POST: the main RAG pipeline (951 lines)
│   │       ├── products/route.ts           # CRUD for products
│   │       ├── products/[id]/route.ts      # Single product CRUD
│   │       ├── products/[id]/upload/       # Upload PDF to a specific product
│   │       ├── documents/route.ts          # CRUD for regulatory documents
│   │       ├── documents/[id]/route.ts     # Single document CRUD
│   │       ├── documents/[id]/autofill/    # AI autofill document sections
│   │       ├── documents/[id]/chat-upload/ # Upload PDF for document chatbot context
│   │       ├── documents/[id]/sections/    # Document section management
│   │       ├── documents/[id]/versions/    # Document version history
│   │       ├── companies/me/              # GET current company profile
│   │       ├── chat/                      # General AI chat endpoint
│   │       ├── assistant/                 # AI assistant endpoint
│   │       ├── compliance-book/           # Compliance knowledge base API
│   │       ├── countries/                 # Country list for frameworks
│   │       ├── dmf-records/               # DMF record CRUD
│   │       ├── legacy-chatbot/            # Legacy chatbot endpoint
│   │       └── print-template/            # Print template generation
│   ├── components/
│   │   ├── Providers.tsx            # SessionProvider wrapper (client component)
│   │   ├── Sidebar.tsx              # Dashboard navigation sidebar
│   │   └── landing/                 # Landing page components (3D globe, etc.)
│   ├── lib/
│   │   ├── auth.ts                  # getSession() / requireAuth() helpers
│   │   ├── mongodb.ts               # Mongoose connection with global cache
│   │   ├── env.ts                   # Zod-validated environment variables
│   │   ├── compliance-knowledge/    # Static compliance knowledge data
│   │   └── frameworks/              # Regulatory framework definitions per country
│   │       ├── types.ts             # RegulatoryFramework, FrameworkSection types
│   │       ├── index.ts             # Framework registry
│   │       └── [region]/            # Per-region framework data (asia, europe, etc.)
│   └── models/
│       ├── Company.ts               # Company schema (the primary identity/user)
│       ├── Product.ts               # Product schema (with uploadedDocs array)
│       ├── Document.ts              # RegulatoryDocument schema
│       ├── DocumentVersion.ts       # Document version history schema
│       └── DmfRecord.ts             # Device Master File record schema
```

---

## Database Schema (MongoDB — `medDoc` database)

### `companies` collection
The primary identity entity. Every "user" is a Company.

| Field | Type | Notes |
|-------|------|-------|
| `companyName` | String | Required |
| `companyEmail` | String | Required, unique, used for login |
| `companyPassword` | String | Required (currently plain text for testing — **must hash before production**) |
| `companyNumber` | String | Optional phone number |
| `description` | String | Optional |
| `country` | String | Optional country code |
| `businessSetup` | Object | Tracks Phase 0 compliance (GST, MSME, IEC Code, Trademark, Domain) |
| `createdAt/updatedAt` | Date | Auto via `timestamps: true` |

### `products` collection
Medical devices registered by a company.

| Field | Type | Notes |
|-------|------|-------|
| `userId` | ObjectId → Company | Owner company |
| `name` | String | Product name |
| `manufacturer` | String | Manufacturer name |
| `description` | String | Product description |
| `deviceClass` | Enum: A/B/C/D | Risk classification |
| `deviceType` | Enum: medical-device/ivd | Device category |
| `intendedUse` | String | Clinical intended use |
| `countries` | String[] | Target countries (default: ["IN"]) |
| `status` | Enum: draft/active/archived | Product lifecycle |
| `uploadedDocs` | Array of `{ fileId, originalName, mimeType, sizeBytes, extractedText, uploadedAt }` | PDFs uploaded to this product |

### `regulatorydocuments` collection
Generated/managed regulatory submission documents.

| Field | Type | Notes |
|-------|------|-------|
| `productId` | ObjectId → Product | Associated product |
| `userId` | ObjectId → Company | Owner company |
| `countryCode` | String | Target country |
| `frameworkId` | String | Regulatory framework used |
| `title` | String | Document title |
| `status` | Enum: draft/in-review/approved/submitted | Workflow status |
| `sections` | Map<string, { fields, completionPct }> | Section-wise data |
| `version` | Number | Current version number |

### `documentversions` collection
Immutable snapshots for version history.

### `dmfrecords` collection
Device Master File records (standalone reference data).

---

## Authentication Flow

```
Register (/register) → POST /api/auth/register → Company.create() → MongoDB
Login (/login) → POST /api/auth/callback/credentials → Company.findOne() → JWT issued
Protected pages → getSession() → getServerSession(authOptions) → Company.findById()
API routes → getToken({ req }) → reads JWT → extracts token.id as companyId
```

- Auth uses **NextAuth.js v4** with `CredentialsProvider` against the `Company` model
- Session strategy: **JWT** (7-day max age)
- JWT callbacks inject `token.id` = `company._id`
- Session callbacks inject `session.user.id` and `session.user._id`
- `Providers.tsx` wraps the app in `<SessionProvider>` for client-side `useSession()`
- **Note:** Passwords are currently stored in plain text for testing. Bcrypt must be re-enabled before production.

---

## Core Feature: AI Upload Pipeline (`/api/upload/route.ts`)

This is the main feature — a 3-phase RAG pipeline (~951 lines). It runs as a long-duration Node.js serverless function (`maxDuration = 300s`).

### Phase 1: PDF Ingestion → Pinecone

```
User uploads PDFs → pdf-parse extracts text → chunkText() splits into 1500-char overlapping chunks
→ OpenAI text-embedding-3-small generates vectors → Pinecone upsert (namespaced by companyId)
→ 20-second wait for Pinecone eventual consistency
```

### Phase 2: RAG-Based Data Extraction

```
4 targeted Pinecone queries (product specs, specifications, intended use, instrument specs)
→ Deduplicated context chunks assembled
→ GPT-4o-mini: Product extraction prompt → returns JSON with up to 5 products
   (product, deviceName, brandName, modelNumber, category, class, use, quantity, material, shelfLife, size, temperature)
→ GPT-4o-mini: Company extraction prompt → returns JSON
   (companyName, companyAddress, telephoneNumber, companyEmail)
→ Regex fallbacks for email and phone if LLM misses them
```

### Phase 3: DOCX Template Rendering → ZIP

```
placeholders.json defines which {tags} each template uses
→ Reads all .docx files from format/ directory
→ mergedValues map built: company fields + numbered product fields (product1–5)
→ docxtemplater replaces all {tags} in each template
→ JSZip packages all filled templates into one .zip
→ Returns ZIP as downloadable response
```

### Placeholder Tag Mapping

The `placeholders.json` file maps each DOCX template to its tags. The upload route reads this at runtime to know what data to extract. Tags follow these patterns:

- **Company tags:** `{ManufacturerCompanyName}`, `{ManufacturerCompanyAddress}`, `{ManufacturerCompanyNumber}`, `{ManufacturerCompanyEmail}`
- **Product tags (numbered 1–5):** `{productGenericName1}`, `{referenceNumber1}`, `{class1}`, `{use1}`, `{importedquantity1}`, `{material1}`, `{brandName1}`, `{size1}`, `{temperature1}`, `{category1}`
- **Scalar tags:** `{shelfLife}` (shared across all products)

### Templates in `format/` directory

| Template | Purpose | Key Placeholders |
|----------|---------|-----------------|
| Covering Letter.docx | Import license covering letter | Company info + product names/categories |
| Declaration Letter.docx | Manufacturer declaration | Company info only |
| Fee Challan Declaration.docx | Fee payment declaration | None (static) |
| Medical Device Description.docx | Device descriptions per product | Products with class/use/material |
| Quantity Justification.docx | Quantity import justification | Products with brand/size/temperature |
| Test Protocol.docx | Testing protocol | Company info only |
| Undertaking.docx | Manufacturer undertaking | Company info + product names/categories |

---

## Dashboard Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/dashboard` | Server component | Home: Phase 0 Business Setup widget, stats cards, recent products/docs, "How it works" guide |
| `/dashboard/products` | Server component | Product list with status badges |
| `/dashboard/products/new` | Client component | Register a new medical device product |
| `/dashboard/products/[id]` | Server component | Product detail: info, uploaded docs, regulatory documents |
| `/dashboard/vault` | Server component | Document Vault: table of all regulatory documents with status |
| `/dashboard/upload` | Client component | Upload PDFs → terminal-style progress log → download ZIP |
| `/dashboard/documents/[id]` | Mixed | Document editor with section forms and AI chatbot |
| `/dashboard/compliance` | Server component | Country-by-country compliance framework guide |
| `/dashboard/settings` | Client component | Company profile settings |

---

## API Routes Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | Public | Register a new company |
| `/api/auth/[...nextauth]` | GET/POST | Public | NextAuth sign-in/sign-out/session |
| `/api/upload` | POST | JWT | **Main pipeline**: PDFs → RAG → DOCX ZIP |
| `/api/products` | GET/POST | Session | List/create products |
| `/api/products/[id]` | GET/PUT/DELETE | Session | Single product CRUD |
| `/api/products/[id]/upload` | POST | Session | Upload PDF to product (extracts text) |
| `/api/documents` | GET/POST | Session | List/create regulatory documents |
| `/api/documents/[id]` | GET/PUT/DELETE | Session | Single document CRUD |
| `/api/documents/[id]/autofill` | POST | Session | AI autofill document sections |
| `/api/documents/[id]/chat-upload` | POST | Session | Upload PDF for document chatbot |
| `/api/documents/[id]/sections` | PUT | Session | Update document sections |
| `/api/documents/[id]/versions` | GET/POST | Session | Version history |
| `/api/companies/me` | GET | Session | Current company profile |
| `/api/companies/me/setup` | PUT | Session | Update Phase 0 business setup checklist |
| `/api/chat` | POST | Session | General AI chat |
| `/api/compliance-book` | GET | Session | Compliance knowledge base |
| `/api/countries` | GET | Public | Country list for frameworks |
| `/api/dmf-records` | GET/POST | Session | DMF record management |

---

## Regulatory Frameworks System

The `src/lib/frameworks/` directory contains structured regulatory framework definitions for medical device registration across multiple regions:

- **Regions covered:** Africa, Americas, Asia, Europe, Middle East, Oceania, South Asia, Southeast Asia
- **Structure:** Each framework defines `sections` → `fields` with `id`, `label`, `hint`
- **Usage:** When a user creates a regulatory document for a specific country, the framework provides the section structure and field hints for that country's regulatory body

---

## User Workflow (End-to-End)

```
1. REGISTER  → /register → creates Company in MongoDB
2. LOGIN     → /login → NextAuth issues JWT
3. PHASE 0   → /dashboard → Update Business Setup widget (GST, MSME, IEC numbers)
4. DASHBOARD → /dashboard → see stats, recent activity
4. PRODUCT   → /dashboard/products/new → register a medical device
5. UPLOAD    → /dashboard/upload → upload product PDFs
                → AI extracts company + product data via RAG
                → Auto-fills 7 DOCX regulatory templates
                → Downloads ZIP of filled documents
6. VAULT     → /dashboard/vault → view all generated documents
7. EDIT      → /dashboard/documents/[id] → manually edit sections, use AI chatbot
8. COMPLIANCE → /dashboard/compliance → reference country-specific requirements
```

---

## Running Locally

```bash
# Install dependencies
npm install

# Start dev server
npm run dev          # http://localhost:3000

# Production build
npm run build
npm start
```

---

## Known Limitations / TODO

- **Security:** Passwords stored in plain text (testing mode). Must re-enable bcryptjs before production.
- **pdf-parse:** Pinned to v1.1.1 because v2.x changed its module structure and breaks Next.js Turbopack builds. The import uses `require("pdf-parse/lib/pdf-parse.js")` to bypass the module's built-in self-test that crashes during build.
- **Pinecone consistency:** After upserting vectors, the pipeline waits 20 seconds + retries up to 6 times for eventual consistency before querying.
- **Product limit:** Templates support up to 5 products per upload batch (numbered placeholders 1–5).
- **Upload storage:** Generated ZIPs are streamed directly to the user and not persisted in MongoDB/S3. Future: save to Document Vault automatically.
