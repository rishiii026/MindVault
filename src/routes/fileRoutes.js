import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import { uploadFile, getTimeline, deleteFile } from '../controllers/fileController.js';

const router = express.Router();

router.use(protect);
router.post('/',upload.single('file'),uploadFile);
router.get('/',getTimeline);
router.delete('/:id',deleteFile);

export default router;