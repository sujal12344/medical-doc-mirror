import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CdscoDocument } from "@/models/CdscoDocument";
import { CdscoScanHistory } from "@/models/CdscoScanHistory";
import { scrapePortal, downloadPdfBytes } from "@/lib/cdsco/scraper";
import { ingestPdfBytes } from "@/lib/cdsco/ingest";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min max for serverless

// Protect with a secret token so only the cron service can call this
function isAuthorized(req: NextRequest): boolean {
  const token = req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret");
  const expected = process.env.CRON_SECRET;
  // If no CRON_SECRET is set, allow all (for local dev only)
  if (!expected) return true;
  return token === expected;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  // Create a new scan history entry
  const scanRecord = await CdscoScanHistory.create({
    startedAt: new Date(),
    status: "running",
    triggeredBy: req.nextUrl.searchParams.get("trigger") === "cron" ? "cron" : "manual",
  });

  const errors: string[] = [];
  let pdfsIndexed = 0;
  let pdfsSkipped = 0;
  let pdfsError = 0;

  try {
    console.log("[cdsco/cron-scrape] Starting portal crawl...");
    const scrapeResult = await scrapePortal({ maxPages: 200, maxDepth: 4 });
    console.log(`[cdsco/cron-scrape] Found ${scrapeResult.pdfsFound.length} PDFs across ${scrapeResult.pagesScanned} pages`);

    errors.push(...scrapeResult.errors);

    for (const pdf of scrapeResult.pdfsFound) {
      const pdfKey = pdf.gatewayUrl || pdf.url;

      // Skip if already indexed
      const existing = await CdscoDocument.findOne({ sourceUrl: pdfKey, status: "indexed" });
      if (existing) {
        pdfsSkipped++;
        continue;
      }

      // Create/update document record
      let docRecord = await CdscoDocument.findOneAndUpdate(
        { sourceUrl: pdfKey },
        {
          $set: {
            sourceUrl: pdfKey,
            gatewayUrl: pdf.gatewayUrl,
            pageUrl: pdf.pageUrl,
            title: pdf.title,
            status: "pending",
            scannedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );

      try {
        // Download and ingest
        const { bytes, fileName } = await downloadPdfBytes(pdfKey, pdf.pageUrl);
        const result = await ingestPdfBytes(String(docRecord._id), bytes, {
          title: pdf.title,
          sourceUrl: pdfKey,
          pageUrl: pdf.pageUrl,
        });

        if (result.status === "indexed") {
          await CdscoDocument.updateOne(
            { _id: docRecord._id },
            {
              $set: {
                status: "indexed",
                fileName,
                chunksIndexed: result.chunksIndexed,
                pineconeIds: result.pineconeIds,
                indexedAt: new Date(),
              },
            }
          );
          pdfsIndexed++;
          console.log(`[cdsco/cron-scrape] Indexed: ${pdf.title}`);
        } else if (result.status === "skipped") {
          await CdscoDocument.updateOne({ _id: docRecord._id }, { $set: { status: "skipped" } });
          pdfsSkipped++;
        } else {
          throw new Error(result.error || "Unknown ingest error");
        }
      } catch (err) {
        const errMsg = String(err);
        errors.push(`${pdfKey}: ${errMsg}`);
        await CdscoDocument.updateOne(
          { _id: docRecord._id },
          { $set: { status: "error", errorMessage: errMsg } }
        );
        pdfsError++;
        console.warn(`[cdsco/cron-scrape] Error for ${pdfKey}: ${errMsg}`);
      }
    }

    // Mark scan as completed
    await CdscoScanHistory.updateOne(
      { _id: scanRecord._id },
      {
        $set: {
          completedAt: new Date(),
          status: "completed",
          pagesScanned: scrapeResult.pagesScanned,
          pdfsDiscovered: scrapeResult.pdfsFound.length,
          pdfsNew: pdfsIndexed + pdfsError,
          pdfsIndexed,
          pdfsSkipped,
          pdfsError,
          errorMessages: errors.slice(0, 50),
        },
      }
    );

    return NextResponse.json({
      success: true,
      scanId: String(scanRecord._id),
      pagesScanned: scrapeResult.pagesScanned,
      pdfsDiscovered: scrapeResult.pdfsFound.length,
      pdfsIndexed,
      pdfsSkipped,
      pdfsError,
      errors: errors.slice(0, 10),
    });
  } catch (error) {
    await CdscoScanHistory.updateOne(
      { _id: scanRecord._id },
      { $set: { status: "failed", completedAt: new Date(), errorMessages: [String(error)] } }
    );
    console.error("[cdsco/cron-scrape] Fatal error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Allow GET for easy browser testing locally
  return POST(req);
}

