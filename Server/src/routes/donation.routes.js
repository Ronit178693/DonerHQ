// Importing the express framework to handle routing logic
import express from 'express';
// Importing the required controller functions for secure Razorpay donation flows
import {
    createOrder,
    verifyPayment,
    getDonationHistory,
    getDonationDetails
} from '../controllers/donation.controller.js';
// Importing the protect middleware to ensure only logged-in users access certain routes
import { protect } from '../middlewares/auth.middleware.js';

// Creating a new router instance for the donation module
const router = express.Router();

// Apply the protect middleware to all donation routes as they require an authenticated user
router.use(protect);

// ─── Protected routes ───

// End-point to initialize a new Razorpay transaction order
router.post('/create-order', createOrder);

// End-point to verify the authenticity of a completed payment and record it
router.post('/verify', verifyPayment);

// End-point to retrieve the full history of donations filtered by user role (donor/ngo/admin)
router.get('/history', getDonationHistory);

// End-point to retrieve the specific details and receipt for a single transaction by ID
router.get('/:id', getDonationDetails);

// Exporting the donation router configuration
export default router;
