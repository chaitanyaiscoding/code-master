import puppeteer from "puppeteer";
import mongoose from "mongoose";
import dotenv from "dotenv";
import QuestionWithDesc from "./models/QuestionWithDesc.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/cf_cc_lc_test";
const baseUrl = "https://www.codechef.com/practice-old/topics/";

const scrapeCodeChef = async (browser) => {
  const page = await browser.newPage();

  try {
    console.log("🟠 Scraping CodeChef topics...");
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

    await page.waitForSelector(
      '#vertical-tab-panel-0 div.MuiFormControl-root label span.MuiTypography-root',
      { timeout: 15000 }
    );

    const topics = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll(
          '#vertical-tab-panel-0 div.MuiFormControl-root label span.MuiTypography-root'
        )
      ).map((el) => el.innerText.trim().toLowerCase().replace(/\s+/g, "-"));
    });

    console.log(`✅ Found ${topics.length} topics`);

    let problemCount = 0;

    for (const topic of topics) {
      if (problemCount >= 2) break;

      console.log(`🔍 Scraping topic: ${topic}`);
      await page.goto(`${baseUrl}${topic}`, { waitUntil: "domcontentloaded" });

      try {
        await page.waitForSelector(
          "td.MuiTableCell-root div._tableCell__link_14me2_257",
          { timeout: 15000 }
        );

        const problems = await page.evaluate((topic) => {
          return Array.from(
            document.querySelectorAll("td.MuiTableCell-root div._tableCell__link_14me2_257")
          ).map((el) => {
            const row = el.closest("tr");
            const difficultyEl = row?.querySelector("td:nth-child(3) > div");
            const title = el.innerText.trim();
            const url = `https://www.codechef.com/problems/${title}`;
            return {
              title,
              url,
              difficulty: difficultyEl ? difficultyEl.innerText.trim() : "N/A",
              topic,
              source: "CodeChef",
            };
          });
        }, topic);

        for (let problem of problems) {
          if (problemCount >= 2) break;

          const exists = await QuestionWithDesc.findOne({ title: problem.title });
          if (exists) {
            console.log(`⏩ Skipping existing problem: ${problem.title}`);
            continue;
          }

          let description = "No description available.";
          try {
            const descPage = await browser.newPage();
            await descPage.goto(problem.url, { waitUntil: "networkidle2", timeout: 60000 });

            await descPage.waitForSelector("#problem-statement", { timeout: 15000 });

            description = await descPage.evaluate(() => {
              const el = document.querySelector("#problem-statement");
              return el ? el.textContent.trim() : "No description available.";
            });

            await descPage.close();
          } catch (err) {
            console.log(`⚠️ Couldn't fetch description for: ${problem.title}`);
          }

          await QuestionWithDesc.create({ ...problem, description });
          console.log(`✅ Stored CodeChef problem: ${problem.title}`);
          problemCount++;
        }
      } catch (err) {
        console.log(`⚠️ Skipping topic ${topic}:`, err.message);
      }
    }

  } catch (err) {
    console.error("❌ CodeChef Scraping Error:", err.message);
  } finally {
    await page.close();
  }
};

// ✅ Runner to execute the function
(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    await scrapeCodeChef(browser);

    await browser.close();
    await mongoose.connection.close();
    console.log("🛑 Browser and DB connection closed.");
  } catch (err) {
    console.error("❌ Error in scrapeCodeChef.js:", err.message);
  }
})();
