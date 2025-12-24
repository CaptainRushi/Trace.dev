import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables FIRST before any other imports
dotenv.config({ path: '../.env' });

// Now import routes (which use environment variables)
const subscriptionRoutes = (await import('./routes/subscription.js')).default;

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware - Allow multiple frontend origins
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:3000',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/subscription', subscriptionRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📦 Razorpay Key ID: ${process.env.RAZORPAY_KEY_ID ? 'Configured ✅' : 'NOT CONFIGURED ❌'}`);
    console.log(`📋 Starter Plan: ${process.env.RAZORPAY_PLAN_STARTER || 'NOT SET'}`);
    console.log(`📋 Pro Plan: ${process.env.RAZORPAY_PLAN_PRO || 'NOT SET'}`);
});
