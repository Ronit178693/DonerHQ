// Importing the express framework to handle routing logic
import express from 'express';
// Importing the required controller functions for escrow actions
import {
    holdFunds,
    releaseFunds,
    cancelEscrow,
    getEscrowStatus,
    getMyEscrows,
    getDonorEscrows
} from '../controllers/escrowTransaction.controller.js';
// Importing the protect middleware to ensure only logged-in users access certain routes
import { protect } from '../middlewares/auth.middleware.js';

// Creating a new router instance for the escrow module
const router = express.Router();

// ─── Public routes ───

// End-point to get transparency/escrow status for a specific fundraising cause using its ID
router.get('/status/:causeId', getEscrowStatus);

// ─── Protected routes — Must be logged in ───

// Apply the protect middleware to all routes defined below this line
router.use(protect);

// End-point to place funds in escrow (Internal/Logic triggered, but exposed for status updates)
router.post('/hold', holdFunds);

// End-point to release funds to the intended recipient (NGO) after verification (Admin gated in controller)
router.post('/release/:id', releaseFunds);

// End-point to handle refunds or cancellations of pending escrow transactions (Admin gated in controller)
router.post('/cancel/:id', cancelEscrow);

// Profile specific ledger endpoints
router.get('/my-ledger', getMyEscrows);
router.get('/donor-ledger', getDonorEscrows);

// Exporting the escrow router configuration
export default router;
