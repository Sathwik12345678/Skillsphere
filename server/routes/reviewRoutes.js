const express = require("express");
const { createReview, getReviews } = require("../controllers/reviewController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getReviews);
router.post("/", authMiddleware, createReview);

module.exports = router;
