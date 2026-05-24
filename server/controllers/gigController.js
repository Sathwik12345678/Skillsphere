const mongoose = require("mongoose");
const Gig = require("../models/Gig");
const Proposal = require("../models/Proposal");

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
  const { q, category, minBudget, maxBudget, status, skills } = query;

  if (q) {
    filter.$text = { $search: q };
  }

  if (category) {
    filter.category = new RegExp(`^${escapeRegex(category)}$`, "i");
  }

  if (status) {
    filter.status = status;
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
  skills: gig.skills,
  budget: gig.budget,
  deadline: gig.deadline,
  status: gig.status,
  client: gig.client,
  proposalCount,
  createdAt: gig.createdAt,
  updatedAt: gig.updatedAt,
});

exports.getGigs = async (req, res) => {
  try {
    const filter = buildGigQuery(req.query);
    const sort = req.query.q ? { score: { $meta: "textScore" } } : { createdAt: -1 };
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

    return res.json({
      gigs: gigs.map((gig) => serializeGig(gig, countMap.get(String(gig._id)) || 0)),
    });
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
    const { title, description, category, skills, budget, deadline } = req.body;

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
      skills: normalizeSkills(skills),
      budget: Number(budget),
      deadline: deadline || undefined,
      client: req.user.id,
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

    const { title, description, category, skills, budget, deadline, status } = req.body;

    if (title !== undefined) gig.title = title;
    if (description !== undefined) gig.description = description;
    if (category !== undefined) gig.category = category;
    if (skills !== undefined) gig.skills = normalizeSkills(skills);
    if (budget !== undefined) {
      if (!Number.isFinite(Number(budget)) || Number(budget) <= 0) {
        return res.status(400).json({ msg: "Budget must be a positive number" });
      }
      gig.budget = Number(budget);
    }
    if (deadline !== undefined) gig.deadline = deadline || undefined;
    if (status !== undefined) gig.status = status;

    await gig.save();
    await gig.populate("client", "name email role");

    return res.json({ gig: serializeGig(gig) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not update gig", error: error.message });
  }
};

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
