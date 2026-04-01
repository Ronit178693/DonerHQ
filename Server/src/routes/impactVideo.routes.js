// Importing the express framework to handle routing logic
import express from 'express';
// Importing the required controller functions for impact video actions
import {
    uploadImpactVideo,
    getImpactVideos,
    approveImpactVideo
} from '../controllers/impactVideo.controller.js';
// Importing the protect middleware to ensure only logged-in users access certain routes
import { protect } from '../middlewares/auth.middleware.js';

// Creating a new router instance for the impact video module
const router = express.Router();

// ─── Public routes ───

// End-point to retrieve a list of impact videos (filtered by NGO or personalized feed)
router.get('/', getImpactVideos);

// ─── Protected routes — Must be logged in ───

// Apply the protect middleware to all routes defined below this line
router.use(protect);

// End-point for NGOs to upload impact proof videos for their missions
router.post('/upload', uploadImpactVideo);

// End-point for Admins to approve/reject impact videos (Admin status checked in controller or global middleware)
router.post('/approve/:id', approveImpactVideo);

// Exporting the impact video router configuration
export default router;
