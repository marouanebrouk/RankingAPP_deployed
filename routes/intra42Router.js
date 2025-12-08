import express from 'express';
import { loginWith42, intra42Callback, getCurrentUser, logout } from '../Controllers/intra42Controller.js';

const router = express.Router();

// 42 Intra OAuth routes
router.get('/42/login', loginWith42);
router.get('/42/callback', intra42Callback);
router.get('/me', getCurrentUser);
router.post('/logout', logout);

export default router;
