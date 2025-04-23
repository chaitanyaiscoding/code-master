import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import compilerRoutes from "./compiler.js";
import Question from "./models/Question.js";
import puppeteer from "puppeteer";
import User from "./models/User.js";
import authRoutes from './routes/auth.js';
import bcrypt from 'bcrypt';
import auth from './middleware/auth.js';
import solvedRoutes from './routes/solvedRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(solvedRoutes);

mongoose.connect(process.env.MONGO_URI, { dbName: "cf_cc_questions" })
  .then(() => console.log("✅ Connected to MongoDB: cf_cc_questions"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Search Route
app.get("/api/search", async (req, res) => {
  const { topic } = req.query;
  if (!topic) {
    return res.status(400).json({ error: "Topic is required" });
  }

  try {
    const questions = await Question.find({
      topic: { $regex: new RegExp(topic, "i") },
    });

    res.json(questions);
  } catch (error) {
    console.error("❌ Server Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Scrape Description Route
app.get("/api/scrapeDescription", async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
    );

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    let description = "Description not available.";

    if (url.includes("leetcode.com")) {
      try {
        await page.waitForSelector('.elfjS, [data-track-load="description_content"]', { timeout: 15000 });
        description = await page.evaluate(() => {
          const el = document.querySelector('.elfjS') || document.querySelector('[data-track-load="description_content"]');
          return el ? el.innerText.trim() : "Description not available.";
        });
      } catch (e) {
        console.log("LeetCode selector not found");
      }

    } else if (url.includes("codeforces.com")) {
      try {
        await page.waitForSelector('.problem-statement', { timeout: 15000 });
        description = await page.evaluate(() => {
          const el = document.querySelector('.problem-statement');
          return el ? el.innerText.trim() : "Description not available.";
        });
      } catch (e) {
        console.log("Codeforces selector not found");
      }

    } else if (url.includes("codechef.com")) {
      try {
        await page.waitForSelector('._problem-statement__inner__container_1k4dt_121', { timeout: 15000 });
        description = await page.evaluate(() => {
          const el = document.querySelector('._problem-statement__inner__container_1k4dt_121');
          return el ? el.innerText.trim() : "Description not available.";
        });
      } catch (e) {
        console.log("CodeChef selector not found");
      }
    }

    await browser.close();
    res.json({ description });
  } catch (error) {
    console.error("Error scraping description:", error);
    if (browser) await browser.close();
    res.status(500).json({ error: "Failed to scrape description. Please try again later." });
  }
});

// Authenticated Test Route
app.get('/api/protected', auth, (req, res) => {
  res.json({ message: `Hello ${req.user.email}, you're authenticated!` });
});

// Signup Route
app.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword, name });
    await newUser.save();

    res.status(201).json({ message: 'Signup successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

    res.status(200).json({ message: 'Login successful', user: { email, name: user.name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Question By ID
app.get("/api/question/:id", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    res.json(question);
  } catch (error) {
    console.error("Error fetching question:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Compiler Route
app.use("/api/compiler", compilerRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
