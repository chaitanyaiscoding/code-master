import mongoose from "mongoose";
import Question from "./models/Question.js"; // adjust path if needed
import topicMap from "./utils/topicMap.js";

// Connect to MongoDB
const MONGO_URI = "mongodb://127.0.0.1:27017/cf_cc_questions";

async function normalize() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const questions = await Question.find({});
  for (const q of questions) {
    const rawTopics = q.topic.split(",").map(t => t.trim());
    const normalizedTopics = rawTopics.map(t => topicMap[t] || t);
    const uniqueNormalized = [...new Set(normalizedTopics)];
    const finalTopic = uniqueNormalized.join(", ");

    if (q.topic !== finalTopic) {
      q.topic = finalTopic;
      await q.save();
      console.log(`✅ Updated "${q.title}" to: ${finalTopic}`);
    }
  }

  console.log("🎉 Normalization complete.");
  mongoose.disconnect();
}

normalize().catch(err => console.error("❌ Error:", err));
