import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { chatQuery } from '../controllers/chatController.js';

const router = express.Router();

router.use(protect);

router.post('/query', chatQuery);

export default router;