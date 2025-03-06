const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  let token = req.header("Authorization");

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    // Handle 'Bearer <token>' format
    if (token.startsWith("Bearer ")) {
      token = token.split(" ")[1];
    }

    // Verify JWT token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Store decoded user info in req.user

    console.log("✅ Authenticated User:", req.user);
    next();
  } catch (error) {
    console.error("❌ Invalid Token:", error.message);
    res.status(401).json({ message: "Invalid token. Authentication failed." });
  }
};

module.exports = authMiddleware;
