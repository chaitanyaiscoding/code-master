import puppeteer from 'puppeteer';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CodeforcesProblem from './models/CodeforcesProblem.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cf_cc_lc_test';

const delay = ms => new Promise(res => setTimeout(res, ms));

// Retry logic for scraping description
const scrapeDescription = async (page, url, selector, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

            const found = await page.$(selector);
            if (found) {
                return await page.evaluate((sel) => {
                    const el = document.querySelector(sel);
                    return el ? el.textContent.trim() : "No description available.";
                }, selector);
            }
        } catch (err) {
            console.log(`🔁 Retry ${i + 1} failed for ${url}: ${err.message}`);
        }
        await delay(1000);
    }
    return "No description available.";
};

const scrapeCodeforces = async (browser) => {
    console.log("🔴 Scraping Codeforces problems...");

    try {
        const res = await fetch("https://codeforces.com/api/problemset.problems");

        if (!res.ok) {
            throw new Error(`API fetch failed with status ${res.status}`);
        }

        const data = await res.json();
        if (data.status !== "OK") throw new Error("Failed to fetch Codeforces problems.");

        // You can adjust this number to scrape more problems
        const problems = data.result.problems.slice(0, 100).map((problem) => ({
            title: problem.name,
            url: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`,
            difficulty: problem.rating ? problem.rating.toString() : "N/A",
            topic: problem.tags.length > 0 ? problem.tags.join(", ") : "Unknown",
            source: "Codeforces",
        }));

        let inserted = 0;
        let skipped = 0;

        for (let prob of problems) {
            let description = "No description available.";

            try {
                const page = await browser.newPage();
                await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");

                description = await scrapeDescription(page, prob.url, ".problem-statement");
                await page.close();
            } catch (err) {
                console.log(`⚠️ Error scraping ${prob.title}: ${err.message}`);
            }

            const existing = await CodeforcesProblem.findOne({ title: prob.title, source: prob.source });
            if (existing) {
                console.log(`⚡ Skipped (already exists): ${prob.title}`);
                skipped++;
            } else {
                try {
                    await CodeforcesProblem.create({ ...prob, description });
                    console.log(`✅ Stored Codeforces problem: ${prob.title}`);
                    inserted++;
                } catch (error) {
                    console.error(`❌ Failed to save problem ${prob.title}:`, error.message);
                }
            }

            await delay(1000); // Delay to avoid rate-limiting
        }

        console.log(`📊 Scraping complete: Inserted ${inserted} | Skipped ${skipped}`);
    } catch (err) {
        console.error("❌ Codeforces Scraping Error:", err);
    }
};

(async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");

        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        await scrapeCodeforces(browser);

        await browser.close();
        await mongoose.connection.close();
        console.log("🛑 Browser and DB connection closed.");
    } catch (err) {
        console.error("❌ Error in scrapeCodeforces.mjs:", err);
    }
})();
