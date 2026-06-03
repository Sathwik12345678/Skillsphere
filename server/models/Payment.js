const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gig",
      required: true,
    },
    proposal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Proposal",
      required: true,
    },
    payer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    payee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    platformFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      uppercase: true,
      trim: true,
      default: "USD",
      maxlength: 3,
    },
    provider: {
      type: String,
      enum: ["mock", "stripe", "razorpay"],
      default: "mock",
    },
    providerOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    providerPaymentId: {
      type: String,
      default: "",
    },
    method: {
      type: String,
      enum: ["card", "upi", "bank_transfer", "wallet", "mock"],
      default: "mock",
    },
    status: {
      type: String,
      enum: ["pending", "paid", "released", "failed", "refunded", "disputed"],
      default: "pending",
    },
    milestones: [
      {
        title: { type: String, trim: true },
        amount: { type: Number, min: 0, default: 0 },
        status: {
          type: String,
          enum: ["escrowed", "released", "refunded"],
          default: "escrowed",
        },
        releasedAt: Date,
      },
    ],
    paidAt: {
      type: Date,
    },
    releasedAt: {
      type: Date,
    },
    refundedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  { timestamps: true }
);

paymentSchema.index({ payer: 1, createdAt: -1 });
paymentSchema.index({ payee: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
