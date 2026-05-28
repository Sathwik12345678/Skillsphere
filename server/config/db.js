const mongoose = require("mongoose");

const RETRY_DELAY_MS = 10000;

const state = {
  retryTimer: null,
  lastError: null,
};

const isDbConnected = () => mongoose.connection.readyState === 1;

const getDbStatus = () => ({
  connected: isDbConnected(),
  readyState: mongoose.connection.readyState,
  lastError: state.lastError,
});

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    state.lastError = "MONGO_URI is not configured";
    console.error("MongoDB connection skipped:", state.lastError);
    return false;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    state.lastError = null;
    console.log("MongoDB Connected");
    return true;
  } catch (error) {
    state.lastError = error.message;
    console.error("MongoDB connection failed:", error.message);

    if (!state.retryTimer) {
      state.retryTimer = setTimeout(async () => {
        state.retryTimer = null;
        await connectDB();
      }, RETRY_DELAY_MS);
    }

    return false;
  }
};

mongoose.connection.on("connected", () => {
  state.lastError = null;
});

mongoose.connection.on("disconnected", () => {
  if (!state.retryTimer && process.env.MONGO_URI) {
    state.retryTimer = setTimeout(async () => {
      state.retryTimer = null;
      await connectDB();
    }, RETRY_DELAY_MS);
  }
});

module.exports = connectDB;
module.exports.getDbStatus = getDbStatus;
module.exports.isDbConnected = isDbConnected;
