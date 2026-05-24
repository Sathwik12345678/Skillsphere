const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gig",
      default: null,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

reviewSchema.index(
  { gig: 1, reviewer: 1, reviewee: 1 },
  { unique: true, partialFilterExpression: { gig: { $type: "objectId" } } }
);
reviewSchema.index(
  { reviewer: 1, reviewee: 1 },
  { unique: true, partialFilterExpression: { gig: null } }
);

module.exports = mongoose.model("Review", reviewSchema);
