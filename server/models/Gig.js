const mongoose = require("mongoose");

const gigSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    budget: {
      type: Number,
      required: true,
      min: 1,
    },
    deadline: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["open", "in_review", "closed"],
      default: "open",
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

gigSchema.index({
  title: "text",
  description: "text",
  category: "text",
  skills: "text",
});

module.exports = mongoose.model("Gig", gigSchema);
