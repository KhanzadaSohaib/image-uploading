import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    axios
      .get("http://localhost:8005/api/users")
      .then((response) => {
        setUsers(response.data);
      })
      .catch((error) => {
        console.error("❌ Error fetching users:", error);
      });

    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.body.classList.toggle("dark-theme", savedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.body.classList.toggle("dark-theme", newTheme === "dark");
  };

  const handleDelete = (userId) => {
    axios
      .delete(`http://localhost:8005/api/users/${userId}`)
      .then(() => {
        setUsers(users.filter((user) => user._id !== userId));
      })
      .catch((error) => {
        console.error("❌ Error deleting user:", error);
      });
  };

  return (
    <>
      <div className="dashboard-container">
        <h2 className="dashboard-title">Registered Users</h2>
        <div className="user-cards">
          {users.map((user) => (
            <div key={user._id} className="user-card">
              <img
                src={user.image || "https://via.placeholder.com/150"}
                alt={user.name || "User Avatar"}
                className="user-image"
              />
              <h3 className="user-name">{user.name}</h3>
              <p className="user-email">{user.email}</p>
              <button
                className="delete-button"
                onClick={() => handleDelete(user._id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
