import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import mongoose from 'mongoose';
import QuestionWithDesc from './models/QuestionWithDesc.js';

puppeteer.use(StealthPlugin());

const MONGO_URI = 'mongodb://localhost:27017/cf_cc_lc_test';
const delay = ms => new Promise(res => setTimeout(res, ms));

// ---------- LeetCode Scraper ----------
const scrapeLeetCode = async (browser) => {
    console.log("🔵 Fetching LeetCode problems...");
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0");

    let allProblems = [];

    for (let pageNum = 1; pageNum <= 2; pageNum++) {
        const url = `https://leetcode.com/problemset/all/?page=${pageNum}`;
        try {
            console.log(`📄 Scraping LeetCode page ${pageNum}`);
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 180000 });
            await page.waitForSelector('[role="rowgroup"]', { timeout: 60000 });

            const problems = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('div[role="row"]')).map(row => {
                    const titleElement = row.querySelector('.h-5');
                    const difficultyElement = row.querySelector('span.rounded');
                    return {
                        title: titleElement ? titleElement.textContent.trim() : "Unknown",
                        url: titleElement ? "https://leetcode.com" + titleElement.getAttribute('href') : "#",
                        difficulty: difficultyElement ? difficultyElement.textContent.trim() : "N/A",
                        topic: "Fetching...",
                        source: "LeetCode"
                    };
                });
            });

            allProblems = allProblems.concat(problems);
        } catch (err) {
            console.log(`⚠️ Failed LeetCode page ${pageNum}:`, err.message);
        }

        await delay(2000);
    }

    await page.close();

    const topicPage = await browser.newPage();
    for (let problem of allProblems) {
        if (problem.title === "Unknown") continue;

        try {
            console.log(`🔍 Fetching topic for: ${problem.title}`);
            await topicPage.goto(problem.url, { waitUntil: 'networkidle2', timeout: 60000 });
            await topicPage.waitForSelector('a[href*="/tag/"]', { timeout: 20000 });

            problem.topic = await topicPage.evaluate(() => {
                return Array.from(document.querySelectorAll('a[href*="/tag/"]'))
                    .map(tag => tag.textContent.trim())
                    .join(', ') || "Unknown";
            });
        } catch {
            problem.topic = "Unknown";
        }

        await delay(1000);
    }

    await topicPage.close();

    for (let problem of allProblems) {
        const descPage = await browser.newPage();
        try {
            console.log(`📝 Fetching description for: ${problem.title}`);
            await descPage.goto(problem.url, { waitUntil: 'networkidle2', timeout: 60000 });
            await descPage.waitForSelector('div[data-track-load="description_content"]', { timeout: 30000 });

            const description = await descPage.evaluate(() => {
                const container = document.querySelector('div[data-track-load="description_content"]');
                return container ? container.innerText.trim() : "No description available.";
            });

            await QuestionWithDesc.findOneAndUpdate(
                { title: problem.title, source: problem.source },
                { $set: { ...problem, description } },
                { upsert: true, new: true }
            );

            await descPage.close();
        } catch {
            await descPage.close();
            await QuestionWithDesc.findOneAndUpdate(
                { title: problem.title, source: problem.source },
                { $set: { ...problem, description: "No description available." } },
                { upsert: true, new: true }
            );
        }

        await delay(1000);
    }

    console.log("✅ LeetCode scraping complete.");
};

