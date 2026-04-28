const mongoose = require("mongoose");

const audioSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      default: "Untitled Recording",
      trim: true,
      maxlength: 200,
    },
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      default: "recording.webm",
    },
    filepath: {
      type: String,
      required: true,
    },
    mimetype: {
      type: String,
      default: "audio/webm",
    },
    size: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      default: 0,
    },
    transcription: {
      type: String,
      default: "",
    },
    summary: {
      type: String,
      default: "",
    },
    mood: {
      type: String,
      enum: ["happy", "stressed", "tired", "confident", "neutral", "unknown"],
      default: "unknown",
    },
    moodScore: {
      type: Number,
      default: 0,
      min: -1,
      max: 1,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isFavorite: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      enum: ["general", "meeting", "interview", "lecture", "personal", "idea", "reminder"],
      default: "general",
    },
  },
  {
    timestamps: true,
  }
);

// Index for text search on transcription
audioSchema.index({ transcription: "text", title: "text", notes: "text" });
// Index for user queries
audioSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Audio", audioSchema);
