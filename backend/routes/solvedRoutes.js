import express from 'express';
import SolvedQuestion from '../models/SolvedQuestion.js';

const router = express.Router();

// ✅ Mark question as solved
router.post('/mark-solved', async (req, res) => {
  const { email, questionId, questionTitle, topic } = req.body;

  try {
    const existing = await SolvedQuestion.findOne({ email, questionId });

    if (existing) {
      return res.json({ message: "You've already marked this question as solved!" });
    }

    const solved = new SolvedQuestion({ email, questionId, questionTitle, topic });
    await solved.save();

    res.json({ message: "Question marked as solved successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error marking question as solved." });
  }
});


// ✅ ML Weak Topic Prediction Route
router.get('/predict-weakness/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const solved = await SolvedQuestion.find({ email });

    if (!solved || solved.length === 0) {
      return res.status(404).json({ message: "No solved questions found for this user." });
    }

    // Count topics
    const topicCount = {};
    for (let q of solved) {
      topicCount[q.topic] = (topicCount[q.topic] || 0) + 1;
    }

    // Sort topics by least solved
    const sortedTopics = Object.entries(topicCount).sort((a, b) => a[1] - b[1]);

    const weakestTopics = sortedTopics.slice(0, 3).map(([topic, count]) => ({
      topic,
      solvedCount: count
    }));

    res.json({ weakestTopics });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error predicting weak topics." });
  }
});

export default router;
