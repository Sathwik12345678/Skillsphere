const express = require("express");
const {
  createGig,
  deleteGig,
  getGig,
  getGigs,
  updateGig,
} = require("../controllers/gigController");
const {
  createProposal,
  getGigProposals,
} = require("../controllers/proposalController");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getGigs);
router.post("/", authMiddleware, requireRole("client", "admin"), createGig);
router.post("/:gigId/proposals", authMiddleware, requireRole("freelancer", "admin"), createProposal);
router.get("/:gigId/proposals", authMiddleware, getGigProposals);
router.get("/:id", getGig);
router.put("/:id", authMiddleware, requireRole("client", "admin"), updateGig);
router.delete("/:id", authMiddleware, requireRole("client", "admin"), deleteGig);

module.exports = router;
