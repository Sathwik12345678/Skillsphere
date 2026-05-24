const express = require("express");
const {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getNotifications);
router.patch("/read-all", authMiddleware, markAllNotificationsRead);
router.patch("/:id/read", authMiddleware, markNotificationRead);

module.exports = router;
