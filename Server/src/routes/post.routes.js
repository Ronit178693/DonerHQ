// Importing the express framework to handle routing logic
import express from 'express';
// Importing all the required controller functions for post actions
import {
    // Post creation for NGOs
    createPost,
    // Personalized feed retrieval
    getFeedPosts,
    // Social interactions (like, comment, share, donateClick)
    interactWithPost,
    // Individual post detail retrieval
    getPostById
} from '../controllers/post.controller.js';
// Importing the protect middleware to ensure only logged-in users access routes
import { protect } from '../middlewares/auth.middleware.js';
// Importing the authorize middleware to restrict routes by role
import { authorize } from '../middlewares/role.middleware.js';

// Creating a new router instance for the post module
const router = express.Router();

// ─── Public routes ───

// End-point to view a specific post's full details by its ID
router.get('/:id', getPostById);

// ─── Protected routes — Must be logged in ───

// Apply the protect middleware to all routes defined below this line
router.use(protect);

// End-point to fetch the personalized social media feed for the logged-in user
router.get('/', getFeedPosts);

// End-point to handle social interactions like likes, comments and shares
router.post('/interact', interactWithPost);

// ─── NGO-only routes — Post management ───

// End-point for verified NGOs to publish a new social media post
router.post('/create', authorize('ngo'), createPost);

// Exporting the post router configuration
export default router;
