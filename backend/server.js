const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const audioRoutes = require("./routes/audioRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve frontend static files
app.use(express.static(path.join(__dirname, "..", "frontend")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/audio", audioRoutes);

// Serve frontend for any non-API route
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ success: false, message: err.message || "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Aria AI Assistant Server running on http://localhost:${PORT}\n`);
});
