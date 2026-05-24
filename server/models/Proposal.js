const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema(
  {
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gig",
      required: true,
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coverLetter: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    bidAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    timeline: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    status: {
      type: String,
      enum: ["submitted", "shortlisted", "accepted", "rejected"],
      default: "submitted",
    },
  },
  { timestamps: true }
);

proposalSchema.index({ gig: 1, freelancer: 1 }, { unique: true });

module.exports = mongoose.model("Proposal", proposalSchema);
