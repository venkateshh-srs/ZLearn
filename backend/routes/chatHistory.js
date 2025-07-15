import express from "express";
import { LearningHistory } from "../models/History.js";
import { protect } from "../middleware/authMiddleware.js";


const router = express.Router();

// @desc    Save chat history
// @route   POST /api/chathistory
// @access  Private
router.post("/", protect, async (req, res) => {
  const { course, topic, messages } = req.body;

  if (!course || !topic || !messages) {
    return res
      .status(400)
      .json({ message: "Please provide course, topic, and messages" });
  }

  try {
    // Check if chat history already exists for this topic
    let chatHistory = await LearningHistory.findOne({
      user: req.user.id,
      course,
      topic,
    });

    if (chatHistory) {
      // If it exists, update it
      chatHistory.messages = messages;
      const updatedChatHistory = await chatHistory.save();
      res.json(updatedChatHistory);
    } else {
      // If not, create a new one
      chatHistory = new LearningHistory({
        user: req.user.id,
        course,
        topic,
        messages,
      });

      const createdChatHistory = await chatHistory.save();
      res.status(201).json(createdChatHistory);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Get chat history for a topic
// @route   GET /api/chathistory/:courseId/:topic
// @access  Private
router.get("/:courseId/:topic", protect, async (req, res) => {
  try {
    const { courseId, topic } = req.params;
    const chatHistory = await ChatHistory.findOne({
      user: req.user.id,
      course: courseId,
      topic: topic,
    });

    if (chatHistory) {
      res.json(chatHistory);
    } else {
      res.status(404).json({ message: "Chat history not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
