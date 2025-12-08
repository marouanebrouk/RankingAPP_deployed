import express from 'express';
import {fetch} from './ressController.js';
const ressRouter = express.Router();

ressRouter.get('/all',fetch);

export default ressRouter;