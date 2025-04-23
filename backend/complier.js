import express from "express";
import axios from "axios";

const router = express.Router();
const JUDGE0_API_URL = "https://ce.judge0.com/submissions/";
const JUDGE0_API_KEY = ""; // Add API key if using private Judge0

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
    // Step 1: Send code to Judge0
    const submission = await axios.post(JUDGE0_API_URL, {
      source_code: code,
      language_id: languageIds[language],
      stdin: input,
    });

    const token = submission.data.token;

    // Step 2: Fetch result after a short delay
    setTimeout(async () => {
      const result = await axios.get(`${JUDGE0_API_URL}/${token}`);
      res.json(result.data);
    }, 3000); // Wait for execution
  } catch (error) {
    res.status(500).json({ error: "Execution failed" });
  }
});

export default router;