const mongoose = require("mongoose");
const Review = require("../models/Review");
const User = require("../models/User");
const { createNotification } = require("../utils/notifications");

const serializeReview = (review) => ({
  _id: review._id,
  gig: review.gig,
  reviewer: review.reviewer,
  reviewee: review.reviewee,
  rating: review.rating,
  comment: review.comment,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
});

exports.getReviews = async (req, res) => {
  try {
    const filter = {};

    if (req.query.userId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.userId)) {
        return res.status(400).json({ msg: "Invalid user id" });
      }
      filter.reviewee = req.query.userId;
    }

    const reviews = await Review.find(filter)
      .populate("reviewer", "name email role")
      .populate("reviewee", "name email role")
      .populate("gig", "title")
      .sort({ createdAt: -1 })
      .limit(60);

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
        : 0;

    return res.json({
      reviews: reviews.map(serializeReview),
      averageRating: Number(averageRating.toFixed(1)),
    });
  } catch (error) {
    return res.status(500).json({ msg: "Could not load reviews", error: error.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { reviewee, rating, comment, gig } = req.body;

    if (!reviewee || !rating || !comment) {
      return res.status(400).json({ msg: "Reviewee, rating, and comment are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(reviewee)) {
      return res.status(400).json({ msg: "Invalid reviewee" });
    }

    if (String(reviewee) === req.user.id) {
      return res.status(400).json({ msg: "You cannot review yourself" });
    }

    const numericRating = Number(rating);
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ msg: "Rating must be between 1 and 5" });
    }

    const reviewedUser = await User.findById(reviewee);
    if (!reviewedUser) {
      return res.status(404).json({ msg: "Reviewee not found" });
    }

    const review = await Review.create({
      gig: gig || null,
      reviewer: req.user.id,
      reviewee,
      rating: numericRating,
      comment,
    });

    await review.populate("reviewer", "name email role");
    await review.populate("reviewee", "name email role");
    await review.populate("gig", "title");

    await createNotification(req.app, {
      user: reviewee,
      type: "review",
      title: "New review received",
      message: `${review.reviewer.name} rated you ${numericRating}/5.`,
      link: "/collaboration",
    });

    return res.status(201).json({ review: serializeReview(review) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ msg: "You already reviewed this person" });
    }

    return res.status(500).json({ msg: "Could not create review", error: error.message });
  }
};
