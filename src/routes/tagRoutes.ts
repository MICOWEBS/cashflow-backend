import express from 'express';
import { getTags, createTag, updateTag, deleteTag } from '../controllers/tagController';
import { auth } from '../middlewares/auth';
import { asyncHandler } from '../utils/routeHandler';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Tag routes
router.get('/', asyncHandler(getTags));
router.post('/', asyncHandler(createTag));
router.put('/:id', asyncHandler(updateTag));
router.delete('/:id', asyncHandler(deleteTag));

export default router; 