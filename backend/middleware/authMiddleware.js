const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "aria_super_secret_key_2024";

/**
 * Middleware to protect routes with JWT authentication.
 * Checks for token in cookies or Authorization header.
 */
const protect = async (req, res, next) => {
  let token;

  // Check cookie first, then Authorization header
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. Please log in.",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists.",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token is invalid or expired.",
    });
  }
};

/**
 * Generate a JWT token for a user.
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: "7d",
  });
};

module.exports = { protect, generateToken, JWT_SECRET };
