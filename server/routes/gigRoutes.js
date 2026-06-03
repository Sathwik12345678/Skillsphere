const express = require("express");
const {
  createGig,
  deleteGig,
  addProgressLog,
  getGig,
  getGigs,
  getRecommendations,
  getTrendingSkills,
  inviteFreelancer,
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
router.get("/trending-skills", getTrendingSkills);
router.post("/", authMiddleware, requireRole("client", "admin"), createGig);
router.post("/:gigId/proposals", authMiddleware, requireRole("freelancer", "admin"), createProposal);
router.get("/:gigId/proposals", authMiddleware, getGigProposals);
router.get("/:id/recommendations", authMiddleware, requireRole("client", "admin"), getRecommendations);
router.post("/:id/invite", authMiddleware, requireRole("client", "admin"), inviteFreelancer);
router.post("/:id/progress", authMiddleware, addProgressLog);
router.get("/:id", getGig);
router.put("/:id", authMiddleware, requireRole("client", "admin"), updateGig);
router.delete("/:id", authMiddleware, requireRole("client", "admin"), deleteGig);

module.exports = router;
