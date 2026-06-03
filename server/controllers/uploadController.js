const crypto = require("crypto");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const User = require("../models/User");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

const streamUpload = (fileBuffer, publicId) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "skillsphere/resumes",
        public_id: publicId,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });

exports.upload = upload;

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "Resume file is required" });
    }

    if (!cloudinary.config().api_key) {
      return res.status(500).json({ msg: "File upload is not configured" });
    }

    const publicId = `resume_${req.user.id}_${Date.now()}`;
    const result = await streamUpload(req.file.buffer, publicId);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { resumeUrl: result.secure_url },
      { returnDocument: "after" }
    ).select("-password");

    return res.json({ url: result.secure_url, user });
  } catch (error) {
    return res.status(500).json({ msg: "Could not upload file", error: error.message });
  }
};
