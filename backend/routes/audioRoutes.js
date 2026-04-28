const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Audio = require("../models/Audio");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname) || ".webm"}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("audio/") || file.mimetype === "video/webm") {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed."), false);
    }
  },
});

// Upload audio
router.post("/upload", protect, upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No audio file provided." });
    const { title, transcription, duration, mood, moodScore, tags, category, notes } = req.body;
    const audio = await Audio.create({
      user: req.user._id,
      title: title || `Recording ${new Date().toLocaleString()}`,
      filename: req.file.filename,
      originalName: req.file.originalname,
      filepath: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      duration: duration ? parseFloat(duration) : 0,
      transcription: transcription || "",
      mood: mood || "unknown",
      moodScore: moodScore ? parseFloat(moodScore) : 0,
      tags: tags ? JSON.parse(tags) : [],
      category: category || "general",
      notes: notes || "",
    });
    res.status(201).json({ success: true, message: "Audio uploaded!", audio });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ success: false, message: "Error uploading audio." });
  }
});

// List recordings
router.get("/list", protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = "-createdAt", category, favorite, search } = req.query;
    const query = { user: req.user._id };
    if (category && category !== "all") query.category = category;
    if (favorite === "true") query.isFavorite = true;
    if (search) query.$text = { $search: search };
    const total = await Audio.countDocuments(query);
    const recordings = await Audio.find(query).sort(sort).skip((page - 1) * limit).limit(parseInt(limit));
    res.json({ success: true, recordings, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching recordings." });
  }
});

// Get single recording
router.get("/:id", protect, async (req, res) => {
  try {
    const audio = await Audio.findOne({ _id: req.params.id, user: req.user._id });
    if (!audio) return res.status(404).json({ success: false, message: "Recording not found." });
    res.json({ success: true, audio });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching recording." });
  }
});

// Stream audio file
router.get("/:id/stream", protect, async (req, res) => {
  try {
    const audio = await Audio.findOne({ _id: req.params.id, user: req.user._id });
    if (!audio) return res.status(404).json({ success: false, message: "Not found." });
    if (!fs.existsSync(audio.filepath)) return res.status(404).json({ success: false, message: "File not found." });
    const stat = fs.statSync(audio.filepath);
    res.writeHead(200, { "Content-Type": audio.mimetype, "Content-Length": stat.size });
    fs.createReadStream(audio.filepath).pipe(res);
  } catch (error) {
    res.status(500).json({ success: false, message: "Error streaming." });
  }
});

// Update recording
router.put("/:id", protect, async (req, res) => {
  try {
    const updates = {};
    ["title", "transcription", "summary", "mood", "moodScore", "tags", "category", "notes"].forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });
    const audio = await Audio.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, updates, { new: true });
    if (!audio) return res.status(404).json({ success: false, message: "Not found." });
    res.json({ success: true, message: "Updated.", audio });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating." });
  }
});

// Toggle favorite
router.put("/:id/favorite", protect, async (req, res) => {
  try {
    const audio = await Audio.findOne({ _id: req.params.id, user: req.user._id });
    if (!audio) return res.status(404).json({ success: false, message: "Not found." });
    audio.isFavorite = !audio.isFavorite;
    await audio.save();
    res.json({ success: true, isFavorite: audio.isFavorite });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error toggling favorite." });
  }
});

// Delete recording
router.delete("/:id", protect, async (req, res) => {
  try {
    const audio = await Audio.findOne({ _id: req.params.id, user: req.user._id });
    if (!audio) return res.status(404).json({ success: false, message: "Not found." });
    if (fs.existsSync(audio.filepath)) fs.unlinkSync(audio.filepath);
    await Audio.deleteOne({ _id: audio._id });
    res.json({ success: true, message: "Deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting." });
  }
});

// Stats overview
router.get("/stats/overview", protect, async (req, res) => {
  try {
    const totalRecordings = await Audio.countDocuments({ user: req.user._id });
    const favorites = await Audio.countDocuments({ user: req.user._id, isFavorite: true });
    const durationAgg = await Audio.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: null, totalDuration: { $sum: "$duration" }, totalSize: { $sum: "$size" } } },
    ]);
    const moodAgg = await Audio.aggregate([
      { $match: { user: req.user._id, mood: { $ne: "unknown" } } },
      { $group: { _id: "$mood", count: { $sum: 1 } } },
    ]);
    const recent = await Audio.find({ user: req.user._id }).sort("-createdAt").limit(5).select("title duration mood createdAt isFavorite");
    res.json({
      success: true,
      stats: { totalRecordings, favorites, totalDuration: durationAgg[0]?.totalDuration || 0, totalSize: durationAgg[0]?.totalSize || 0, moods: moodAgg, recentRecordings: recent },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching stats." });
  }
});

module.exports = router;
