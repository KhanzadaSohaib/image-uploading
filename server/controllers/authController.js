const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const User = require("../models/User");
const Stripe = require("stripe");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Store in memory
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Load secret key from .env

// ✅ Register & Signup (Both work the same way)
const registerUser = async (req, res) => {
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
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "user_profiles",
      });
      imageUrl = result.secure_url;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      profileImage: imageUrl,
    });

    await newUser.save();

    res.status(201).json({ message: "User Registered Successfully" });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Register User
router.post("/register", upload.single("image"), registerUser);

// ✅ Signup (Same as Register)
router.post("/signup", upload.single("image"), registerUser);

// ✅ Login User & Generate JWT Token
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 604800000, // 7 days
    });

    res.status(200).json({ message: "Login Successful", token });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// ✅ Logout User
router.post("/logout", (req, res) => {
  try {
    res.clearCookie("jwt");
    res.status(200).json({ message: "Logout Successful" });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// ✅ DELETE User
router.delete("/delete-user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }

    res.status(200).json({ message: "User Deleted Successfully" });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// ✅ Stripe Payment Route
router.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency } = req.body;

    if (!amount || !currency) {
      return res
        .status(400)
        .json({ message: "Amount and Currency are required" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: ["card"],
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({ message: "Payment Error" });
  }
});

router.post("/payment", async (req, res) => {
  try {
    const { paymentMethodId, amount } = req.body;

    if (!paymentMethodId || !amount) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: "usd",
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never", // Prevent redirect-based payment methods
      },
    });

    res.json({
      success: true,
      message: "Payment successful",
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Payment Error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
