import express from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import session from 'express-session'
import cors from 'cors'
import ressRouter from './ressRouter.js'
import authRouter from './routes/authRouter.js'
import rankingRouter from './routes/rankingRouter.js'
import intra42Router from './routes/intra42Router.js'
import { initCodeforcesOAuth } from './oauthService.js'

const app = express();

dotenv.config();
const PORT = process.env.PORT || 8080;
const MONGOURL = process.env.MONGO_URL;
const SESSION_SECRET = process.env.SESSION_SECRET || 'default-secret-change-this';

app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('views')); // Serve static HTML files

// Session middleware (required for OAuth)
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        httpOnly: true,
        secure: false // Set to true if using HTTPS
    }
}));


app.use("/api/users", authRouter);
app.use("/api/auth", authRouter);  // Codeforces OAuth routes
app.use("/api/auth", intra42Router);  // 42 Intra OAuth routes
app.use("/api/rankings", rankingRouter);
app.use("/api/ressources", ressRouter);

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
            }
        },
        example: "1. POST /api/users/add-user with {codeforcesHandle: 'tourist'}\n2. GET /api/rankings to see updated rankings"
    });
});

mongoose.connect(MONGOURL).then(async () => {
    // Initialize OAuth
    await initCodeforcesOAuth();
    
    // app.listen(PORT, () => {
    //     console.log(`✅ Server is running on http://localhost:${PORT}`);
    //     console.log(`📊 API Documentation available at http://localhost:${PORT}/`);
    //     console.log(`🔐 OAuth Login: http://localhost:${PORT}/api/auth/codeforces`);
    // });
}).catch((error) => {
    console.log("❌ Mongo connection failed:", error);
});