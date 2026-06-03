const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["client", "freelancer", "admin"],
      default: "client",
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: "",
    },
    emailVerificationExpires: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
      default: "",
    },
    passwordResetExpires: {
      type: Date,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorCode: {
      type: String,
      default: "",
    },
    twoFactorExpires: {
      type: Date,
    },
    oauthProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    skills: {
      type: [String],
      default: [],
    },
    skillProficiency: [
      {
        name: { type: String, trim: true },
        level: {
          type: String,
          enum: ["beginner", "intermediate", "advanced", "expert"],
          default: "intermediate",
        },
      },
    ],
    bio: {
      type: String,
      default: "",
    },
    portfolio: [
      {
        title: { type: String, trim: true },
        url: { type: String, trim: true },
        description: { type: String, trim: true, maxlength: 500 },
      },
    ],
    resumeUrl: {
      type: String,
      trim: true,
      default: "",
    },
    certifications: [
      {
        name: { type: String, trim: true },
        issuer: { type: String, trim: true },
        url: { type: String, trim: true },
      },
    ],
    experience: [
      {
        title: { type: String, trim: true },
        company: { type: String, trim: true },
        startDate: Date,
        endDate: Date,
        description: { type: String, trim: true, maxlength: 800 },
      },
    ],
    experienceYears: {
      type: Number,
      min: 0,
      default: 0,
    },
    availability: [
      {
        startsAt: Date,
        endsAt: Date,
        note: { type: String, trim: true, maxlength: 200 },
        booked: { type: Boolean, default: false },
      },
    ],
    hourlyRate: {
      type: Number,
      min: 0,
      default: 0,
    },
    milestoneRate: {
      type: Number,
      min: 0,
      default: 0,
    },
    verificationBadge: {
      type: Boolean,
      default: false,
    },
    profileViews: {
      type: Number,
      min: 0,
      default: 0,
    },
    reputationScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, status: 1, verificationBadge: 1 });
userSchema.index({ skills: 1, location: 1, experienceYears: -1 });

module.exports = mongoose.model("User", userSchema);
