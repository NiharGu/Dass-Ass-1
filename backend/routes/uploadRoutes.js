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
        resource_type: "auto", // Supports images, PDFs, etc.
        transformation: [{ quality: "auto" }] // Auto-optimize images
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// POST /api/upload — Upload a single file, returns the hosted URL
router.post("/", authMiddleware, upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        res.json({
            url: req.file.path, // Cloudinary URL
            filename: req.file.originalname || req.file.filename,
            format: req.file.format || req.file.mimetype,
            size: req.file.size
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "File upload failed" });
    }
});

module.exports = router;
