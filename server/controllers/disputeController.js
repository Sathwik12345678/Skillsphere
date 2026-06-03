const Dispute = require("../models/Dispute");
const Payment = require("../models/Payment");
const { createNotification } = require("../utils/notifications");

const populateDispute = (query) =>
  query
    .populate("payment", "amount currency status providerOrderId")
    .populate("gig", "title")
    .populate("openedBy", "name email role")
    .populate("against", "name email role");

const serializeDispute = (dispute) => ({
  _id: dispute._id,
  payment: dispute.payment,
  gig: dispute.gig,
  openedBy: dispute.openedBy,
  against: dispute.against,
  reason: dispute.reason,
  evidence: dispute.evidence,
  adminNote: dispute.adminNote,
  resolution: dispute.resolution,
  status: dispute.status,
  createdAt: dispute.createdAt,
  updatedAt: dispute.updatedAt,
});

const canAccess = (dispute, user) =>
  user.role === "admin" ||
  String(dispute.openedBy?._id || dispute.openedBy) === user.id ||
  String(dispute.against?._id || dispute.against) === user.id;

exports.createDispute = async (req, res) => {
  try {
    const { paymentId, reason, evidence } = req.body;

    if (!paymentId || !reason) {
      return res.status(400).json({ msg: "Payment and reason are required" });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ msg: "Payment not found" });

    const isPayer = String(payment.payer) === req.user.id;
    const isPayee = String(payment.payee) === req.user.id;
    if (!isPayer && !isPayee && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Only payment participants can open a dispute" });
    }

    const dispute = await Dispute.create({
      payment: payment._id,
      gig: payment.gig,
      openedBy: req.user.id,
      against: isPayer ? payment.payee : payment.payer,
      reason,
      evidence: Array.isArray(evidence) ? evidence : [],
    });

    payment.status = "disputed";
    await payment.save();

    await createNotification(req.app, {
      user: isPayer ? payment.payee : payment.payer,
      type: "payment",
      title: "Dispute opened",
      message: "A payment dispute was opened for your project.",
      link: "/payments",
    });

    const populated = await populateDispute(Dispute.findById(dispute._id));
    return res.status(201).json({ dispute: serializeDispute(populated) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not create dispute", error: error.message });
  }
};

exports.getDisputes = async (req, res) => {
  try {
    const filter =
      req.user.role === "admin"
        ? {}
        : { $or: [{ openedBy: req.user.id }, { against: req.user.id }] };
    const disputes = await populateDispute(Dispute.find(filter).sort({ createdAt: -1 }).limit(100));

    return res.json({ disputes: disputes.map(serializeDispute) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not load disputes", error: error.message });
  }
};

exports.updateDispute = async (req, res) => {
  try {
    const { status, adminNote, resolution } = req.body;
    const dispute = await populateDispute(Dispute.findById(req.params.id));

    if (!dispute) return res.status(404).json({ msg: "Dispute not found" });
    if (!canAccess(dispute, req.user)) {
      return res.status(403).json({ msg: "You do not have access to this dispute" });
    }
    if (req.user.role !== "admin" && status && status !== "under_review") {
      return res.status(403).json({ msg: "Only admins can resolve disputes" });
    }

    if (status !== undefined) dispute.status = status;
    if (typeof adminNote === "string" && req.user.role === "admin") dispute.adminNote = adminNote;
    if (typeof resolution === "string" && req.user.role === "admin") dispute.resolution = resolution;
    await dispute.save();

    return res.json({ dispute: serializeDispute(dispute) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not update dispute", error: error.message });
  }
};
