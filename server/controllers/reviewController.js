const mongoose = require("mongoose");
const Proposal = require("../models/Proposal");
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
  verified: review.verified,
  weight: review.weight,
  flagged: review.flagged,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
});

const refreshReputation = async (userId) => {
  const reviews = await Review.find({ reviewee: userId, flagged: false });
  const weightTotal = reviews.reduce((total, review) => total + review.weight, 0);
  const weightedRating = weightTotal
    ? reviews.reduce((total, review) => total + review.rating * review.weight, 0) / weightTotal
    : 0;
  const score = Math.round((weightedRating / 5) * 80 + Math.min(reviews.length, 20));

  await User.findByIdAndUpdate(userId, { reputationScore: score });
  return score;
};

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
    const weightedTotal = reviews.reduce((total, review) => total + review.rating * review.weight, 0);
    const weightTotal = reviews.reduce((total, review) => total + review.weight, 0);

    return res.json({
      reviews: reviews.map(serializeReview),
      averageRating: Number(averageRating.toFixed(1)),
      weightedRating: weightTotal ? Number((weightedTotal / weightTotal).toFixed(1)) : 0,
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

    const verified = gig
      ? Boolean(
          await Proposal.exists({
            gig,
            $or: [
              { freelancer: reviewee, status: "accepted" },
              { freelancer: req.user.id, status: "accepted" },
            ],
          })
        )
      : false;
    const flagged = comment.trim().length < 12;

    const review = await Review.create({
      gig: gig || null,
      reviewer: req.user.id,
      reviewee,
      rating: numericRating,
      comment,
      verified,
      weight: verified ? 2 : 1,
      flagged,
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

    await refreshReputation(reviewee);

    return res.status(201).json({ review: serializeReview(review) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ msg: "You already reviewed this person" });
    }

    return res.status(500).json({ msg: "Could not create review", error: error.message });
  }
};
