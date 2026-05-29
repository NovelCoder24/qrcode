import mongoose from "mongoose";

const folderSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    color: {
        type: String,
        default: "#F8F8F8" // Default subtle background color
    }
}, { timestamps: true });

// Ensure a user cannot have two folders with the same name
folderSchema.index({ user_id: 1, name: 1 }, { unique: true });

export const Folder = mongoose.model("Folder", folderSchema);
