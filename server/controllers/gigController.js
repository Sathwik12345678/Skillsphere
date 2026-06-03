const mongoose = require("mongoose");
const redisClient = require("../config/redis");
const Gig = require("../models/Gig");
const Proposal = require("../models/Proposal");
const Review = require("../models/Review");
const User = require("../models/User");
const { createNotification } = require("../utils/notifications");

const normalizeSkills = (skills) => {
  if (Array.isArray(skills)) {
    return skills.map((skill) => String(skill).trim()).filter(Boolean);
  }

  if (typeof skills === "string") {
    return skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
  }

  return [];
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildGigQuery = (query) => {
  const filter = {};
  const { q, category, minBudget, maxBudget, status, skills, location, listingType } = query;

  if (q) {
    filter.$text = { $search: q };
  }

  if (category) {
    filter.category = new RegExp(`^${escapeRegex(category)}$`, "i");
  }

  if (listingType) {
    filter.listingType = listingType;
  }

  if (status) {
    filter.status = status;
  }

  if (location) {
    filter.location = new RegExp(escapeRegex(location), "i");
  }

  const skillList = normalizeSkills(skills);
  if (skillList.length) {
    filter.skills = { $in: skillList.map((skill) => new RegExp(`^${escapeRegex(skill)}$`, "i")) };
  }

  const budget = {};
  if (minBudget && Number.isFinite(Number(minBudget))) budget.$gte = Number(minBudget);
  if (maxBudget && Number.isFinite(Number(maxBudget))) budget.$lte = Number(maxBudget);
  if (Object.keys(budget).length) filter.budget = budget;

  return filter;
};

const serializeGig = (gig, proposalCount = 0) => ({
  _id: gig._id,
  title: gig.title,
  description: gig.description,
  category: gig.category,
  listingType: gig.listingType,
  company: gig.company,
  location: gig.location,
  duration: gig.duration,
  experienceLevel: gig.experienceLevel,
  skills: gig.skills,
  budget: gig.budget,
  stipend: gig.stipend,
  budgetMin: gig.budgetMin,
  budgetMax: gig.budgetMax,
  deadline: gig.deadline,
  status: gig.status,
  client: gig.client,
  milestones: gig.milestones,
  attachments: gig.attachments,
  invitedFreelancers: gig.invitedFreelancers,
  progressPercent: gig.progressPercent,
  progressLogs: gig.progressLogs,
  approved: gig.approved,
  proposalCount,
  createdAt: gig.createdAt,
  updatedAt: gig.updatedAt,
});

exports.getGigs = async (req, res) => {
  try {
    const cacheKey = `gigs:${JSON.stringify(req.query || {})}`;
    if (redisClient) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    }

    const filter = buildGigQuery(req.query);
    const sort = req.query.q
      ? { score: { $meta: "textScore" }, createdAt: -1 }
      : { createdAt: -1 };
    const projection = req.query.q ? { score: { $meta: "textScore" } } : {};

    const gigs = await Gig.find(filter, projection)
      .populate("client", "name email role")
      .sort(sort)
      .limit(50);

    const counts = await Proposal.aggregate([
      { $match: { gig: { $in: gigs.map((gig) => gig._id) } } },
      { $group: { _id: "$gig", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((item) => [String(item._id), item.count]));

    const response = {
      gigs: gigs.map((gig) => serializeGig(gig, countMap.get(String(gig._id)) || 0)),
    };

    if (redisClient) {
      await redisClient.setEx(cacheKey, 60, JSON.stringify(response));
    }

    return res.json(response);
  } catch (error) {
    return res.status(500).json({ msg: "Could not load gigs", error: error.message });
  }
};

exports.getGig = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ msg: "Gig not found" });
    }

    const gig = await Gig.findById(req.params.id).populate("client", "name email role");

    if (!gig) {
      return res.status(404).json({ msg: "Gig not found" });
    }

    const proposalCount = await Proposal.countDocuments({ gig: gig._id });
    return res.json({ gig: serializeGig(gig, proposalCount) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not load gig", error: error.message });
  }
};

