import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";
import { OAuth2Client } from "google-auth-library";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
import dbConnect from "../lib/dbConnect.js";

const router = express.Router();

// Signup Route
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  // console.log("Signup request received:", { email, password });

  try {
    await dbConnect();
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
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // true on Vercel
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000 * 3, // 1 day
    });
    // console.log("token", token);

    res.status(201).json({
      message: "User created successfully",
      token,
      userId: newUser._id,
    });
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
    await dbConnect();
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
      secure: true, // true on Vercel
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000 * 3, // 1 day
    });
    // console.log("log here");
    // console.log(res.cookie.token);

    res
      .status(200)
      .json({ message: "Login successful", token, userId: user._id });
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
});

router.post("/google", async (req, res) => {
  const { token } = req.body;

  try {
    await dbConnect();
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    // Check if user exists
    let user = await User.findOne({ email });

    // If not, create the user
    if (!user) {
      user = new User({
        email,
        googleId,
        name,
        password: "", // leave empty for social login users
      });
      await user.save();
    }
    console.log("user id", user._id);
    // Sign JWT
    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Set JWT cookie
    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: true, // set true in prod
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000 * 3,
    });

    res.status(200).json({
      message: "Google login successful",
      token: jwtToken,
      userId: user._id,
    });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(401).json({ message: "Invalid Google token" });
  }
});
// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
router.get("/me", protect, async (req, res) => {
  try {
    // console.log("me route");
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // console.log("user", user);

    res.status(200).json(user);
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
    await dbConnect();
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
