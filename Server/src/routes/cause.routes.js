// Importing the express framework to handle routing logic
import express from 'express';
// Importing the required controller functions for cause actions
import {
    createCause,
    getCauses,
    getCauseDetails
} from '../controllers/cause.controller.js';
// Importing the protect middleware to ensure only logged-in users access certain routes
import { protect } from '../middlewares/auth.middleware.js';
// Importing the upload middleware for handling mission cover asset segments
import { upload } from '../middlewares/multer.js';

// Creating a new router instance for the cause module
const router = express.Router();

// ─── Public routes ───

// End-point to retrieve a list of all current causes across the platform based on filters
router.get('/', getCauses);

// End-point to retrieve complete details and metrics for a specific cause using its ID
router.get('/:id', getCauseDetails);

// ─── Protected routes — Must be logged in ───

// Apply the protect middleware to all routes defined below this line (only NGOs can create causes, but we check that in the controller)
router.use(protect);

// End-point to create a new campaign or charitable cause including cover image upload
// Using Multer to extract the 'coverImage' file before the controller processes the upload to Cloudinary
router.post('/create', upload.single('coverImage'), createCause);

// Exporting the cause router configuration
export default router;