exports.createGig = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      listingType,
      company,
      skills,
      budget,
      stipend,
      budgetMin,
      budgetMax,
      deadline,
      location,
      duration,
      experienceLevel,
      milestones,
      attachments,
      invitedFreelancers,
    } = req.body;

    if (!title || !description || !category || !budget) {
      return res.status(400).json({ msg: "Title, description, category, and budget are required" });
    }

    if (!Number.isFinite(Number(budget)) || Number(budget) <= 0) {
      return res.status(400).json({ msg: "Budget must be a positive number" });
    }

    const gig = await Gig.create({
      title,
      description,
      category,
      listingType: ["project", "internship", "job"].includes(listingType) ? listingType : "project",
      company,
      location,
      duration,
      experienceLevel,
      skills: normalizeSkills(skills),
      budget: Number(budget),
      stipend: Number(stipend) || Number(budget),
      budgetMin: Number(budgetMin) || Number(budget),
      budgetMax: Number(budgetMax) || Number(budget),
      deadline: deadline || undefined,
      client: req.user.id,
      milestones: Array.isArray(milestones) ? milestones : [],
      attachments: Array.isArray(attachments) ? attachments : [],
      invitedFreelancers: Array.isArray(invitedFreelancers) ? invitedFreelancers : [],
    });

    await gig.populate("client", "name email role");
    return res.status(201).json({ gig: serializeGig(gig) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not create gig", error: error.message });
  }
};

