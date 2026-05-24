const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gig",
      default: null,
    },
    lastMessage: {
      type: String,
      default: "",
      trim: true,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, updatedAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
