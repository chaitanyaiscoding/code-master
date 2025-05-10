import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  difficulty: { type: String, default: "N/A" },
  topic: { type: String, default: "Unknown" },
  source: { type: String, required: true }, 
});

export default mongoose.model("Question", QuestionSchema);
