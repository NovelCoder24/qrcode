import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import userRoutes from "./routes/userRoutes.js";
import qrRoutes from "./routes/qrRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import redirectRoutes from "./routes/redirectRoutes.js";
import uploadFileRoutes from "./routes/uploadFile.js";
import razorpayRoutes from "./routes/razorpayRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import folderRoutes from "./routes/folderRoutes.js";
import { env } from "./config/env.js"; 
import { getClientIp, getLocationOffline } from "./services/Geolocation.js"; 

const app = express();

app.set('trust proxy', 1);

// ==========================================
// RATE LIMITERS
// ==========================================

// Redirect route: 300 scans per IP per minute (handles conference halls with shared WiFi/NAT)
const redirectLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many scan requests. Please try again shortly." }
});

// API routes: 100 requests per IP per minute
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests. Please slow down." }
});

// Auth routes: 15 attempts per IP per 15 minutes (brute-force protection)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many login attempts. Please try again in 15 minutes." }
});

// CORS configuration — driven by env.CORS_ORIGIN (comma-separated list)
const allowedOrigins = [
  'http://localhost:5173',
  ...(env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean) : [])
];

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        // In development, allow any localhost
        if (env.NODE_ENV !== 'production' && origin && origin.includes('localhost')) {
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
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning', 'x-hub-signature-256']
}));

// ==========================================
// CRITICAL: Mount webhooks BEFORE express.json()
// Meta sends 'application/json' but we need the raw buffer for HMAC validation.
// ==========================================
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Health check endpoint for Render/Railway
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug IP endpoint to inspect Render / Cloudflare headers and visitor IP resolution
app.get('/debug-ip', (req, res) => {
    // In production, restrict debug-ip to requests with valid debug key
    if (env.NODE_ENV === 'production' && req.headers['x-debug-key'] !== env.JWT_SECRET && req.query.key !== env.JWT_SECRET) {
        return res.status(404).json({ message: "Not found" });
    }

    const detectedIp = getClientIp(req);
    const isLocalDevOverride = process.env.NODE_ENV !== 'production' &&
        !req.headers['true-client-ip'] &&
        !req.headers['cf-connecting-ip'] &&
        (!req.headers['x-forwarded-for'] || req.headers['x-forwarded-for'].includes('127.0.0.1'));

    res.json({
        trueClientIp: req.headers['true-client-ip'] || null,
        cfIp: req.headers['cf-connecting-ip'] || null,
        xff: req.headers['x-forwarded-for'] || null,
        xRealIp: req.headers['x-real-ip'] || null,
        reqIp: req.ip || null,
        detectedIp,
        isLocalDevOverride,
        geo: getLocationOffline(detectedIp),
        tip: "In local development, visits from localhost (127.0.0.1) use your real WAN public IP or test IP. You can also test any IP using /debug-ip?ip=<test_ip>."
    });
});

// Auth routes get the strictest limiter
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);
app.use('/api/users/google', authLimiter);

// Standard API limiter for all /api routes
app.use('/api', apiLimiter);

app.use('/api/users', userRoutes);
app.use('/api/qrcodes', qrRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/razorpay', razorpayRoutes);
app.use('/api/upload', uploadFileRoutes);
app.use('/api/folders', folderRoutes);

// Public Redirect Route — scan limiter
// This must come LAST or have a specific prefix like /r
app.use('/r', redirectLimiter, redirectRoutes);

export default app;
