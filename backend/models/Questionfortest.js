import mongoose from "mongoose";

const TestCaseSchema = new mongoose.Schema({
  problemTitle: { type: String, required: true }, 
  problemSource: { type: String, required: true }, 
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
});

export default mongoose.model("TestCase", TestCaseSchema);
