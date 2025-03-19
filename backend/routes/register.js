const express = require("express");
const router = express.Router();
const User = require("../models/User"); // Import model User

// Route đăng ký người dùng
router.post("/register", async (req, res) => {
  console.log("Received register request:", req.body);
  const { username, password } = req.body;

  if (!username || !password) {
    console.log("Missing username or password");
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  try {
    console.log("Checking if username exists...");
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log("Username already exists:", username);
      return res.status(400).json({ message: "Username already exists" });
    }

    console.log("Creating new user...");
    const newUser = new User({
      username,
      password,
    });

    console.log("Saving user to database...");
    await newUser.save();
    console.log("User saved successfully:", newUser);

    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    console.error("Error in register route:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router; // Export router
