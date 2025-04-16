import puppeteer from "puppeteer";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Question from "./models/Question.js";
// import LeetCode from "leetcode-query";
// import puppeteer from "puppeteer";

dotenv.config();

// Connect to the MongoDB database
mongoose
  .connect(process.env.MONGO_URI, { dbName: "cf_cc_questions" })
  .then(() => console.log("✅ Connected to MongoDB: cf_cc_questions"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ---------- Codeforces Scraper ----------
async function scrapeCodeforces() {
  console.log("🔍 Fetching Codeforces problems...");

  try {
    const response = await fetch("https://codeforces.com/api/problemset.problems");
    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error("Failed to fetch Codeforces problems.");
    }

    const problems = data.result.problems.map((problem) => ({
      title: problem.name,
      url: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`,
      difficulty: problem.rating || "N/A",
      topic: problem.tags.length > 0 ? problem.tags.join(", ") : "Unknown",
      source: "Codeforces",
    }));

    console.log("🔍 First 5 Codeforces problems:", problems.slice(0, 5));

    if (problems.length > 0) {
      await Question.insertMany(problems);
      console.log(`✅ Successfully stored ${problems.length} Codeforces problems.`);
    } else {
      console.log("❌ No Codeforces problems found.");
    }
  } catch (error) {
    console.error(`❌ Codeforces Scraping Error: ${error.message}`);
  }
}

// ---------- CodeChef Scraper ----------
const baseUrl = "https://www.codechef.com/practice-old/topics/";

async function scrapeCodeChef() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log("🔍 Fetching available CodeChef topics...");
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

    console.log(`✅ Found ${topics.length} topics:`, topics);

    for (let topic of topics) {
      console.log(`🔍 Scraping topic: ${topic}`);
      await page.goto(`${baseUrl}${topic}`, { waitUntil: "domcontentloaded" });

      try {
        await page.waitForSelector("td.MuiTableCell-root div._tableCell__link_14me2_257", { timeout: 15000 });

        const problems = await page.evaluate((topic) => {
          return Array.from(
            document.querySelectorAll("td.MuiTableCell-root div._tableCell__link_14me2_257")
          )
            .map((el) => {
              const row = el.closest("tr");
              const difficultyElement = row ? row.querySelector("td:nth-child(3) > div") : null;
              const difficulty = difficultyElement ? difficultyElement.innerText.trim() : "N/A";
              const title = el.innerText.trim();
              const url = `https://www.codechef.com/problems/${title}`;
              return { title, url, difficulty, topic, source: "CodeChef" };
            })
            .filter((problem) => problem.title);
        }, topic);

        console.log(`✅ Found ${problems.length} problems for topic: ${topic}`);

        if (problems.length > 0) {
          await Question.insertMany(problems);
          console.log(`📌 Stored ${problems.length} CodeChef problems in MongoDB.`);
        }
      } catch (error) {
        console.error(`❌ Skipping topic ${topic} due to error: ${error.message}`);
      }
    }
  } catch (error) {
    console.error("❌ CodeChef Scraping Error:", error);
  } finally {
    await browser.close();
  }
}



// ✅ Scroll function to load all problems
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 300;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= document.body.scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 500);
    });
  });
}


// Execute the scrapers
(async () => {
  await scrapeCodeforces();
  await scrapeCodeChef();
})();
