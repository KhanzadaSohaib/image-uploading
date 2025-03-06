const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();
let refreshTokens = []; // Store valid refresh tokens

// ✅ Refresh Access Token
router.post("/refresh", (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ message: "Access Denied" });

  if (!refreshTokens.includes(token)) {
    return res.status(403).json({ message: "Invalid Refresh Token" });
  }

  jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid Token" });

    const newAccessToken = jwt.sign(
      { userId: user.userId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ accessToken: newAccessToken });
  });
});

// ✅ Logout (Remove Refresh Token)
router.post("/logout", (req, res) => {
  const { token } = req.body;
  refreshTokens = refreshTokens.filter((t) => t !== token);
  res.json({ message: "Logged out successfully" });
});

module.exports = router;
