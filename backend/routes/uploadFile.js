import express from "express";
import multer from "multer";
import { storage } from "../config/cloudinary.js";

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});
const router = express.Router();

router.post('/', upload.single('file'), (req, res) => {
    try {
        res.status(200).json({
            message: 'Upload successful',
            url: req.file.path,
            type: req.file.mimetype
        });
    } catch (error) {
        console.error('Upload Error Details:', error);
        res.status(500).json({ error: error.message });
    }
})

export default router;