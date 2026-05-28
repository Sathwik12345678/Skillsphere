const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  skills: user.skills,
  bio: user.bio,
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

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, skills, bio } = req.body;

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
      skills,
      bio,
    });

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

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid password" });
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
    const { name, bio, skills } = req.body;

    if (typeof name === "string") updates.name = name.trim();
    if (typeof bio === "string") updates.bio = bio.trim();
    if (skills !== undefined) updates.skills = normalizeSkills(skills);

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
