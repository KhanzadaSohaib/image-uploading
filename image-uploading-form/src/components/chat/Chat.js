import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import {
  FiMoreVertical,
  FiSearch,
  FiPaperclip,
  FiMic,
  FiSmile,
} from "react-icons/fi";
import { BsCheck2All, BsThreeDotsVertical } from "react-icons/bs";
import "./Chat.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8005";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [users, setUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUser(response.data.user);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser) return;
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(response.data.filter((user) => user._id !== currentUser._id));
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, [currentUser]);

  // Socket.IO connection and message handling
  useEffect(() => {
    if (!currentUser) return;

    const token = localStorage.getItem("token");
    socketRef.current = io(API_URL, {
      auth: { token },
      withCredentials: true,
    });

    socketRef.current.on("updateUsers", (userList) => {
      setActiveUsers(userList.map((user) => user.userId));
    });

    socketRef.current.on("userOnline", (userId) => {
      setActiveUsers((prev) => [...prev, userId]);
    });

    socketRef.current.on("userOffline", (userId) => {
      setActiveUsers((prev) => prev.filter((id) => id !== userId));
    });

    socketRef.current.on("receiveMessage", (message) => {
      if (
        (message.senderId === selectedUser?._id &&
          message.receiverId === currentUser._id) ||
        (message.senderId === currentUser._id &&
          message.receiverId === selectedUser?._id)
      ) {
        setMessages((prev) => [
          ...prev,
          {
            ...message,
            sender: {
              _id: message.senderId,
              name: message.senderUsername,
              image: message.senderImage,
            },
            receiver: {
              _id: message.receiverId,
            },
          },
        ]);
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [currentUser, selectedUser]);

  // Fetch messages when user is selected
  useEffect(() => {
    if (!selectedUser || !currentUser) return;

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${API_URL}/api/messages/${currentUser._id}/${selectedUser._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessages(response.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
    fetchMessages();
  }, [selectedUser, currentUser]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (isSending || !messageInput.trim() || !selectedUser || !currentUser)
      return;

    setIsSending(true);

    const messageData = {
      receiverId: selectedUser._id,
      senderId: currentUser._id,
      text: messageInput,
    };

    // Emit message to the server
    socketRef.current.emit("sendMessage", messageData);

    // Add the message to the chat
    setMessages((prev) => [
      ...prev,
      {
        text: messageInput,
        sender: {
          _id: currentUser._id,
          name: currentUser.name,
          image: currentUser.image,
        },
        receiver: {
          _id: selectedUser._id,
        },
        timestamp: new Date().toISOString(),
        status: "sent",
      },
    ]);

    setMessageInput("");
    setIsSending(false);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="whatsapp-container">
      {/* Sidebar */}
      <div className="sidebar">
        {/* User header */}
        <div className="sidebar-header">
          <div className="user-avatar1">
            <img src={currentUser?.image} alt={currentUser?.name} />
          </div>
          <div className="sidebar-actions">
            <button>
              <FiMoreVertical />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="search-container">
          <div className="search-input">
            <FiSearch className="search-icon" />
            <input type="text" placeholder="Search or start new chat" />
          </div>
        </div>

        {/* Chats list */}
        <div className="chats-list">
          {users.map((user) => (
            <div
              key={user._id}
              className={`chat-item ${
                selectedUser?._id === user._id ? "active" : ""
              }`}
              onClick={() => setSelectedUser(user)}
            >
              <div className="chat-avatar">
                <img src={user.image} alt={user.name} />
                <div
                  className={`status-dot ${
                    activeUsers.includes(user._id) ? "online" : "offline"
                  }`}
                />
              </div>
              <div className="chat-info">
                <div className="chat-name">{user.name}</div>
                <div className="chat-preview">Last message preview...</div>
              </div>
              <div className="chat-meta">
                <div className="chat-time">10:30 AM</div>
                <div className="unread-count">2</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="chat-area">
        {selectedUser ? (
          <>
            {/* Chat header */}
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-avatar">
                  <img src={selectedUser.image} alt={selectedUser.name} />
                  <div
                    className={`status-dot ${
                      activeUsers.includes(selectedUser._id)
                        ? "online"
                        : "offline"
                    }`}
                  />
                </div>
                <div className="chat-title">
                  <div className="chat-name">{selectedUser.name}</div>
                  <div className="chat-status">
                    {activeUsers.includes(selectedUser._id)
                      ? "Online"
                      : "Last seen today at 12:45 PM"}
                  </div>
                </div>
              </div>
              <div className="chat-actions">
                <button>
                  <FiSearch />
                </button>
                <button>
                  <BsThreeDotsVertical />
                </button>
              </div>
            </div>

            {/* Messages container */}
            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="no-messages">
                  <p>No messages yet</p>
                  <p>Start a conversation with {selectedUser.name}</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`message ${
                      msg.sender._id === currentUser?._id ? "sent" : "received"
                    }`}
                  >
                    <div className="message-content">
                      {msg.sender._id !== currentUser?._id && (
                        <img
                          src={msg.sender.image || selectedUser.image}
                          alt={msg.sender.name}
                          className="message-avatar"
                        />
                      )}
                      <div className="message-bubble">
                        <div className="message-text">{msg.text}</div>
                        <div className="message-meta">
                          <span className="message-time">
                            {formatTime(msg.timestamp)}
                          </span>
                          {msg.sender._id === currentUser?._id && (
                            <span className="message-status">
                              <BsCheck2All
                                className={msg.status === "read" ? "read" : ""}
                              />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="message-input">
              <form onSubmit={sendMessage}>
                <div className="input-actions">
                  <button>
                    <FiPaperclip />
                  </button>
                  <button>
                    <FiSmile />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Type a message"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                />
                <div className="send-button">
                  <button type="submit" disabled={isSending}>
                    {isSending ? "Sending..." : <FiMic />}
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <p>Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
