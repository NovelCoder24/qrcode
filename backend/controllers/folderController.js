import { Folder } from "../models/Folder.js";
import { QRCode } from "../models/QRCode.js";

// @desc    Create a new folder
// @route   POST /api/folders
// @access  Private
export const createFolder = async (req, res) => {
    try {
        const { name, color } = req.body;
        
        if (!name) {
            return res.status(400).json({ message: "Folder name is required" });
        }

        const existingFolder = await Folder.findOne({ user_id: req.user._id, name });
        if (existingFolder) {
            return res.status(400).json({ message: "A folder with this name already exists" });
        }

        const folder = await Folder.create({
            user_id: req.user._id,
            name,
            color: color || "#F8F8F8"
        });

        res.status(201).json(folder);
    } catch (error) {
        console.error("Create Folder Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Get all folders for a user (with qr counts)
// @route   GET /api/folders
// @access  Private
export const getFolders = async (req, res) => {
    try {
        // Find all folders
        const folders = await Folder.find({ user_id: req.user._id }).sort({ createdAt: -1 }).lean();
        
        // Aggregate counts from QRCodes
        const folderIds = folders.map(f => f._id);
        const qrCounts = await QRCode.aggregate([
            { $match: { user_id: req.user._id, folder_id: { $in: folderIds } } },
            { $group: { _id: "$folder_id", count: { $sum: 1 } } }
        ]);

        const countMap = {};
        qrCounts.forEach(item => {
            countMap[item._id] = item.count;
        });

        const foldersWithCounts = folders.map(folder => ({
            ...folder,
            qrCount: countMap[folder._id] || 0
        }));

        res.json(foldersWithCounts);
    } catch (error) {
        console.error("Get Folders Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Update a folder
// @route   PUT /api/folders/:id
// @access  Private
export const updateFolder = async (req, res) => {
    try {
        const { name, color } = req.body;
        const folder = await Folder.findOne({ _id: req.params.id, user_id: req.user._id });

        if (!folder) {
            return res.status(404).json({ message: "Folder not found" });
        }

        if (name) folder.name = name;
        if (color) folder.color = color;

        await folder.save();
        res.json(folder);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "A folder with this name already exists" });
        }
        console.error("Update Folder Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Delete a folder (Move QRs to uncategorized)
// @route   DELETE /api/folders/:id
// @access  Private
export const deleteFolder = async (req, res) => {
    try {
        const folder = await Folder.findOne({ _id: req.params.id, user_id: req.user._id });

        if (!folder) {
            return res.status(404).json({ message: "Folder not found" });
        }

        // Move all QRs in this folder to Uncategorized (null)
        await QRCode.updateMany(
            { user_id: req.user._id, folder_id: folder._id },
            { $set: { folder_id: null } }
        );

        await Folder.deleteOne({ _id: folder._id });
        res.json({ message: "Folder deleted and QR codes moved to Uncategorized." });
    } catch (error) {
        console.error("Delete Folder Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Move a QR Code to a Folder
// @route   PATCH /api/folders/qr/:shortId
// @access  Private
export const moveQRToFolder = async (req, res) => {
    try {
        const { shortId } = req.params;
        const { folder_id } = req.body; // Can be null to move to Uncategorized

        const qr = await QRCode.findOne({ short_id: shortId, user_id: req.user._id });
        if (!qr) {
            return res.status(404).json({ message: "QR Code not found" });
        }

        if (folder_id) {
            const folder = await Folder.findOne({ _id: folder_id, user_id: req.user._id });
            if (!folder) {
                return res.status(404).json({ message: "Folder not found" });
            }
        }

        qr.folder_id = folder_id || null;
        await qr.save();

        res.json({ message: "QR Code moved successfully", folder_id: qr.folder_id });
    } catch (error) {
        console.error("Move QR Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
