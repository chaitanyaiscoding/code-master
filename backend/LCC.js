import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Question from "./models/Question.js";
import TestCase from "./models/TestCase.js";

puppeteer.use(StealthPlugin());
dotenv.config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { dbName: "cf_cc_questions" })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ---------------------- Helper Function to Insert Questions Safely ----------------------
async function saveQuestion(problem) {
  const existingQuestion = await Question.findOne({ title: problem.title, source: problem.source });
  if (!existingQuestion) {
    await Question.create(problem);
    console.log(`✅ Added question: ${problem.title}`);
  } else {
    console.log(`⚠️ Skipped duplicate question: ${problem.title}`);
  }
}

// ---------------------- Helper Function to Insert Test Cases Safely ----------------------
async function saveTestCase(problem, testCase) {
  const existingTestCase = await TestCase.findOne({
    problemTitle: problem.title,
    problemSource: problem.source,
    input: testCase.input,
  });

  if (!existingTestCase) {
    await TestCase.create({
      problemTitle: problem.title,
      problemSource: problem.source,
      ...testCase,
    });
    console.log(`✅ Added test case for: ${problem.title}`);
  } else {
    console.log(`⚠️ Skipped duplicate test case for: ${problem.title}`);
  }
}

// ---------------------- Codeforces Scraper ----------------------
async function scrapeCodeforces() {
  console.log("🔍 Fetching Codeforces problems...");

  try {
    const response = await fetch("https://codeforces.com/api/problemset.problems");
    const data = await response.json();

    if (data.status !== "OK") throw new Error("Failed to fetch Codeforces problems.");

    const problems = data.result.problems.map((problem) => ({
      title: problem.name,
      url: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`,
      difficulty: problem.rating || "N/A",
      topic: problem.tags.length > 0 ? problem.tags.join(", ") : "Unknown",
      source: "Codeforces",
    }));

    console.log(`✅ Found ${problems.length} Codeforces problems.`);

    for (let problem of problems) {
      await saveQuestion(problem);
      await scrapeCodeforcesTestCases(problem);
    }
  } catch (error) {
    console.error(`❌ Codeforces Scraping Error: ${error.message}`);
  }
}

async function scrapeCodeforcesTestCases(problem) {
  console.log(`🔍 Fetching test cases for ${problem.title}`);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(problem.url, { waitUntil: "domcontentloaded" });

  const testCases = await page.evaluate(() => {
    const inputs = [...document.querySelectorAll(".input pre")].map((el) => el.innerText);
    const outputs = [...document.querySelectorAll(".output pre")].map((el) => el.innerText);

    return inputs.map((input, index) => ({
      input,
      expectedOutput: outputs[index] || "",
    }));
  });

  for (let tc of testCases) {
    await saveTestCase(problem, tc);
  }

  await browser.close();
}

// ---------------------- CodeChef Scraper ----------------------
const baseUrl = "https://www.codechef.com/practice-old/topics/";

async function scrapeCodeChef() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  console.log("🔍 Fetching CodeChef problems...");
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

  const topics = await page.evaluate(() =>
    Array.from(document.querySelectorAll('label span.MuiTypography-root'))
      .map((el) => el.innerText.trim().toLowerCase().replace(/\s+/g, "-"))
  );

  for (let topic of topics) {
    console.log(`🔍 Scraping topic: ${topic}`);
    await page.goto(`${baseUrl}${topic}`, { waitUntil: "domcontentloaded" });

    const problems = await page.evaluate((topic) =>
      Array.from(document.querySelectorAll("td.MuiTableCell-root div._tableCell__link_14me2_257"))
        .map((el) => ({
          title: el.innerText.trim(),
          url: `https://www.codechef.com/problems/${el.innerText.trim()}`,
          difficulty: "N/A",
          topic,
          source: "CodeChef",
        }))
    );

    for (let problem of problems) {
      await saveQuestion(problem);
      await scrapeCodeChefTestCases(problem);
    }
  }

  await browser.close();
}

async function scrapeCodeChefTestCases(problem) {
  console.log(`🔍 Fetching test cases for ${problem.title}`);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(problem.url, { waitUntil: "domcontentloaded" });

  const testCases = await page.evaluate(() => {
    const inputs = [...document.querySelectorAll(".sample-test .input pre")].map((el) => el.innerText);
    const outputs = [...document.querySelectorAll(".sample-test .output pre")].map((el) => el.innerText);

    return inputs.map((input, index) => ({
      input,
      expectedOutput: outputs[index] || "",
    }));
  });

  for (let tc of testCases) {
    await saveTestCase(problem, tc);
  }

  await browser.close();
}

// ---------------------- LeetCode Scraper ----------------------
async function scrapeLeetCode() {
  console.log("🔍 Fetching LeetCode problems...");

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  let allProblems = [];

  for (let pageNum = 1; pageNum <= 2; pageNum++) {
    console.log(`🔄 Scraping Page ${pageNum}`);
    await page.goto(`https://leetcode.com/problemset/all/?page=${pageNum}`, { waitUntil: "networkidle2" });

    let problems = await page.evaluate(() =>
      Array.from(document.querySelectorAll('div[role="row"]')).map((row) => ({
        title: row.querySelector(".h-5")?.textContent.trim() || "Unknown",
        url: row.querySelector(".h-5")?.getAttribute("href")
          ? `https://leetcode.com${row.querySelector(".h-5").getAttribute("href")}`
          : "#",
        difficulty: row.querySelector("span.rounded")?.textContent.trim() || "N/A",
        topic: "Fetching...",
        source: "LeetCode",
      }))
    );

    allProblems = [...allProblems, ...problems];
  }

  for (let problem of allProblems) {
    await saveQuestion(problem);
    await scrapeLeetCodeTestCases(problem);
  }

  await browser.close();
}

async function scrapeLeetCodeTestCases(problem) {
  console.log(`🔍 Fetching test cases for ${problem.title}`);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(problem.url, { waitUntil: "domcontentloaded" });

  const testCases = await page.evaluate(() => {
    const inputs = [...document.querySelectorAll("pre[data-name='input']")].map((el) => el.innerText);
    const outputs = [...document.querySelectorAll("pre[data-name='output']")].map((el) => el.innerText);

    return inputs.map((input, index) => ({
      input,
      expectedOutput: outputs[index] || "",
    }));
  });

  for (let tc of testCases) {
    await saveTestCase(problem, tc);
  }

  await browser.close();
}

// Run Scrapers
(async () => {
  await scrapeCodeforces();
  // await scrapeCodeChef();
  // await scrapeLeetCode();
})();