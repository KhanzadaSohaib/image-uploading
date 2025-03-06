require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const cloudinary = require("../config/cloudinary"); // Import Cloudinary Config
const User = require("../models/User");
const asyncHandler = require("express-async-handler"); // Optional for better async handling

const router = express.Router();

// ✅ Configure Multer for Cloudinary Uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// ✅ Generate Refresh Token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

// ✅ Middleware to Protect Routes
const protect = asyncHandler(async (req, res, next) => {
  let token = req.headers.authorization;

  if (!token || !token.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Unauthorized - No token provided" });
  }

  try {
    token = token.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId).select("-password");

    if (!req.user) {
      return res.status(404).json({ message: "User not found" });
    }

    next();
  } catch (error) {
    console.error("❌ Auth Error:", error.message);
    res.status(401).json({ message: "Unauthorized - Invalid token" });
  }
});

// ✅ Register User (With Cloudinary Image Upload)
router.post(
  "/register",
  upload.single("image"),
  asyncHandler(async (req, res) => {
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

    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      image: imageUrl,
    });
    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
      user: newUser,
      accessToken: generateToken(newUser._id),
      refreshToken: generateRefreshToken(newUser._id),
    });
  })
);

// ✅ Register User (Without Image)
router.post(
  "/signup",
  asyncHandler(async (req, res) => {
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

    res.status(201).json({
      message: "Signup successful!",
      user: newUser,
      accessToken: generateToken(newUser._id),
      refreshToken: generateRefreshToken(newUser._id),
    });
  })
);

// ✅ User Login
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password.trim(), user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    res.status(200).json({
      message: "Login successful",
      token: generateToken(user._id),
      refreshToken: generateRefreshToken(user._id),
      user,
    });
  })
);

// ✅ Get All Users
router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const users = await User.find({}, "name email image");
    res.status(200).json(users);
  })
);

// ✅ Delete User
router.delete(
  "/users/:userId",
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });
  })
);

// ✅ Refresh Token
router.post(
  "/refresh-token",
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token is required" });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({ message: "Invalid refresh token" });
      }

      // Issue a new access token
      const newAccessToken = generateToken(user._id);
      res.json({ accessToken: newAccessToken });
    } catch (error) {
      console.error("❌ Refresh Token Error:", error.message);
      res.status(401).json({ message: "Invalid refresh token" });
    }
  })
);

// ✅ Protected Profile Route
router.get(
  "/profile",
  protect,
  asyncHandler(async (req, res) => {
    res.json({ message: "Profile data", user: req.user });
  })
);

module.exports = router;
