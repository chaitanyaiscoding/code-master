import mongoose from "mongoose";
import puppeteer from "puppeteer";
import CodeforcesProblem from './models/CodeforcesProblem.js';  // Assuming you're using this model

const scrapeCodeforces = async (browser) => {
  console.log("🔴 Scraping Codeforces problems...");

  try {
    const res = await fetch("https://codeforces.com/api/problemset.problems");
    const data = await res.json();

    if (data.status !== "OK") throw new Error("Failed to fetch Codeforces problems.");

    const problems = data.result.problems.slice(0, 5).map((problem) => ({
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
        await page.goto(prob.url, { waitUntil: "domcontentloaded", timeout: 60000 });

        const selector = ".problem-statement";
        const found = await page.$(selector);

        if (found) {
          description = await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            return el ? el.textContent.trim() : "No description available.";
          }, selector);
        } else {
          console.log(`⚠️ Selector not found for: ${prob.title}`);
        }

        await page.close();
      } catch (err) {
        console.log(`⚠️ Error fetching description for: ${prob.title} - ${err.message}`);
      }

      try {
        // Check if the problem already exists in the collection
        const existing = await CodeforcesProblem.findOne({ title: prob.title, source: prob.source });
        
        if (existing) {
          console.log(`⚡ Skipped (already exists): ${prob.title}`);
          skipped++;
        } else {
          await CodeforcesProblem.create({ ...prob, description });
          console.log(`✅ Stored Codeforces problem: ${prob.title}`);
          inserted++;
        }
      } catch (err) {
        console.error(`❌ Failed to save question: ${prob.title}`, err.message);
      }
    }

    console.log(`📊 Scraping complete: Inserted ${inserted} | Skipped ${skipped}`);
  } catch (err) {
    console.error("❌ Codeforces Scraping Error:", err.message);
  }
};
