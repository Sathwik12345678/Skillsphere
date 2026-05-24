const express = require("express");
const {
  getMyProposals,
  updateProposalStatus,
} = require("../controllers/proposalController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/mine", authMiddleware, getMyProposals);
router.patch("/:id/status", authMiddleware, updateProposalStatus);

module.exports = router;
