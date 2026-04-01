// Importing the Team model to handle collective fundraising groups in the database
import Team from '../models/Team.js';
// Importing the User model to manage individual member associations and profiles
import User from '../models/User.js';
// Importing crypto for generating secure random invite link codes for team recruitment
import crypto from 'crypto';

/**
 * Team Controller
 * Handles organizational teams or collective fundraising efforts by donors.
 */

// ═══════════════════════════════════════════════════════════════
//  TEAM CREATION — Starting a new collective fundraising group
// ═══════════════════════════════════════════════════════════════

// Controller to create a new team for collective impact tracking and competition
export const createTeam = async (req, res) => {
    // Extracting the desired team name from the request body
    const { name } = req.body;
    // Starting the try block to manage database operations and potential failures
    try {
        // Guard clause ensuring a team name was actually provided in the payload
        if (!name) {
            // Returning a 400 Bad Request if the name field is blank or missing
            return res.status(400).json({ success: false, message: 'Team name is required' });
        // Closing the name validation check
        }

        // Fetching the user from the database to verify their current team status
        const existingUser = await User.findById(req.user._id);
        // Preventing a user from creating a team if they are already a member of another group
        if (existingUser.teamId) {
            // Returning a 400 error to indicate conflicting team membership roles
            return res.status(400).json({ success: false, message: 'You are already part of a team. Leave your current team first.' });
        // Closing the membership check
        }

        // Generating a unique 12-character hex invite code using secure random bytes
        const inviteLink = crypto.randomBytes(6).toString('hex');

        // Creating and saving the new team document in the MongoDB collection
        const newTeam = await Team.create({
            // Setting the public-facing display name for the fundraising group
            name,
            // Assigning the currently authenticated user as the team's founder
            createdBy: req.user._id,
            // Initializing the members array with the founder as the first entry
            members: [req.user._id],
            // Associating the unique invite code for sharing and recruitment efforts
            inviteLink
        // Closing the team create parameters
        });

        // Atomically updating the user's document to link them to their newly created team
        await User.findByIdAndUpdate(req.user._id, { $set: { teamId: newTeam._id } });

        // Returning the successfully created team document and a positive status code
        return res.status(201).json({ success: true, message: 'Team created successfully', team: newTeam });
    // Catching any database errors or invite link collision failures
    } catch (error) {
        // Returning a 500 status code with the specific internal failure details
        return res.status(500).json({ success: false, message: 'Error creating team', error: error.message });
    // Closing the try-catch block
    }
// Closing the createTeam controller
};

// ═══════════════════════════════════════════════════════════════
//  TEAM DETAILS — Dashboard, members, and performance metrics
// ═══════════════════════════════════════════════════════════════

// Controller to retrieve the full dashboard data and member roster for a specific team
export const getTeamDetails = async (req, res) => {
    // Extracting the team's unique database ID from the URL parameters
    const { id } = req.params;
    // Starting the try block for data lookup and population
    try {
        // Finding the team document and populating its referenced relational data
        const team = await Team.findById(id)
            // Populating each member's name and leaderboard score for the roster view
            .populate('members', 'name leaderboardScore streak')
            // Populating the creator's name and email for administrative identity
            .populate('createdBy', 'name email');

        // Validating that the requested team record actually exists in our data store
        if (!team) {
            // Returning a 404 response if no team matches the provided ID string
            return res.status(404).json({ success: false, message: 'Team not found' });
        // Closing the existence guard clause
        }

        // Returning the enriched team profile object back to the client UI
        return res.status(200).json({ success: true, team });
    // Catching any database connection issues or ID parsing errors
    } catch (error) {
        // Returning a 500 error message with the specific internal details
        return res.status(500).json({ success: false, message: 'Error fetching team details', error: error.message });
    // Closing the try-catch block
    }
// Closing the getTeamDetails controller
};

// ═══════════════════════════════════════════════════════════════
//  TEAM SETTINGS — Admin-only modifications to team metadata
// ═══════════════════════════════════════════════════════════════

