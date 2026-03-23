// Importing the express framework to handle routing logic
import express from 'express';
// Importing all the required controller functions for team actions
import {
    // Team creation for donors
    createTeam,
    // Team dashboard and member roster
    getTeamDetails,
    // Admin-only settings modification
    updateTeamSettings,
    // Joining a team via invite link
    joinTeam,
    // Leaving the current team
    leaveTeam
} from '../controllers/team.controller.js';
// Importing the protect middleware to ensure only logged-in users access routes
import { protect } from '../middlewares/auth.middleware.js';

// Creating a new router instance for the team module
const router = express.Router();

// ─── Public routes ───

// End-point to view a specific team's public dashboard and member roster
router.get('/:id', getTeamDetails);

// ─── Protected routes — Must be logged in ───

// Apply the protect middleware to all routes defined below this line
router.use(protect);

// End-point to create a new collective fundraising group
router.post('/create', createTeam);

// End-point to join a specific fundraising team using a secret invite code
router.post('/join', joinTeam);

// End-point to leave the user's current team
router.post('/leave', leaveTeam);

// End-point to modify team settings like name (only the creator can do this)
router.put('/:id/settings', updateTeamSettings);

// Exporting the team router configuration
export default router;
