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
    listingType: {
      type: String,
      enum: ["project", "internship", "job"],
      default: "project",
    },
    company: {
      type: String,
      trim: true,
      default: "",
    },
    duration: {
      type: String,
      trim: true,
      default: "",
    },
    experienceLevel: {
      type: String,
      trim: true,
      default: "",
    },
    stipend: {
      type: Number,
      min: 0,
      default: 0,
    },
    location: {
      type: String,
      trim: true,
      default: "",
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
    budgetMin: {
      type: Number,
      min: 0,
      default: 0,
    },
    budgetMax: {
      type: Number,
      min: 0,
      default: 0,
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
    milestones: [
      {
        title: { type: String, required: true, trim: true },
        amount: { type: Number, min: 0, default: 0 },
        dueDate: Date,
        status: {
          type: String,
          enum: ["pending", "in_progress", "submitted", "approved", "paid"],
          default: "pending",
        },
      },
    ],
    attachments: [
      {
        name: { type: String, trim: true },
        url: { type: String, trim: true },
        type: { type: String, trim: true },
      },
    ],
    invitedFreelancers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    progressPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    progressLogs: [
      {
        note: { type: String, trim: true, maxlength: 800 },
        percent: { type: Number, min: 0, max: 100 },
        attachments: [
          {
            name: { type: String, trim: true },
            url: { type: String, trim: true },
            type: { type: String, trim: true },
          },
        ],
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    approved: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

gigSchema.index({
  title: "text",
  description: "text",
  category: "text",
  company: "text",
  skills: "text",
  location: "text",
});
gigSchema.index({ listingType: 1, location: 1, budget: 1, status: 1 });
gigSchema.index({ invitedFreelancers: 1 });

module.exports = mongoose.model("Gig", gigSchema);
