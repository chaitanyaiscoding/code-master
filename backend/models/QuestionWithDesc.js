import mongoose from 'mongoose';

const QuestionWithDescSchema = new mongoose.Schema({
    title: { type: String, required: true },
    url: { type: String, required: true },
    difficulty: { type: String, default: "N/A" },
    topic: { type: String, default: "Unknown" },
    source: { type: String, required: true },
    description: { type: String, default: "No description available." }
});

// Add compound index for unique (title, source) pair
QuestionWithDescSchema.index({ title: 1, source: 1 }, { unique: true });

export default mongoose.model("QuestionWithDesc", QuestionWithDescSchema);
