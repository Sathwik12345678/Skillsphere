const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(60);

    return res.json({ notifications });
  } catch (error) {
    return res.status(500).json({ msg: "Could not load notifications", error: error.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" });
    }

    return res.json({ notification });
  } catch (error) {
    return res.status(500).json({ msg: "Could not update notification", error: error.message });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(60);

    return res.json({ notifications });
  } catch (error) {
    return res.status(500).json({ msg: "Could not update notifications", error: error.message });
  }
};
