import express from 'express';
import { getRankings } from '../Controllers/rankingController.js';

const rankingRouter = express.Router();

// Get rankings (auto-updates all users from Codeforces API)
rankingRouter.get('/', getRankings);

export default rankingRouter;
