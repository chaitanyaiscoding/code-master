import mongoose from "mongoose";

const TestCaseSchema = new mongoose.Schema({
  problemTitle: { type: String, required: true }, // Must match the problem title in cf_cc_questions
  problemSource: { type: String, required: true }, // Codeforces, CodeChef, LeetCode
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
});

export default mongoose.model("TestCase", TestCaseSchema);
