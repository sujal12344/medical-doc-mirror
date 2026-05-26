# PDF text extraction & OCR (Knowledge Base autofill)

## Why autofill misses fields

Product autofill needs **plain text** to chunk, embed, and query. Many IFU/brochure PDFs are:

1. **Text-based** — selectable text; `pdf-parse` works well.
2. **Scanned / image-only** — pages are pictures; `pdf-parse` returns almost nothing → **OCR required**.

Your log (`chunksIndexed: 1`, `intendedUse: (not found)`) usually means very little text was extracted, not that GPT ignored good text.

## How SwayamSutra handles it (automatic)

```
Upload PDF
    ↓
Step 1 — pdf-parse (text layer)
    ↓
Sparse? (<200 chars total OR <80 chars/page OR multi-page with <2500 chars total OR <250 chars/page)
    ↓ yes + OPENAI_API_KEY
Step 2 — Render pages → PNG → OpenAI Vision OCR
    ↓
Merge text → /api/products/autofill (RAG + GPT)
```

### API

`POST /api/extract-text` returns:

| Field | Meaning |
|--------|---------|
| `text` | Full extracted text |
| `method` | `pdf-text` or `ocr-vision` |
| `charCount` | Character count |
| `pageCount` | PDF pages |
| `ocrPages` | Pages processed by OCR (if any) |

### Environment variables (optional)

```env
OPENAI_API_KEY=...          # Required for OCR fallback
OPENAI_OCR_MODEL=gpt-4o-mini   # Vision model (default: OPENAI_MODEL)
PDF_OCR_ENABLED=true        # Set false to disable OCR
OCR_MAX_PAGES=12            # Max pages to OCR per upload
OCR_RENDER_SCALE=1.25       # Base scale (capped by OCR_MAX_EDGE)
OCR_MAX_EDGE=1568           # Max width/height in px (prevents 3MB+ images)
OCR_MAX_IMAGE_BYTES=3500000 # Reject page images larger than this before Vision API
PDF_MIN_TEXT_CHARS=200      # Below this → try OCR
PDF_MIN_CHARS_PER_PAGE=80   # Avg chars/page below this → try OCR
PDF_MIN_TEXT_MULTI_PAGE=2500   # 2+ pages with less total text → try OCR (letterhead-only PDFs)
PDF_MIN_CHARS_PER_PAGE_MULTI=250
```

## Step-by-step: test with your PDF

1. Restart dev server after `npm install` (adds `pdfjs-dist`, `@napi-rs/canvas`).
2. Open **Register Product** → expand **Knowledge Base**.
3. Upload the same IFU PDF → **Autofill Product from Document**.
4. Watch terminal logs:
   - `[documentExtract] PDF text layer: …`
   - If sparse: `[documentExtract] Sparse text detected → running Vision OCR fallback`
   - `[documentExtract] OCR complete: … chars`
5. UI shows **Last extraction: OCR (Vision)** and char count (expect thousands, not ~100).
6. Confirm autofill log shows multiple chunks and `intendedUse` / `description` filled.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Still `pdf-text` and low chars | PDF may be encrypted; try export/print to new PDF |
| OCR never runs | Check `OPENAI_API_KEY`, `PDF_OCR_ENABLED` not `false` |
| OCR slow / costly | Lower `OCR_MAX_PAGES`; use text-based PDF export from vendor |
| `canvas` / pdfjs error on Windows | Run `npm install` again; ensure Node 20+ |
| Fields still empty after OCR | Re-upload; check char count > 2000; verify IFU pages are readable |

## Code locations

- `src/lib/documentExtract.ts` — text layer + OCR pipeline
- `src/app/api/extract-text/route.ts` — HTTP endpoint
- `src/app/dashboard/products/new/page.tsx` — Knowledge Base UI
