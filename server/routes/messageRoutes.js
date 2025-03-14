const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

// ✅ Send a message
router.post("/send", async (req, res) => {
  try {
    const { senderId, recipientId, text } = req.body;

    if (!senderId || !recipientId || !text) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const message = new Message({ senderId, recipientId, text });
    await message.save();

    res.status(201).json({ message });
  } catch (error) {
    console.error("❌ Error sending message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Fetch messages between two users
router.get("/:userId/:otherUserId", async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: userId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: userId },
      ],
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
