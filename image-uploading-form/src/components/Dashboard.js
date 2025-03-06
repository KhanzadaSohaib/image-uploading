import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Import useNavigate
import api from "../api"; // ✅ Import configured Axios instance
import "./Dashboard.css";

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate(); // ✅ Initialize useNavigate

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token"); // Retrieve JWT token
        const response = await api.get("/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(response.data);
      } catch (error) {
        console.error(
          "❌ Error fetching users:",
          error.response?.data || error.message
        );
      }
    };

    fetchUsers();
  }, []);

  const handleDelete = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers(users.filter((user) => user._id !== userId));
    } catch (error) {
      console.error(
        "❌ Error deleting user:",
        error.response?.data || error.message
      );
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Registered Users</h2>
      <div className="user-cards">
        {users.map((user) => (
          <div key={user._id} className="user-card">
            <img
              src={user.image || "https://via.placeholder.com/150"}
              alt={user.name}
            />
            <h3>{user.name}</h3>
            <p>{user.email}</p>
            <div>
              <button
                className="delete-button"
                onClick={() => handleDelete(user._id)}
              >
                Delete
              </button>
              {/* ✅ Chat Now Button */}
              <button
                className="chat-now-button"
                onClick={() => navigate(`/chat?userId=${user._id}`)}
              >
                Chat Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
