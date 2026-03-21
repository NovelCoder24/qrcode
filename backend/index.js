import dotenv from 'dotenv';
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import qrRoutes from "./routes/qrRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import redirectRoutes from "./routes/redirectRoutes.js";
import uploadFileRoutes from "./routes/uploadFile.js";
import razorpayRoutes from "./routes/razorpayRoutes.js";
import { initHealthMonitor } from "./jobs/healthMonitor.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use('/api/users', userRoutes);
app.use('/api/qrcodes', qrRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/razorpay', razorpayRoutes);

// Public Redirect Route
// This must come LAST or have a specific prefix like /r
app.use('/r', redirectRoutes);
// file upload
app.use('/api/upload', uploadFileRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Boot up the 24h cron checks
    initHealthMonitor();
});
