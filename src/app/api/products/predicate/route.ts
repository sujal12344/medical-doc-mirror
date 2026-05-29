import { NextRequest, NextResponse } from "next/server";
import { chromium, type Page } from "playwright";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type CdscoListType = "manufacturer" | "import";

function parseCdscoListType(raw: unknown): CdscoListType {
    return raw === "import" ? "import" : "manufacturer";
}

/** Click Manufacturer or Import category on CDSCO ListOfApprovedDevices (loadAppsImport for Import). */
async function clickCdscoListTab(page: Page, listType: CdscoListType): Promise<void> {
    if (listType === "import") {
        const importSelectors = ["#impPre", "#impPre .cardtext", "#impPre a.cardtext"];

        for (const selector of importSelectors) {
            try {
                const el = page.locator(selector).first();
                await el.waitFor({ state: "visible", timeout: 5000 });
                await el.click({ timeout: 5000 });
                await page.waitForTimeout(1000);
                console.log(`[predicate] Clicked Import tab via: ${selector}`);
                return;
            } catch {
                /* try next selector */
            }
        }

        try {
            await page
                .locator(".card.order-card, .card.bg-c-blue")
                .filter({ hasText: /^Import$/i })
                .first()
                .click({ timeout: 5000 });
            await page.waitForTimeout(1000);
            console.log("[predicate] Clicked Import tab via Import card");
            return;
        } catch {
            /* fall through */
        }

        try {
            await page.locator("a.cardtext", { hasText: /^Import$/i }).first().click({ timeout: 3000 });
            await page.waitForTimeout(1000);
            console.log("[predicate] Clicked Import tab via cardtext link");
            return;
        } catch {
            /* fall through */
        }

        throw new Error('Could not open CDSCO "Import" list — Import card not found on page');
    }

    try {
        const mfgCard = page
            .locator(".card-block, a, .cardtext")
            .filter({ hasText: "Manufacturer" })
            .first();
        await mfgCard.click({ timeout: 5000 });
        await page.waitForTimeout(1000);
        console.log("[predicate] Clicked Manufacturer tab");
        return;
    } catch {
        try {
            await page.locator("text=Manufacturer").first().click({ timeout: 2000 });
            await page.waitForTimeout(1000);
            console.log("[predicate] Clicked Manufacturer tab (fallback)");
        } catch {
            throw new Error('Could not open CDSCO "Manufacturer" list');
        }
    }
}

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

type PredicateMatch = {
    device: ScrapedDevice;
    reason: string;
    rank: number;
};

const TOP_MATCH_COUNT = 5;

/**
 * Use OpenAI to rank the top predicate devices from scraped CDSCO results.
 */