// Controller for the team creator to modify settings, branding, or team metadata
export const updateTeamSettings = async (req, res) => {
    // Extracting the team ID from parameters and the new name from the body
    const { id } = req.params;
    // Extracting the name string
    const { name } = req.body;
    // Starting the admin update process with error handling
    try {
        // Finding the target team in the database for verification
        const team = await Team.findById(id);

        // Guard clause checking for record existence
        if (!team) {
            // Returning a 404 code if the team ID is invalid
            return res.status(404).json({ success: false, message: 'Team not found' });
        // Closing the guard clause
        }

        // Security check: ensuring only the team's creator can modify its settings
        if (team.createdBy.toString() !== req.user._id.toString()) {
            // Returning a 403 Forbidden error for unauthorized edit attempts
            return res.status(403).json({ success: false, message: 'Only the team creator can modify settings' });
        // Closing the security check block
        }

        // Updating the team's name if a valid new one was provided
        if (name) team.name = name;
        // Committing the updated settings to the database
        await team.save();

        // Returning the updated team state and a victory message
        return res.status(200).json({ success: true, message: 'Team settings updated', team });
    // Catching any save failures or authorization errors
    } catch (error) {
        // Returning 500 status message
        return res.status(500).json({ success: false, message: 'Error updating team', error: error.message });
    // Closing the try-catch block
    }
// Closing the updateTeamSettings controller
};

// ═══════════════════════════════════════════════════════════════
//  TEAM MEMBERSHIP — Joining and leaving collective groups
// ═══════════════════════════════════════════════════════════════

// Controller for a donor to join a team using a shared invitation link or code
export const joinTeam = async (req, res) => {
    // Extracting the invite code from the request body
    const { inviteLink } = req.body;
    // Starting the join process with comprehensive checks
    try {
        // Finding the team document that owns this specific invite link
        const team = await Team.findOne({ inviteLink });
        // Guard clause for invalid or expired invitation codes
        if (!team) {
            // Returning 404 if the link does not map to any active team
            return res.status(404).json({ success: false, message: 'Invalid invite link' });
        // Closing the link check
        }

        // Fetching the user to check their current membership status
        const user = await User.findById(req.user._id);
        // Preventing users from joining a team if they are already in one (can only be in one team)
        if (user.teamId) {
            // Returning a 400 error indicating membership conflict
            return res.status(400).json({ success: false, message: 'You are already part of a team' });
        // Closing the current membership check
        }

        // Atomically adding the user's ID to the team's members array
        team.members.push(req.user._id);
        // Committing the new membership to the team document
        await team.save();

        // Linking the team back to the user's profile for easy retrieval
        user.teamId = team._id;
        // Committing the team association to the user record
        await user.save();

        // Returning a success message and the updated team roster
        return res.status(200).json({ success: true, message: `Successfully joined ${team.name}`, team });
    // Catching any database errors or membership lock failures
    } catch (error) {
        // Returning a 500 status code
        return res.status(500).json({ success: false, message: 'Error joining team', error: error.message });
    // Closing the try-catch block
    }
// Closing the joinTeam controller
};

// Controller to allow a member to leave their current fundraising team
export const leaveTeam = async (req, res) => {
    // Starting the separation process with thorough cleanup
    try {
        // Finding the user to identify their current team affiliation
        const user = await User.findById(req.user._id);
        // Guard clause if the user does not actually belong to any team
        if (!user.teamId) {
            // Returning 400 as there is no team to leave
            return res.status(400).json({ success: false, message: 'You are not part of any team' });
        // Closing the team existence check
        }

        // Finding the team document in question
        const team = await Team.findById(user.teamId);
        
        // Branching logic: check if the user leaving is the actual founder/creator
        if (team && team.createdBy.toString() === req.user._id.toString()) {
            // Blocking the creator from leaving to prevent orphaned teams (must delete or transfer first)
            return res.status(400).json({ success: false, message: 'The team creator cannot leave. Disband the team instead.' });
        // Closing the creator check
        }

        // If the team still exists, remove the member from the roster
        if (team) {
            // Atomically filtering out the current user's ID from the members array
            team.members = team.members.filter(m => m.toString() !== req.user._id.toString());
            // Committing the reduced roster to the database
            await team.save();
        // Closing the roster reduction block
        }

        // Severing the user's link to the team in their personal profile
        user.teamId = undefined;
        // Committing the membership removal to the user document
        await user.save();

        // Returning a success message acknowledging the departure
        return res.status(200).json({ success: true, message: 'Successfully left the team' });
    // Catching any update failures or database connection losses
    } catch (error) {
        // Returning a 500 status code with the failure report
        return res.status(500).json({ success: false, message: 'Error leaving team', error: error.message });
    // Closing the try-catch block
    }
// Closing the leaveTeam controller
};
