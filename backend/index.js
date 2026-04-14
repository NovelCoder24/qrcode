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

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://qrcode-jade-chi.vercel.app',
  'https://qrcode-git-dev-v2-novelsahu22-9572s-projects.vercel.app'
];

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        // In development, allow any localhost
        if (process.env.NODE_ENV !== 'production' && origin && origin.includes('localhost')) {
            return callback(null, true);
        }

        // Allow configured origins
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // Log CORS violations for debugging
        console.warn(`CORS blocked origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
        callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Health check endpoint for Railway
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

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
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
    console.log(`Server running on ${HOST}:${PORT}`);
    // Boot up the 24h cron checks
    initHealthMonitor();
});
