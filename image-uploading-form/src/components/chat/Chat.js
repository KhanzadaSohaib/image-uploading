import React, { useState, useEffect, useRef, useCallback } from "react";
import io from "socket.io-client";
import "./Chat.css"; // Import CSS file

const API_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:8005"
    : "https://your-deployed-backend.vercel.app");

const Chat = () => {
  const [username, setUsername] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const messageInputRef = useRef(null);
  const socketRef = useRef(null);

  // 🌐 Establish socket connection when username is set
  useEffect(() => {
    if (!username.trim()) return;

    const token = localStorage.getItem("token");
    socketRef.current = io(API_URL, {
      auth: { token, username },
      withCredentials: true,
      transports: ["websocket"],
    });

    console.log("🔗 Connected to Socket.IO");

    // ✅ Listen for messages
    socketRef.current.on("receiveMessage", (data) => {
      console.log("📩 Received message:", data);
      setMessages((prev) => [...prev, data]);
    });

    // ✅ Update online users
    socketRef.current.on("updateUsers", (userList) => {
      console.log("👥 Updated user list:", userList);
      setUsers(userList);
    });

    // ✅ Handle errors
    socketRef.current.on("connect_error", (err) => {
      console.error("❌ Socket error:", err.message);
      if (err.message.includes("Unauthorized")) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    });

    return () => {
      console.log("🔌 Disconnecting socket...");
      socketRef.current.disconnect();
    };
  }, [username]);

  // 🏃 Handle user joining the chat
  const handleJoin = () => {
    if (!nameInput.trim()) return;
    setUsername(nameInput);
    setNameInput("");
  };

  // ✉️ Send message
  const handleSendMessage = useCallback(() => {
    if (!message.trim() || !username) return;

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser || !currentUser._id) {
      console.error("❌ Current user not found in localStorage!");
      return;
    }

    const newMessage = {
      senderId: currentUser._id,
      username,
      text: message,
      timestamp: new Date().toISOString(),
    };

    console.log("🚀 Sending message:", newMessage);
    socketRef.current?.emit("sendMessage", newMessage);
    setMessage("");

    // Auto-focus message input after sending
    setTimeout(() => messageInputRef.current?.focus(), 100);
  }, [message, username]);

  return (
    <div className="chat-container">
      <h2>Chat Room</h2>

      {!username ? (
        <div className="join-container">
          <input
            type="text"
            placeholder="Enter your name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
          />
          <button onClick={handleJoin}>Join Chat</button>
        </div>
      ) : (
        <div className="chat-box">
          <div className="chat-header">
            <h3>Welcome, {username}!</h3>
          </div>

          <div className="users-list">
            <h4>Online Users:</h4>
            <ul>
              {users.length > 0 ? (
                users.map((user, index) => (
                  <li key={user.userId || index}>
                    {user.username || "Unknown User"}
                  </li>
                ))
              ) : (
                <li>No users online</li>
              )}
            </ul>
          </div>

          <div className="messages-container">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message-group ${
                  msg.username === username ? "sent" : "received"
                }`}
              >
                <span className="message-username">{msg.username}</span>
                <div className="message-bubble">{msg.text}</div>
              </div>
            ))}
          </div>

          <div className="input-container">
            <input
              ref={messageInputRef}
              type="text"
              value={message}
              placeholder="Type a message..."
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
