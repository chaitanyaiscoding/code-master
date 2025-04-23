import mongoose from "mongoose";

const solvedQuestionSchema = new mongoose.Schema({
  email: { type: String, required: true },
  questionId: { type: String, required: true },
  questionTitle: { type: String, required: true },
  topic: { type: String, required: true },
  solvedAt: { type: Date, default: Date.now }
});

const SolvedQuestion = mongoose.model("SolvedQuestion", solvedQuestionSchema);
export default SolvedQuestion;
