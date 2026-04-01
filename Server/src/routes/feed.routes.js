// Importing the express framework to handle routing logic
import express from 'express';
// Importing the required controller functions for algorithmic feed scoring
import {
    updateFeedScores,
    getTopRankedContent
} from '../controllers/feedScore.controller.js';
// Importing the protect middleware to ensure only logged-in users access the personalized feed
import { protect } from '../middlewares/auth.middleware.js';

// Creating a new router instance for the algorithmic feed module
const router = express.Router();

// Apply the protect middleware to all feed routes as they are highly personalized
router.use(protect);

// ─── Protected routes ───

// End-point to retrieve the highest-scoring posts for a personalized donor feed
router.get('/', getTopRankedContent);

// End-point to manually refresh or update content rankings for the current user (Triggered by pull-to-refresh)
router.post('/refresh', updateFeedScores);

// Exporting the feed router configuration
export default router;
