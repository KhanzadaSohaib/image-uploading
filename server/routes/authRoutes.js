require("dotenv").config(); // Load environment variables
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const cloudinary = require("../config/cloudinary"); // Import Cloudinary Config
const User = require("../models/User");

const router = express.Router();

// ✅ Configure Multer for Cloudinary Uploads
const storage = multer.memoryStorage(); // Store file in memory
const upload = multer({ storage });

// ✅ Register User (With Cloudinary Image Upload)
router.post("/register", upload.single("image"), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "User already exists" });
    }

    let imageUrl = null;
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "user_profiles" }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          })
          .end(req.file.buffer);
      });

      imageUrl = uploadResult.secure_url;
    }

    const newUser = new User({ name, email, password, image: imageUrl });
    await newUser.save();

    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    console.error("❌ Registration Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Register User (Without Image)
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match!" });
    }

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Email already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    const newUser = new User({ name, email, password: hashedPassword });

    await newUser.save();
    console.log("✅ User Saved Successfully:", newUser);

    res.status(201).json({ message: "Signup successful!", user: newUser });
  } catch (error) {
    console.error("❌ Signup Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ User Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password.trim(), user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get All Users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "name email image");
    res.status(200).json(users);
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Delete User
router.delete("/users/:userId", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
