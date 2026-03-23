// Importing the Team model to handle collective fundraising groups in the database
import Team from '../models/Team.js';
// Importing the User model to manage individual member associations and profiles
import User from '../models/User.js';
// Importing crypto for generating secure random invite link codes
import crypto from 'crypto';

/**
 * Team Controller
 * Handles organizational teams or collective fundraising efforts.
 */

// ═══════════════════════════════════════════════════════════════
//  TEAM CREATION — Starting a new collective fundraising group
// ═══════════════════════════════════════════════════════════════

// Controller to create a new team for collective impact tracking
export const createTeam = async (req, res) => {
    // Extracting the team name from the request body
    const { name } = req.body;
    // Starting the try block for error handling
    try {
        // Guard clause ensuring a team name was actually provided
        if (!name) {
            // Returning a 400 Bad Request if the name is blank
            return res.status(400).json({ success: false, message: 'Team name is required' });
        }

        // Checking if the user is already a member of another team
        const existingUser = await User.findById(req.user._id);
        // Preventing a user from creating a team if they already belong to one
        if (existingUser.teamId) {
            // Returning a 400 error to indicate conflicting team membership
            return res.status(400).json({ success: false, message: 'You are already part of a team. Leave your current team first.' });
        }

        // Generating a unique 12-character hex invite link using secure random bytes
        const inviteLink = crypto.randomBytes(6).toString('hex');

        // Creating the new team record in the MongoDB database
        const newTeam = await Team.create({
            // Setting the public display name for the team
            name,
            // Assigning the currently logged-in user as the team creator
            createdBy: req.user._id,
            // Initializing the members list with the founder as the first member
            members: [req.user._id],
            // Associating the unique invite code for sharing and member recruitment
            inviteLink
        });

        // Atomically updating the user's document to link them to their new team
        await User.findByIdAndUpdate(req.user._id, { $set: { teamId: newTeam._id } });

        // Returning the successfully created team document back to the client
        return res.status(201).json({ success: true, message: 'Team created successfully', team: newTeam });
    // Catching any database errors or invite link collisions
    } catch (error) {
        // Returning a 500 status code with the error message
        return res.status(500).json({ success: false, message: 'Error creating team', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  TEAM DETAILS — Dashboard, members, and performance metrics
// ═══════════════════════════════════════════════════════════════

// Controller to retrieve the full dashboard data and member roster for a team
export const getTeamDetails = async (req, res) => {
    // Extracting the team's unique ID from the URL parameters
    const { id } = req.params;
    // Starting the try block for data lookup
    try {
        // Finding the team document and populating its referenced member data
        const team = await Team.findById(id)
            // Populating each member's name and leaderboard score for the roster
            .populate('members', 'name leaderboardScore streak')
            // Populating the creator's name and email for administrative display
            .populate('createdBy', 'name email');

        // Validating that the requested team record actually exists
        if (!team) {
            // Returning a 404 response if no team matches the provided ID
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        // Returning the enriched team profile back to the client UI
        return res.status(200).json({ success: true, team });
    // Catching any database or connection errors during the lookup
    } catch (error) {
        // Returning a 500 error message with the specific failure details
        return res.status(500).json({ success: false, message: 'Error fetching team details', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  TEAM SETTINGS — Admin-only modifications to team metadata
// ═══════════════════════════════════════════════════════════════

// Controller for the team creator to modify team settings and metadata
export const updateTeamSettings = async (req, res) => {
    // Extracting the team ID from the URL parameters
    const { id } = req.params;
    // Extracting the new team name from the request body
    const { name } = req.body;
    // Starting the try block for the update operation
    try {
        // Finding the current team document to verify administrative rights
        const team = await Team.findById(id);

        // Checking if the team exists in the database
        if (!team) {
            // Returning 404 if the team was not found
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        // Verifying that the requester is the original team founder
        if (team.createdBy.toString() !== req.user._id.toString()) {
            // Blocking unauthorized members from modifying team settings
            return res.status(403).json({ success: false, message: 'Only the team creator can update settings' });
        }

        // Applying the new name if it was provided in the request
        if (name) team.name = name;
        // Committing the updated team document back to the database
        await team.save();

        // Returning the newly updated team document to the client
        return res.status(200).json({ success: true, message: 'Team settings updated successfully', team });
    // Catching any update failures or validation errors
    } catch (error) {
        // Returning a 500 internal server error back to the client
        return res.status(500).json({ success: false, message: 'Error updating team settings', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  JOIN TEAM — Donors join via unique invite link
// ═══════════════════════════════════════════════════════════════

// Controller for any user to join a fundraising team using an invite link
export const joinTeam = async (req, res) => {
    // Extracting the secret invite code from the request body
    const { inviteLink } = req.body;
    // Starting the try block for the joining process
    try {
        // Validating that an invite link was actually provided
        if (!inviteLink) {
            // Returning 400 if the invite link is missing from the request
            return res.status(400).json({ success: false, message: 'Invite link is required' });
        }

        // Checking if the user already belongs to a team
        const existingUser = await User.findById(req.user._id);
        // Preventing double team membership
        if (existingUser.teamId) {
            // Returning a 400 error explaining the conflict
            return res.status(400).json({ success: false, message: 'You are already part of a team. Leave your current team first.' });
        }

        // Searching for the team that matches the provided invite code
        const team = await Team.findOne({ inviteLink });

        // Guard clause for invalid or non-existent invite links
        if (!team) {
            // Returning 404 if the invite link code was not recognized
            return res.status(404).json({ success: false, message: 'Invalid invite link. Team not found.' });
        }

        // Atomically adding the user's ID to the team's membership roster
        await Team.findByIdAndUpdate(team._id, { $addToSet: { members: req.user._id } });
        // Atomically updating the user's document to associate them with the team
        await User.findByIdAndUpdate(req.user._id, { $set: { teamId: team._id } });

        // Returning a success message once the user is enrolled in the team
        return res.status(200).json({ success: true, message: 'Successfully joined team', team });
    // Catching any errors during the joining process
    } catch (error) {
        // Returning a 500 status message to the client
        return res.status(500).json({ success: false, message: 'Error joining team', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  LEAVE TEAM — Donors can leave their current team
// ═══════════════════════════════════════════════════════════════

// Controller for a user to leave their current team
export const leaveTeam = async (req, res) => {
    // Starting the try block for the leave process
    try {
        // Fetching the current user's document to find their team association
        const user = await User.findById(req.user._id);

        // Checking if the user is actually part of a team
        if (!user.teamId) {
            // Returning 400 if the user does not belong to any team
            return res.status(400).json({ success: false, message: 'You are not part of any team' });
        }

        // Storing the team ID before clearing it from the user document
        const teamId = user.teamId;

        // Checking if the user is the creator of the team
        const team = await Team.findById(teamId);
        // Preventing the team creator from leaving without disbanding first
        if (team && team.createdBy.toString() === req.user._id.toString()) {
            // Returning 400 with guidance to delete the team instead
            return res.status(400).json({ success: false, message: 'Team creators cannot leave. Delete the team instead.' });
        }

        // Atomically removing the user from the team's membership roster
        await Team.findByIdAndUpdate(teamId, { $pull: { members: req.user._id } });
        // Clearing the team reference from the user's profile document
        await User.findByIdAndUpdate(req.user._id, { $unset: { teamId: '' } });

        // Returning a success message confirming the departure
        return res.status(200).json({ success: true, message: 'Successfully left team' });
    // Catching any errors during the leave process
    } catch (error) {
        // Returning a 500 status message to the client
        return res.status(500).json({ success: false, message: 'Error leaving team', error: error.message });
    }
};
