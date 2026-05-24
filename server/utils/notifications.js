const Notification = require("../models/Notification");

const userRoom = (userId) => `user:${userId}`;

const createNotification = async (app, payload) => {
  const notification = await Notification.create(payload);
  const populated = await notification.populate("user", "name email role");
  const io = app?.get("io");

  if (io) {
    io.to(userRoom(payload.user)).emit("notification:new", populated);
  }

  return populated;
};

module.exports = {
  createNotification,
  userRoom,
};
