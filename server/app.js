require("dotenv").config(); // Load environment variables from .env file
const Message = require("./models/Message"); // Ensure this is included

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const messageRoutes = require("./routes/messageRoutes"); // ✅ Import Routes AFTER Express

// Debugging: Print Stripe Key to verify it's loading
console.log("Stripe Key:", process.env.STRIPE_SECRET_KEY);

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("❌ STRIPE_SECRET_KEY is not defined in .env file!");
}

// Initialize Stripe AFTER loading .env
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const authRoutes = require("./routes/authRoutes");

const app = express();
const server = http.createServer(app);

// CORS Configuration
const allowedOrigins = [
  "http://localhost:3000", // Local development
  "https://your-frontend-domain.com", // Production frontend
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

// Handle Preflight Requests
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.status(200).end();
});

app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// Routes
app.use("/api", authRoutes);

// Stripe Payment Endpoint
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

app.use("/api/messages", messageRoutes); // ✅ Add Message API

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // Allow Socket.IO connections from frontend
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Store user connections properly
const users = new Map();

// Socket.IO Authentication Middleware
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

// Handle User Connection
io.on("connection", (socket) => {
  console.log(`⚡ User connected: ${socket.user?.userId}`);

  // Add user to the users map
  if (!users.has(socket.user.userId)) {
    users.set(socket.user.userId, {
      username: socket.user.username,
      sockets: new Set(),
    });
  }
  users.get(socket.user.userId).sockets.add(socket.id);

  // Send updated user list to all connected clients
  const userList = Array.from(users.entries()).map(([userId, data]) => ({
    userId,
    username: data.username,
  }));
  io.emit("updateUsers", userList);

  // Notify all clients that this user is online
  io.emit("userOnline", socket.user.userId);

  // Handle private messages
  socket.on("sendMessage", ({ receiverId, text }) => {
    const sender = users.get(socket.user.userId);
    if (!sender) {
      console.error("❌ Sender not found:", socket.user.userId);
      return;
    }

    const messageData = {
      senderId: socket.user.userId,
      senderUsername: socket.user.username,
      receiverId,
      text,
      timestamp: new Date().toISOString(),
    };

    console.log(
      `📩 Message from ${socket.user.username} to ${receiverId}:`,
      text
    );

    // Send the message to the sender's all tabs
    sender.sockets.forEach((socketId) => {
      io.to(socketId).emit("receiveMessage", messageData);
    });

    // Check if the receiver is online and send the message to all their open tabs
    if (users.has(receiverId)) {
      users.get(receiverId).sockets.forEach((socketId) => {
        io.to(socketId).emit("receiveMessage", messageData);
      });
    } else {
      console.log(`🔴 Receiver (${receiverId}) is offline`);
    }
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log(`🔴 User disconnected: ${socket.user.userId}`);

    if (users.has(socket.user.userId)) {
      const userSockets = users.get(socket.user.userId).sockets;
      userSockets.delete(socket.id);

      // Remove user if no active sockets remain
      if (userSockets.size === 0) {
        users.delete(socket.user.userId);
        io.emit("userOffline", socket.user.userId);
      }
    }

    // Update all users with the new user list
    const updatedUserList = Array.from(users.entries()).map(
      ([userId, data]) => ({
        userId,
        username: data.username,
      })
    );
    io.emit("updateUsers", updatedUserList);
  });
});
app.get("/api/messages/:senderId/:recipientId", async (req, res) => {
  const { senderId, recipientId } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        {
          senderId: new mongoose.Types.ObjectId(senderId),
          recipientId: new mongoose.Types.ObjectId(recipientId),
        },
        {
          senderId: new mongoose.Types.ObjectId(recipientId),
          recipientId: new mongoose.Types.ObjectId(senderId),
        },
      ],
    }).sort({ timestamp: 1 });

    res.status(200).json(messages); // ✅ Always return 200, even if empty
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Start Server
const PORT = process.env.PORT || 8005;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
