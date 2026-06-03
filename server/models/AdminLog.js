const mongoose = require("mongoose");

const adminLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    targetType: {
      type: String,
      required: true,
      trim: true,
    },
    target: {
      type: mongoose.Schema.Types.ObjectId,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

adminLogSchema.index({ actor: 1, createdAt: -1 });
adminLogSchema.index({ targetType: 1, target: 1 });

module.exports = mongoose.model("AdminLog", adminLogSchema);
