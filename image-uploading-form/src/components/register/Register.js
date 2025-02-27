import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // ✅ Added password field
  const [image, setImage] = useState(null); // ✅ Added image upload
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password); // ✅ Added password
      if (image) formData.append("image", image); // ✅ Added image

      console.log("🔄 Sending registration request...");

      const response = await fetch("http://localhost:8005/api/register", {
        method: "POST",
        body: formData, // ✅ Sending FormData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      console.log("✅ Registration successful:", data);
      navigate("/dashboard"); // Redirect to login page
    } catch (error) {
      console.error("❌ Registration Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">Register</h2>
          <p className="auth-subtitle">Create an account to get started.</p>

          <form className="auth-form" onSubmit={handleRegister}>
            {/* Name Input */}
            <div className="input-group">
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input-field"
              />
              <span className="input-icon">👤</span>
            </div>

            {/* Email Input */}
            <div className="input-group">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
              />
              <span className="input-icon">📧</span>
            </div>

            {/* Password Input */}
            <div className="input-group">
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field"
              />
              <span className="input-icon">🔒</span>
            </div>

            {/* Image Upload */}
            <div className="input-group">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files[0])}
                className="input-field"
              />
              <span className="input-icon">🖼️</span>
            </div>

            {/* Register Button */}
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          <p className="auth-link">
            Already have an account?{" "}
            <span className="link-text" onClick={() => navigate("/login")}>
              Login
            </span>
          </p>
        </div>
      </div>
    </>
  );
};

export default Register;
