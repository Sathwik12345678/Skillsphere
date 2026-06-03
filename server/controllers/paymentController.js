const crypto = require("crypto");
const Razorpay = require("razorpay");
const stripe = require("../config/stripe");
const Gig = require("../models/Gig");
const Payment = require("../models/Payment");
const Proposal = require("../models/Proposal");
const User = require("../models/User");
const { createNotification } = require("../utils/notifications");

const PAYMENT_FEE_RATE = Number(process.env.PLATFORM_FEE_RATE || 0.08);
const DEFAULT_PROVIDER = (process.env.PAYMENT_PROVIDER || "mock").toLowerCase();

const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

const isProviderConfigured = {
  stripe: Boolean(stripe),
  razorpay: Boolean(razorpay),
};

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
  milestones: payment.milestones,
  notes: payment.notes,
  paidAt: payment.paidAt,
  releasedAt: payment.releasedAt,
  refundedAt: payment.refundedAt,
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
      .populate("gig", "title budget status client milestones")
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

    const payerUser = await User.findById(req.user.id).select("name email");
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
    let provider = ["stripe", "razorpay"].includes(DEFAULT_PROVIDER) ? DEFAULT_PROVIDER : "mock";
    if (provider !== "mock" && !isProviderConfigured[provider]) {
      provider = "mock";
    }

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
      milestones: (proposal.gig.milestones || []).length
        ? proposal.gig.milestones.map((milestone) => ({
            title: milestone.title,
            amount: milestone.amount,
          }))
        : [{ title: "Project escrow", amount }],
    });

    let checkoutUrl = null;
    let checkoutData = null;

    if (provider === "stripe" && stripe) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: payment.currency.toLowerCase(),
              product_data: {
                name: proposal.gig.title,
                description: proposal.gig.category,
              },
              unit_amount: Math.round(payment.amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/payments?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/payments?cancelled=1`,
        metadata: {
          paymentId: payment._id.toString(),
          providerOrderId: providerOrderId,
        },
        customer_email: payerUser?.email,
      });

      payment.providerPaymentId = session.id;
      await payment.save();
      checkoutUrl = session.url;
    } else if (provider === "razorpay" && razorpay) {
      const order = await razorpay.orders.create({
        amount: Math.round(payment.amount * 100),
        currency: payment.currency,
        receipt: providerOrderId,
        payment_capture: 1,
      });

      payment.providerPaymentId = order.id;
      await payment.save();

      checkoutData = {
        provider: "razorpay",
        keyId: process.env.RAZORPAY_KEY_ID,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        name: "SkillSphere",
        description: proposal.gig.title,
        prefill: {
          email: payerUser?.email || "",
          name: payerUser?.name || "",
        },
      };
    }

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
      checkoutUrl,
      checkoutData,
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

    const providerPayment = providerPaymentId || payment.providerPaymentId;

    if (payment.provider === "stripe" && stripe) {
      const session = await stripe.checkout.sessions.retrieve(providerPayment);
      if (session.payment_status !== "paid") {
        return res.status(400).json({ msg: "Stripe payment has not completed" });
      }
      payment.method = method === "mock" ? "card" : method;
      payment.providerPaymentId = session.payment_intent || providerPayment;
    } else if (payment.provider === "razorpay" && razorpay) {
      if (!providerPayment) {
        return res.status(400).json({ msg: "Razorpay payment id is required" });
      }
      const razorpayPayment = await razorpay.payments.fetch(providerPayment);
      if (razorpayPayment.status !== "captured") {
        return res.status(400).json({ msg: "Razorpay payment has not been captured" });
      }
      payment.method = method === "mock" ? "upi" : method;
      payment.providerPaymentId = providerPayment;
    } else {
      payment.method = method;
      payment.providerPaymentId =
        providerPayment || `mock_pay_${crypto.randomBytes(8).toString("hex")}`;
    }

    payment.status = "paid";
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

exports.handlePaymentWebhook = async (req, res) => {
  try {
    if (stripe && process.env.STRIPE_WEBHOOK_SECRET) {
      const signature = req.headers["stripe-signature"];
      const rawBody = req.rawBody || req.body || Buffer.from("{}");
      const event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const paymentId = session.metadata?.paymentId;
        if (paymentId) {
          const payment = await Payment.findById(paymentId);
          if (payment && session.payment_status === "paid") {
            payment.status = "paid";
            payment.paidAt = new Date();
            payment.providerPaymentId = session.payment_intent || payment.providerPaymentId;
            await payment.save();
          }
        }
      }
      return res.json({ received: true });
    }

    if (razorpay) {
      const rawBody = req.rawBody || req.body;
      const body = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;
      const event = body?.event;
      const payload = body?.payload?.payment?.entity;
      if (event === "payment.captured" && payload) {
        const payment = await Payment.findOne({ providerPaymentId: payload.order_id });
        if (payment) {
          payment.status = "paid";
          payment.paidAt = new Date();
          payment.providerPaymentId = payload.id;
          await payment.save();
        }
      }
      return res.json({ received: true });
    }

    return res.status(400).json({ msg: "Webhook provider not configured" });
  } catch (error) {
    return res.status(400).json({ msg: "Webhook processing failed", error: error.message });
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

exports.refundPayment = async (req, res) => {
  try {
    const payment = await populatePayment(Payment.findById(req.params.id));

    if (!payment) {
      return res.status(404).json({ msg: "Payment not found" });
    }

    if (String(payment.payer?._id || payment.payer) !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Only the payer or admin can refund this payment" });
    }

    if (!["pending", "paid", "disputed"].includes(payment.status)) {
      return res.status(400).json({ msg: "This payment cannot be refunded" });
    }

    payment.status = "refunded";
    payment.refundedAt = new Date();
    payment.milestones = (payment.milestones || []).map((milestone) => {
      const item = typeof milestone.toObject === "function" ? milestone.toObject() : milestone;
      return { ...item, status: "refunded" };
    });
    await payment.save();

    await createNotification(req.app, {
      user: payment.payee._id || payment.payee,
      type: "payment",
      title: "Payment refunded",
      message: `${payment.currency} ${payment.amount} was refunded for ${payment.gig.title}.`,
      link: "/payments",
    });

    const populated = await populatePayment(Payment.findById(payment._id));
    return res.json({ payment: serializePayment(populated) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not refund payment", error: error.message });
  }
};
