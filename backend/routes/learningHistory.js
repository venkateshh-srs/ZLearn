import express from "express";
import { LearningHistory } from "../models/History.js";
import { protect } from "../middleware/authMiddleware.js";
import dbConnect from "../lib/dbConnect.js";

const router = express.Router();

// @desc    Get user's learning history
// @route   GET /api/history
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    await dbConnect();
    // console.log(req.user._id);
    const history = await LearningHistory.findOne({ userId: req.user._id });
    // console.log("history: ", history);
    if (history) {
      // sort courses by lastAccessed date descending
      history.courses.sort((a, b) => b.lastAccessed - a.lastAccessed);
      res.json(history);
    } else {
      // Return empty history if not found
      res.json({ userId: req.user.id, courses: [] });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Add or update a course in learning history
// @route   POST /api/history/courses
// @access  Private
router.post("/courses", protect, async (req, res) => {
  await dbConnect();
  const { courseId, title, totalTopics, completedTopics } = req.body;
  // console.log("sai ram");
  //   console.log(req.body);

  if (!courseId || !title || totalTopics === undefined) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    let history = await LearningHistory.findOne({ userId: req.user.id });

    if (!history) {
      history = new LearningHistory({
        userId: req.user.id,
        courses: [],
      });
    }

    const courseIndex = history.courses.findIndex(
      (c) => c.courseId === courseId
    );

    if (courseIndex > -1) {
      // Update existing course
      history.courses[courseIndex].lastAccessed = new Date();
      if (completedTopics !== undefined) {
        history.courses[courseIndex].completedTopics = completedTopics;
      }
      if (totalTopics !== undefined) {
        history.courses[courseIndex].totalTopics = totalTopics;
      }
      if (title) {
        history.courses[courseIndex].title = title;
      }
    } else {
      // Add new course
      history.courses.push({
        courseId,
        title,
        totalTopics,
        completedTopics: completedTopics || 0,
        lastAccessed: new Date(),
      });
    }

    await history.save();
    // sort courses by lastAccessed date descending
    history.courses.sort((a, b) => b.lastAccessed - a.lastAccessed);
    res.status(200).json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Remove a course from learning history
// @route   DELETE /api/history/courses/:courseId
// @access  Private
router.delete("/courses/:courseId", protect, async (req, res) => {
  // console.log("deleting course");
  try {
    await dbConnect();
    const { courseId } = req.params;
    const history = await LearningHistory.findOne({ userId: req.user._id });

    if (history) {
      history.courses = history.courses.filter(
        (course) => course.courseId !== courseId
      );
      await history.save();
      // sort courses by lastAccessed date descending
      history.courses.sort((a, b) => b.lastAccessed - a.lastAccessed);
      res.json(history);
    } else {
      res.status(404).json({ message: "History not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Clear all learning history for a user
// @route   DELETE /api/history
// @access  Private
router.delete("/", protect, async (req, res) => {
  try {
    await dbConnect();
      const history = await LearningHistory.findOne({ userId: req.user._id });

    if (history) {
      history.courses = [];
      await history.save();
      res.json(history);
    } else {
      // If no history, we can just return success
      res.status(200).json({ message: "History cleared" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
