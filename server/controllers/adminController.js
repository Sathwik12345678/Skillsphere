const Gig = require("../models/Gig");
const Payment = require("../models/Payment");
const Proposal = require("../models/Proposal");
const Review = require("../models/Review");
const User = require("../models/User");

const serializeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  skills: user.skills,
  bio: user.bio,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

exports.getOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      totalGigs,
      openGigs,
      totalProposals,
      acceptedProposals,
      totalReviews,
      usersByRole,
      gigsByStatus,
      paymentsByStatus,
      revenue,
      recentUsers,
      recentGigs,
      recentPayments,
    ] = await Promise.all([
      User.countDocuments(),
      Gig.countDocuments(),
      Gig.countDocuments({ status: "open" }),
      Proposal.countDocuments(),
      Proposal.countDocuments({ status: "accepted" }),
      Review.countDocuments(),
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      Gig.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Payment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$amount" } } }]),
      Payment.aggregate([
        { $match: { status: { $in: ["paid", "released"] } } },
        { $group: { _id: null, gross: { $sum: "$amount" }, fees: { $sum: "$platformFee" } } },
      ]),
      User.find().select("-password").sort({ createdAt: -1 }).limit(5),
      Gig.find().populate("client", "name email role").sort({ createdAt: -1 }).limit(5),
      Payment.find()
        .populate("gig", "title")
        .populate("payer", "name email role")
        .populate("payee", "name email role")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    return res.json({
      stats: {
        totalUsers,
        totalGigs,
        openGigs,
        totalProposals,
        acceptedProposals,
        totalReviews,
        grossVolume: revenue[0]?.gross || 0,
        platformFees: revenue[0]?.fees || 0,
      },
      breakdowns: {
        usersByRole,
        gigsByStatus,
        paymentsByStatus,
      },
      recent: {
        users: recentUsers.map(serializeUser),
        gigs: recentGigs,
        payments: recentPayments,
      },
    });
  } catch (error) {
    return res.status(500).json({ msg: "Could not load admin overview", error: error.message });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("gig", "title budget status")
      .populate("payer", "name email role")
      .populate("payee", "name email role")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({ payments });
  } catch (error) {
    return res.status(500).json({ msg: "Could not load admin payments", error: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 }).limit(100);
    return res.json({ users: users.map(serializeUser) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not load admin users", error: error.message });
  }
};
