const express = require("express");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "felicity-uploads",
        allowed_formats: ["jpg", "jpeg", "png", "gif", "pdf", "doc", "docx", "txt", "zip"],
        resource_type: "auto",
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// POST /api/upload — Upload a single file, returns the hosted URL
router.post("/", authMiddleware, (req, res) => {
    upload.single("file")(req, res, (err) => {
        if (err) {
            console.error("[UPLOAD] Multer/Cloudinary error:", err);
            return res.status(500).json({ message: err.message || "File upload failed" });
        }

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        console.log("[UPLOAD] Success:", req.file.path);
        res.json({
            url: req.file.path,
            filename: req.file.originalname || req.file.filename,
            format: req.file.format || req.file.mimetype,
            size: req.file.size
        });
    });
});

module.exports = router;
