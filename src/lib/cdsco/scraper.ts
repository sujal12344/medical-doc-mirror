/**
 * CDSCO Portal Scraper
 * Crawls cdsco.gov.in breadth-first, discovers PDF links, and returns them.
 */

const CDSCO_BASE = "https://cdsco.gov.in";
const CDSCO_START_URLS = [
  //Medical Devices & Diagnostics section
  "https://cdsco.gov.in/opencms/opencms/en/Medical-Device-Diagnostics/InVitro-Diagnostics/",
  "https://cdsco.gov.in/opencms/opencms/en/Medical-Device-Diagnostics/Medical-Device-Diagnostics/",

  //Alerts section
  "https://cdsco.gov.in/opencms/opencms/en/Alerts/",
  "https://cdsco.gov.in/opencms/opencms/en/Notifications/nsq-drugs/",

  //Acts & Rules section
  "https://cdsco.gov.in/opencms/opencms/en/Acts-and-rules/Drugs-and-Cosmetics-Act/",
  "https://cdsco.gov.in/opencms/opencms/en/Acts-and-rules/Drugs-Rules/",
  "https://cdsco.gov.in/opencms/opencms/en/Acts-and-rules/Medical-Devices-Rules/",
  "https://cdsco.gov.in/opencms/opencms/en/Acts-and-rules/New-Drugs/",
  "https://cdsco.gov.in/opencms/opencms/en/Acts-and-rules/Cosmetics-Rules/",
  "https://cdsco.gov.in/opencms/opencms/en/Acts-and-rules/Advisories_NO/",
  "https://cdsco.gov.in/opencms/opencms/en/Acts-and-rules/Final-Notifications/",
  "https://cdsco.gov.in/opencms/opencms/en/Acts-and-rules/Draft-Notifications/",
  "https://cdsco.gov.in/opencms/opencms/en/Acts-and-rules/Guidance-documents/",

  //Notifications section
  "https://cdsco.gov.in/opencms/opencms/en/Notifications/page/",
  "https://cdsco.gov.in/opencms/opencms/en/Notifications/Alerts/",
  "https://cdsco.gov.in/opencms/opencms/en/Notifications/Archive/",
  "https://cdsco.gov.in/opencms/opencms/en/Notifications/Circulars/",
  "https://cdsco.gov.in/opencms/opencms/en/Notifications/documents/",
  "https://cdsco.gov.in/opencms/opencms/en/Notifications/Events/",
  "https://cdsco.gov.in/opencms/opencms/en/Notifications/Gazette-Notifications/",
  "https://cdsco.gov.in/opencms/opencms/en/Notifications/Public-Notices/",
  "https://cdsco.gov.in/opencms/opencms/en/Notifications/Prescribing-Information/",
  "https://cdsco.gov.in/opencms/opencms/en/Notifications/Adverse-Drug-Reaction-related-Notifications/",
  "https://cdsco.gov.in/opencms/opencms/en/Notifications/Tender/",
  "https://cdsco.gov.in/opencms/opencms/en/Notifications/Vacancy/",
  "https://cdsco.gov.in/opencms/opencms/en/Notifications/Citizens-charter/",  
];
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const ALLOWED_HOST = "cdsco.gov.in";

export interface ScrapedPdf {
  url: string;
  gatewayUrl?: string;
  title: string;
  pageUrl: string;
}

export interface ScrapeResult {
  pagesScanned: number;
  pdfsFound: ScrapedPdf[];
  errors: string[];
}


const ALLOWED_PATHS = CDSCO_START_URLS.map(u => new URL(u).pathname);
function isRelevantPath(urlStr: string): boolean {
  try {
    const pathname = new URL(urlStr).pathname;
    return ALLOWED_PATHS.some(p => pathname.startsWith(p));
  } catch { return false; }
}

function isAllowedHost(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(ALLOWED_HOST);
  } catch {
    return false;
  }
}

function normalizeUrl(base: string, href: string): string | null {
  try {
    const resolved = new URL(href, base).toString();
    // Strip fragments
    const u = new URL(resolved);
    u.hash = "";
    return isAllowedHost(u.toString()) ? u.toString() : null;
  } catch {
    return null;
  }
}

function isPdfUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.endsWith(".pdf") || lower.includes("downloadfile") || lower.includes("download_file") || lower.includes("/opencms/resources/");
}

