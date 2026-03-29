// Importing the User model to interact with user data in the database
import User from '../models/User.js';
// Importing the NGO model to manage NGO-related interactions (following, wishlist)
import NGO from '../models/NGO.js';
// Importing Cause model to handle AI cause recommendations
import Cause from '../models/Cause.js';
// Importing Post model to handle the personalized social media feed
import Post from '../models/Post.js';

// ═══════════════════════════════════════════════════════════════
//  USER PROFILE & SETTINGS
// ═══════════════════════════════════════════════════════════════

// Controller to retrieve the public profile of any user or their own complete dashboard
export const getUserProfile = async (req, res) => {
    // Extracting the user ID from the request parameters sent in the URL
    const { id } = req.params;
    // Starting a try block to catch any database or server execution errors
    try {
        // Querying the database to find the user document by its unique ID
        const user = await User.findById(id)
            // Excluding sensitive fields (impact tokens were stripped out of the project)
            .select('-password -email -otp -otpExpires')
            // Populating the NGO profile if the user is an NGO creator
            .populate('ngoProfile')
            // Populating the social media following list with key metrics
            .populate('following', 'name logo category location followerCount')
            // Populating the team details for the team fundraising feature
            .populate('teamId', 'name members');
            
        // Validating if a user was actually found in the database
        if (!user) {
            // Returning a 404 Not Found response if the user does not exist
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Returning the successfully populated dashboard/profile data to the client
        return res.status(200).json({ success: true, user });
    // Catching any runtime errors during the process
    } catch (error) {
        // Returning a 500 status code with the error message
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Update user preferences (interests for the personalized feed algorithm)
export const updateUserProfile = async (req, res) => {
    // These interests feed directly into the personalised feed algorithm
    const { name, interestTags, interests } = req.body;
    // Starting a try block for the update operation
    try {
        // Fetching the currently authenticated user based on the JWT payload
        const user = await User.findById(req.user._id);

        // Updating the user's name if a new name was provided
        if (name) {
            // Assigning the new name to the user object
            user.name = name;
        }
        // Updating the free-form interest tags if new tags were provided
        if (interestTags) {
            // Assigning the new interest tags array
            user.interestTags = interestTags;
        }
        // Updating the core onboarding interest categories if provided
        if (interests) {
            // Assigning the core interests array
            user.interests = interests;
        }

        // Saving the modified user document back to the database
        await user.save();

        // Querying the newly updated document to exclude the password before responding
        const updatedUser = await User.findById(user._id).select('-password');

        // Returning a success message along with the updated profile
        return res.status(200).json({ 
            // Marking the operation as successful
            success: true, 
            // Setting a clear message indicating preferences were successfully saved
            message: 'Profile and feed preferences updated successfully', 
            // Attaching the updated user object to the response
            user: updatedUser 
        });
    // Catch block for any internal errors during the update
    } catch (error) {
        // Responding with a 500 error code for server failures
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  SOCIAL MEDIA FEATURES (Follow NGOs like social accounts)
// ═══════════════════════════════════════════════════════════════

// Follow an NGO
export const followNGO = async (req, res) => {
    // Extract target NGO ID from request body
    const { ngoId } = req.body;
    // Try block for follow execution
    try {
        // Validate presence of NGO ID
        if (!ngoId) {
            // Return 400 if ID is missing
            return res.status(400).json({ success: false, message: 'NGO ID is required' });
        }

        // Check if NGO exists in collection
        const ngoExists = await NGO.exists({ _id: ngoId });
        // Handle non-existent NGO case
        if (!ngoExists) {
            // Return 404 if not found
            return res.status(404).json({ success: false, message: 'NGO not found' });
        }

        // Fetch current user document
        const user = await User.findById(req.user._id);
        // Prevent duplicate follow actions
        if (user.following.includes(ngoId)) {
            // Return 400 if already followed
            return res.status(400).json({ success: false, message: 'Already following this NGO' });
        }

        // Add NGO to user's following list atomically
        await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: ngoId } });
        // Increment NGO's global follower count atomically
        await NGO.findByIdAndUpdate(ngoId, { $inc: { followerCount: 1 } });

        // Acknowledge success to client
        return res.status(200).json({ success: true, message: 'Successfully followed NGO' });
    // Catch any error during the follow process
    } catch (error) {
        // Error handling for database/server failures
        return res.status(500).json({ success: false, message: 'Error following NGO', error: error.message });
    }
};

// Unfollow an NGO
export const unfollowNGO = async (req, res) => {
    // Extract target NGO ID from request body
    const { ngoId } = req.body;
    // Try block for unfollow execution
    try {
        // Validate presence of NGO ID
        if (!ngoId) {
            // Return 400 if ID is missing
            return res.status(400).json({ success: false, message: 'NGO ID is required' });
        }

        // Fetch current user document
        const user = await User.findById(req.user._id);
        // Check if follow record exists
        if (!user.following.includes(ngoId)) {
            // Return 400 if not following
            return res.status(400).json({ success: false, message: 'Not following this NGO' });
        }

        // Remove NGO from user's following list atomically
        await User.findByIdAndUpdate(req.user._id, { $pull: { following: ngoId } });
        // Decrement NGO's global follower count atomically
        await NGO.findByIdAndUpdate(ngoId, { $inc: { followerCount: -1 } });

        // Acknowledge success to client
        return res.status(200).json({ success: true, message: 'Successfully unfollowed NGO' });
    // Catch any error during the unfollow process
    } catch (error) {
        // Error handling for database/server failures
        return res.status(500).json({ success: false, message: 'Error unfollowing NGO', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  PERSONALISED ALGORITHM FEED (New: Social Feed)
// ═══════════════════════════════════════════════════════════════

// Fetch the personalized social media feed
export const getUserFeed = async (req, res) => {
    // Extract optional pagination parameters
    const { page = 1, limit = 20 } = req.query;
    // Try block for feed generation
    try {
        // Fetch current user document
        const user = await User.findById(req.user._id);
        
        // Query posts based on user interests and following
        const feedPosts = await Post.find({
            // Match any of the following conditions
            $or: [
                // Condition 1: Posts from followed NGOs
                { ngoId: { $in: user.following } },
                // Condition 2: Posts tagged with categories matching user interest categories
                { tags: { $in: user.interests || [] } }
            ]
        })
        // Sort newest posts to the top
        .sort({ createdAt: -1 })
        // Pagination logic: skip previous items
        .skip((page - 1) * limit)
        // Pagination logic: limit items per response
        .limit(parseInt(limit))
        // Populate author NGO details
        .populate('ngoId', 'name logo verified transparencyScore')
        // Populate linked cause details for the donate button overlay
        .populate('linkedCauseId', 'title goalAmount raisedAmount status');
        
        // Count total for pagination metadata
        const total = await Post.countDocuments({
            // Apply same filter as the find query
            $or: [
                // Following filter
                { ngoId: { $in: user.following } },
                // Interest filter
                { tags: { $in: user.interests || [] } }
            ]
        });

        // Return feed results to client with pagination metadata
        return res.status(200).json({ 
            // Mark successful
            success: true, 
            // Result count
            count: feedPosts.length, 
            // Total available
            total,
            // Current page
            page: parseInt(page),
            // Total pages
            pages: Math.ceil(total / limit),
            // Feed data
            feed: feedPosts 
        });
    // Catching any feed generation errors
    } catch (error) {
        // Error handling for feed retrieval
        return res.status(500).json({ success: false, message: 'Error fetching feed', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  WISHLIST (Kept: save NGOs for later)
// ═══════════════════════════════════════════════════════════════

// Save an NGO to the wishlist
export const saveNGO = async (req, res) => {
    // Extract target ID from request body
    const { ngoId } = req.body;
    // Try block for save action
    try {
        // Validate presence of ID
        if (!ngoId) {
            // Return 400 if ID is missing
            return res.status(400).json({ success: false, message: 'NGO ID is required' });
        }

        // Atomic toggle/push to saved list
        const updatedUser = await User.findByIdAndUpdate(
            // Target specific user
            req.user._id,
            // Add ID to set to ensure uniqueness
            { $addToSet: { savedNGOs: ngoId } },
            // Request modified document back
            { new: true }
        );

        // Acknowledge bookmark success
        return res.status(200).json({ success: true, message: 'NGO added to wishlist successfully' });
    // Catching any save errors
    } catch (error) {
        // Error handling for wishlist update
        return res.status(500).json({ success: false, message: 'Error saving NGO', error: error.message });
    }
};

// Remove an NGO from the wishlist
export const unsaveNGO = async (req, res) => {
    // Extract target ID from request body
    const { ngoId } = req.body;
    // Try block for removal action
    try {
        // Validate presence of ID
        if (!ngoId) {
            // Return 400 if ID is missing
            return res.status(400).json({ success: false, message: 'NGO ID is required' });
        }

        // Atomic removal from saved list
        await User.findByIdAndUpdate(
            // Target specific user
            req.user._id,
            // Pull specific ID from array
            { $pull: { savedNGOs: ngoId } }
        );

        // Acknowledge removal success
        return res.status(200).json({ success: true, message: 'NGO removed from wishlist' });
    // Catching any unsave errors
    } catch (error) {
        // Error handling for wishlist removal
        return res.status(500).json({ success: false, message: 'Error removing NGO from wishlist', error: error.message });
    }
};

// Retrieves the user's populated wishlist
export const getWishlist = async (req, res) => {
    // Error shielding
    try {
        // Querying User object while specifically populating their requested saved organizations
        const user = await User.findById(req.user._id).populate('savedNGOs', 'name logo category location transparencyScore following');
        // Transmitting the populated list back
        return res.status(200).json({ success: true, wishlist: user.savedNGOs });
    // Catch condition execution
    } catch (error) {
        // Serving backend error to frontend
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  GAMIFICATION & LEADERBOARD (Kept: streak + consistency based)
// ═══════════════════════════════════════════════════════════════

// Retrieve the top users based on streak and consistency score
export const getLeaderboard = async (req, res) => {
    // Protective enclosure
    try {
        // Querying for accounts labelled strictly as donors
        const topUsers = await User.find({ role: 'donor' })
            // Leaderboard focuses on consistency (streak) over pure donation amounts
            .sort({ leaderboardScore: -1, streak: -1 })
            // Trimming data specifically for the leaderboard views
            .select('name leaderboardScore streak')
            // Capping results at top 100 players
            .limit(100);

        // Funneling the finalized leaderboard array back out
        return res.status(200).json({ success: true, topUsers });
    // Safety net
    } catch (error) {
        // Server side failure dispatch
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  RECOMMENDATIONS (Kept: BERT-powered personalised recommendations)
// ═══════════════════════════════════════════════════════════════

// Get AI recommendations (This route communicates with an ML microservice or simulates it)
export const getRecommendedCauses = async (req, res) => {
    // Isolating execution scope
    try {
        // Securing target user details to extract specific preference arrays
        const user = await User.findById(req.user._id);
        
        // In a deployed application, an axios call would be made to a Flask/FastAPI BERT ML service here
        // For demonstration, simulating fetched causes by matching local DB with user's selected interest categories
        const recommendedCauses = await Cause.find({ category: { $in: user.interests } }).limit(10);
        
        // Outputting the modeled recommendations back downwards to client
        return res.status(200).json({ success: true, recommendedCauses });
    // Catch-all
    } catch (error) {
        // Sending 500 error flag
        return res.status(500).json({ success: false, message: error.message });
    }
};
