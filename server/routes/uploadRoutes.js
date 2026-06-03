const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { upload, uploadResume } = require("../controllers/uploadController");

const router = express.Router();

router.post("/resume", authMiddleware, upload.single("file"), uploadResume);

module.exports = router;
