// Importing the express framework to handle routing logic
import express from 'express';
// Importing all the required controller functions for user actions
import {
    getUserProfile,
    updateUserProfile,
    followNGO,
    unfollowNGO,
    getUserFeed,
    saveNGO,
    unsaveNGO,
    getWishlist,
    getLeaderboard,
    getRecommendedCauses,
    getMyInfo
} from '../controllers/user.controller.js';
// Importing the protect middleware to ensure only logged-in users access routes
import { protect } from '../middlewares/auth.middleware.js';

// Creating a new router instance for the user module
const router = express.Router();

// ─── Public routes ───

// End-point to retrieve the global donor leaderboard
router.get('/leaderboard', getLeaderboard);

// End-point to view a specific user's public profile by their ID
router.get('/profile/:id', getUserProfile);

// ─── Protected routes — Must be logged in ───

// Apply the protect middleware to all routes defined below this line
router.use(protect);

// End-point to get current user info (ME)
router.get('/me', getMyInfo);

// End-point to update the current logged-in user's profile details
router.put('/profile', updateUserProfile);

// End-point to follow an NGO, requiring the NGO ID in the body
router.post('/follow', followNGO);

// End-point to unfollow an already followed NGO
router.post('/unfollow', unfollowNGO);

// End-point to get the personalized social media feed
router.get('/feed', getUserFeed);

// End-point to save an NGO to user's bookmark list
router.post('/save-ngo', saveNGO);

// End-point to remove an NGO from the user's bookmark list
router.post('/unsave-ngo', unsaveNGO);

// End-point to retrieve the populated wishlist
router.get('/wishlist', getWishlist);

// End-point to fetch BERT-powered personalised cause recommendations
router.get('/recommendations', getRecommendedCauses);

// Exporting the user router configuration
export default router;
