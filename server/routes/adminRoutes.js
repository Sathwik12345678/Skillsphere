const express = require("express");
const {
  getOverview,
  getPayments,
  getUsers,
} = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware, requireRole("admin"));
router.get("/overview", getOverview);
router.get("/payments", getPayments);
router.get("/users", getUsers);

module.exports = router;
