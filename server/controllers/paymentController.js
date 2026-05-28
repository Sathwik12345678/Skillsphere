const crypto = require("crypto");
const Gig = require("../models/Gig");
const Payment = require("../models/Payment");
const Proposal = require("../models/Proposal");
const { createNotification } = require("../utils/notifications");

const PAYMENT_FEE_RATE = Number(process.env.PLATFORM_FEE_RATE || 0.08);
const DEFAULT_PROVIDER = (process.env.PAYMENT_PROVIDER || "mock").toLowerCase();

const serializePayment = (payment) => ({
  _id: payment._id,
  gig: payment.gig,
  proposal: payment.proposal,
  payer: payment.payer,
  payee: payment.payee,
  amount: payment.amount,
  platformFee: payment.platformFee,
  currency: payment.currency,
  provider: payment.provider,
  providerOrderId: payment.providerOrderId,
  providerPaymentId: payment.providerPaymentId,
  method: payment.method,
  status: payment.status,
  notes: payment.notes,
  paidAt: payment.paidAt,
  releasedAt: payment.releasedAt,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
});

const populatePayment = (query) =>
  query
    .populate("gig", "title budget status category client")
    .populate("proposal", "bidAmount timeline status")
    .populate("payer", "name email role")
    .populate("payee", "name email role");

const canAccessPayment = (payment, user) =>
  user.role === "admin" ||
  String(payment.payer?._id || payment.payer) === user.id ||
  String(payment.payee?._id || payment.payee) === user.id;

exports.getCheckoutOptions = async (req, res) => {
  try {
    const gigFilter = req.user.role === "admin" ? {} : { client: req.user.id };
    const gigs = await Gig.find(gigFilter).select("_id");
    const gigIds = gigs.map((gig) => gig._id);

    const proposals = await Proposal.find({ gig: { $in: gigIds }, status: "accepted" })
      .populate("gig", "title budget status category client")
      .populate("freelancer", "name email role skills")
      .sort({ updatedAt: -1 });

    const existingPayments = await Payment.find({
      proposal: { $in: proposals.map((proposal) => proposal._id) },
      status: { $in: ["pending", "paid", "released"] },
    }).select("proposal status providerOrderId");
    const paymentByProposal = new Map(
      existingPayments.map((payment) => [String(payment.proposal), payment])
    );

    return res.json({
      proposals: proposals.map((proposal) => ({
        _id: proposal._id,
        gig: proposal.gig,
        freelancer: proposal.freelancer,
        bidAmount: proposal.bidAmount,
        timeline: proposal.timeline,
        status: proposal.status,
        payment: paymentByProposal.get(String(proposal._id)) || null,
      })),
    });
  } catch (error) {
    return res.status(500).json({ msg: "Could not load checkout options", error: error.message });
  }
};

exports.createCheckout = async (req, res) => {
  try {
    const { proposalId, currency = "USD", method = "mock", notes = "" } = req.body;

    const proposal = await Proposal.findById(proposalId)
      .populate("gig", "title budget status client")
      .populate("freelancer", "name email role");

    if (!proposal) {
      return res.status(404).json({ msg: "Proposal not found" });
    }

    if (proposal.status !== "accepted") {
      return res.status(400).json({ msg: "Payments can only be created for accepted proposals" });
    }

    if (String(proposal.gig.client) !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Only the gig owner can pay for this proposal" });
    }

    const existing = await populatePayment(
      Payment.findOne({
        proposal: proposal._id,
        status: { $in: ["pending", "paid", "released"] },
      })
    );

    if (existing) {
      return res.status(200).json({ payment: serializePayment(existing), checkoutUrl: null });
    }

    const amount = Number(proposal.bidAmount);
    const platformFee = Math.round(amount * PAYMENT_FEE_RATE * 100) / 100;
    const providerOrderId = `ss_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
    const provider = ["stripe", "razorpay"].includes(DEFAULT_PROVIDER) ? DEFAULT_PROVIDER : "mock";

    const payment = await Payment.create({
      gig: proposal.gig._id,
      proposal: proposal._id,
      payer: proposal.gig.client,
      payee: proposal.freelancer._id,
      amount,
      platformFee,
      currency: String(currency).slice(0, 3).toUpperCase(),
      provider,
      providerOrderId,
      method,
      notes,
    });

    await createNotification(req.app, {
      user: proposal.freelancer._id,
      type: "payment",
      title: "Payment checkout created",
      message: `A ${payment.currency} ${payment.amount} checkout was created for ${proposal.gig.title}.`,
      link: "/payments",
    });

    const populated = await populatePayment(Payment.findById(payment._id));

    return res.status(201).json({
      payment: serializePayment(populated),
      checkoutUrl: provider === "mock" ? null : `/payments/${payment._id}`,
    });
  } catch (error) {
    return res.status(500).json({ msg: "Could not create checkout", error: error.message });
  }
};

exports.getMyPayments = async (req, res) => {
  try {
    const filter =
      req.user.role === "admin"
        ? {}
        : { $or: [{ payer: req.user.id }, { payee: req.user.id }] };

    const payments = await populatePayment(Payment.find(filter).sort({ createdAt: -1 }).limit(75));
    return res.json({ payments: payments.map(serializePayment) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not load payments", error: error.message });
  }
};

exports.getPayment = async (req, res) => {
  try {
    const payment = await populatePayment(Payment.findById(req.params.id));

    if (!payment) {
      return res.status(404).json({ msg: "Payment not found" });
    }

    if (!canAccessPayment(payment, req.user)) {
      return res.status(403).json({ msg: "You do not have access to this payment" });
    }

    return res.json({ payment: serializePayment(payment) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not load payment", error: error.message });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const { providerPaymentId, method = "mock" } = req.body;
    const payment = await populatePayment(Payment.findById(req.params.id));

    if (!payment) {
      return res.status(404).json({ msg: "Payment not found" });
    }

    if (String(payment.payer?._id || payment.payer) !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Only the payer can confirm this payment" });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({ msg: "Only pending payments can be confirmed" });
    }

    payment.status = "paid";
    payment.method = method;
    payment.providerPaymentId =
      providerPaymentId || `mock_pay_${crypto.randomBytes(8).toString("hex")}`;
    payment.paidAt = new Date();
    await payment.save();

    await createNotification(req.app, {
      user: payment.payee._id || payment.payee,
      type: "payment",
      title: "Payment secured",
      message: `${payment.currency} ${payment.amount} is now held for ${payment.gig.title}.`,
      link: "/payments",
    });

    const populated = await populatePayment(Payment.findById(payment._id));
    return res.json({ payment: serializePayment(populated) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not confirm payment", error: error.message });
  }
};

exports.releasePayment = async (req, res) => {
  try {
    const payment = await populatePayment(Payment.findById(req.params.id));

    if (!payment) {
      return res.status(404).json({ msg: "Payment not found" });
    }

    if (String(payment.payer?._id || payment.payer) !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Only the payer can release this payment" });
    }

    if (payment.status !== "paid") {
      return res.status(400).json({ msg: "Only paid payments can be released" });
    }

    payment.status = "released";
    payment.releasedAt = new Date();
    await payment.save();

    await Gig.findByIdAndUpdate(payment.gig._id || payment.gig, { status: "closed" });

    await createNotification(req.app, {
      user: payment.payee._id || payment.payee,
      type: "payment",
      title: "Payment released",
      message: `${payment.currency} ${payment.amount - payment.platformFee} has been released.`,
      link: "/payments",
    });

    const populated = await populatePayment(Payment.findById(payment._id));
    return res.json({ payment: serializePayment(populated) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not release payment", error: error.message });
  }
};
