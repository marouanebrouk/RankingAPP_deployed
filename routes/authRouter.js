import express from 'express';
import { addUser } from '../Controllers/authController.js';
import { 
    loginWithCodeforces, 
    codeforcesCallback
} from '../Controllers/oauthController.js';

const authRouter = express.Router();

// Manual add user (existing functionality)
authRouter.post('/add-user', addUser);

// Codeforces OAuth routes (linking account only)
authRouter.get('/codeforces', loginWithCodeforces);
authRouter.get('/codeforces/callback', codeforcesCallback);

export default authRouter;
