import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Signup Route
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  // console.log("Signup request received:", { email, password });

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: "User already exists" });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    // Create JWT token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(201).json({ message: "User created successfully", token });
  } catch (err) {
    console.log("Error creating user:", err.message);
    res
      .status(500)
      .json({ message: "Error creating user", error: err.message });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  // console.log("Login request received:", { email, password });

  try {
    // Find the user
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // Create JWT token
    // console.log(user._id);
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // Only HTTPS in prod
      sameSite: "Lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    // console.log("log here");
    // console.log(res.cookie.token);

    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
});

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Update user settings
// @route   PUT /api/auth/settings
// @access  Private
router.put("/settings", protect, async (req, res) => {
  const { lastActiveTopicId, customPrompt } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.lastActiveTopicId = lastActiveTopicId ?? user.lastActiveTopicId;
      user.customPrompt = customPrompt ?? user.customPrompt;
      await user.save();
      res.json({ message: "Settings updated" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
