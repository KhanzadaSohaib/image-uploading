const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Stripe = require("stripe");
const authRoutes = require("./routes/authRoutes");
require("dotenv").config();

const app = express();
app.use(cors({ origin: "http://localhost:3000" })); // Adjust based on your frontend URL
app.use(express.json());

// ✅ Ensure Stripe API Key is Set
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ Stripe Secret Key is missing in .env file!");
  process.exit(1); // Exit if key is missing
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ Payment Route
app.post("/api/payment", async (req, res) => {
  try {
    const { paymentMethodId, amount } = req.body;

    if (!paymentMethodId || !amount) {
      return res.status(400).json({ success: false, message: "Invalid data" });
    }

    // ✅ Define Return URL Based on Environment
    const returnUrl =
      process.env.NODE_ENV === "production"
        ? "https://your-production-site.com/payment-success"
        : "http://localhost:3000/payment-success";

    const amountInCents = Math.round(parseFloat(amount) * 100);

    // ✅ Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: "usd",
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: { enabled: true },
      return_url: returnUrl,
    });

    console.log(
      "✅ PaymentIntent Response:",
      JSON.stringify(paymentIntent, null, 2)
    );

    res.json({ success: true, paymentIntent });
  } catch (error) {
    console.error("❌ Stripe Payment Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Mount Authentication Routes
app.use("/api", authRoutes);

const PORT = process.env.PORT || 8005;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
