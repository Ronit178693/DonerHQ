// Importing the express framework to handle routing logic
import express from 'express';
// Importing NGO controller functions (except createPost which comes from post.controller)
import {
    // NGO profile management
    getNGOProfile,
    updateNGOProfile,
    // Discovery and search
    discoverNGOs,
    // Social media posting (delete + list only — create is in post.controller)
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
// Use the post.controller createPost which correctly handles Multer file uploads
import { createPost } from '../controllers/post.controller.js';
// Importing the protect middleware to ensure only logged-in users access routes
import { protect } from '../middlewares/auth.middleware.js';
// Importing the authorize middleware to restrict routes by role
import { authorize } from '../middlewares/role.middleware.js';
// Importing the upload middleware for handling organization branding updates
import { upload } from '../middlewares/multer.js';

// Creating a new router instance for the NGO module
const router = express.Router();

// ─── Public routes (specific paths FIRST, wildcard LAST) ───

// End-point to browse and search all approved NGOs with filtering and pagination
router.get('/discover', discoverNGOs);

// End-point to view all posts by a specific NGO (their profile feed)
router.get('/:id/posts', getNGOPosts);

// End-point to view all causes belonging to a specific NGO
router.get('/:id/causes', getNGOCauses);

// ─── Protected routes — Must be logged in ───

// Applying the protect middleware to all routes below this line
router.use(protect);

// End-point for NGOs to view their creator dashboard analytics
// MUST be before /:id to avoid wildcard swallowing
router.get('/dashboard/analytics', authorize('ngo'), getNGODashboard);

// End-point for NGOs to create a new social media post
// MUST be before /:id to avoid wildcard swallowing
router.post('/posts/create', authorize('ngo'), upload.single('media'), createPost);

// End-point for NGOs to delete one of their posts
router.delete('/posts/:postId', authorize('ngo'), deletePost);

// End-point to follow an NGO (like Instagram follow)
router.post('/:id/follow', followNGO);

// End-point to unfollow an NGO
router.post('/:id/unfollow', unfollowNGO);

// End-point for NGOs to update their own profile including logo upload
router.put('/:id', authorize('ngo'), upload.single('logo'), updateNGOProfile);

// End-point to view a specific NGO's public profile page (LAST — wildcard catches everything)
router.get('/:id', getNGOProfile);

// Exporting the NGO router configuration
export default router;
