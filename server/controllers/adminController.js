const AdminLog = require("../models/AdminLog");
const Dispute = require("../models/Dispute");
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
  status: user.status,
  verificationBadge: user.verificationBadge,
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
      openDisputes,
      usersByRole,
      gigsByStatus,
      paymentsByStatus,
      topCategories,
      revenue,
      recentUsers,
      recentGigs,
      recentPayments,
      recentDisputes,
    ] = await Promise.all([
      User.countDocuments(),
      Gig.countDocuments(),
      Gig.countDocuments({ status: "open" }),
      Proposal.countDocuments(),
      Proposal.countDocuments({ status: "accepted" }),
      Review.countDocuments(),
      Dispute.countDocuments({ status: { $in: ["open", "under_review"] } }),
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      Gig.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Payment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$amount" } } }]),
      Gig.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
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
      Dispute.find()
        .populate("gig", "title")
        .populate("openedBy", "name email role")
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
        openDisputes,
        grossVolume: revenue[0]?.gross || 0,
        platformFees: revenue[0]?.fees || 0,
        jobSuccessRate: totalProposals
          ? Math.round((acceptedProposals / totalProposals) * 100)
          : 0,
      },
      breakdowns: {
        usersByRole,
        gigsByStatus,
        paymentsByStatus,
        topCategories,
      },
      recent: {
        users: recentUsers.map(serializeUser),
        gigs: recentGigs,
        payments: recentPayments,
        disputes: recentDisputes,
      },
    });
  } catch (error) {
    return res.status(500).json({ msg: "Could not load admin overview", error: error.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "suspended"].includes(status)) {
      return res.status(400).json({ msg: "Invalid account status" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: "after", runValidators: true }
    ).select("-password");

    if (!user) return res.status(404).json({ msg: "User not found" });

    await AdminLog.create({
      actor: req.user.id,
      action: `user:${status}`,
      targetType: "User",
      target: user._id,
    });

    return res.json({ user: serializeUser(user) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not update user status", error: error.message });
  }
};

exports.verifyFreelancer = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { verificationBadge: true },
      { returnDocument: "after", runValidators: true }
    ).select("-password");

    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.role !== "freelancer") {
      return res.status(400).json({ msg: "Only freelancer profiles can receive a verification badge" });
    }

    await AdminLog.create({
      actor: req.user.id,
      action: "freelancer:verify",
      targetType: "User",
      target: user._id,
    });

    return res.json({ user: serializeUser(user) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not verify freelancer", error: error.message });
  }
};

exports.approveGig = async (req, res) => {
  try {
    const gig = await Gig.findByIdAndUpdate(
      req.params.id,
      { approved: true, status: "open" },
      { returnDocument: "after", runValidators: true }
    ).populate("client", "name email role");

    if (!gig) return res.status(404).json({ msg: "Gig not found" });

    await AdminLog.create({
      actor: req.user.id,
      action: "gig:approve",
      targetType: "Gig",
      target: gig._id,
    });

    return res.json({ gig });
  } catch (error) {
    return res.status(500).json({ msg: "Could not approve gig", error: error.message });
  }
};

exports.getAdminLogs = async (req, res) => {
  try {
    const logs = await AdminLog.find()
      .populate("actor", "name email role")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({ logs });
  } catch (error) {
    return res.status(500).json({ msg: "Could not load admin logs", error: error.message });
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
