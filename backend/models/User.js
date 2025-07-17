import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String }, // may be empty for Google login
  googleId: { type: String },
  name: { type: String },
});

export const User = mongoose.model("User", userSchema);