async function pickTopMatches(
    intendedUse: string,
    devices: ScrapedDevice[]
): Promise<PredicateMatch[]> {
    if (devices.length === 0) return [];

    const candidates = devices.slice(0, 40);
    const targetCount = Math.min(TOP_MATCH_COUNT, candidates.length);
    const mustRankAll = candidates.length <= TOP_MATCH_COUNT;

    const deviceList = candidates
        .map(
            (d, i) =>
                `${i + 1}. Name: "${d.name}" | Manufacturer: "${d.manufacturer}" | Reg: ${d.regNo} | Intended Use: "${d.intendedUse}" | Class: ${d.deviceClass}`
        )
        .join("\n");

    const backfillUnranked = (
        results: PredicateMatch[],
        seen: Set<number>,
    ): PredicateMatch[] => {
        for (let i = 1; i <= candidates.length && results.length < targetCount; i++) {
            if (seen.has(i)) continue;
            seen.add(i);
            results.push({
                device: candidates[i - 1],
                reason: "CDSCO keyword match — review for substantial equivalence",
                rank: results.length + 1,
            });
        }
        return results;
    };

    try {
        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a CDSCO medical device regulatory expert. Given a product's intended use and a numbered list of CDSCO-registered devices, rank predicate devices for substantial equivalence (same or similar analytical/clinical purpose preferred).

Return ONLY valid JSON:
{
  "matches": [
    { "index": <1-based number>, "reason": "<one sentence why this is a good predicate>" }
  ]
}

Rules:
- Return up to ${TOP_MATCH_COUNT} matches, ordered best to worst (most similar first).
- Use distinct indices only — never repeat the same device.
${
                        mustRankAll
                            ? `- There are exactly ${candidates.length} devices in the list — you MUST return all ${candidates.length} indices (1 through ${candidates.length}), each with a reason, ordered by similarity.`
                            : `- Return the top ${TOP_MATCH_COUNT} best matches from the list.`
                    }
- If nothing is suitable, return { "matches": [] }.`,
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
        const rawMatches = Array.isArray(parsed.matches) ? parsed.matches : [];
        const seen = new Set<number>();
        const results: PredicateMatch[] = [];

        for (const entry of rawMatches) {
            if (results.length >= TOP_MATCH_COUNT) break;
            const idx = Number(entry?.index);
            if (!idx || idx < 1 || idx > candidates.length || seen.has(idx)) continue;
            seen.add(idx);
            const reason = typeof entry?.reason === "string" ? entry.reason.trim() : "Similar intended use";
            results.push({
                device: candidates[idx - 1],
                reason,
                rank: results.length + 1,
            });
        }

        const filled = backfillUnranked(results, seen);

        console.log(
            `[predicate] AI ranked ${results.length} suggestion(s), ${filled.length} total after including all scraped devices`,
        );
        filled.forEach((m, i) => {
            console.log(`[predicate]   [${i + 1}] ${m.device.name} (${m.device.regNo}) — ${m.reason.slice(0, 80)}`);
        });

        if (filled.length > 0) return filled;

        return candidates.slice(0, targetCount).map((device, i) => ({
            device,
            reason: "Keyword match from CDSCO search (AI ranking unavailable)",
            rank: i + 1,
        }));
    } catch (err) {
        console.error("[predicate] OpenAI ranking failed, falling back to first results", err);
        return candidates.slice(0, targetCount).map((device, i) => ({
            device,
            reason: "Fallback: CDSCO keyword search result",
            rank: i + 1,
        }));
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const intendedUse: string = (body.intendedUse || "").trim();
        const cdscoListType = parseCdscoListType(body.cdscoListType);

        if (!intendedUse) {
            return NextResponse.json(
                { error: "Product intended use missing in request body" },
                { status: 400 }
            );
        }

        console.log(
            `[predicate] Searching for predicate (${cdscoListType} list). Intended use: "${intendedUse}"`,
        );

        // ── Step 1: Extract smart keyword via OpenAI ──────────────────────────
        const keyword = await extractSearchKeyword(intendedUse);

        // ── Step 2: Scrape CDSCO ──────────────────────────────────────────────
        const browser = await chromium.launch({ headless: false });
        const page = await browser.newPage();

        await page.goto(
            "https://cdscomdonline.gov.in/NewMedDev/ListOfApprovedDevices",
            { waitUntil: "networkidle" }
        );

        await clickCdscoListTab(page, cdscoListType);

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
                    name: cols[3],
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

        const uniqueDevices: ScrapedDevice[] = [];
        const seenReg = new Set<string>();
        for (const d of devices) {
            const key = (d.regNo || d.name).trim().toLowerCase();
            if (!key || seenReg.has(key)) continue;
            seenReg.add(key);
            uniqueDevices.push(d);
        }

        console.log(
            `[predicate] Scraped ${devices.length} rows, ${uniqueDevices.length} unique devices for keyword "${keyword}"`,
        );

        if (uniqueDevices.length === 0) {
            return NextResponse.json({
                success: false,
                message: `No devices found on CDSCO for keyword "${keyword}"`,
            });
        }

        // ── Step 4: Use OpenAI to rank top predicate suggestions ───────────────
        const matches = await pickTopMatches(intendedUse, uniqueDevices);

        if (matches.length === 0) {
            return NextResponse.json({
                success: false,
                message: "No suitable predicate devices found in scraped results",
            });
        }

        const suggestions = matches.map((m) => ({
            rank: m.rank,
            reason: m.reason,
            name: m.device.name,
            manufacturer: m.device.manufacturer,
            regNo: m.device.regNo,
            intendedUse: m.device.intendedUse,
            deviceClass: m.device.deviceClass,
        }));

        return NextResponse.json({
            success: true,
            match: matches[0].device,
            matchReason: matches[0].reason,
            matches: suggestions,
            searchKeyword: keyword,
            cdscoListType,
            totalDevicesScraped: uniqueDevices.length,
        });
    } catch (error) {
        console.error("Predicate Scraping Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch predicate device" },
            { status: 500 }
        );
    }
}