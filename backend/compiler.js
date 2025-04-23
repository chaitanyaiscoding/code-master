import express from "express";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com/submissions";
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY; // ✅ Load API Key from .env

// Language IDs: Python (71), Java (62), C++ (54)
const languageIds = {
  python: 71,
  java: 62,
  cpp: 54,
};

// Compile & run code
router.post("/run", async (req, res) => {
  const { language, code, input } = req.body;

  if (!languageIds[language]) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  try {
    // ✅ Submit code for execution
    const submissionResponse = await axios.post(
      `${JUDGE0_API_URL}?base64_encoded=false&wait=true`, // ✅ Correct API URL
      {
        source_code: code,
        language_id: languageIds[language],
        stdin: input,
      },
      {
        headers: {
          "X-RapidAPI-Key": JUDGE0_API_KEY, // ✅ Include API Key
          "Content-Type": "application/json",
        },
      }
    );

    // ✅ Response from Judge0
    const result = submissionResponse.data;
    res.json(result);
  } catch (error) {
    console.error("❌ Execution Error:", error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || "Execution failed" });
  }
});

export default router;