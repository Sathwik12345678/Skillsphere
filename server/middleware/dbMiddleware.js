const { isDbConnected, getDbStatus } = require("../config/db");

const requireDb = (req, res, next) => {
  if (isDbConnected()) {
    return next();
  }

  const status = getDbStatus();

  return res.status(503).json({
    msg: "Database unavailable. Please check MongoDB connection settings and try again.",
    db: {
      connected: status.connected,
      readyState: status.readyState,
      lastError: status.lastError,
    },
  });
};

module.exports = requireDb;
