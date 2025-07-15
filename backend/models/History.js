import mongoose from "mongoose";

const courseProgressSchema = new mongoose.Schema(
  {
    courseId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: "",
    },
    totalTopics: {
      type: Number,
      required: true,
    },
    completedTopics: {
      type: Number,
      required: true,
      default: 0,
    },
    lastAccessed: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const learningHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    courses: {
      type: [courseProgressSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export const LearningHistory = mongoose.model(
  "LearningHistory",
  learningHistorySchema
);
