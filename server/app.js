require("dotenv").config(); // ✅ Load .env before anything else

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

// ✅ Debugging: Print Stripe Key to verify it's loading
console.log("Stripe Key:", process.env.STRIPE_SECRET_KEY);

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("❌ STRIPE_SECRET_KEY is not defined in .env file!");
}

// ✅ Initialize Stripe AFTER loading .env
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const authRoutes = require("./routes/authRoutes");

const app = express();
const server = http.createServer(app);

// ✅ CORS Middleware - FIXED for Preflight Requests
const allowedOrigins = [
  "http://localhost:3000", // Localhost for development
  "https://image-uploading-form.vercel.app", // Production frontend
  "https://image-uploading-form-ftctmw0g7-khanzadasohaibs-projects.vercel.app", // New deployed preview
];

app.use(
  cors({
    origin: function (origin, callback) {
      console.log("🔍 Incoming request from:", origin);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ CORS blocked for:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Handle Preflight Requests
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.status(200).end();
});

app.use(express.json());

// ✅ Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

app.use("/api", authRoutes);

// ✅ Stripe Payment Endpoint
app.post("/api/payment", async (req, res) => {
  try {
    const { amount, paymentMethodId } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
    });

    res.json({ success: true, clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("❌ Payment Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ SOCKET.IO Setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // Allow Socket.IO connections from frontend
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ✅ Store user connections properly
const users = new Map();

// ✅ Socket.IO Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Unauthorized - No token provided"));
  }

  const rawToken = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
  jwt.verify(rawToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error("Unauthorized - Invalid token"));
    }

    socket.user = {
      userId: decoded.userId,
      username: socket.handshake.auth.username || "Anonymous", // Ensure username exists
    };
    next();
  });
});

// ✅ Handle User Connection
io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.user?.userId);

  if (!users.has(socket.user.userId)) {
    users.set(socket.user.userId, {
      username: socket.user.username,
      sockets: new Set(),
    });
  }
  users.get(socket.user.userId).sockets.add(socket.id);

  const userList = Array.from(users.entries()).map(([userId, data]) => ({
    userId,
    username: data.username,
  }));

  io.emit("updateUsers", userList);

  socket.on("sendMessage", (message) => {
    const user = users.get(socket.user.userId);
    if (!user) {
      console.error("❌ Sender not found:", socket.user.userId);
      return;
    }

    const messageData = {
      username: socket.user.username,
      text: message.text,
      userId: socket.user.userId,
      timestamp: new Date().toISOString(),
    };

    console.log(
      `📩 Broadcasting message from ${socket.user.username}:`,
      messageData
    );

    io.emit("receiveMessage", messageData);
  });

  socket.on("disconnect", () => {
    console.log(`🔴 User disconnected: ${socket.user.userId}`);

    if (users.has(socket.user.userId)) {
      const userSockets = users.get(socket.user.userId).sockets;
      userSockets.delete(socket.id);

      if (userSockets.size === 0) {
        users.delete(socket.user.userId);
      }
    }

    const updatedUserList = Array.from(users.entries()).map(
      ([userId, data]) => ({
        userId,
        username: data.username,
      })
    );

    io.emit("updateUsers", updatedUserList);
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 8005;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
