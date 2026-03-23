// Importing the express framework to handle routing logic
import express from 'express';
// Importing all NGO controller functions
import {
    // NGO profile management
    getNGOProfile,
    updateNGOProfile,
    // Discovery and search
    discoverNGOs,
    // Social media posting
    createPost,
    deletePost,
    getNGOPosts,
    // Social follow/unfollow
    followNGO,
    unfollowNGO,
    // Creator dashboard
    getNGODashboard,
    // NGO causes list
    getNGOCauses
} from '../controllers/ngo.controller.js';
// Importing the protect middleware to ensure only logged-in users access routes
import { protect } from '../middlewares/auth.middleware.js';
// Importing the authorize middleware to restrict routes by role
import { authorize } from '../middlewares/role.middleware.js';

// Creating a new router instance for the NGO module
const router = express.Router();

// ─── Public routes ───

// End-point to browse and search all approved NGOs with filtering and pagination
router.get('/discover', discoverNGOs);

// End-point to view a specific NGO's public profile page
router.get('/:id', getNGOProfile);

// End-point to view all posts by a specific NGO (their profile feed)
router.get('/:id/posts', getNGOPosts);

// End-point to view all causes belonging to a specific NGO
router.get('/:id/causes', getNGOCauses);

// ─── Protected routes — Must be logged in ───

// Applying the protect middleware to all routes below this line
router.use(protect);

// End-point to follow an NGO (like Instagram follow)
router.post('/:id/follow', followNGO);

// End-point to unfollow an NGO
router.post('/:id/unfollow', unfollowNGO);

// ─── NGO-only routes — Must be logged in as an NGO ───

// End-point for NGOs to update their own profile
router.put('/:id', authorize('ngo'), updateNGOProfile);

// End-point for NGOs to create a new social media post
router.post('/posts/create', authorize('ngo'), createPost);

// End-point for NGOs to delete one of their posts
router.delete('/posts/:postId', authorize('ngo'), deletePost);

// End-point for NGOs to view their creator dashboard analytics
router.get('/dashboard/analytics', authorize('ngo'), getNGODashboard);

// Exporting the NGO router configuration
export default router;
