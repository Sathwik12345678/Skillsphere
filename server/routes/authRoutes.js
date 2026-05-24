const express = require("express");
const {
  register,
  login,
  getProfile,
  updateProfile,
  getUsers,
  getDirectory,
  updateUserRole,
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getProfile);
router.put("/me", authMiddleware, updateProfile);
router.get("/directory", authMiddleware, getDirectory);
router.get("/users", authMiddleware, requireRole("admin"), getUsers);
router.patch("/users/:id/role", authMiddleware, requireRole("admin"), updateUserRole);

module.exports = router;
