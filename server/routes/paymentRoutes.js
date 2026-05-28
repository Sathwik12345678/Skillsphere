const express = require("express");
const {
  confirmPayment,
  createCheckout,
  getCheckoutOptions,
  getMyPayments,
  getPayment,
  releasePayment,
} = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getMyPayments);
router.get("/checkout-options", authMiddleware, requireRole("client", "admin"), getCheckoutOptions);
router.post("/checkout", authMiddleware, requireRole("client", "admin"), createCheckout);
router.get("/:id", authMiddleware, getPayment);
router.post("/:id/confirm", authMiddleware, confirmPayment);
router.post("/:id/release", authMiddleware, releasePayment);

module.exports = router;