// ---------- Codeforces Scraper ----------
const scrapeCodeforces = async (browser) => {
    console.log("🔴 Fetching Codeforces problems...");
    try {
        const response = await fetch("https://codeforces.com/api/problemset.problems");
        const data = await response.json();

        if (data.status !== "OK") throw new Error("Failed to fetch Codeforces problems.");

        const allProblems = data.result.problems.map(problem => ({
            title: problem.name,
            url: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`,
            difficulty: problem.rating || "N/A",
            topic: problem.tags.length ? problem.tags.join(', ') : "Unknown",
            source: "Codeforces"
        }));

        const page = await browser.newPage();

        for (let problem of allProblems.slice(0, 50)) {
            try {
                console.log(`📝 Fetching description for: ${problem.title}`);
                await page.goto(problem.url, { waitUntil: 'networkidle2', timeout: 60000 });
                await page.waitForSelector('.problem-statement', { timeout: 20000 });

                const description = await page.evaluate(() => {
                    const container = document.querySelector('.problem-statement');
                    return container ? container.innerText.trim() : "No description available.";
                });

                await QuestionWithDesc.findOneAndUpdate(
                    { title: problem.title, source: problem.source },
                    { $set: { ...problem, description } },
                    { upsert: true, new: true }
                );
            } catch {
                await QuestionWithDesc.findOneAndUpdate(
                    { title: problem.title, source: problem.source },
                    { $set: { ...problem, description: "No description available." } },
                    { upsert: true, new: true }
                );
            }

            await delay(1000);
        }

        await page.close();
        console.log("✅ Codeforces scraping complete.");
    } catch (error) {
        console.error(`❌ Codeforces Scraping Error: ${error.message}`);
    }
};

// ---------- CodeChef Scraper (Updated UI) ----------
const scrapeCodeChef = async (browser) => {
    console.log("🟠 Fetching CodeChef problems...");
    const page = await browser.newPage();
    const baseUrl = 'https://www.codechef.com/practice?end_rating=4000&group=all&hints=0&limit=20&page=';
    let currentPage = 1;

    while (currentPage <= 1) {
        const url = `${baseUrl}${currentPage}`;
        console.log(`📄 Scraping CodeChef page ${currentPage}`);

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 180000 });

        await page.waitForSelector('[data-testid="problem-card"]', { timeout: 30000 });
        await delay(2000);

        const problems = await page.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('[data-testid="problem-card"]'));
            return cards.map(card => {
                const titleEl = card.querySelector('h5');
                const linkEl = card.querySelector('a');
                const difficultyEl = card.querySelector('[data-testid="difficulty-tag"]');

                return {
                    title: titleEl?.textContent.trim() || "Unknown",
                    url: linkEl?.href || "#",
                    difficulty: difficultyEl?.textContent.trim() || "N/A",
                    topic: "Unknown",
                    source: "CodeChef"
                };
            });
        });

        for (let problem of problems) {
            const probPage = await browser.newPage();
            try {
                console.log(`📝 Fetching description for: ${problem.title}`);
                await probPage.goto(problem.url, { waitUntil: 'networkidle2', timeout: 60000 });

                await probPage.waitForSelector('[class*="problem-statement"]', { timeout: 30000 });

                const description = await probPage.evaluate(() => {
                    const container = document.querySelector('[class*="problem-statement"]');
                    return container ? container.innerText.trim() : "No description available.";
                });

                await QuestionWithDesc.findOneAndUpdate(
                    { title: problem.title, source: problem.source },
                    { $set: { ...problem, description } },
                    { upsert: true, new: true }
                );
            } catch (err) {
                console.error(`⚠️ Failed to fetch/save ${problem.title}:`, err.message);

                await QuestionWithDesc.findOneAndUpdate(
                    { title: problem.title, source: problem.source },
                    { $set: { ...problem, description: "No description available." } },
                    { upsert: true, new: true }
                );
            }

            await probPage.close();
            await delay(1000);
        }

        currentPage++;
        await delay(2000);
    }

    await page.close();
    console.log("✅ CodeChef scraping complete.");
};

// ---------- Main Runner ----------
(async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");

        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        // Uncomment as needed
        // await scrapeLeetCode(browser);
        // await scrapeCodeforces(browser);
        await scrapeCodeChef(browser);

        await browser.close();
        await mongoose.connection.close();
        console.log("🛑 Browser and DB connection closed.");
    } catch (err) {
        console.error("❌ Unified Scraper Error:", err);
    }
})();