exports.updateGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return res.status(404).json({ msg: "Gig not found" });
    }

    if (String(gig.client) !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Only the gig owner can update this gig" });
    }

    const {
      title,
      description,
      category,
      listingType,
      company,
      skills,
      budget,
      stipend,
      budgetMin,
      budgetMax,
      deadline,
      status,
      location,
      duration,
      experienceLevel,
      milestones,
      attachments,
      invitedFreelancers,
      approved,
    } = req.body;

    if (title !== undefined) gig.title = title;
    if (description !== undefined) gig.description = description;
    if (category !== undefined) gig.category = category;
    if (listingType !== undefined && ["project", "internship", "job"].includes(listingType)) {
      gig.listingType = listingType;
    }
    if (company !== undefined) gig.company = company;
    if (location !== undefined) gig.location = location;
    if (duration !== undefined) gig.duration = duration;
    if (experienceLevel !== undefined) gig.experienceLevel = experienceLevel;
    if (skills !== undefined) gig.skills = normalizeSkills(skills);
    if (budget !== undefined) {
      if (!Number.isFinite(Number(budget)) || Number(budget) <= 0) {
        return res.status(400).json({ msg: "Budget must be a positive number" });
      }
      gig.budget = Number(budget);
    }
    if (stipend !== undefined) gig.stipend = Number(stipend) || 0;
    if (budgetMin !== undefined) gig.budgetMin = Number(budgetMin) || 0;
    if (budgetMax !== undefined) gig.budgetMax = Number(budgetMax) || 0;
    if (deadline !== undefined) gig.deadline = deadline || undefined;
    if (status !== undefined) gig.status = status;
    if (milestones !== undefined && Array.isArray(milestones)) gig.milestones = milestones;
    if (attachments !== undefined && Array.isArray(attachments)) gig.attachments = attachments;
    if (invitedFreelancers !== undefined && Array.isArray(invitedFreelancers)) {
      gig.invitedFreelancers = invitedFreelancers;
    }
    if (approved !== undefined && req.user.role === "admin") gig.approved = Boolean(approved);

    await gig.save();
    await gig.populate("client", "name email role");

    return res.json({ gig: serializeGig(gig) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not update gig", error: error.message });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id).populate("client", "location");

    if (!gig) return res.status(404).json({ msg: "Gig not found" });

    const freelancers = await User.find({
      role: "freelancer",
      status: "active",
      _id: { $ne: gig.client?._id || gig.client },
    }).select("-password");

    const reviews = await Review.aggregate([
      { $match: { reviewee: { $in: freelancers.map((freelancer) => freelancer._id) } } },
      {
        $group: {
          _id: "$reviewee",
          rating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);
    const reviewMap = new Map(reviews.map((review) => [String(review._id), review]));
    const gigSkills = new Set((gig.skills || []).map((skill) => skill.toLowerCase()));

    const recommendations = freelancers
      .map((freelancer) => {
        const skillMatches = (freelancer.skills || []).filter((skill) =>
          gigSkills.has(String(skill).toLowerCase())
        );
        const skillScore = gigSkills.size ? (skillMatches.length / gigSkills.size) * 60 : 0;
        const review = reviewMap.get(String(freelancer._id));
        const ratingScore = ((review?.rating || 0) / 5) * 25;
        const locationScore =
          gig.location &&
          freelancer.location &&
          gig.location.toLowerCase() === freelancer.location.toLowerCase()
            ? 10
            : 0;
        const verificationScore = freelancer.verificationBadge ? 5 : 0;

        return {
          freelancer: sanitizeFreelancer(freelancer),
          score: Math.round(skillScore + ratingScore + locationScore + verificationScore),
          skillMatches,
          averageRating: Number((review?.rating || 0).toFixed(1)),
          reviewCount: review?.count || 0,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return res.json({ recommendations });
  } catch (error) {
    return res.status(500).json({ msg: "Could not load recommendations", error: error.message });
  }
};

exports.getTrendingSkills = async (req, res) => {
  try {
    const rows = await Gig.aggregate([
      { $unwind: "$skills" },
      { $group: { _id: { $toLower: "$skills" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 12 },
    ]);

    return res.json({
      skills: rows.map((row) => ({ skill: row._id, count: row.count })),
    });
  } catch (error) {
    return res.status(500).json({ msg: "Could not load trending skills", error: error.message });
  }
};

exports.inviteFreelancer = async (req, res) => {
  try {
    const { freelancerId } = req.body;
    const gig = await Gig.findById(req.params.id);

    if (!gig) return res.status(404).json({ msg: "Gig not found" });
    if (String(gig.client) !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Only the gig owner can invite freelancers" });
    }
    if (!mongoose.Types.ObjectId.isValid(freelancerId)) {
      return res.status(400).json({ msg: "Valid freelancer id is required" });
    }

    if (!gig.invitedFreelancers.some((id) => String(id) === freelancerId)) {
      gig.invitedFreelancers.push(freelancerId);
      await gig.save();
    }

    await createNotification(req.app, {
      user: freelancerId,
      type: "gig",
      title: "Gig invitation",
      message: `You were invited to ${gig.title}.`,
      link: "/gigs",
    });

    return res.json({ gig: serializeGig(gig) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not invite freelancer", error: error.message });
  }
};

exports.addProgressLog = async (req, res) => {
  try {
    const { note, percent, attachments } = req.body;
    const gig = await Gig.findById(req.params.id);

    if (!gig) return res.status(404).json({ msg: "Gig not found" });
    if (String(gig.client) !== req.user.id && req.user.role !== "admin") {
      const accepted = await Proposal.exists({
        gig: gig._id,
        freelancer: req.user.id,
        status: "accepted",
      });
      if (!accepted) return res.status(403).json({ msg: "Only project members can update progress" });
    }

    const nextPercent = Math.max(0, Math.min(100, Number(percent) || gig.progressPercent));
    gig.progressPercent = nextPercent;
    gig.progressLogs.push({
      note,
      percent: nextPercent,
      attachments: Array.isArray(attachments) ? attachments : [],
      createdBy: req.user.id,
    });
    await gig.save();

    return res.json({ gig: serializeGig(gig) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not update progress", error: error.message });
  }
};

const sanitizeFreelancer = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  skills: user.skills,
  location: user.location,
  hourlyRate: user.hourlyRate,
  milestoneRate: user.milestoneRate,
  experienceYears: user.experienceYears,
  verificationBadge: user.verificationBadge,
  reputationScore: user.reputationScore,
});

exports.deleteGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return res.status(404).json({ msg: "Gig not found" });
    }

    if (String(gig.client) !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Only the gig owner can delete this gig" });
    }

    await Proposal.deleteMany({ gig: gig._id });
    await gig.deleteOne();

    return res.json({ msg: "Gig deleted" });
  } catch (error) {
    return res.status(500).json({ msg: "Could not delete gig", error: error.message });
  }
};
