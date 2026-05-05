const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "SkillSphere API is running" });
});

app.use("/api/auth", require("./routes/authRoutes"));

module.exports = app;
