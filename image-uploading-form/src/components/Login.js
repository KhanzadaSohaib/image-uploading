import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevents page refresh on form submit
    setLoading(true);

    try {
      console.log("🔄 Sending login request...");

      const response = await fetch("http://localhost:8005/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      console.log("✅ Login successful:", data);

      // ✅ Store token in localStorage
      localStorage.setItem("token", data.token);

      // ✅ Redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("❌ Login Error:", error.message);
      alert(error.message); // Show error message to user
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Login</h2>
        <p className="auth-subtitle">
          Welcome back! Please log in to continue.
        </p>

        <form className="auth-form" onSubmit={handleLogin}>
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

          {/* Login Button */}
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-link">
          Don't have an account?{" "}
          <span className="link-text" onClick={() => navigate("/signup")}>
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