function isDownloadGateway(url: string): boolean {
  return url.toLowerCase().includes("downloadfile") || url.toLowerCase().includes("/download/");
}

function extractLinks(html: string, baseUrl: string): { links: string[]; pdfs: ScrapedPdf[] } {
  const links: string[] = [];
  const pdfs: ScrapedPdf[] = [];

  // Match all href and src attributes
  const hrefPattern = /href=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = hrefPattern.exec(html)) !== null) {
    const raw = match[1].trim();
    const normalized = normalizeUrl(baseUrl, raw);
    if (!normalized) continue;

    if (isPdfUrl(normalized)) {
      // Try to extract a nearby title from anchor text
      const titleMatch = html.slice(Math.max(0, match.index - 200), match.index + 300).match(/>([^<]{5,120})</);
      const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, " ") : normalized.split("/").pop() || "CDSCO Document";
      pdfs.push({
        url: isDownloadGateway(normalized) ? normalized : normalized,
        gatewayUrl: isDownloadGateway(normalized) ? normalized : undefined,
        title,
        pageUrl: baseUrl,
      });
    } else if (isRelevantPath(normalized)) {
      links.push(normalized);
    }
  }

  return { links, pdfs };
}

function getPageTitle(html: string, fallback: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim().replace(/\s+/g, " ") : fallback;
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8" },
      signal: AbortSignal.timeout(30_000),
    });
    const contentType = res.headers.get("content-type") || "";
    if (!res.ok || contentType.includes("pdf")) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function scrapePortal(options?: {
  maxPages?: number;
  maxDepth?: number;
  startUrls?: string[];
}): Promise<ScrapeResult> {
  const maxPages = options?.maxPages ?? 300;
  const maxDepth = options?.maxDepth ?? 5;
  const startUrls = options?.startUrls ?? CDSCO_START_URLS;

  const visited = new Set<string>();
  const seenPdfUrls = new Set<string>();
  const allPdfs: ScrapedPdf[] = [];
  const errors: string[] = [];
  const queue: Array<{ url: string; depth: number }> = startUrls.map(url => ({ url, depth: 0 }));

  while (queue.length > 0 && visited.size < maxPages) {
    const item = queue.shift()!;
    if (visited.has(item.url)) continue;
    visited.add(item.url);

    const html = await fetchHtml(item.url);
    if (!html) {
      errors.push(`Failed to fetch: ${item.url}`);
      continue;
    }

    const { links, pdfs } = extractLinks(html, item.url);

    for (const pdf of pdfs) {
      const key = pdf.gatewayUrl || pdf.url;
      if (!seenPdfUrls.has(key)) {
        seenPdfUrls.add(key);
        allPdfs.push(pdf);
      }
    }

    if (item.depth < maxDepth) {
      for (const link of links) {
        if (!visited.has(link)) {
          queue.push({ url: link, depth: item.depth + 1 });
        }
      }
    }
  }

  return {
    pagesScanned: visited.size,
    pdfsFound: allPdfs,
    errors: errors.slice(0, 50),
  };
}

export async function resolveDirectPdfUrl(gatewayUrl: string): Promise<string> {
  if (!isDownloadGateway(gatewayUrl)) return gatewayUrl;
  try {
    const res = await fetch(gatewayUrl, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(30_000),
      redirect: "follow",
    });
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("pdf")) return res.url;
    // Parse HTML to find the real PDF resource
    const html = await res.text();
    const resourceMatch = html.match(/\/opencms\/resources\/[^\s"'<>]+\.pdf/i);
    if (resourceMatch) return normalizeUrl(gatewayUrl, resourceMatch[0]) || gatewayUrl;
  } catch {
    // fall through
  }
  return gatewayUrl;
}

export async function downloadPdfBytes(url: string, pageUrl?: string): Promise<{ bytes: Uint8Array; fileName: string }> {
  const direct = await resolveDirectPdfUrl(url);
  const res = await fetch(direct, {
    headers: {
      "User-Agent": USER_AGENT,
      "Referer": pageUrl || CDSCO_START_URLS[0],
    },
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${direct}`);
  const arrayBuffer = await res.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  if (bytes.length < 100) throw new Error("Downloaded file is too small to be a valid PDF");
  const rawName = new URL(direct).pathname.split("/").pop() || "cdsco-doc.pdf";
  const fileName = rawName.endsWith(".pdf") ? rawName : `${rawName}.pdf`;
  return { bytes, fileName };
}
