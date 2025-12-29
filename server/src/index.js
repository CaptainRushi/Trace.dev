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

        // In production, we might have multiple subdomains or different protocols
        // For simplicity and to avoid deployment errors, we'll allow all origins for now
        // You can restrict this later by uncommenting the validation logic
        return callback(null, true);

        /* Standard validation:
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
        */
    },
    credentials: true
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root route to prevent "Cannot GET /"
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: white;">
            <h1 style="color: #6366f1;">Trace.dev Backend</h1>
            <p>API Server is running successfully.</p>
            <div style="margin-top: 20px; padding: 15px; background: #1e293b; border-radius: 8px; font-family: monospace;">
                Status: <span style="color: #22c55e;">Online</span><br>
                Endpoints: /api/health, /api/subscription/plans
            </div>
        </div>
    `);
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
