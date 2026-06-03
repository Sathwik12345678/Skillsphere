const express = require("express");
const {
  createDispute,
  getDisputes,
  updateDispute,
} = require("../controllers/disputeController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getDisputes);
router.post("/", authMiddleware, createDispute);
router.patch("/:id", authMiddleware, updateDispute);

module.exports = router;
