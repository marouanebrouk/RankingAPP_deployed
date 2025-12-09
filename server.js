import express from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import cors from 'cors'
import ressRouter from './ressRouter.js'
import authRouter from './routes/authRouter.js'
import rankingRouter from './routes/rankingRouter.js'
import intra42Router from './routes/intra42Router.js'
import { initCodeforcesOAuth } from './oauthService.js'

const app = express();

dotenv.config();
const PORT = process.env.PORT || 3000;
const MONGOURL = process.env.MONGO_URL;
const SESSION_SECRET = process.env.SESSION_SECRET || 'default-secret-change-this';
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Validate required environment variables
if (!MONGOURL) {
    console.error('❌ MONGO_URL environment variable is required!');
    process.exit(1);
}

if (SESSION_SECRET === 'default-secret-change-this' && NODE_ENV === 'production') {
    console.error('❌ SESSION_SECRET must be set in production!');
    process.exit(1);
}

// Trust proxy - required for Render to detect HTTPS properly
app.set('trust proxy', 1);

// Security headers to help with Chrome Safe Browsing
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

app.use(cors({
    origin: FRONTEND_URL,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('views')); // Serve static HTML files

// Session middleware (required for OAuth)
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true, // Changed to true to save session even if not modified
    store: MongoStore.create({
        mongoUrl: MONGOURL,
        touchAfter: 24 * 3600 // lazy session update (24 hours)
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        httpOnly: true,
        secure: NODE_ENV === 'production', // Auto-enable secure cookies in production (HTTPS)
        sameSite: NODE_ENV === 'production' ? 'none' : 'lax' // Required for cross-site cookies
    }
}));


app.use("/api/users", authRouter);
app.use("/api/auth", authRouter);  // Codeforces OAuth routes
app.use("/api/auth", intra42Router);  // 42 Intra OAuth routes
app.use("/api/rankings", rankingRouter);
app.use("/api/ressources", ressRouter);

// Debug endpoint to test sessions
app.get('/api/session-test', (req, res) => {
    if (!req.session.views) {
        req.session.views = 1;
    } else {
        req.session.views++;
    }
    res.json({
        message: 'Session is working!',
        sessionID: req.sessionID,
        views: req.session.views,
        cookie: req.session.cookie
    });
});

app.get('/', (req, res) => {
    res.json({
        message: "🏆 Codeforces Ranking API",
        version: "2.0.0 - Simplified",
        description: "Add users by Codeforces handle, rankings auto-update on fetch",
        endpoints: {
            addUser: {
                method: "POST",
                path: "/api/users/add-user",
                body: { codeforcesHandle: "tourist" },
                description: "Add a user by their Codeforces username"
            },
            getRankings: {
                method: "GET", 
                path: "/api/rankings",
                description: "Get all users ranked by rating (auto-updates from CF API)"
            },
            sessionTest: {
                method: "GET",
                path: "/api/session-test",
                description: "Test if sessions are persisting correctly"
            }
        },
        example: "1. POST /api/users/add-user with {codeforcesHandle: 'tourist'}\n2. GET /api/rankings to see updated rankings"
    });
});

mongoose.connect(MONGOURL).then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Initialize OAuth
    await initCodeforcesOAuth();
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Server is running on http://localhost:${PORT}`);
        console.log(`🌍 Environment: ${NODE_ENV}`);
        console.log(`📊 API Documentation available at http://localhost:${PORT}/`);
        console.log(`🔐 OAuth Login: http://localhost:${PORT}/api/auth/codeforces`);
    });
}).catch((error) => {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
});