import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import "./Chat.css";

const API_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:8005"
    : "https://your-deployed-backend.vercel.app");

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Fetch logged-in user
  useEffect(() => {
    const fetchLoggedInUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLoggedInUser(response.data.user);
      } catch (error) {
        console.error("❌ Error fetching logged-in user:", error);
      }
    };
    fetchLoggedInUser();
  }, []);

  // Fetch all users
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(response.data);
      } catch (error) {
        console.error("❌ Error fetching users:", error);
      }
    };
    fetchAllUsers();
  }, []);

  // Connect to Socket.io
  useEffect(() => {
    if (!loggedInUser?._id) return;

    const token = localStorage.getItem("token");
    socketRef.current = io(API_URL, {
      auth: { token },
      withCredentials: true,
      transports: ["websocket"],
    });

    socketRef.current.on("updateUserStatus", (onlineUsers) => {
      setOnlineUsers(onlineUsers);
    });

    socketRef.current.on("receivePrivateMessage", (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    socketRef.current.on("userTyping", (userId) => {
      if (selectedUser?._id === userId) {
        setTyping(true);
        setTimeout(() => setTyping(false), 2000);
      }
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [loggedInUser, selectedUser]);

  // Fetch chat messages between logged-in user & selected user
  useEffect(() => {
    if (!selectedUser || !loggedInUser) return;

    console.log("Fetching messages for:", loggedInUser._id, selectedUser._id);

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${API_URL}/api/messages/${loggedInUser._id}/${selectedUser._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.status === 200) {
          setMessages(response.data);
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error("❌ Error fetching messages:", error.response || error);
        setMessages([]);
      }
    };

    fetchMessages();
  }, [selectedUser, loggedInUser]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSendMessage = async () => {
    if (!message.trim() || !selectedUser?._id || !loggedInUser?._id) return;

    const newMessage = {
      senderId: loggedInUser._id,
      recipientId: selectedUser._id,
      text: message,
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, newMessage]);

    try {
      await axios.post(`${API_URL}/api/messages/send`, newMessage, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      socketRef.current?.emit("sendPrivateMessage", newMessage);
    } catch (error) {
      console.error("❌ Error sending message:", error);
    }

    setMessage("");
  };

  // Handle typing
  const handleTyping = () => {
    socketRef.current?.emit("typing", selectedUser?._id);
  };

  return (
    <div className="chat-container">
      <aside className="sidebar">
        <h3>Chats</h3>
        <ul>
          {users
            .filter((user) => user._id !== loggedInUser?._id)
            .map((user) => (
              <li
                key={user._id}
                className={`user ${
                  selectedUser?._id === user._id ? "active" : ""
                }`}
                onClick={() => setSelectedUser(user)}
              >
                <div
                  className="status-dot"
                  style={{
                    background: onlineUsers[user._id] ? "green" : "gray",
                  }}
                ></div>
                <img src={user.image} alt={user.name} className="avatar" />
                <span>{user.name}</span>
              </li>
            ))}
        </ul>
      </aside>

      <div className="chat-window">
        {selectedUser ? (
          <>
            <header className="chat-header">
              <div
                className="status-dot"
                style={{
                  background: onlineUsers[selectedUser._id] ? "green" : "gray",
                }}
              ></div>
              <img
                src={selectedUser.image}
                alt={selectedUser.name}
                className="avatar"
              />
              <h3>{selectedUser.name}</h3>
            </header>

            <div className="messages">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${
                    msg.senderId === loggedInUser?._id ? "sent" : "received"
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
              ))}
              {typing && <div className="typing-indicator">Typing...</div>}
              <div ref={messagesEndRef} />
            </div>

            <footer className="chat-input">
              <input
                type="text"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => {
                  handleTyping();
                  if (e.key === "Enter") handleSendMessage();
                }}
              />
              <button onClick={handleSendMessage}>Send</button>
            </footer>
          </>
        ) : (
          <div className="select-user">Select a user to start chatting</div>
        )}
      </div>
    </div>
  );
};

export default Chat;
