import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import mongoose from 'mongoose';
import Question from './models/Question.js';

puppeteer.use(StealthPlugin()); // Stealth mode to bypass detection

// MongoDB Connection
const MONGO_URI = 'mongodb://localhost:27017/cf_cc_questions';

try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");
} catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
}

// Delay function
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
        for (let pageNum = 1; pageNum <= 2; pageNum++) {
            console.log(`🔄 Scraping Page ${pageNum}...`);
            const url = `https://leetcode.com/problemset/all/?page=${pageNum}`;

            await page.goto(url, { waitUntil: 'networkidle2', timeout: 180000 });

            await page.waitForSelector('[role="rowgroup"]', { timeout: 90000 });

            let problems = await page.evaluate(() => {
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

            console.log(`✅ Found ${problems.length} problems on Page ${pageNum}`);
            allProblems = [...allProblems, ...problems];
        }

        console.log(`🎯 Total Problems Extracted: ${allProblems.length}. Fetching topics...`);

        const problemPage = await browser.newPage();
        await problemPage.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

        for (let i = 0; i < allProblems.length; i++) {
            try {
                console.log(`🔍 Fetching topics for: ${allProblems[i].title}`);
                await problemPage.goto(allProblems[i].url, { waitUntil: 'networkidle2', timeout: 60000 });

                await problemPage.waitForSelector('a[href*="/tag/"]', { timeout: 20000 });

                allProblems[i].topic = await problemPage.evaluate(() => {
                    return Array.from(document.querySelectorAll('a[href*="/tag/"]'))
                        .map(tag => tag.textContent.trim())
                        .join(', ') || "Unknown";
                });

                console.log(`✅ ${allProblems[i].title} → ${allProblems[i].topic}`);
            } catch (err) {
                console.log(`⚠️ Failed to fetch topics for: ${allProblems[i].title}`);
                allProblems[i].topic = "Unknown";
            }

            await delay(2000); // Add a 2-second delay between requests
        }

        await problemPage.close();

        // Store in MongoDB
        if (allProblems.length > 0) {
            await Question.insertMany(allProblems);
            console.log("✅ Successfully stored LeetCode problems in MongoDB.");
        } else {
            console.log("⚠️ No problems extracted.");
        }
    } catch (error) {
        console.error("❌ Error:", error);
    }

    await browser.close();
    mongoose.connection.close();
})();
