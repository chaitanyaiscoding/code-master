import mongoose from "mongoose";

const TestCaseSchema = new mongoose.Schema({
  problemTitle: { type: String, required: true }, // Matches Question title
  problemSource: { type: String, enum: ["Codeforces", "CodeChef", "LeetCode"], required: true },
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
});

const TestCase = mongoose.model("TestCase", TestCaseSchema);
export default TestCase;
