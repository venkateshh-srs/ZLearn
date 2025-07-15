import express from "express";
import { Course } from "../models/Course.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private
router.post("/", protect, async (req, res) => {
  const { title, data } = req.body;

  if (!title || !data) {
    return res.status(400).json({ message: "Please provide title and data" });
  }

  try {
    const course = new Course({
      title,
      data,
      user: req.user.id,
    });

    const createdCourse = await course.save();
    res.status(201).json(createdCourse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Get all courses for a user
// @route   GET /api/courses
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const courses = await Course.find({ user: req.user.id });
    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Get course by ID
// @route   GET /api/courses/:id
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (course) {
      if (course.user.toString() !== req.user.id) {
        return res.status(401).json({ message: "Not authorized" });
      }
      res.json(course);
    } else {
      res.status(404).json({ message: "Course not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Update completed subtopics for a course
// @route   PUT /api/courses/:id/complete
// @access  Private
router.put("/:id/complete", protect, async (req, res) => {
  const { subtopicId } = req.body;

  try {
    const course = await Course.findById(req.params.id);

    if (course) {
      if (course.user.toString() !== req.user.id) {
        return res.status(401).json({ message: "Not authorized" });
      }

      if (!course.completedSubtopics.includes(subtopicId)) {
        course.completedSubtopics.push(subtopicId);
        await course.save();
      }

      res.json(course);
    } else {
      res.status(404).json({ message: "Course not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
