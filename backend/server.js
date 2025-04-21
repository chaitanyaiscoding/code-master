import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import compilerRoutes from "./compiler.js";
import Question from "./models/Question.js";
import puppeteer from "puppeteer";  // Import Puppeteer
import User from "./models/User.js";
import authRoutes from './routes/auth.js';
import bcrypt from 'bcrypt';
import auth from './middleware/auth.js'; // Import the middleware

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

mongoose.connect(process.env.MONGO_URI, { dbName: "cf_cc_questions" })
  .then(() => console.log("✅ Connected to MongoDB: cf_cc_questions"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Search API Route
app.get("/api/search", async (req, res) => {
  const { topic } = req.query;
  if (!topic) {
    return res.status(400).json({ error: "Topic is required" });
  }
  try {
    const questions = await Question.find({
      topic: { $regex: new RegExp(topic, "i") },
    });
    if (questions.length === 0) {
      return res.status(404).json({ error: "No questions found for this topic" });
    }
    res.json(questions);
  } catch (error) {
    console.error("❌ Server Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get('/api/protected', auth, (req, res) => {
  res.json({ message: `Hello ${req.user.email}, you're authenticated!` });

});
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
// Get a single question by ID
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

app.get("/api/scrapeDescription", async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    let description = "Description not available.";

    if (url.includes("leetcode.com")) {
      try {
        await page.waitForSelector('.elfjS, [data-track-load="description_content"]', { timeout: 10000 });
        description = await page.evaluate(() => {
          const element = document.querySelector('.elfjS') || document.querySelector('[data-track-load="description_content"]');
          return element ? element.innerText.trim() : "Description not available.";
        });
      } catch {
        description = "Description not available.";
      }

    } else if (url.includes("codeforces.com")) {
      try {
        await page.waitForSelector('.problem-statement', { timeout: 10000 });
        description = await page.evaluate(() => {
          const element = document.querySelector('.problem-statement');
          return element ? element.innerText.trim() : "Description not available.";
        });
      } catch {
        description = "Description not available.";
      }

    } else if (url.includes("codechef.com")) {
      try {
        await page.waitForSelector('._problem-statement__inner__container_1k4dt_121', { timeout: 10000 });
        description = await page.evaluate(() => {
          const element = document.querySelector('._problem-statement__inner__container_1k4dt_121');
          return element ? element.innerText.trim() : "Description not available.";
        });
      } catch {
        description = "Description not available.";
      }
    }

    await browser.close();
    res.json({ description });
  } catch (error) {
    console.error("Error scraping description:", error);
    res.status(500).json({ error: "Failed to scrape description" });
  }
});


app.use("/api/compiler", compilerRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
