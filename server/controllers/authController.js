const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { sendEmail } = require("../utils/email");
const User = require("../models/User");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  isEmailVerified: user.isEmailVerified,
  twoFactorEnabled: user.twoFactorEnabled,
  oauthProvider: user.oauthProvider,
  location: user.location,
  skills: user.skills,
  skillProficiency: user.skillProficiency,
  bio: user.bio,
  portfolio: user.portfolio,
  resumeUrl: user.resumeUrl,
  certifications: user.certifications,
  experience: user.experience,
  experienceYears: user.experienceYears,
  availability: user.availability,
  hourlyRate: user.hourlyRate,
  milestoneRate: user.milestoneRate,
  verificationBadge: user.verificationBadge,
  profileViews: user.profileViews,
  reputationScore: user.reputationScore,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

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

const sendPlatformEmail = async ({ to, subject, text, html }) => {
  try {
    return await sendEmail({ to, subject, text, html });
  } catch (error) {
    console.error("Email send failed", error.message || error);
    return false;
  }
};

const buildVerificationLink = (token) => `${CLIENT_URL}/verify-email?token=${token}`;

const sendVerificationToken = async (user) => {
  user.emailVerificationToken = crypto.randomBytes(20).toString("hex");
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  const link = buildVerificationLink(user.emailVerificationToken);
  return await sendPlatformEmail({
    to: user.email,
    subject: "Verify your SkillSphere email",
    text: `Verify your account by visiting: ${link}`,
    html: `<p>Verify your account by clicking <a href="${link}">here</a>.</p>`,
  });
};

const sendResetToken = async (user) => {
  user.passwordResetToken = crypto.randomBytes(20).toString("hex");
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  const link = `${CLIENT_URL}/reset-password?token=${user.passwordResetToken}`;
  return await sendPlatformEmail({
    to: user.email,
    subject: "Reset your SkillSphere password",
    text: `Reset your password by visiting: ${link}`,
    html: `<p>Reset your password by clicking <a href="${link}">here</a>.</p>`,
  });
};

const sendTwoFactorCode = async (user) => {
  user.twoFactorCode = crypto.randomInt(100000, 999999).toString();
  user.twoFactorExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  return await sendPlatformEmail({
    to: user.email,
    subject: "Your SkillSphere verification code",
    text: `Your SkillSphere login code is ${user.twoFactorCode}. It expires in 10 minutes.`,
    html: `<p>Your SkillSphere login code is <strong>${user.twoFactorCode}</strong>. It expires in 10 minutes.</p>`,
  });
};

const verifyGoogleToken = async (idToken) => {
  if (!process.env.GOOGLE_CLIENT_ID || !idToken) return null;

  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  return ticket.getPayload();
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, skills, bio, location } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ msg: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      skills: normalizeSkills(skills),
      bio,
      location,
      emailVerificationToken: crypto.randomBytes(20).toString("hex"),
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await sendVerificationToken(user);

    const token = signToken(user);

    return res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ msg: "Registration failed", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ msg: "Your account is suspended" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid password" });
    }

    if (user.twoFactorEnabled) {
      const emailSent = await sendTwoFactorCode(user);
      return res.json({
        requiresTwoFactor: true,
        userId: user._id,
        demoCode: emailSent ? undefined : user.twoFactorCode,
      });
    }

    const token = signToken(user);

    return res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ msg: "Login failed", error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not load profile", error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = {};
    const {
      name,
      bio,
      skills,
      skillProficiency,
      location,
      portfolio,
      resumeUrl,
      certifications,
      experience,
      experienceYears,
      availability,
      hourlyRate,
      milestoneRate,
    } = req.body;

    if (typeof name === "string") updates.name = name.trim();
    if (typeof bio === "string") updates.bio = bio.trim();
    if (skills !== undefined) updates.skills = normalizeSkills(skills);
    if (typeof location === "string") updates.location = location.trim();
    if (Array.isArray(skillProficiency)) updates.skillProficiency = skillProficiency;
    if (Array.isArray(portfolio)) updates.portfolio = portfolio;
    if (typeof resumeUrl === "string") updates.resumeUrl = resumeUrl.trim();
    if (Array.isArray(certifications)) updates.certifications = certifications;
    if (Array.isArray(experience)) updates.experience = experience;
    if (experienceYears !== undefined) updates.experienceYears = Number(experienceYears) || 0;
    if (Array.isArray(availability)) updates.availability = availability;
    if (hourlyRate !== undefined) updates.hourlyRate = Number(hourlyRate) || 0;
    if (milestoneRate !== undefined) updates.milestoneRate = Number(milestoneRate) || 0;

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      returnDocument: "after",
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not update profile", error: error.message });
  }
};

exports.requestEmailVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ msg: "User not found" });

    const sent = await sendVerificationToken(user);

    return res.json({
      msg: "Verification token generated",
      demoToken: sent ? undefined : user.emailVerificationToken,
    });
  } catch (error) {
    return res.status(500).json({ msg: "Could not create verification token", error: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ msg: "Invalid or expired verification token" });

    user.isEmailVerified = true;
    user.emailVerificationToken = "";
    user.emailVerificationExpires = undefined;
    await user.save();

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not verify email", error: error.message });
  }
};

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.json({ msg: "If the account exists, a reset token was created" });

    const sent = await sendResetToken(user);

    return res.json({
      msg: "Password reset token generated",
      demoToken: sent ? undefined : user.passwordResetToken,
    });
  } catch (error) {
    return res.status(500).json({ msg: "Could not create reset token", error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ msg: "Token and password are required" });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ msg: "Invalid or expired reset token" });

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = "";
    user.passwordResetExpires = undefined;
    await user.save();

    return res.json({ msg: "Password updated" });
  } catch (error) {
    return res.status(500).json({ msg: "Could not reset password", error: error.message });
  }
};

exports.enableTwoFactor = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { twoFactorEnabled: true },
      { returnDocument: "after" }
    ).select("-password");

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not enable 2FA", error: error.message });
  }
};

exports.verifyTwoFactor = async (req, res) => {
  try {
    const { userId, code } = req.body;
    const user = await User.findOne({
      _id: userId,
      twoFactorCode: code,
      twoFactorExpires: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ msg: "Invalid or expired 2FA code" });

    user.twoFactorCode = "";
    user.twoFactorExpires = undefined;
    await user.save();

    return res.json({ token: signToken(user), user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not verify 2FA", error: error.message });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    let { name, email, googleId, idToken, role = "client" } = req.body;

    if (process.env.GOOGLE_CLIENT_ID && idToken) {
      const payload = await verifyGoogleToken(idToken);
      if (!payload || !payload.email || !payload.sub) {
        return res.status(400).json({ msg: "Invalid Google login token" });
      }
      email = payload.email;
      googleId = payload.sub;
      name = payload.name || name || email.split("@")[0];
    }

    if (!email || !googleId) {
      return res.status(400).json({ msg: "Google profile id and email are required" });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        password: await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10),
        role,
        oauthProvider: "google",
        isEmailVerified: true,
      });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ msg: "Your account is suspended" });
    }

    return res.json({ token: signToken(user), user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ msg: "Google login failed", error: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.json({ users: users.map(sanitizeUser) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not load users", error: error.message });
  }
};

exports.getDirectory = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } })
      .select("-password")
      .sort({ name: 1 });

    return res.json({ users: users.map(sanitizeUser) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not load directory", error: error.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!["client", "freelancer", "admin"].includes(role)) {
      return res.status(400).json({ msg: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { returnDocument: "after", runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not update role", error: error.message });
  }
};
