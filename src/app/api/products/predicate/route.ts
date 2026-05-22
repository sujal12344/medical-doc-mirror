import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type ScrapedDevice = {
    name: string;
    manufacturer: string;
    regNo: string;
    intendedUse: string;
    deviceClass: string;
};

/** Normalize CDSCO deviceClass strings like "Class A", "CLASS A - LOW RISK", "a" → "A" */
function normalizeDeviceClass(raw: string): string {
    const match = raw.toUpperCase().match(/\b([ABCD])\b/);
    return match ? match[1] : raw.trim();
}

/**
 * Use OpenAI to extract the single most medically meaningful search keyword
 * e.g. "For quantitative determination of albumin in human serum" → "albumin"
 */
async function extractSearchKeyword(intendedUse: string): Promise<string> {
    try {
        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a medical device regulatory expert. Extract the single most specific medical or analytical keyword from the intended use statement that would best identify the device type in a CDSCO product database search.
Return ONLY the keyword — no punctuation, no explanation.
Examples:
- "For quantitative in vitro diagnostic determination of albumin in human serum" → albumin
- "For detection of HIV 1 and HIV 2 antibodies in human serum" → HIV
- "For measurement of blood glucose levels in diabetic patients" → glucose
- "For in vitro diagnostic detection of Hepatitis B surface antigen" → HBsAg
- "For quantitative determination of creatinine in urine and serum" → creatinine`,
                },
                {
                    role: "user",
                    content: intendedUse,
                },
            ],
            temperature: 0,
            max_tokens: 20,
        });

        const keyword = (completion.choices[0].message.content || "").trim().toLowerCase();
        console.log(`[predicate] AI extracted keyword: "${keyword}"`);
        return keyword;
    } catch (err) {
        console.warn("[predicate] Failed to extract keyword via AI, falling back to longest word", err);
        // Fallback: longest word
        const words = intendedUse
            .toLowerCase()
            .replace(/[^a-z0-9 ]/g, "")
            .split(/\s+/)
            .filter((w) => w.length > 4)
            .sort((a, b) => b.length - a.length);
        return words[0] || intendedUse;
    }
}

/**
 * Use OpenAI to select the best predicate device from scraped results.
 * Returns the best matching device and a reason string.
 */
async function pickBestMatch(
    intendedUse: string,
    devices: ScrapedDevice[]
): Promise<{ device: ScrapedDevice; reason: string } | null> {
    if (devices.length === 0) return null;

    // Cap at 25 candidates to stay within token limits
    const candidates = devices.slice(0, 25);

    const deviceList = candidates
        .map(
            (d, i) =>
                `${i + 1}. Name: "${d.name}" | Intended Use: "${d.intendedUse}" | Class: ${d.deviceClass}`
        )
        .join("\n");

    try {
        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a CDSCO medical device regulatory expert. Given a product's intended use and a numbered list of CDSCO-registered devices, select the single best predicate device with the most similar clinical/analytical purpose.
Return ONLY valid JSON: { "index": <1-based number or null if no match>, "reason": "<one sentence reason>" }`,
                },
                {
                    role: "user",
                    content: `My product intended use:\n"${intendedUse}"\n\nCDSCO registered devices:\n${deviceList}`,
                },
            ],
            response_format: { type: "json_object" },
            temperature: 0,
        });

        const parsed = JSON.parse(completion.choices[0].message.content || "{}");
        console.log(`[predicate] AI selected index ${parsed.index}: ${parsed.reason}`);

        if (!parsed.index || parsed.index < 1 || parsed.index > candidates.length) {
            return null;
        }

        const device = candidates[parsed.index - 1];
        return { device, reason: parsed.reason };
    } catch (err) {
        console.error("[predicate] OpenAI match failed, falling back to first result", err);
        // Fallback: return first result
        return { device: candidates[0], reason: "Fallback: first keyword match" };
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const intendedUse: string = (body.intendedUse || "").trim();

        if (!intendedUse) {
            return NextResponse.json(
                { error: "Product intended use missing in request body" },
                { status: 400 }
            );
        }

        console.log(`[predicate] Searching for predicate. Intended use: "${intendedUse}"`);

        // ── Step 1: Extract smart keyword via OpenAI ──────────────────────────
        const keyword = await extractSearchKeyword(intendedUse);

        // ── Step 2: Scrape CDSCO ──────────────────────────────────────────────
        const browser = await chromium.launch({ headless: false });
        const page = await browser.newPage();

        await page.goto(
            "https://cdscomdonline.gov.in/NewMedDev/ListOfApprovedDevices",
            { waitUntil: "networkidle" }
        );

        // Click the Manufacturer card/tab to load the DataTable
        try {
            const mfgCard = page
                .locator(".card-block, a, .cardtext")
                .filter({ hasText: "Manufacturer" })
                .first();
            await mfgCard.click({ timeout: 5000 });
        } catch {
            try {
                await page.locator("text=Manufacturer").first().click({ timeout: 2000 });
            } catch { }
        }

        // Wait for the search bar (no timeout — site is slow)
        await page.waitForSelector('input[type="search"]', { timeout: 0 });

        // Type keyword into the DataTables global search box
        const searchInput = await page.$('input[type="search"]');
        if (searchInput && keyword) {
            await searchInput.fill(keyword);
            // Wait for DataTables to debounce and filter
            await page.waitForTimeout(1500);
        }

        // ── Step 3: Collect all filtered rows ────────────────────────────────
        const devices: ScrapedDevice[] = [];
        let hasNext = true;

        while (hasNext) {
            const rows = await page.$$("table tbody tr");

            for (const row of rows) {
                const cols = await row.$$eval("td", (tds) =>
                    tds.map((td) => td.textContent?.trim() || "")
                );

                if (cols.length < 5) continue;
                if (cols[0].toLowerCase().includes("no data")) continue;

                devices.push({
                    name: cols[0],
                    manufacturer: cols[1],
                    regNo: cols[2],
                    intendedUse: cols[3],
                    deviceClass: normalizeDeviceClass(cols[4]),
                });
            }

            const nextBtn = await page.$(".pagination .next:not(.disabled)");
            if (!nextBtn) {
                hasNext = false;
            } else {
                await nextBtn.click();
                await page.waitForTimeout(600);
            }
        }

        await browser.close();

        console.log(`[predicate] Scraped ${devices.length} devices for keyword "${keyword}"`);

        if (devices.length === 0) {
            return NextResponse.json({
                success: false,
                message: `No devices found on CDSCO for keyword "${keyword}"`,
            });
        }

        // ── Step 4: Use OpenAI to pick the best predicate ─────────────────────
        const result = await pickBestMatch(intendedUse, devices);

        if (!result) {
            return NextResponse.json({
                success: false,
                message: "No suitable predicate device found in scraped results",
            });
        }

        return NextResponse.json({
            success: true,
            match: result.device,
            matchReason: result.reason,
            searchKeyword: keyword,
            totalDevicesScraped: devices.length,
        });
    } catch (error) {
        console.error("Predicate Scraping Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch predicate device" },
            { status: 500 }
        );
    }
}