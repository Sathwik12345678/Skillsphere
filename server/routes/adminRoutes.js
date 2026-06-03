const express = require("express");
const {
  getOverview,
  approveGig,
  getAdminLogs,
  getPayments,
  getUsers,
  updateUserStatus,
  verifyFreelancer,
} = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware, requireRole("admin"));
router.get("/overview", getOverview);
router.get("/payments", getPayments);
router.get("/users", getUsers);
router.get("/logs", getAdminLogs);
router.patch("/users/:id/status", updateUserStatus);
router.patch("/users/:id/verify", verifyFreelancer);
router.patch("/gigs/:id/approve", approveGig);

module.exports = router;
