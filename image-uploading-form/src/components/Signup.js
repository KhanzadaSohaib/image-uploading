import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import "./Auth.css";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      alert("All fields are required!");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      console.log("\ud83d\udce4 Sending Signup Data:", {
        name,
        email,
        password,
      });

      const API_BASE_URL =
        process.env.REACT_APP_API_BASE_URL ||
        "http://localhost:8005" ||
        "https://server-5gujvqfe0-khanzadasohaibs-projects.vercel.app";

      const response = await axios.post(
        `${API_BASE_URL}/api/signup`,
        {
          name,
          email,
          password,
          confirmPassword,
        }, // ✅ Send data as JSON
        {
          headers: { "Content-Type": "application/json" }, // ✅ Correct headers
        }
      );

      console.log("\u2705 Signup Response:", response.data);
      alert(response.data.message || "Signup successful!");
      navigate("/");
    } catch (error) {
      console.error(
        "\u274c Signup Error:",
        error.response?.data?.message || error.message
      );
      alert(error.response?.data?.message || "Signup failed!");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Sign Up</h2>
        <p className="auth-subtitle">Create your account</p>

        <form className="auth-form" onSubmit={handleSignup}>
          {/* Name Input */}
          <div className="input-group">
            <FaUser className="input-icon" />
            <input
              type="text"
              className="input-field"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Email Input */}
          <div className="input-group">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              className="input-field"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password Input */}
          <div className="input-group">
            <FaLock className="input-icon" />
            <input
              type="password"
              className="input-field"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Confirm Password Input */}
          <div className="input-group">
            <FaLock className="input-icon" />
            <input
              type="password"
              className="input-field"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-button">
            Sign Up
          </button>
        </form>

        <p className="auth-link">
          Already have an account?{" "}
          <span className="link-text" onClick={() => navigate("/")}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default Signup;
