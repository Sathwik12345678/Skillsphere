const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "SkillSphere API is running" });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/gigs", require("./routes/gigRoutes"));
app.use("/api/proposals", require("./routes/proposalRoutes"));
app.use("/api/conversations", require("./routes/conversationRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));

module.exports = app;
