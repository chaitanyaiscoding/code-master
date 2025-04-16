import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import mongoose from 'mongoose';
import QuestionWithDesc from './models/QuestionWithDesc.js'; // your schema

puppeteer.use(StealthPlugin());

const MONGO_URI = 'mongodb://localhost:27017/cf_cc_lc_test';

try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");
} catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
}

const delay = ms => new Promise(res => setTimeout(res, ms));

(async () => {
    console.log("🔵 Fetching LeetCode problems...");

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

    let allProblems = [];

    try {
        const url = `https://leetcode.com/problemset/all/?page=1`;
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 180000 });
        await page.waitForSelector('[role="rowgroup"]', { timeout: 90000 });

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

        console.log(`✅ Found ${problems.length} problems on Page 1`);
        allProblems = problems;

        const topicPage = await browser.newPage();
        await topicPage.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

        for (let i = 0; i < Math.min(5, allProblems.length); i++) {
            const problem = allProblems[i];
            try {
                console.log(`🔍 Fetching topic for: ${problem.title}`);
                await topicPage.goto(problem.url, { waitUntil: 'networkidle2', timeout: 60000 });
                await topicPage.waitForSelector('a[href*="/tag/"]', { timeout: 20000 });

                problem.topic = await topicPage.evaluate(() => {
                    return Array.from(document.querySelectorAll('a[href*="/tag/"]'))
                        .map(tag => tag.textContent.trim())
                        .join(', ') || "Unknown";
                });
                console.log(`✅ Topic fetched: ${problem.topic}`);
            } catch (err) {
                console.log(`⚠️ Failed to fetch topic for: ${problem.title}`);
                problem.topic = "Unknown";
            }
            await delay(2000);
        }

        await topicPage.close();

        // Description extraction
        for (let i = 0; i < Math.min(5, allProblems.length); i++) {
            const problem = allProblems[i];
            try {
                const descPage = await browser.newPage();
                console.log(`📝 Fetching description for: ${problem.title}`);
                await descPage.goto(problem.url, { waitUntil: 'networkidle2', timeout: 60000 });

                await descPage.waitForSelector('div[data-track-load="description_content"]', { timeout: 30000 });

                const description = await descPage.evaluate(() => {
                    const container = document.querySelector('div[data-track-load="description_content"]');
                    return container ? container.innerText.trim() : "No description available.";
                });

                await descPage.close();

                await QuestionWithDesc.create({
                    ...problem,
                    description
                });

                console.log(`✅ Stored: ${problem.title}`);
            } catch (err) {
                console.log(`❌ Failed to fetch/store description for: ${problem.title}`);
                problem.description = "No description available.";
                await QuestionWithDesc.create(problem);
            }

            await delay(1500);
        }

    } catch (error) {
        console.error("❌ Error during scraping:", error);
    }

    await browser.close();
    mongoose.connection.close();
    console.log("🛑 Browser and DB connection closed.");
})();
