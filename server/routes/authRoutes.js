const express = require("express");
const {
  register,
  login,
  enableTwoFactor,
  googleLogin,
  getProfile,
  updateProfile,
  getUsers,
  getDirectory,
  requestEmailVerification,
  requestPasswordReset,
  resetPassword,
  updateUserRole,
  verifyEmail,
  verifyTwoFactor,
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/2fa/verify", verifyTwoFactor);
router.post("/password/forgot", requestPasswordReset);
router.post("/password/reset", resetPassword);
router.get("/me", authMiddleware, getProfile);
router.put("/me", authMiddleware, updateProfile);
router.post("/email/verification", authMiddleware, requestEmailVerification);
router.post("/email/verify", verifyEmail);
router.post("/2fa/enable", authMiddleware, enableTwoFactor);
router.get("/directory", authMiddleware, getDirectory);
router.get("/users", authMiddleware, requireRole("admin"), getUsers);
router.patch("/users/:id/role", authMiddleware, requireRole("admin"), updateUserRole);

module.exports = router;
