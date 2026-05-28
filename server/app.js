const express = require("express");
const cors = require("cors");
const { getDbStatus } = require("./config/db");
const requireDb = require("./middleware/dbMiddleware");
const { createRateLimiter, securityHeaders } = require("./middleware/securityMiddleware");

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(securityHeaders);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(createRateLimiter());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "SkillSphere API is running",
    db: getDbStatus(),
  });
});

app.use("/api/auth", requireDb, require("./routes/authRoutes"));
app.use("/api/gigs", requireDb, require("./routes/gigRoutes"));
app.use("/api/proposals", requireDb, require("./routes/proposalRoutes"));
app.use("/api/conversations", requireDb, require("./routes/conversationRoutes"));
app.use("/api/notifications", requireDb, require("./routes/notificationRoutes"));
app.use("/api/reviews", requireDb, require("./routes/reviewRoutes"));
app.use("/api/payments", requireDb, require("./routes/paymentRoutes"));
app.use("/api/admin", requireDb, require("./routes/adminRoutes"));

module.exports = app;
