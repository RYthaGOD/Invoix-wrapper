import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { rateLimit } from "express-rate-limit";
import apiRoutes from "./routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Global Rate Limiting - Prevent DoS on heavy transaction building endpoints
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: "Too many requests from this IP, please try again after 15 minutes",
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiter to all routes
app.use(limiter);

// Strict CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : ["http://localhost:3000"];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === "development") {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST"],
    credentials: true
}));

app.use(express.json({ limit: '10kb' })); // Limit body size to prevent memory exhaustion

// Request logging (sanitized)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

app.use("/v1", apiRoutes);

app.get("/", (req, res) => {
    res.json({
        status: "ok",
        service: "c-SPL Wrapper API",
        version: "1.0.0",
        endpoints: {
            health: "/v1/health",
            wrap: "POST /v1/wrap",
            unwrap: "POST /v1/unwrap"
        }
    });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📡 RPC: ${process.env.RPC_URL || "https://api.devnet.solana.com"}`);
});
