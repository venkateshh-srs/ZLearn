// models/LearningHistory.js
import mongoose from "mongoose";
import { nanoid } from "nanoid";

const messageSchema = new mongoose.Schema(
  {
    id: Number,
    sender: String,
    text: String,
    thinking: Boolean,

    prompts: {
      type: [String], // optional
      default: [],
    },

    image: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    images: {
      type: [String],
      default: null,
    },

    imageContext: {
      type: [
        {
          role: { type: String }, // "model" | "function"
          parts: [
            {
              functionCall: {
                name: String,
                args: mongoose.Schema.Types.Mixed,
              },
              functionResponse: {
                name: String,
                response: mongoose.Schema.Types.Mixed,
              },
            },
          ],
        },
      ],
      default: [],
    },
  },
  { _id: false }
);

const chatThreadSchema = new mongoose.Schema(
  {
    id: Number,
    messages: [messageSchema],
  },
  { _id: false }
);

const subSubtopicSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
  },
  { _id: false }
);

const subtopicSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    subtopics: [subSubtopicSchema],
  },
  { _id: false }
);

const topicSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    subtopics: [subtopicSchema],
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      default: () => `${nanoid(10)}`,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    topics: [topicSchema],
    chatThreads: {
      type: Map,
      of: [messageSchema], // ✅ each thread is a list of messages
    },
    relatedTopicsByThread: {
      type: Map,
      of: [String],
    },
    completedSubtopics: [String],
    llmResponsesByTopic: {
      type: Map,
      of: messageSchema,
      default: {},
    },
    quizzes: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
    currentChat: {
      topicId: String,
      subtopicId: { type: String, default: null },
      subtopicName: { type: String, default: "" },
    },
    lastAccessed: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const Course = mongoose.model("Course", courseSchema);
