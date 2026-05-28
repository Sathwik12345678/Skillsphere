const Gig = require("../models/Gig");
const Proposal = require("../models/Proposal");
const { createNotification } = require("../utils/notifications");

const serializeProposal = (proposal) => ({
  _id: proposal._id,
  gig: proposal.gig,
  freelancer: proposal.freelancer,
  coverLetter: proposal.coverLetter,
  bidAmount: proposal.bidAmount,
  timeline: proposal.timeline,
  status: proposal.status,
  createdAt: proposal.createdAt,
  updatedAt: proposal.updatedAt,
});

exports.createProposal = async (req, res) => {
  try {
    const { coverLetter, bidAmount, timeline } = req.body;

    if (!coverLetter || !bidAmount || !timeline) {
      return res.status(400).json({ msg: "Cover letter, bid amount, and timeline are required" });
    }

    if (!Number.isFinite(Number(bidAmount)) || Number(bidAmount) <= 0) {
      return res.status(400).json({ msg: "Bid amount must be a positive number" });
    }

    const gig = await Gig.findById(req.params.gigId);

    if (!gig) {
      return res.status(404).json({ msg: "Gig not found" });
    }

    if (gig.status !== "open") {
      return res.status(400).json({ msg: "This gig is not accepting proposals" });
    }

    if (String(gig.client) === req.user.id) {
      return res.status(400).json({ msg: "You cannot propose on your own gig" });
    }

    const proposal = await Proposal.create({
      gig: gig._id,
      freelancer: req.user.id,
      coverLetter,
      bidAmount: Number(bidAmount),
      timeline,
    });

    await proposal.populate("freelancer", "name email role skills");
    await proposal.populate("gig", "title budget status client");

    await createNotification(req.app, {
      user: gig.client,
      type: "proposal",
      title: "New proposal received",
      message: `${proposal.freelancer.name} submitted a proposal for ${proposal.gig.title}.`,
      link: "/gigs",
    });

    return res.status(201).json({ proposal: serializeProposal(proposal) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ msg: "You have already submitted a proposal for this gig" });
    }

    return res.status(500).json({ msg: "Could not submit proposal", error: error.message });
  }
};

exports.getMyProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find({ freelancer: req.user.id })
      .populate("gig", "title budget status category client")
      .populate("freelancer", "name email role skills")
      .sort({ createdAt: -1 });

    return res.json({ proposals: proposals.map(serializeProposal) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not load proposals", error: error.message });
  }
};

exports.getGigProposals = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.gigId);

    if (!gig) {
      return res.status(404).json({ msg: "Gig not found" });
    }

    if (String(gig.client) !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Only the gig owner can view proposals" });
    }

    const proposals = await Proposal.find({ gig: gig._id })
      .populate("freelancer", "name email role skills")
      .populate("gig", "title budget status category client")
      .sort({ createdAt: -1 });

    return res.json({ proposals: proposals.map(serializeProposal) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not load proposals", error: error.message });
  }
};

exports.updateProposalStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["submitted", "shortlisted", "accepted", "rejected"].includes(status)) {
      return res.status(400).json({ msg: "Invalid proposal status" });
    }

    const proposal = await Proposal.findById(req.params.id).populate("gig");

    if (!proposal) {
      return res.status(404).json({ msg: "Proposal not found" });
    }

    if (String(proposal.gig.client) !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Only the gig owner can update proposal status" });
    }

    proposal.status = status;
    await proposal.save();
    if (status === "accepted") {
      proposal.gig.status = "in_review";
      await proposal.gig.save();
    }
    await proposal.populate("freelancer", "name email role skills");

    await createNotification(req.app, {
      user: proposal.freelancer._id,
      type: "proposal",
      title: "Proposal status updated",
      message: `Your proposal was marked ${status}.`,
      link: "/gigs",
    });

    return res.json({ proposal: serializeProposal(proposal) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not update proposal", error: error.message });
  }
};
