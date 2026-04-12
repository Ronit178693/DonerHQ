// Importing the express library to set up our routing system
import express from 'express';
// Importing specific registration, login, and auth management controllers
import {
    // Controller for donor registration
    registerDonor,
    // Controller for NGO registration
    registerNGO,
    // Unified login controller
    login,
    // Session termination controller
    logout,
    // Current user lookup controller
    getMe,
    // Password reset request controller
    passwordResetOTP,
    // Password reset execution controller
    resetPassword,
    // NGO verification controller for admins
    verifyNGO,
    // Pending NGO lookup controller for admins
    getPendingNGOs,
    // Unified registration entry point
    register,
    // Administrative user lookup controller
    getAllUsers
} from '../controllers/auth.controller.js';
// Importing middleware to protect routes that require authentication
import { protect } from '../middlewares/auth.middleware.js';
// Importing middleware to authorize specific user roles
import { authorize } from '../middlewares/role.middleware.js';
// Importing our upload middleware for handling multi-part attachment registration
import { upload } from '../middlewares/multer.js';

// Initializing the express router instance
const router = express.Router();

// End-point for a unified account registration that handles branching to Donor or NGO logic
router.post('/register', upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'doc80G', maxCount: 1 },
    { name: 'docFCRA', maxCount: 1 }
]), register);

router.post('/register/donor', registerDonor);
// End-point for an NGO account registration with logo and legal doc attachments
// Using Multer to extract 'logo', 'doc80G', and 'docFCRA' before profile creation
router.post('/register/ngo', upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'doc80G', maxCount: 1 },
    { name: 'docFCRA', maxCount: 1 }
]), registerNGO);
// End-point to authenticate and provide a session cookie for all users
router.post('/login', login);
// End-point to initiate a secure password reset via OTP to email
router.post('/password-reset-otp', passwordResetOTP);
// End-point to finalize a password update using a valid email and OTP
router.post('/reset-password', resetPassword);

// End-point to log out an authenticated user and clear their session cookie
router.post('/logout', protect, logout);
// End-point to retrieve the current profile of a logged-in donor, NGO, or admin
router.get('/me', protect, getMe);

// Administrative end-point to approve or reject organizations awaiting review
router.post('/admin/verify-ngo', protect, authorize('admin'), verifyNGO);
// Administrative end-point to list all NGO registration requests currently pending
router.get('/admin/pending-ngos', protect, authorize('admin'), getPendingNGOs);
// Administrative end-point to list all users in the system for platform moderation
router.get('/admin/users', protect, authorize('admin'), getAllUsers);

// Exporting the configured router as default
export default router;
